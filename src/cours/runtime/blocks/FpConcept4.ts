import type { LigneDeMachine, SortiesMachine, ValeurAffichee } from '../../content/types';
import { dansUnDefileur } from '../core/defileur';
import { type EscapedHtml, escapeHtml, safeHtml, VIDE } from '../core/html';
import { echapperPourRegex, fini } from '../core/valeurs';
import { type Reglages } from './animation';
import { plafondDe, plancherDe } from './curseurs';
import { echelle } from './echelle';
import { type DefinitionReglable, FpReglable, arrondi, copierLeReglable } from './reglable';

export interface Concept4Definition extends DefinitionReglable {
  readonly formuleLatexSimplifie: string;
  readonly etapes?: readonly Concept4Etape[];
  readonly sorties: readonly SortiesMachine[];
}

export interface Concept4Etape {
  readonly libelle: string;
}

type Concept4Parametre = Concept4Definition['parametres'][number];

interface Trace {
  readonly points: string;
  readonly cx: number;
  readonly cy: number;
}

const EVENEMENT_D_EVALUATION = 'fp-concept4-evaluation';
const ABSENTE: ValeurAffichee = { valeur: null, affichage: '—' };
const LARGEUR = 320;
const HAUTEUR = 180;
const MARGE = 12;
function motifDesTermes(cles: readonly string[]): RegExp {
  const alternatives = [...cles]
    .sort((gauche, droite) => droite.length - gauche.length)
    .map(echapperPourRegex)
    .join('|');
  return new RegExp(`(?<![A-Za-z0-9_])(?:${alternatives})(?![A-Za-z0-9_])`, 'g');
}

function copierValeur({ valeur, affichage }: ValeurAffichee): ValeurAffichee {
  return { valeur, affichage };
}

function copierSortie(sortie: SortiesMachine): SortiesMachine {
  return {
    valeurs: { ...sortie.valeurs },
    resultat: copierValeur(sortie.resultat),
    etapes: sortie.etapes.map(copierValeur),
    courbes: Object.fromEntries(
      Object.entries(sortie.courbes).map(([cle, points]) => [
        cle,
        points.map(({ x, y }) => ({ x, y })),
      ]),
    ),
    lignes: Object.fromEntries(
      Object.entries(sortie.lignes).map(([cle, lignes]) => [
        cle,
        lignes.map(({ valeur, resultat, courante }) => ({
          valeur: copierValeur(valeur),
          resultat: copierValeur(resultat),
          courante,
        })),
      ]),
    ),
    phrase: sortie.phrase,
  };
}

function valeurDeFace(resultat: ValeurAffichee): EscapedHtml {
  return escapeHtml(String(resultat.valeur ?? Number.NaN));
}

export class FpConcept4 extends FpReglable<Concept4Definition> {
  protected readonly evenementDeReglage = 'fp-concept4-reglage';
  protected readonly bloc = 'concept4';
  private actif: string | null = null;
  private connues = new Map<string, SortiesMachine>();
  private montree: SortiesMachine | null = null;
  private derniereRecue: SortiesMachine | null = null;

  set evaluee(valeur: SortiesMachine | null) {
    if (valeur === null || valeur === this.derniereRecue || this.interne === null) {
      return;
    }
    this.derniereRecue = valeur;
    const cle = this.cleDe(valeur.valeurs);
    this.connues.set(cle, copierSortie(valeur));
    if (this.isConnected && cle === this.cleDe(this.courantes)) {
      this.rafraichirZone('faces', this.faces());
    }
  }

  protected copier(valeur: Concept4Definition): Concept4Definition {
    return {
      ...copierLeReglable(valeur),
      formuleLatexSimplifie: valeur.formuleLatexSimplifie,
      etapes: (valeur.etapes ?? []).map(({ libelle }) => ({ libelle })),
      sorties: valeur.sorties.map(copierSortie),
    };
  }

  protected override apresDefinition(): void {
    this.actif = null;
    this.montree = null;
    this.derniereRecue = null;
    this.connues = new Map(
      (this.interne?.sorties ?? []).map((sortie) => [this.cleDe(sortie.valeurs), sortie]),
    );
  }

  protected override apresReglage(cle: string): void {
    this.actif = cle;
  }

  protected override apresEtape(etape: Reglages): void {
    const parametres = this.definition?.parametres ?? [];
    this.actif = parametres.filter(({ cle }) => cle in etape).at(-1)?.cle ?? this.actif;
  }

  protected override apresRelachement(): void {
    this.rafraichirZone('faces', this.faces());
    if (this.connues.has(this.cleDe(this.courantes)) || this.presentateur() || this.enApercu()) {
      return;
    }
    this.emit(EVENEMENT_D_EVALUATION, { reglages: this.valeurs });
  }

  protected rafraichirLeRendu(): void {
    this.racine
      .querySelector('[data-testid="faces"]')
      ?.setAttribute('aria-busy', String(this.enAttente()));
  }

  render(): EscapedHtml {
    if (this.definition === null) {
      return this.attente();
    }
    const declencheurs = safeHtml`${this.boutonAnimer()}${this.prereglagesAffiches()}`;
    return safeHtml`<section class="fp-carte fp-scene fp-concept4__atelier">${this.panneauDeReglages(declencheurs)}<div class="fp-concept4__zone" data-zone="faces">${this.faces()}</div>${this.annonces()}</section>`;
  }

  private cleDe(valeurs: Reglages): string {
    return JSON.stringify((this.interne?.parametres ?? []).map(({ cle }) => valeurs[cle]));
  }

  private enAttente(): boolean {
    return this.montree === null || this.cleDe(this.montree.valeurs) !== this.cleDe(this.courantes);
  }

  private faces(): EscapedHtml {
    const definition = this.definition;
    if (definition === null) {
      return VIDE;
    }
    this.montree = this.connues.get(this.cleDe(this.courantes)) ?? this.montree;
    const sortie = this.montree;
    const resultat = sortie?.resultat ?? ABSENTE;
    const parametre = this.pilote();
    const pilotees =
      parametre === null
        ? VIDE
        : safeHtml`${this.graphique(parametre, sortie, resultat)}${this.tableau(parametre, sortie, resultat)}`;
    return safeHtml`
      <div class="fp-concept4__faces" data-testid="faces" aria-busy="${escapeHtml(String(this.enAttente()))}">
        ${this.formule(definition, resultat)}
        ${pilotees}
        ${this.enMots(sortie, resultat)}
      </div>
    `;
  }

  private parametre(cle: string): Concept4Parametre | null {
    return this.definition?.parametres.find((candidat) => candidat.cle === cle) ?? null;
  }

  private pilote(): Concept4Parametre | null {
    const parametres = this.definition?.parametres ?? [];
    return this.parametre(this.actif ?? '') ?? parametres[0] ?? null;
  }

  private formule(definition: Concept4Definition, resultat: ValeurAffichee): EscapedHtml {
    return safeHtml`
      <div class="fp-concept4__face fp-encadre" data-testid="formule" data-valeur="${valeurDeFace(resultat)}">
        <h3 class="fp-concept4__intitule">${escapeHtml(this.texte('concept4-formule'))}</h3>
        <p class="fp-concept4__formule fp-montant">${this.termes(definition)} = <span class="fp-concept4__resultat" data-testid="resultat-formule">${escapeHtml(resultat.affichage)}</span></p>
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

  private graphique(
    parametre: Concept4Parametre,
    sortie: SortiesMachine | null,
    resultat: ValeurAffichee,
  ): EscapedHtml {
    const trajectoire = this.trajectoire(sortie);
    const trace = trajectoire ?? this.trace(parametre, sortie, resultat);
    const etiquette = `${this.texte('concept4-courbe')} ${parametre.libelle}`;
    return safeHtml`
      <figure class="fp-concept4__face" data-testid="graphique" data-valeur="${valeurDeFace(resultat)}">
        <h3 class="fp-concept4__intitule">${escapeHtml(this.texte('concept4-graphique'))}</h3>
        <svg class="fp-concept4__courbe" data-testid="courbe" viewBox="0 0 ${LARGEUR} ${HAUTEUR}" role="img" aria-label="${escapeHtml(etiquette)}">
          ${trajectoire === null ? VIDE : safeHtml`<line class="fp-concept4__repere" data-testid="repere" x1="${MARGE}" x2="${LARGEUR - MARGE}" y1="${trajectoire.repere}" y2="${trajectoire.repere}"></line>`}
          <polyline class="fp-concept4__trace" data-testid="trace" points="${escapeHtml(trace.points)}"></polyline>
          <circle class="fp-concept4__point" data-testid="point" cx="${trace.cx}" cy="${trace.cy}" r="6"></circle>
        </svg>
      </figure>
    `;
  }

  private trajectoire(sortie: SortiesMachine | null): (Trace & { readonly repere: number }) | null {
    const ordonnees =
      (this.definition?.etapes ?? []).length > 0
        ? (sortie?.etapes ?? []).map((etape) => fini(etape.valeur ?? Number.NaN, 0))
        : [];
    if (ordonnees.length < 2) {
      return null;
    }
    const plancher = Math.min(...ordonnees);
    const plafond = Math.max(...ordonnees);
    const marge = (plafond - plancher || Math.abs(plafond) || 1) * 0.1;
    const derniere = ordonnees.length - 1;
    const versX = echelle(0, derniere, MARGE, LARGEUR - 2 * MARGE);
    const versY = echelle(
      plancher - marge,
      plafond - plancher + 2 * marge,
      HAUTEUR - MARGE,
      -(HAUTEUR - 2 * MARGE),
    );
    return {
      points: ordonnees
        .map((ordonnee, rang) => `${arrondi(versX(rang))},${arrondi(versY(ordonnee))}`)
        .join(' '),
      cx: arrondi(versX(derniere)),
      cy: arrondi(versY(ordonnees[derniere])),
      repere: arrondi(versY(ordonnees[0])),
    };
  }

  private trace(
    parametre: Concept4Parametre,
    sortie: SortiesMachine | null,
    resultat: ValeurAffichee,
  ): Trace {
    const depart = plancherDe(parametre);
    const arrivee = plafondDe(parametre);
    const versX = echelle(depart, arrivee - depart, MARGE, LARGEUR - 2 * MARGE);
    const cx = arrondi(versX(this.valeurDe(parametre)));
    const points = (sortie?.courbes[parametre.cle] ?? []).flatMap(({ x, y }) =>
      y !== null && Number.isFinite(y) ? [{ x, y }] : [],
    );
    if (points.length === 0) {
      return { points: '', cx, cy: HAUTEUR - MARGE };
    }
    const ordonnees = points.map(({ y }) => y);
    const plancher = Math.min(...ordonnees);
    const plafond = Math.max(...ordonnees);
    const versY = echelle(plancher, plafond - plancher, HAUTEUR - MARGE, -(HAUTEUR - 2 * MARGE));
    return {
      points: points.map(({ x, y }) => `${arrondi(versX(x))},${arrondi(versY(y))}`).join(' '),
      cx,
      cy: arrondi(versY(fini(resultat.valeur ?? Number.NaN, plancher))),
    };
  }

  private tableau(
    parametre: Concept4Parametre,
    sortie: SortiesMachine | null,
    resultat: ValeurAffichee,
  ): EscapedHtml {
    const etapes = this.definition?.etapes ?? [];
    if (etapes.length === 0) {
      return this.faceDuTableau(
        resultat,
        parametre.libelle,
        (sortie?.lignes[parametre.cle] ?? []).map((ligne) => this.ligne(ligne)),
      );
    }
    const derniere = etapes.length - 1;
    return this.faceDuTableau(
      resultat,
      this.texte('concept4-etape'),
      etapes.map(
        (etape, rang) =>
          safeHtml`<tr class="fp-concept4__ligne" data-testid="ligne" data-courant="${escapeHtml(String(rang === derniere))}"><td>${escapeHtml(etape.libelle)}</td><td class="fp-montant" data-testid="resultat-ligne">${escapeHtml((sortie?.etapes[rang] ?? ABSENTE).affichage)}</td></tr>`,
      ),
    );
  }

  private faceDuTableau(
    resultat: ValeurAffichee,
    premiereColonne: string,
    lignes: readonly EscapedHtml[],
  ): EscapedHtml {
    return safeHtml`
      <div class="fp-concept4__face" data-testid="tableau" data-valeur="${valeurDeFace(resultat)}">
        <h3 class="fp-concept4__intitule">${escapeHtml(this.texte('concept4-tableau'))}</h3>
        ${dansUnDefileur(safeHtml`<table class="fp-concept4__tableau">
          <thead>
            <tr>
              <th scope="col">${escapeHtml(premiereColonne)}</th>
              <th scope="col">${escapeHtml(this.texte('concept4-resultat'))}</th>
            </tr>
          </thead>
          <tbody>${lignes}</tbody>
        </table>`)}
      </div>
    `;
  }

  private ligne(ligne: LigneDeMachine): EscapedHtml {
    return safeHtml`<tr class="fp-concept4__ligne" data-testid="ligne" data-courant="${escapeHtml(String(ligne.courante))}"><td class="fp-montant">${escapeHtml(ligne.valeur.affichage)}</td><td class="fp-montant" data-testid="resultat-ligne">${escapeHtml(ligne.resultat.affichage)}</td></tr>`;
  }

  private enMots(sortie: SortiesMachine | null, resultat: ValeurAffichee): EscapedHtml {
    return safeHtml`
      <div class="fp-concept4__face" data-testid="phrase" data-valeur="${valeurDeFace(resultat)}">
        <h3 class="fp-concept4__intitule">${escapeHtml(this.texte('concept4-phrase'))}</h3>
        <p class="fp-prose" data-testid="phrase-texte">${escapeHtml(sortie?.phrase ?? '')}</p>
      </div>
    `;
  }
}
