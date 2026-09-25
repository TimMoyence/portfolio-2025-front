import { evaluerExpression, remplirGabarit } from '../core/formula';
import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { type Reglages } from './animation';
import {
  type DefinitionReglable,
  FpReglable,
  arrondi,
  copierLeReglable,
  fini,
  formater,
  plafondDe,
  plancherDe,
} from './reglable';

export interface Concept4Definition extends DefinitionReglable {
  readonly formuleLatexSimplifie: string;
  readonly calcul: string;
  readonly phrase: string;
  readonly etapes?: readonly Concept4Etape[];
}

export interface Concept4Etape {
  readonly libelle: string;
  readonly calcul: string;
}

type Concept4Parametre = Concept4Definition['parametres'][number];

type Valeurs = Reglages;

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

function motifDesTermes(cles: readonly string[]): RegExp {
  const alternatives = [...cles]
    .sort((gauche, droite) => droite.length - gauche.length)
    .map((cle) => cle.replace(SPECIAUX, '\\$&'))
    .join('|');
  return new RegExp(`(?<![A-Za-z0-9_])(?:${alternatives})(?![A-Za-z0-9_])`, 'g');
}

export class FpConcept4 extends FpReglable<Concept4Definition> {
  protected readonly evenementDeReglage = 'fp-concept4-reglage';
  protected readonly bloc = 'concept4';
  private actif: string | null = null;

  protected copier(valeur: Concept4Definition): Concept4Definition {
    return {
      ...copierLeReglable(valeur),
      formuleLatexSimplifie: valeur.formuleLatexSimplifie,
      calcul: valeur.calcul,
      phrase: valeur.phrase,
      etapes: (valeur.etapes ?? []).map(({ libelle, calcul }) => ({ libelle, calcul })),
    };
  }

  protected override apresDefinition(): void {
    this.actif = null;
  }

  protected override apresReglage(cle: string): void {
    this.actif = cle;
  }

  protected override apresEtape(etape: Reglages): void {
    const parametres = this.definition?.parametres ?? [];
    this.actif = parametres.filter(({ cle }) => cle in etape).at(-1)?.cle ?? this.actif;
  }

  protected rafraichirLeRendu(): void {
    this.rafraichirZone('faces', this.faces());
  }

  render(): EscapedHtml {
    if (this.definition === null) {
      return this.attente();
    }
    const declencheurs = safeHtml`${this.boutonAnimer()}${this.prereglagesAffiches()}`;
    return safeHtml`<section class="fp-carte fp-scene fp-concept4__atelier">${this.panneauDeReglages(declencheurs)}<div class="fp-concept4__zone" data-zone="faces">${this.faces()}</div></section>`;
  }

  private faces(): EscapedHtml {
    const definition = this.definition;
    if (definition === null) {
      return safeHtml``;
    }
    const valeurs = this.valeurs;
    const resultat = this.resultat(valeurs);
    return safeHtml`
      <div class="fp-concept4__faces">
        ${this.formule(definition, resultat)}
        ${this.graphique(valeurs)}
        ${this.tableau(valeurs)}
        ${this.enMots(definition, valeurs, resultat)}
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

  private formule(definition: Concept4Definition, resultat: number): EscapedHtml {
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
      fini(evaluerExpression(etape.calcul, valeurs).valeur ?? Number.NaN, 0),
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
    const depart = plancherDe(parametre);
    const arrivee = plafondDe(parametre);
    const abscisses = Array.from(
      { length: POINTS_COURBE + 1 },
      (_, rang) => depart + ((arrivee - depart) * rang) / POINTS_COURBE,
    );
    const ordonnees = abscisses.map((abscisse) =>
      fini(this.resultat({ ...valeurs, [parametre.cle]: abscisse }), 0),
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
      cx: arrondi(versX(this.valeurDe(parametre, valeurs))),
      cy: arrondi(versY(fini(this.resultat(valeurs), plancher))),
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
    const depart = plancherDe(parametre);
    const arrivee = plafondDe(parametre);
    const courante = this.valeurDe(parametre, valeurs);
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

  private enMots(definition: Concept4Definition, valeurs: Valeurs, resultat: number): EscapedHtml {
    const phrase = remplirGabarit(definition.phrase, { ...valeurs, resultat }, formater);
    return safeHtml`
      <div class="fp-concept4__face" data-testid="phrase" data-valeur="${escapeHtml(String(resultat))}">
        <h3 class="fp-concept4__intitule">${escapeHtml(this.texte('concept4-phrase'))}</h3>
        <p class="fp-prose fp-concept4__phrase" data-testid="phrase-texte">${escapeHtml(phrase)}</p>
      </div>
    `;
  }
}
