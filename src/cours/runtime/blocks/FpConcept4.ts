import type { MetadonneesBrique } from '../../content/types';
import { evaluerExpression, remplirGabarit } from '../core/formula';
import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
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
  readonly metadonnees: MetadonneesBrique;
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
const SENS: Readonly<Record<string, number | undefined>> = {
  ArrowRight: 1,
  ArrowUp: 1,
  ArrowLeft: -1,
  ArrowDown: -1,
};

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

function pasUtile(parametre: Concept4Parametre): number {
  const pas = nombre(parametre.pas, 0);
  return pas > 0 ? pas : 1;
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
  private suivi: string | null = null;

  set definition(valeur: Concept4Definition | null) {
    this.interne =
      valeur === null
        ? null
        : {
            id: valeur.id,
            parametres: projeterParametres(valeur.parametres),
            formuleLatexSimplifie: valeur.formuleLatexSimplifie,
            calcul: valeur.calcul,
            phrase: valeur.phrase,
            metadonnees: projeterMetadonnees(valeur.metadonnees),
          };
    this.courantes = {};
    this.actif = null;
    this.suivi = null;
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

  get termeActif(): string | null {
    return this.actif;
  }

  renderHand(): EscapedHtml {
    if (this.definition === null) {
      return safeHtml`<p>${escapeHtml(this.texte('chargement'))}</p>`;
    }
    return safeHtml`<section class="fp-carte fp-concept4__atelier">${this.reglages()}${this.faces('fp-prose')}</section>`;
  }

  renderStage(): EscapedHtml {
    if (this.definition === null) {
      return safeHtml``;
    }
    return safeHtml`<section class="fp-scene fp-concept4__atelier">${this.faces('fp-enonce')}</section>`;
  }

  renderBoard(): EscapedHtml {
    const definition = this.definition;
    if (definition === null) {
      return safeHtml`<p data-testid="attente">${escapeHtml(this.texte('en-attente'))}</p>`;
    }
    const metadonnees = definition.metadonnees;
    return safeHtml`
      <section class="fp-carte fp-concept4__atelier">
        ${this.faces('fp-prose')}
        <div class="fp-concept4__reperes">
          <span class="fp-badge" data-testid="modalite">${escapeHtml(metadonnees.modalite)}</span>
          <span class="fp-badge" data-testid="duree">${metadonnees.dureeMinutes} min</span>
        </div>
      </section>
    `;
  }

  bind(racine: ShadowRoot): void {
    this.suivreAffichage(this.definition?.id ?? null);
    if (this.mode() !== 'hand') {
      return;
    }
    for (const curseur of racine.querySelectorAll<HTMLInputElement>('[data-testid="curseur"]')) {
      const cle = curseur.dataset['cle'] ?? '';
      curseur.addEventListener('input', () => this.appliquer(cle, Number(curseur.value)));
      curseur.addEventListener('keydown', (evenement) => this.auClavier(cle, evenement));
      if (cle === this.suivi) {
        curseur.focus();
      }
    }
  }

  private faces(stylePhrase: string): EscapedHtml {
    const valeurs = this.valeurs;
    return safeHtml`
      <div class="fp-concept4__faces">
        ${this.formule(valeurs)}
        ${this.graphique(valeurs)}
        ${this.tableau(valeurs)}
        ${this.enMots(valeurs, stylePhrase)}
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
    if (cles.length === 0) {
      return escapeHtml(source);
    }
    const morceaux: EscapedHtml[] = [];
    let curseur = 0;
    for (const trouve of source.matchAll(motifDesTermes(cles))) {
      const debut = trouve.index ?? 0;
      morceaux.push(escapeHtml(source.slice(curseur, debut)));
      morceaux.push(this.terme(trouve[0]));
      curseur = debut + trouve[0].length;
    }
    morceaux.push(escapeHtml(source.slice(curseur)));
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
    const trace = this.trace(parametre, valeurs);
    const etiquette = `${this.texte('concept4-courbe')} ${parametre.libelle}`;
    return safeHtml`
      <figure class="fp-concept4__face" data-testid="graphique" data-valeur="${escapeHtml(String(this.resultat(valeurs)))}">
        <h3 class="fp-concept4__intitule">${escapeHtml(this.texte('concept4-graphique'))}</h3>
        <svg class="fp-concept4__courbe" data-testid="courbe" viewBox="0 0 ${LARGEUR} ${HAUTEUR}" role="img" aria-label="${escapeHtml(etiquette)}">
          <polyline class="fp-concept4__trace" data-testid="trace" points="${escapeHtml(trace.points)}"></polyline>
          <circle class="fp-concept4__point" data-testid="point" cx="${trace.cx}" cy="${trace.cy}" r="6"></circle>
        </svg>
      </figure>
    `;
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

  private enMots(valeurs: Valeurs, stylePhrase: string): EscapedHtml {
    const definition = this.definition;
    if (definition === null) {
      return safeHtml``;
    }
    const resultat = this.resultat(valeurs);
    const phrase = remplirGabarit(definition.phrase, { ...valeurs, resultat }, formater);
    return safeHtml`
      <div class="fp-concept4__face" data-testid="phrase" data-valeur="${escapeHtml(String(resultat))}">
        <h3 class="fp-concept4__intitule">${escapeHtml(this.texte('concept4-phrase'))}</h3>
        <p class="${escapeHtml(stylePhrase)} fp-concept4__phrase" data-testid="phrase-texte">${escapeHtml(phrase)}</p>
      </div>
    `;
  }

  private reglages(): EscapedHtml {
    const parametres = this.definition?.parametres ?? [];
    return safeHtml`
      <fieldset class="fp-concept4__reglages">
        <legend>${escapeHtml(this.texte('concept4-reglages'))}</legend>
        ${parametres.map((parametre) => this.curseur(parametre))}
      </fieldset>
    `;
  }

  private curseur(parametre: Concept4Parametre): EscapedHtml {
    const valeur = this.valeurCourante(parametre, this.courantes);
    const identifiant = `fp-concept4-${parametre.cle}`;
    return safeHtml`
      <div class="fp-concept4__curseur">
        <label class="fp-concept4__etiquette" for="${escapeHtml(identifiant)}">${escapeHtml(parametre.libelle)}</label>
        <input class="fp-concept4__glissiere" data-testid="curseur" data-cle="${escapeHtml(parametre.cle)}" id="${escapeHtml(identifiant)}" type="range" min="${bas(parametre)}" max="${haut(parametre)}" step="${pasUtile(parametre)}" value="${valeur}" aria-valuetext="${escapeHtml(this.enonceValeur(parametre, valeur))}">
        <output class="fp-concept4__valeur fp-montant" data-testid="valeur">${escapeHtml(formater(valeur))}</output>
      </div>
    `;
  }

  private enonceValeur(parametre: Concept4Parametre, valeur: number): string {
    const plage = `${this.texte('concept4-plage')} ${formater(bas(parametre))} ${this.texte('concept4-plage-fin')} ${formater(haut(parametre))}`;
    return `${parametre.libelle} : ${formater(valeur)} (${plage})`;
  }

  private auClavier(cle: string, evenement: KeyboardEvent): void {
    const parametre = this.parametre(cle);
    const sens = SENS[evenement.key];
    if (parametre === null || sens === undefined) {
      return;
    }
    evenement.preventDefault();
    const actuelle = this.valeurCourante(parametre, this.courantes);
    this.appliquer(cle, actuelle + sens * pasUtile(parametre));
  }

  private appliquer(cle: string, valeur: number): void {
    const parametre = this.parametre(cle);
    if (parametre === null) {
      return;
    }
    this.courantes = { ...this.courantes, [cle]: borner(parametre, valeur) };
    this.actif = cle;
    this.suivi = cle;
    this.emit('fp-concept4-explore', {
      definitionId: this.definition?.id,
      cle,
      valeur: this.courantes[cle],
      dureeMs: this.depuisAffichage(),
    });
    this.refresh();
  }
}
