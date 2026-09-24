import type { MetadonneesBrique } from '../../content/types';
import { evaluerExpression, remplirGabarit } from '../core/formula';
import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { brancherCurseurs, curseur } from './curseurs';
import { FpBlock } from './FpBlock';
import { projeterMetadonnees } from './projection';

export interface Concept4Parametre {
  readonly cle: string;
  readonly libelle: string;
  readonly min: number;
  readonly max: number;
  readonly pas: number;
  readonly defaut: number;
}

export interface Concept4Definition {
  readonly id: string;
  readonly parametres: readonly Concept4Parametre[];
  readonly formuleLatexSimplifie: string;
  readonly calcul: string;
  readonly phrase: string;
  readonly etapes?: readonly Concept4Etape[];
  readonly prereglages?: readonly Concept4Prereglage[];
  readonly metadonnees: MetadonneesBrique;
}

export interface Concept4Prereglage {
  readonly libelle: string;
  readonly valeurs: Readonly<Record<string, number>>;
}

export interface Concept4Etape {
  readonly libelle: string;
  readonly calcul: string;
}

type Valeurs = Readonly<Record<string, number>>;

interface LigneTableau {
  readonly valeur: number;
  readonly resultat: number;
  readonly courant: boolean;
}

interface Trace {
  readonly points: string;
  readonly cx: number;
  readonly cy: number;
}

const POINTS_COURBE = 24;
const INTERVALLES_TABLEAU = 6;
const LARGEUR = 320;
const HAUTEUR = 180;
const MARGE = 12;
const SPECIAUX = /[.*+?^${}()|[\]\\]/g;
function nombre(valeur: number, repli: number): number {
  return Number.isFinite(valeur) ? valeur : repli;
}

function bas(parametre: Concept4Parametre): number {
  return nombre(parametre.min, 0);
}

function haut(parametre: Concept4Parametre): number {
  return Math.max(nombre(parametre.max, bas(parametre)), bas(parametre));
}

function borner(parametre: Concept4Parametre, valeur: number): number {
  return Math.min(Math.max(nombre(valeur, bas(parametre)), bas(parametre)), haut(parametre));
}

function arrondi(valeur: number): number {
  return Math.round(valeur * 100) / 100;
}

function formater(valeur: number): string {
  return Number.isFinite(valeur) ? String(arrondi(valeur)).replace('.', ',') : '—';
}

function projeterParametres(source: readonly Concept4Parametre[]): Concept4Parametre[] {
  return source
    .filter((parametre) => parametre.cle.trim().length > 0)
    .map((parametre) => ({
      cle: parametre.cle,
      libelle: parametre.libelle,
      min: parametre.min,
      max: parametre.max,
      pas: parametre.pas,
      defaut: parametre.defaut,
    }));
}

function motifDesTermes(cles: readonly string[]): RegExp {
  const alternatives = [...cles]
    .sort((gauche, droite) => droite.length - gauche.length)
    .map((cle) => cle.replace(SPECIAUX, '\\$&'))
    .join('|');
  return new RegExp(`(?<![A-Za-z0-9_])(?:${alternatives})(?![A-Za-z0-9_])`, 'g');
}

export class FpConcept4 extends FpBlock {
  private interne: Concept4Definition | null = null;
  private courantes: Record<string, number> = {};
  private actif: string | null = null;
  private animation: ReturnType<typeof setInterval> | null = null;

  set definition(valeur: Concept4Definition | null) {
    this.arreterAnimation();
    this.interne =
      valeur === null
        ? null
        : {
            id: valeur.id,
            parametres: projeterParametres(valeur.parametres),
            formuleLatexSimplifie: valeur.formuleLatexSimplifie,
            calcul: valeur.calcul,
            phrase: valeur.phrase,
            etapes: (valeur.etapes ?? []).map(({ libelle, calcul }) => ({ libelle, calcul })),
            prereglages: (valeur.prereglages ?? []).map(({ libelle, valeurs }) => ({
              libelle,
              valeurs: { ...valeurs },
            })),
            metadonnees: projeterMetadonnees(valeur.metadonnees),
          };
    this.courantes = {};
    this.actif = null;
    for (const parametre of this.interne?.parametres ?? []) {
      this.courantes[parametre.cle] = borner(parametre, parametre.defaut);
    }
    this.refreshSiConnecte();
  }

  get definition(): Concept4Definition | null {
    return this.interne;
  }

  get valeurs(): Valeurs {
    return { ...this.courantes };
  }

  set reglages(valeur: Valeurs | null) {
    if (valeur === null) {
      return;
    }
    this.arreterAnimation();
    for (const parametre of this.interne?.parametres ?? []) {
      const pilote = valeur[parametre.cle];
      if (typeof pilote === 'number') {
        this.courantes[parametre.cle] = borner(parametre, pilote);
      }
    }
    this.refreshSiConnecte();
  }

  disconnectedCallback(): void {
    this.arreterAnimation();
  }

  render(): EscapedHtml {
    if (this.definition === null) {
      return safeHtml`<p data-testid="attente">${escapeHtml(this.texte('chargement'))}</p>`;
    }
    return safeHtml`<section class="fp-carte fp-scene fp-concept4__atelier">${this.panneauDeReglages()}<div class="fp-concept4__zone" data-zone="faces">${this.faces()}</div></section>`;
  }

  bind(racine: ShadowRoot): void {
    this.suivreAffichage(this.definition?.id ?? null);
    racine
      .querySelector<HTMLButtonElement>('[data-testid="animer"]')
      ?.addEventListener('click', () => {
        this.animer();
      });
    brancherCurseurs(racine, (cle, valeur) => this.regler(cle, valeur));
    racine.querySelectorAll<HTMLButtonElement>('[data-testid="prereglage"]').forEach((bouton) => {
      bouton.addEventListener('click', () => {
        this.appliquerPrereglage(Number(bouton.dataset['rang']));
        this.relayerReglages();
      });
    });
    for (const curseur of racine.querySelectorAll('input[data-testid="curseur"]')) {
      curseur.addEventListener('change', () => this.relayerReglages());
    }
  }

  private relayerReglages(): void {
    if (this.roleActuel() === 'presentateur' && !this.enApercu()) {
      this.emit('fp-concept4-reglage', { reglages: this.valeurs });
    }
  }

  private appliquerPrereglage(rang: number): void {
    const prereglage = this.definition?.prereglages?.[rang];
    if (prereglage === undefined) {
      return;
    }
    this.arreterAnimation();
    for (const parametre of this.definition?.parametres ?? []) {
      if (Object.hasOwn(prereglage.valeurs, parametre.cle)) {
        this.courantes = {
          ...this.courantes,
          [parametre.cle]: borner(parametre, prereglage.valeurs[parametre.cle]),
        };
      }
    }
    this.refresh();
  }

  private estActif(prereglage: Concept4Prereglage | undefined): boolean {
    return (
      prereglage !== undefined &&
      Object.entries(prereglage.valeurs).every(([cle, valeur]) => this.courantes[cle] === valeur)
    );
  }

  private prereglagesAffiches(): EscapedHtml {
    const prereglages = this.definition?.prereglages ?? [];
    if (prereglages.length === 0) {
      return safeHtml``;
    }
    return safeHtml`<div class="fp-concept4__prereglages" role="group" aria-label="${escapeHtml(this.texte('concept4-prereglages'))}">${prereglages.map(
      (prereglage, rang) =>
        safeHtml`<button class="fp-concept4__prereglage" data-testid="prereglage" data-rang="${rang}" type="button" aria-pressed="${escapeHtml(String(this.estActif(prereglage)))}">${escapeHtml(prereglage.libelle)}</button>`,
    )}</div>`;
  }

  private regler(cle: string, valeur: number): void {
    const parametre = this.parametre(cle);
    if (parametre === null) {
      return;
    }
    this.arreterAnimation();
    this.courantes = { ...this.courantes, [cle]: borner(parametre, valeur) };
    this.actif = cle;
    const sortie = this.racine.querySelector<HTMLOutputElement>(
      `output[data-testid="valeur"][data-cle="${cle}"]`,
    );
    if (sortie !== null) {
      sortie.textContent = formater(this.courantes[cle]);
    }
    this.rafraichirZone('faces', this.faces());
    this.racine
      .querySelectorAll<HTMLButtonElement>('[data-testid="prereglage"]')
      .forEach((bouton) => {
        const prereglage = this.definition?.prereglages?.[Number(bouton.dataset['rang'])];
        bouton.setAttribute('aria-pressed', String(this.estActif(prereglage)));
      });
  }

  private faces(): EscapedHtml {
    const valeurs = this.valeurs;
    return safeHtml`
      <div class="fp-concept4__faces">
        ${this.formule(valeurs)}
        ${this.graphique(valeurs)}
        ${this.tableau(valeurs)}
        ${this.enMots(valeurs)}
      </div>
    `;
  }

  private resultat(valeurs: Valeurs): number {
    const definition = this.definition;
    return definition === null
      ? Number.NaN
      : (evaluerExpression(definition.calcul, valeurs).valeur ?? Number.NaN);
  }

  private parametre(cle: string): Concept4Parametre | null {
    return this.definition?.parametres.find((candidat) => candidat.cle === cle) ?? null;
  }

  private pilote(): Concept4Parametre | null {
    const parametres = this.definition?.parametres ?? [];
    return this.parametre(this.actif ?? '') ?? parametres[0] ?? null;
  }

  private valeurCourante(parametre: Concept4Parametre, valeurs: Valeurs): number {
    return borner(parametre, nombre(valeurs[parametre.cle], parametre.defaut));
  }

  private formule(valeurs: Valeurs): EscapedHtml {
    const definition = this.definition;
    if (definition === null) {
      return safeHtml``;
    }
    const resultat = this.resultat(valeurs);
    return safeHtml`
      <div class="fp-concept4__face fp-encadre" data-testid="formule" data-valeur="${escapeHtml(String(resultat))}">
        <h3 class="fp-concept4__intitule">${escapeHtml(this.texte('concept4-formule'))}</h3>
        <p class="fp-concept4__formule fp-montant">${this.termes(definition)} = <span class="fp-concept4__resultat" data-testid="resultat-formule">${escapeHtml(formater(resultat))}</span></p>
      </div>
    `;
  }

  private termes(definition: Concept4Definition): EscapedHtml {
    const cles = definition.parametres.map((parametre) => parametre.cle);
    const source = definition.formuleLatexSimplifie;
    const morceaux: EscapedHtml[] = [];
    const fraction = /\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g;
    let curseur = 0;
    for (const trouve of source.matchAll(fraction)) {
      const debut = trouve.index ?? 0;
      morceaux.push(this.termesTexte(source.slice(curseur, debut), cles));
      const numerateur = trouve[1] ?? '';
      const denominateur = trouve[2] ?? '';
      const libelleFraction = escapeHtml(
        `${numerateur} ${this.texte('concept4-divise-par')} ${denominateur}`,
      );
      morceaux.push(
        safeHtml`<span class="fp-concept4__fraction" data-testid="fraction" aria-label="${libelleFraction}"><span class="fp-concept4__fraction-numerateur">${this.termesTexte(numerateur, cles)}</span><span class="fp-concept4__fraction-denominateur">${this.termesTexte(denominateur, cles)}</span></span>`,
      );
      curseur = debut + trouve[0].length;
    }
    morceaux.push(this.termesTexte(source.slice(curseur), cles));
    return safeHtml`${morceaux}`;
  }

  private termesTexte(source: string, cles: readonly string[]): EscapedHtml {
    const texte = source.replaceAll('\\times', '×');
    if (cles.length === 0) {
      return escapeHtml(texte);
    }
    const morceaux: EscapedHtml[] = [];
    let curseur = 0;
    for (const trouve of texte.matchAll(motifDesTermes(cles))) {
      const debut = trouve.index ?? 0;
      morceaux.push(escapeHtml(texte.slice(curseur, debut)));
      morceaux.push(this.terme(trouve[0]));
      curseur = debut + trouve[0].length;
    }
    morceaux.push(escapeHtml(texte.slice(curseur)));
    return safeHtml`${morceaux}`;
  }

  private terme(cle: string): EscapedHtml {
    return safeHtml`<span class="fp-concept4__terme" data-testid="terme" data-cle="${escapeHtml(cle)}" data-actif="${escapeHtml(String(cle === this.actif))}">${escapeHtml(cle)}</span>`;
  }

  private graphique(valeurs: Valeurs): EscapedHtml {
    const parametre = this.pilote();
    if (parametre === null) {
      return safeHtml``;
    }
    const trajectoire = this.trajectoire(valeurs);
    const trace = trajectoire ?? this.trace(parametre, valeurs);
    const etiquette = `${this.texte('concept4-courbe')} ${parametre.libelle}`;
    return safeHtml`
      <figure class="fp-concept4__face" data-testid="graphique" data-valeur="${escapeHtml(String(this.resultat(valeurs)))}">
        <h3 class="fp-concept4__intitule">${escapeHtml(this.texte('concept4-graphique'))}</h3>
        <svg class="fp-concept4__courbe" data-testid="courbe" viewBox="0 0 ${LARGEUR} ${HAUTEUR}" role="img" aria-label="${escapeHtml(etiquette)}">
          ${trajectoire === null ? safeHtml`` : safeHtml`<line class="fp-concept4__repere" data-testid="repere" x1="${MARGE}" x2="${LARGEUR - MARGE}" y1="${trajectoire.repere}" y2="${trajectoire.repere}"></line>`}
          <polyline class="fp-concept4__trace" data-testid="trace" points="${escapeHtml(trace.points)}"></polyline>
          <circle class="fp-concept4__point" data-testid="point" cx="${trace.cx}" cy="${trace.cy}" r="6"></circle>
        </svg>
      </figure>
    `;
  }

  private valeursDesEtapes(valeurs: Valeurs): number[] {
    return (this.definition?.etapes ?? []).map((etape) =>
      nombre(evaluerExpression(etape.calcul, valeurs).valeur ?? Number.NaN, 0),
    );
  }

  private trajectoire(valeurs: Valeurs): (Trace & { readonly repere: number }) | null {
    const ordonnees = this.valeursDesEtapes(valeurs);
    if (ordonnees.length < 2) {
      return null;
    }
    const plancher = Math.min(...ordonnees);
    const plafond = Math.max(...ordonnees);
    const marge = (plafond - plancher || Math.abs(plafond) || 1) * 0.1;
    const versX = (rang: number): number =>
      MARGE + (rang / (ordonnees.length - 1)) * (LARGEUR - 2 * MARGE);
    const versY = (ordonnee: number): number =>
      HAUTEUR -
      MARGE -
      ((ordonnee - (plancher - marge)) / (plafond - plancher + 2 * marge)) * (HAUTEUR - 2 * MARGE);
    const derniere = ordonnees.length - 1;
    return {
      points: ordonnees
        .map((ordonnee, rang) => `${arrondi(versX(rang))},${arrondi(versY(ordonnee))}`)
        .join(' '),
      cx: arrondi(versX(derniere)),
      cy: arrondi(versY(ordonnees[derniere])),
      repere: arrondi(versY(ordonnees[0])),
    };
  }

  private trace(parametre: Concept4Parametre, valeurs: Valeurs): Trace {
    const depart = bas(parametre);
    const arrivee = haut(parametre);
    const abscisses = Array.from(
      { length: POINTS_COURBE + 1 },
      (_, rang) => depart + ((arrivee - depart) * rang) / POINTS_COURBE,
    );
    const ordonnees = abscisses.map((abscisse) =>
      nombre(this.resultat({ ...valeurs, [parametre.cle]: abscisse }), 0),
    );
    const plancher = Math.min(...ordonnees);
    const plafond = Math.max(...ordonnees);
    const versX = (abscisse: number): number =>
      MARGE + ((abscisse - depart) / (arrivee - depart || 1)) * (LARGEUR - 2 * MARGE);
    const versY = (ordonnee: number): number =>
      HAUTEUR - MARGE - ((ordonnee - plancher) / (plafond - plancher || 1)) * (HAUTEUR - 2 * MARGE);
    return {
      points: abscisses
        .map((abscisse, rang) => `${arrondi(versX(abscisse))},${arrondi(versY(ordonnees[rang]))}`)
        .join(' '),
      cx: arrondi(versX(this.valeurCourante(parametre, valeurs))),
      cy: arrondi(versY(nombre(this.resultat(valeurs), plancher))),
    };
  }

  private tableau(valeurs: Valeurs): EscapedHtml {
    const parametre = this.pilote();
    if (parametre === null) {
      return safeHtml``;
    }
    if ((this.definition?.etapes ?? []).length > 0) {
      return this.tableauDesEtapes(valeurs);
    }
    const lignes = this.lignes(parametre, valeurs);
    const courante = lignes.find((ligne) => ligne.courant);
    return safeHtml`
      <div class="fp-concept4__face" data-testid="tableau" data-valeur="${escapeHtml(String(courante?.resultat ?? Number.NaN))}">
        <h3 class="fp-concept4__intitule">${escapeHtml(this.texte('concept4-tableau'))}</h3>
        <table class="fp-concept4__tableau">
          <thead>
            <tr>
              <th scope="col">${escapeHtml(parametre.libelle)}</th>
              <th scope="col">${escapeHtml(this.texte('concept4-resultat'))}</th>
            </tr>
          </thead>
          <tbody>${lignes.map((ligne) => this.ligne(ligne))}</tbody>
        </table>
      </div>
    `;
  }

  private tableauDesEtapes(valeurs: Valeurs): EscapedHtml {
    const etapes = this.definition?.etapes ?? [];
    const resultats = this.valeursDesEtapes(valeurs);
    const derniere = etapes.length - 1;
    return safeHtml`
      <div class="fp-concept4__face" data-testid="tableau" data-valeur="${escapeHtml(String(this.resultat(valeurs)))}">
        <h3 class="fp-concept4__intitule">${escapeHtml(this.texte('concept4-tableau'))}</h3>
        <table class="fp-concept4__tableau">
          <thead>
            <tr>
              <th scope="col">${escapeHtml(this.texte('concept4-etape'))}</th>
              <th scope="col">${escapeHtml(this.texte('concept4-resultat'))}</th>
            </tr>
          </thead>
          <tbody>${etapes.map(
            (etape, rang) =>
              safeHtml`<tr class="fp-concept4__ligne" data-testid="ligne" data-courant="${escapeHtml(String(rang === derniere))}"><td>${escapeHtml(etape.libelle)}</td><td class="fp-montant" data-testid="resultat-ligne">${escapeHtml(formater(resultats[rang]))}</td></tr>`,
          )}</tbody>
        </table>
      </div>
    `;
  }

  private lignes(parametre: Concept4Parametre, valeurs: Valeurs): LigneTableau[] {
    const depart = bas(parametre);
    const arrivee = haut(parametre);
    const courante = this.valeurCourante(parametre, valeurs);
    const jalons = Array.from(
      { length: INTERVALLES_TABLEAU + 1 },
      (_, rang) => depart + ((arrivee - depart) * rang) / INTERVALLES_TABLEAU,
    );
    return [...new Set([...jalons, courante])]
      .sort((gauche, droite) => gauche - droite)
      .map((valeur) => ({
        valeur,
        resultat: this.resultat({ ...valeurs, [parametre.cle]: valeur }),
        courant: valeur === courante,
      }));
  }

  private ligne(ligne: LigneTableau): EscapedHtml {
    return safeHtml`<tr class="fp-concept4__ligne" data-testid="ligne" data-courant="${escapeHtml(String(ligne.courant))}"><td class="fp-montant">${escapeHtml(formater(ligne.valeur))}</td><td class="fp-montant" data-testid="resultat-ligne">${escapeHtml(formater(ligne.resultat))}</td></tr>`;
  }

  private enMots(valeurs: Valeurs): EscapedHtml {
    const definition = this.definition;
    if (definition === null) {
      return safeHtml``;
    }
    const resultat = this.resultat(valeurs);
    const phrase = remplirGabarit(definition.phrase, { ...valeurs, resultat }, formater);
    return safeHtml`
      <div class="fp-concept4__face" data-testid="phrase" data-valeur="${escapeHtml(String(resultat))}">
        <h3 class="fp-concept4__intitule">${escapeHtml(this.texte('concept4-phrase'))}</h3>
        <p class="fp-prose fp-concept4__phrase" data-testid="phrase-texte">${escapeHtml(phrase)}</p>
      </div>
    `;
  }

  private panneauDeReglages(): EscapedHtml {
    const parametres = this.definition?.parametres ?? [];
    return safeHtml`
      <fieldset class="fp-concept4__reglages">
        <legend>${escapeHtml(this.texte('concept4-reglages'))}</legend>
        <button class="fp-concept4__animation" data-testid="animer" type="button">
          ${escapeHtml(this.texte('concept4-animer'))}
        </button>
        ${this.prereglagesAffiches()}
        <div class="fp-concept4__parametres" aria-live="polite">
          ${parametres.map((parametre) => this.parametreAffiche(parametre))}
        </div>
      </fieldset>
    `;
  }

  private parametreAffiche(parametre: Concept4Parametre): EscapedHtml {
    const valeur = this.valeurCourante(parametre, this.courantes);
    return safeHtml`
      <div class="fp-concept4__parametre" data-testid="parametre" data-cle="${escapeHtml(parametre.cle)}">
        <span class="fp-concept4__etiquette">${escapeHtml(parametre.libelle)}</span>
        ${curseur('fp-concept4', parametre, valeur, this.enonceValeur(parametre, valeur))}
        <output class="fp-concept4__valeur fp-montant" data-testid="valeur" data-cle="${escapeHtml(parametre.cle)}" aria-label="${escapeHtml(this.enonceValeur(parametre, valeur))}">${escapeHtml(formater(valeur))}</output>
      </div>
    `;
  }

  private enonceValeur(parametre: Concept4Parametre, valeur: number): string {
    const plage = `${this.texte('concept4-plage')} ${formater(bas(parametre))} ${this.texte('concept4-plage-fin')} ${formater(haut(parametre))}`;
    return `${parametre.libelle} : ${formater(valeur)} (${plage})`;
  }

  private animer(): void {
    const parametres = this.definition?.parametres ?? [];
    if (parametres.length === 0) {
      return;
    }
    this.arreterAnimation();
    const depart = Object.fromEntries(
      parametres.map((parametre) => [
        parametre.cle,
        this.valeurCourante(parametre, this.courantes),
      ]),
    );
    let etape = 0;
    const total = 6;
    const avancer = (): void => {
      etape += 1;
      const progression = etape / total;
      this.courantes = Object.fromEntries(
        parametres.map((parametre) => {
          const valeurDepart = depart[parametre.cle] ?? parametre.defaut;
          const valeur = valeurDepart + (haut(parametre) - valeurDepart) * progression;
          return [parametre.cle, borner(parametre, valeur)];
        }),
      );
      this.actif = parametres[parametres.length - 1].cle;
      this.refresh();
      if (etape >= total) {
        this.arreterAnimation();
      }
    };
    this.animation = setInterval(avancer, 180);
    avancer();
  }

  private arreterAnimation(): void {
    if (this.animation !== null) {
      clearInterval(this.animation);
      this.animation = null;
    }
  }
}
