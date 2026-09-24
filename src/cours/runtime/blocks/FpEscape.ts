import type { MetadonneesBrique } from '../../content/types';
import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { FpBlock } from './FpBlock';
import { projeterMetadonnees } from './projection';
import { estObjet, type ProgressionDesEnigmes, type VerdictDeTentative } from './retours';

export interface EscapeEnigmePublique {
  readonly id: string;
  readonly intitule: string;
  readonly enonce: string;
  readonly indice: string;
}

export interface EscapeParcoursPublic {
  readonly id: string;
  readonly intitule: string;
  readonly delaiIndiceMs: number;
  readonly budgetEnigmeMs: number;
  readonly tentativesMax: number;
  readonly enigmes: readonly EscapeEnigmePublique[];
  readonly metadonnees: MetadonneesBrique;
}

interface SolutionnaireEnigme {
  readonly enigmeId: string;
  readonly solution: string;
  readonly fragment: string;
}

interface Solutionnaire {
  readonly enigmes: readonly SolutionnaireEnigme[];
  readonly codeFinal: string;
}

type EtatEnigme = 'resolue' | 'epuisee' | 'ouverte' | 'verrouillee';

const VIDE = escapeHtml('');
const DESACTIVE = safeHtml`disabled`;
const MS_PAR_MINUTE = 60000;
const MS_PAR_SECONDE = 1000;
const TENTATIVES_PAR_DEFAUT = 10;
const LONGUEUR_MAX_REPONSE = 40;

function projeterParcours(source: EscapeParcoursPublic): EscapeParcoursPublic {
  return {
    id: source.id,
    intitule: source.intitule,
    delaiIndiceMs: source.delaiIndiceMs,
    budgetEnigmeMs: source.budgetEnigmeMs,
    tentativesMax:
      Number.isInteger(source.tentativesMax) && source.tentativesMax > 0
        ? source.tentativesMax
        : TENTATIVES_PAR_DEFAUT,
    enigmes: source.enigmes.map((enigme) => ({
      id: enigme.id,
      intitule: enigme.intitule,
      enonce: enigme.enonce,
      indice: enigme.indice,
    })),
    metadonnees: projeterMetadonnees(source.metadonnees),
  };
}

function lireSolutionnaire(valeur: unknown): Solutionnaire | null {
  if (
    !estObjet(valeur) ||
    valeur['type'] !== 'enigmes' ||
    !Array.isArray(valeur['enigmes']) ||
    typeof valeur['codeFinal'] !== 'string'
  ) {
    return null;
  }
  const enigmes = valeur['enigmes'].filter(
    (enigme): enigme is SolutionnaireEnigme =>
      estObjet(enigme) &&
      typeof enigme['enigmeId'] === 'string' &&
      typeof enigme['solution'] === 'string' &&
      typeof enigme['fragment'] === 'string',
  );
  return { enigmes, codeFinal: valeur['codeFinal'] };
}

function estTentative(valeur: unknown): valeur is VerdictDeTentative {
  return (
    estObjet(valeur) &&
    typeof valeur['parcoursId'] === 'string' &&
    typeof valeur['enigmeId'] === 'string' &&
    typeof valeur['correcte'] === 'boolean' &&
    (valeur['fragment'] === null || typeof valeur['fragment'] === 'string') &&
    typeof valeur['tentativesRestantes'] === 'number'
  );
}

export class FpEscape extends FpBlock {
  private interne: EscapeParcoursPublic | null = null;
  private fragments = new Map<string, string>();
  private restantes = new Map<string, number>();
  private enVol: string | null = null;
  private saisie = '';
  private indiceOuvert = false;
  private message = '';
  private solutionnaire: Solutionnaire | null = null;

  set parcours(valeur: EscapeParcoursPublic | null) {
    const change = (valeur?.id ?? null) !== (this.interne?.id ?? null);
    this.interne = valeur === null ? null : projeterParcours(valeur);
    if (change) {
      this.fragments = new Map();
      this.restantes = new Map();
      this.enVol = null;
      this.saisie = '';
      this.indiceOuvert = false;
      this.message = '';
    }
    this.suivreAffichage(this.cleAffichage());
    this.refreshSiConnecte();
  }

  get parcours(): EscapeParcoursPublic | null {
    return this.interne;
  }

  set progression(valeur: ProgressionDesEnigmes | null) {
    if (
      !estObjet(valeur) ||
      valeur.parcoursId !== this.interne?.id ||
      !Array.isArray(valeur.resolues) ||
      !estObjet(valeur.tentativesRestantes)
    ) {
      return;
    }
    for (const resolue of valeur.resolues) {
      this.fragments.set(resolue.enigmeId, resolue.fragment);
    }
    for (const [enigmeId, restantes] of Object.entries(valeur.tentativesRestantes)) {
      this.restantes.set(enigmeId, restantes);
    }
    this.suivreAffichage(this.cleAffichage());
    this.refreshSiConnecte();
  }

  set tentatives(valeur: readonly VerdictDeTentative[] | null) {
    const parcoursId = this.interne?.id;
    for (const tentative of (valeur ?? []).filter(estTentative)) {
      if (tentative.parcoursId === parcoursId) {
        this.appliquer(tentative);
      }
    }
    this.suivreAffichage(this.cleAffichage());
    this.refreshSiConnecte();
  }

  set corrige(valeur: unknown) {
    this.solutionnaire = lireSolutionnaire(valeur);
    this.refreshSiConnecte();
  }

  set brouillon(valeur: unknown) {
    if (estObjet(valeur) && typeof valeur['saisie'] === 'string') {
      this.saisie = valeur['saisie'];
      this.noterBrouillonRepris();
      this.refreshSiConnecte();
    }
  }

  render(): EscapedHtml {
    const parcours = this.interne;
    if (parcours === null) {
      return safeHtml`<p data-testid="attente">${escapeHtml(this.texte('chargement'))}</p>`;
    }
    const corrige = this.solutionnaire !== null;
    const jeu =
      this.presentateur() || corrige
        ? VIDE
        : safeHtml`${this.progressionAffichee()}${this.minuteur()}`;
    const retour = this.presentateur()
      ? VIDE
      : safeHtml`<p class="fp-escape__annonce" role="status" aria-live="polite" data-testid="annonce">${escapeHtml(this.message)}</p>
        ${this.annonces()}`;
    return safeHtml`
      <section class="fp-carte fp-scene fp-escape__parcours">
        <p class="fp-enonce fp-escape__intitule" data-testid="intitule">${escapeHtml(parcours.intitule)}</p>
        <p class="fp-escape__consigne">${escapeHtml(this.texte('escape-consigne'))}</p>
        ${jeu}
        ${this.presentateur() || corrige ? this.enigmesProjetees(parcours) : this.enigmes()}
        ${this.issue(corrige)}
        ${retour}
      </section>
    `;
  }

  bind(racine: ShadowRoot): void {
    this.suivreAffichage(this.cleAffichage());
    if (this.presentateur()) {
      return;
    }
    const champ = racine.querySelector<HTMLInputElement>('[data-testid="saisie"]');
    if (champ !== null) {
      champ.addEventListener('input', () => {
        this.saisie = champ.value;
        this.signalerBrouillon(this.interne?.id ?? '', { saisie: champ.value });
      });
      champ.addEventListener('keydown', (evenement) => {
        if (evenement.key === 'Enter') {
          evenement.preventDefault();
          this.repondre();
        }
      });
    }
    racine
      .querySelector('[data-testid="repondre"]')
      ?.addEventListener('click', () => this.repondre());
    racine
      .querySelector('[data-testid="demander-indice"]')
      ?.addEventListener('click', () => this.demanderIndice());
  }

  protected override appliquerErreur(valeur: string | null): void {
    if (valeur !== null) {
      this.enVol = null;
    }
    super.appliquerErreur(valeur);
  }

  private appliquer(tentative: VerdictDeTentative): void {
    if (this.enVol === tentative.enigmeId) {
      this.enVol = null;
    }
    this.restantes.set(tentative.enigmeId, tentative.tentativesRestantes);
    if (tentative.correcte && tentative.fragment !== null) {
      const deja = this.fragments.has(tentative.enigmeId);
      this.fragments.set(tentative.enigmeId, tentative.fragment);
      this.saisie = '';
      this.indiceOuvert = false;
      this.message = deja ? this.message : this.annonceOuverture();
      return;
    }
    this.message =
      tentative.tentativesRestantes <= 0
        ? this.texte('escape-tentatives-epuisees')
        : this.texte('escape-a-chercher');
  }

  private tentativesMax(): number {
    return this.interne?.tentativesMax ?? TENTATIVES_PAR_DEFAUT;
  }

  private restantesDe(enigmeId: string): number {
    return this.restantes.get(enigmeId) ?? this.tentativesMax();
  }

  private etatDe(enigmeId: string): EtatEnigme {
    if (this.fragments.has(enigmeId)) {
      return 'resolue';
    }
    if (this.restantesDe(enigmeId) <= 0) {
      return 'epuisee';
    }
    return this.enigmeOuverte()?.id === enigmeId ? 'ouverte' : 'verrouillee';
  }

  private enigmeOuverte(): EscapeEnigmePublique | null {
    return (
      this.interne?.enigmes.find(
        (enigme) => !this.fragments.has(enigme.id) && this.restantesDe(enigme.id) > 0,
      ) ?? null
    );
  }

  private resolues(): number {
    return this.interne?.enigmes.filter((enigme) => this.fragments.has(enigme.id)).length ?? 0;
  }

  private total(): number {
    return this.interne?.enigmes.length ?? 0;
  }

  private acheve(): boolean {
    return this.total() > 0 && this.enigmeOuverte() === null;
  }

  private codeReconstitue(): string {
    return (this.interne?.enigmes ?? [])
      .map((enigme) => this.fragments.get(enigme.id) ?? '·')
      .join('');
  }

  private cleAffichage(): string | null {
    const parcours = this.interne;
    return parcours === null ? null : `${parcours.id}#${this.enigmeOuverte()?.id ?? 'fin'}`;
  }

  private progressionAffichee(): EscapedHtml {
    return safeHtml`<p class="fp-escape__progression" data-testid="progression" data-resolues="${this.resolues()}">${escapeHtml(this.texte('escape-progression'))} ${this.resolues()} / ${this.total()}</p>`;
  }

  private minuteur(): EscapedHtml {
    const budget = this.interne?.budgetEnigmeMs ?? 0;
    const ecoule = this.depuisAffichage();
    const echu = budget > 0 && ecoule >= budget;
    return safeHtml`
      <p class="fp-escape__minuteur" data-testid="minuteur" data-echu="${escapeHtml(echu)}">
        ${escapeHtml(this.texte('escape-minuteur'))} ${Math.floor(ecoule / MS_PAR_MINUTE)} / ${Math.round(budget / MS_PAR_MINUTE)} ${escapeHtml(this.texte('escape-minuteur-annonce'))}
        ${echu ? this.echeance() : VIDE}
      </p>
    `;
  }

  private echeance(): EscapedHtml {
    return safeHtml`<span class="fp-escape__echeance" data-testid="echeance">${escapeHtml(this.texte('escape-echu'))}</span>`;
  }

  private parcoursVide(): EscapedHtml {
    return safeHtml`<p class="fp-escape__vide" data-testid="vide">${escapeHtml(this.texte('escape-vide'))}</p>`;
  }

  private enigmes(): EscapedHtml {
    if (this.total() === 0) {
      return this.parcoursVide();
    }
    return safeHtml`<ol class="fp-escape__liste">${(this.interne?.enigmes ?? []).map((enigme) => this.enigme(enigme))}</ol>`;
  }

  private enigmesProjetees(parcours: EscapeParcoursPublic): EscapedHtml {
    if (parcours.enigmes.length === 0) {
      return this.parcoursVide();
    }
    const solution = (id: string): EscapedHtml => {
      const trouvee = this.solutionnaire?.enigmes.find((enigme) => enigme.enigmeId === id);
      return trouvee === undefined
        ? VIDE
        : safeHtml`<p class="fp-encadre fp-escape__solution" data-etat="confirme" data-testid="solution">${escapeHtml(trouvee.solution)} · <span class="fp-montant">${escapeHtml(trouvee.fragment)}</span></p>`;
    };
    return safeHtml`<ol class="fp-escape__liste">${parcours.enigmes.map(
      (enigme) =>
        safeHtml`<li class="fp-escape__enigme" data-testid="enigme" data-enigme="${escapeHtml(enigme.id)}"><p class="fp-escape__titre"><span class="fp-escape__nom">${escapeHtml(enigme.intitule)}</span></p><p class="fp-escape__enonce fp-prose" data-testid="enonce">${escapeHtml(enigme.enonce)}</p>${solution(enigme.id)}</li>`,
    )}</ol>`;
  }

  private libelleEtat(etat: EtatEnigme): string {
    return this.texte(etat === 'epuisee' ? 'escape-etat-verrouillee' : `escape-etat-${etat}`);
  }

  private enigme(enigme: EscapeEnigmePublique): EscapedHtml {
    const etat = this.etatDe(enigme.id);
    return safeHtml`
      <li class="fp-escape__enigme" data-testid="enigme" data-enigme="${escapeHtml(enigme.id)}" data-etat="${escapeHtml(etat)}">
        <p class="fp-escape__titre">
          <span class="fp-escape__nom">${escapeHtml(enigme.intitule)}</span>
          <span class="fp-badge fp-escape__etat" data-testid="etat">${escapeHtml(this.libelleEtat(etat))}</span>
        </p>
        ${this.corpsEnigme(enigme, etat)}
      </li>
    `;
  }

  private corpsEnigme(enigme: EscapeEnigmePublique, etat: EtatEnigme): EscapedHtml {
    if (etat === 'verrouillee') {
      return safeHtml`<p class="fp-escape__verrou" data-testid="verrou">${escapeHtml(this.texte('escape-verrouillee'))}</p>`;
    }
    if (etat === 'epuisee') {
      return safeHtml`<p class="fp-escape__verrou" data-testid="epuisee">${escapeHtml(this.texte('escape-tentatives-epuisees'))}</p>`;
    }
    if (etat === 'resolue') {
      return safeHtml`<p class="fp-escape__fragment" data-testid="fragment"><span class="fp-escape__mention">${escapeHtml(this.texte('escape-fragment'))}</span> <span class="fp-montant">${escapeHtml(this.fragments.get(enigme.id) ?? '')}</span></p>`;
    }
    return safeHtml`
      <p class="fp-escape__enonce fp-prose" data-testid="enonce">${escapeHtml(enigme.enonce)}</p>
      ${this.atelier(enigme)}
    `;
  }

  private atelier(enigme: EscapeEnigmePublique): EscapedHtml {
    const bloque = this.enVol !== null && !this.enApercu();
    return safeHtml`
      <p class="fp-escape__saisie">
        <label class="fp-escape__etiquette" for="fp-escape-reponse">${escapeHtml(this.texte('escape-reponse'))}</label>
        <input class="fp-escape__champ" id="fp-escape-reponse" type="text" data-testid="saisie" maxlength="${LONGUEUR_MAX_REPONSE}" value="${escapeHtml(this.saisie)}" autocomplete="off" />
        <button type="button" class="fp-escape__repondre" data-testid="repondre" ${bloque ? DESACTIVE : VIDE}>${escapeHtml(this.texte('escape-repondre'))}</button>
      </p>
      <p class="fp-escape__restantes" data-testid="tentatives-restantes">${escapeHtml(this.texte('escape-tentatives-restantes'))} ${this.restantesDe(enigme.id)}</p>
      <p class="fp-escape__aide">
        <button type="button" class="fp-escape__indice" data-testid="demander-indice" data-pret="${escapeHtml(this.indiceDisponible())}" ${this.indiceOuvert ? DESACTIVE : VIDE}>${escapeHtml(this.texte('escape-indice'))}</button>      </p>
      ${this.indiceOuvert ? this.indice(enigme) : VIDE}
    `;
  }

  private indice(enigme: EscapeEnigmePublique): EscapedHtml {
    return safeHtml`<p class="fp-encadre fp-escape__indication" data-testid="indice"><span class="fp-escape__mention">${escapeHtml(this.texte('escape-indice-donne'))}</span> ${escapeHtml(enigme.indice)}</p>`;
  }

  private coffre(): EscapedHtml {
    if (!this.acheve()) {
      return VIDE;
    }
    return safeHtml`<p class="fp-escape__coffre" data-testid="code"><span class="fp-escape__mention">${escapeHtml(this.texte('escape-code'))}</span> <span class="fp-montant">${escapeHtml(this.codeReconstitue())}</span></p>`;
  }

  private issue(corrige: boolean): EscapedHtml {
    if (corrige) {
      return this.codeFinal();
    }
    return this.presentateur() ? VIDE : this.coffre();
  }

  private codeFinal(): EscapedHtml {
    const solutionnaire = this.solutionnaire;
    if (solutionnaire === null) {
      return VIDE;
    }
    return safeHtml`<p class="fp-escape__coffre" data-testid="code-final"><span class="fp-escape__mention">${escapeHtml(this.texte('escape-code'))}</span> <span class="fp-montant">${escapeHtml(solutionnaire.codeFinal)}</span></p>`;
  }

  private indiceDisponible(): boolean {
    return this.depuisAffichage() >= (this.interne?.delaiIndiceMs ?? 0);
  }

  private demanderIndice(): void {
    const reste = (this.interne?.delaiIndiceMs ?? 0) - this.depuisAffichage();
    if (reste > 0) {
      this.message = `${this.texte('escape-indice-attente')} ${Math.ceil(reste / MS_PAR_SECONDE)} ${this.texte('escape-secondes')}`;
      this.refresh();
      return;
    }
    this.indiceOuvert = true;
    this.message = this.texte('escape-indice-pris');
    this.refresh();
  }

  private repondre(): void {
    const enigme = this.enigmeOuverte();
    const parcours = this.interne;
    if (enigme === null || parcours === null || (this.enVol !== null && !this.enApercu())) {
      return;
    }
    const reponse = this.saisie.trim();
    if (reponse.length === 0) {
      this.message = this.texte('escape-reponse-vide');
      this.refresh();
      return;
    }
    this.enVol = enigme.id;
    this.message = this.enApercu() ? this.texte('apercu') : '';
    this.emit('fp-escape-tentative', {
      parcoursId: parcours.id,
      enigmeId: enigme.id,
      reponse: reponse.slice(0, LONGUEUR_MAX_REPONSE),
      dureeMs: this.depuisAffichage(),
    });
    this.refresh();
  }

  private annonceOuverture(): string {
    const suivante = this.enigmeOuverte();
    if (suivante === null) {
      return `${this.texte('escape-termine')} ${this.codeReconstitue()}`;
    }
    return `${this.texte('escape-debloquee')} ${suivante.intitule}`;
  }
}
