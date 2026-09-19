import type { MetadonneesBrique } from '../../content/types';
import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { seedFromKey } from '../core/seed';
import { persistJson, readJson } from '../core/storage';
import { FpBlock } from './FpBlock';
import { projeterMetadonnees } from './projection';

export interface EscapeEnigmePublique {
  readonly id: string;
  readonly intitule: string;
  readonly enonce: string;
  readonly indice: string;
  readonly fragment: string;
}

export interface EscapeEnigme extends EscapeEnigmePublique {
  readonly solution: string;
}

export interface EscapeParcoursPublic {
  readonly id: string;
  readonly intitule: string;
  readonly delaiIndiceMs: number;
  readonly budgetEnigmeMs: number;
  readonly enigmes: readonly EscapeEnigmePublique[];
  readonly metadonnees: MetadonneesBrique;
}

export interface EscapeParcours extends EscapeParcoursPublic {
  readonly enigmes: readonly EscapeEnigme[];
}

interface EscapeProgres {
  readonly parcoursId: string;
  readonly resolues: number;
}

type EtatEnigme = 'resolue' | 'ouverte' | 'verrouillee';

const VIDE = escapeHtml('');
const DESACTIVE = safeHtml`disabled`;
const MS_PAR_MINUTE = 60000;
const MS_PAR_SECONDE = 1000;

function normaliserReponse(saisie: string): string {
  return saisie
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, '')
    .toLowerCase();
}

function empreinteDe(solution: string): number {
  return seedFromKey(normaliserReponse(solution));
}

function clePersistance(parcoursId: string): string {
  return `fp.escape.${parcoursId}`;
}

export class FpEscape extends FpBlock {
  private interne: EscapeParcoursPublic | null = null;
  private empreintes: readonly number[] = [];
  private solutions: readonly string[] = [];
  private resolues = 0;
  private saisie = '';
  private indiceOuvert = false;
  private message = '';

  set parcours(valeur: EscapeParcours | null) {
    this.interne = valeur === null ? null : this.projeterParcours(valeur);
    this.empreintes = valeur === null ? [] : valeur.enigmes.map((e) => empreinteDe(e.solution));
    this.solutions =
      valeur !== null && this.roleActuel() === 'presentateur'
        ? valeur.enigmes.map((enigme) => enigme.solution)
        : [];
    this.resolues = this.reprendre();
    this.saisie = '';
    this.indiceOuvert = false;
    this.message = '';
    this.suivreAffichage(this.cleAffichage());
    this.refreshSiConnecte();
  }

  get parcours(): EscapeParcoursPublic | null {
    const source = this.interne;
    if (source === null) {
      return null;
    }
    return {
      id: source.id,
      intitule: source.intitule,
      delaiIndiceMs: source.delaiIndiceMs,
      budgetEnigmeMs: source.budgetEnigmeMs,
      enigmes: source.enigmes.map((enigme, ordre) => this.projeterEnigme(enigme, ordre)),
      metadonnees: projeterMetadonnees(source.metadonnees),
    };
  }

  get avancement(): number {
    return this.resolues;
  }

  get codeFinal(): string {
    if (!this.acheve()) {
      return '';
    }
    return (this.interne?.enigmes ?? []).map((enigme) => enigme.fragment).join('');
  }

  renderHand(): EscapedHtml {
    const parcours = this.interne;
    if (parcours === null) {
      return safeHtml`<p>${escapeHtml(this.texte('chargement'))}</p>`;
    }
    return safeHtml`
      <section class="fp-carte fp-escape__parcours">
        <p class="fp-enonce fp-escape__intitule" data-testid="intitule">${escapeHtml(parcours.intitule)}</p>
        <p class="fp-escape__consigne">${escapeHtml(this.texte('escape-consigne'))}</p>
        ${this.progression()}
        ${this.minuteur()}
        ${this.enigmes(true)}
        ${this.coffre()}
        <p class="fp-escape__annonce" role="status" aria-live="polite" data-testid="annonce">${escapeHtml(this.message)}</p>
      </section>
    `;
  }

  renderStage(): EscapedHtml {
    const parcours = this.interne;
    if (parcours === null) {
      return safeHtml``;
    }
    return safeHtml`
      <section class="fp-scene fp-escape__parcours">
        <p class="fp-enonce fp-escape__intitule" data-testid="intitule">${escapeHtml(parcours.intitule)}</p>
        ${this.progression()}
        ${this.enigmes(false)}
        ${this.coffre()}
      </section>
    `;
  }

  renderBoard(): EscapedHtml {
    const parcours = this.interne;
    if (parcours === null) {
      return safeHtml`<p data-testid="attente">${escapeHtml(this.texte('en-attente'))}</p>`;
    }
    return safeHtml`
      <section class="fp-carte fp-escape__parcours">
        <p class="fp-enonce fp-escape__intitule" data-testid="intitule">${escapeHtml(parcours.intitule)}</p>
        ${this.progression()}
        ${this.minuteur()}
        <div class="fp-escape__reperes">
          <span class="fp-badge" data-testid="modalite">${escapeHtml(parcours.metadonnees.modalite)}</span>
          <span class="fp-badge" data-testid="duree">${parcours.metadonnees.dureeMinutes} min</span>
        </div>
        ${this.solutionnaire()}
      </section>
    `;
  }

  bind(racine: ShadowRoot): void {
    this.suivreAffichage(this.cleAffichage());
    if (this.mode() !== 'hand') {
      return;
    }
    const champ = racine.querySelector<HTMLInputElement>('[data-testid="saisie"]');
    if (champ !== null) {
      champ.addEventListener('input', () => {
        this.saisie = champ.value;
      });
    }
    racine
      .querySelector('[data-testid="repondre"]')
      ?.addEventListener('click', () => this.repondre());
    racine
      .querySelector('[data-testid="demander-indice"]')
      ?.addEventListener('click', () => this.demanderIndice());
  }

  private projeterParcours(source: EscapeParcours): EscapeParcoursPublic {
    return {
      id: source.id,
      intitule: source.intitule,
      delaiIndiceMs: source.delaiIndiceMs,
      budgetEnigmeMs: source.budgetEnigmeMs,
      enigmes: source.enigmes.map((enigme) => ({
        id: enigme.id,
        intitule: enigme.intitule,
        enonce: enigme.enonce,
        indice: enigme.indice,
        fragment: enigme.fragment,
      })),
      metadonnees: projeterMetadonnees(source.metadonnees),
    };
  }

  private projeterEnigme(enigme: EscapeEnigmePublique, ordre: number): EscapeEnigmePublique {
    if (ordre < this.resolues || this.roleActuel() === 'presentateur') {
      return { ...enigme };
    }
    return { ...enigme, fragment: '' };
  }

  private total(): number {
    return this.interne?.enigmes.length ?? 0;
  }

  private acheve(): boolean {
    return this.total() > 0 && this.resolues >= this.total();
  }

  private cleAffichage(): string | null {
    const parcours = this.interne;
    return parcours === null ? null : `${parcours.id}#${this.resolues}`;
  }

  private reprendre(): number {
    const parcours = this.interne;
    if (parcours === null) {
      return 0;
    }
    const repris = readJson<EscapeProgres>(clePersistance(parcours.id));
    if (repris === null || repris.parcoursId !== parcours.id) {
      return 0;
    }
    return Math.min(Math.max(Math.trunc(repris.resolues), 0), parcours.enigmes.length);
  }

  private consigner(): void {
    const parcours = this.interne;
    if (parcours === null) {
      return;
    }
    persistJson(clePersistance(parcours.id), {
      parcoursId: parcours.id,
      resolues: this.resolues,
    });
  }

  private etatDe(ordre: number): EtatEnigme {
    if (ordre < this.resolues) {
      return 'resolue';
    }
    return ordre === this.resolues ? 'ouverte' : 'verrouillee';
  }

  private enigmeOuverte(): EscapeEnigmePublique | null {
    return this.interne?.enigmes[this.resolues] ?? null;
  }

  private progression(): EscapedHtml {
    return safeHtml`<p class="fp-escape__progression" data-testid="progression" data-resolues="${this.resolues}">${escapeHtml(this.texte('escape-progression'))} ${this.resolues} / ${this.total()}</p>`;
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

  private enigmes(interactif: boolean): EscapedHtml {
    if (this.total() === 0) {
      return safeHtml`<p class="fp-escape__vide" data-testid="vide">${escapeHtml(this.texte('escape-vide'))}</p>`;
    }
    return safeHtml`<ol class="fp-escape__liste">${(this.interne?.enigmes ?? []).map((enigme, ordre) => this.enigme(enigme, ordre, interactif))}</ol>`;
  }

  private enigme(enigme: EscapeEnigmePublique, ordre: number, interactif: boolean): EscapedHtml {
    const etat = this.etatDe(ordre);
    return safeHtml`
      <li class="fp-escape__enigme" data-testid="enigme" data-enigme="${escapeHtml(enigme.id)}" data-etat="${escapeHtml(etat)}">
        <p class="fp-escape__titre">
          <span class="fp-escape__nom">${escapeHtml(enigme.intitule)}</span>
          <span class="fp-badge fp-escape__etat" data-testid="etat">${escapeHtml(this.texte(`escape-etat-${etat}`))}</span>
        </p>
        ${this.corpsEnigme(enigme, etat, interactif)}
      </li>
    `;
  }

  private corpsEnigme(
    enigme: EscapeEnigmePublique,
    etat: EtatEnigme,
    interactif: boolean,
  ): EscapedHtml {
    if (etat === 'verrouillee') {
      return safeHtml`<p class="fp-escape__verrou" data-testid="verrou">${escapeHtml(this.texte('escape-verrouillee'))}</p>`;
    }
    if (etat === 'resolue') {
      return safeHtml`<p class="fp-escape__fragment" data-testid="fragment"><span class="fp-escape__mention">${escapeHtml(this.texte('escape-fragment'))}</span> <span class="fp-montant">${escapeHtml(enigme.fragment)}</span></p>`;
    }
    return safeHtml`
      <p class="fp-escape__enonce fp-prose" data-testid="enonce">${escapeHtml(enigme.enonce)}</p>
      ${interactif ? this.atelier(enigme) : VIDE}
    `;
  }

  private atelier(enigme: EscapeEnigmePublique): EscapedHtml {
    return safeHtml`
      <p class="fp-escape__saisie">
        <label class="fp-escape__etiquette" for="fp-escape-reponse">${escapeHtml(this.texte('escape-reponse'))}</label>
        <input class="fp-escape__champ" id="fp-escape-reponse" type="text" data-testid="saisie" value="${escapeHtml(this.saisie)}" autocomplete="off" />
        <button type="button" class="fp-escape__repondre" data-testid="repondre">${escapeHtml(this.texte('escape-repondre'))}</button>
      </p>
      <p class="fp-escape__aide">
        <button type="button" class="fp-escape__indice" data-testid="demander-indice" data-pret="${escapeHtml(this.indiceDisponible())}" ${this.indiceOuvert ? DESACTIVE : VIDE}>${escapeHtml(this.texte('escape-indice'))}</button>
        <span class="fp-escape__gratuite" data-testid="gratuite">${escapeHtml(this.texte('escape-indice-gratuit'))}</span>
      </p>
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
    return safeHtml`<p class="fp-escape__coffre" data-testid="code"><span class="fp-escape__mention">${escapeHtml(this.texte('escape-code'))}</span> <span class="fp-montant">${escapeHtml(this.codeFinal)}</span></p>`;
  }

  private solutionnaire(): EscapedHtml {
    if (this.solutions.length === 0) {
      return VIDE;
    }
    return safeHtml`<ul class="fp-escape__solutions" data-testid="solutions">${this.solutions.map((solution) => this.solution(solution))}</ul>`;
  }

  private solution(solution: string): EscapedHtml {
    return safeHtml`<li class="fp-escape__solution">${escapeHtml(solution)}</li>`;
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
    if (enigme === null) {
      return;
    }
    if (this.saisie.trim().length === 0) {
      this.message = this.texte('escape-reponse-vide');
      this.refresh();
      return;
    }
    if (seedFromKey(normaliserReponse(this.saisie)) !== this.empreintes[this.resolues]) {
      this.message = this.texte('escape-a-chercher');
      this.refresh();
      return;
    }
    this.ouvrirSuivante(enigme);
  }

  private ouvrirSuivante(enigme: EscapeEnigmePublique): void {
    const dureeMs = this.depuisAffichage();
    this.resolues += 1;
    this.saisie = '';
    this.indiceOuvert = false;
    this.message = this.annonceOuverture();
    this.consigner();
    this.suivreAffichage(this.cleAffichage());
    this.emit('fp-escape-resolue', {
      parcoursId: this.interne?.id ?? '',
      enigmeId: enigme.id,
      resolues: this.resolues,
      acheve: this.acheve(),
      dureeMs,
    });
    this.refresh();
  }

  private annonceOuverture(): string {
    const suivante = this.enigmeOuverte();
    if (suivante === null) {
      return `${this.texte('escape-termine')} ${this.codeFinal}`;
    }
    return `${this.texte('escape-debloquee')} ${suivante.intitule}`;
  }
}
