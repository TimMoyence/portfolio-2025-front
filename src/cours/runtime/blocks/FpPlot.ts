import type { MetadonneesBrique } from '../../content/types';
import { evaluerExpression } from '../core/formula';
import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { FpBlock } from './FpBlock';
import { projeterMetadonnees } from './projection';

export type TraitSerie = 'plein' | 'tirets';

export interface PlotParametre {
  readonly cle: string;
  readonly libelle: string;
  readonly min: number;
  readonly max: number;
  readonly pas: number;
  readonly defaut: number;
}

export interface PlotAxe {
  readonly libelle: string;
  readonly min: number;
  readonly max: number;
}

export interface PlotSerie {
  readonly id: string;
  readonly libelle: string;
  readonly trait: TraitSerie;
  readonly calcul: string;
}

export interface PlotDefinition {
  readonly id: string;
  readonly titre?: string;
  readonly source?: string;
  readonly abscisse: PlotAxe;
  readonly ordonnee: string;
  readonly parametres: readonly PlotParametre[];
  readonly series: readonly PlotSerie[];
  readonly metadonnees: MetadonneesBrique;
}

type Valeurs = Readonly<Record<string, number>>;

interface Echantillon {
  readonly abscisse: number;
  readonly ordonnee: number;
}

interface SerieTracee {
  readonly serie: PlotSerie;
  readonly echantillons: readonly Echantillon[];
}

interface Cadre {
  readonly depart: number;
  readonly arrivee: number;
  readonly plancher: number;
  readonly plafond: number;
}

export const LARGEUR = 360;
export const HAUTEUR = 260;
export const MARGE_GAUCHE = 64;
export const MARGE_DROITE = 18;
export const MARGE_HAUT = 20;
export const MARGE_BAS = 42;
const ECHANTILLONS = 24;
const GRADUATIONS = 4;

const LARGEUR_TRACE = LARGEUR - MARGE_GAUCHE - MARGE_DROITE;
const HAUTEUR_TRACE = HAUTEUR - MARGE_HAUT - MARGE_BAS;
const LIGNE_BASSE = HAUTEUR - MARGE_BAS;
const BORD_DROIT = LARGEUR - MARGE_DROITE;
const DECALAGE_X = 16;
const DECALAGE_Y = 4;
const ECART_Y = 6;
const PAS_CLAVIER: Readonly<Record<string, number | undefined>> = {
  ArrowRight: 1,
  ArrowUp: 1,
  ArrowLeft: -1,
  ArrowDown: -1,
};

function fini(valeur: number, repli: number): number {
  return Number.isFinite(valeur) ? valeur : repli;
}

function arrondi(valeur: number): number {
  return Math.round(valeur * 100) / 100;
}

function formater(valeur: number): string {
  return Number.isFinite(valeur) ? String(arrondi(valeur)).replace('.', ',') : '—';
}

function plancherDe(bornes: { readonly min: number; readonly max: number }): number {
  return fini(bornes.min, 0);
}

function plafondDe(bornes: { readonly min: number; readonly max: number }): number {
  const bas = plancherDe(bornes);
  return Math.max(fini(bornes.max, bas), bas);
}

function borner(parametre: PlotParametre, valeur: number): number {
  const bas = plancherDe(parametre);
  return Math.min(Math.max(fini(valeur, bas), bas), plafondDe(parametre));
}

function pasDe(parametre: PlotParametre): number {
  const pas = fini(parametre.pas, 0);
  return pas > 0 ? pas : 1;
}

function jalons(depart: number, arrivee: number, intervalles: number): number[] {
  return Array.from(
    { length: intervalles + 1 },
    (_, rang) => depart + ((arrivee - depart) * rang) / intervalles,
  );
}

function versX(cadre: Cadre, abscisse: number): number {
  const etendue = cadre.arrivee - cadre.depart || 1;
  return MARGE_GAUCHE + ((abscisse - cadre.depart) / etendue) * LARGEUR_TRACE;
}

function versY(cadre: Cadre, ordonnee: number): number {
  const etendue = cadre.plafond - cadre.plancher || 1;
  return LIGNE_BASSE - ((ordonnee - cadre.plancher) / etendue) * HAUTEUR_TRACE;
}

function copierParametre(parametre: PlotParametre): PlotParametre {
  return {
    cle: parametre.cle,
    libelle: parametre.libelle,
    min: parametre.min,
    max: parametre.max,
    pas: parametre.pas,
    defaut: parametre.defaut,
  };
}

function copierSerie(serie: PlotSerie): PlotSerie {
  return {
    id: serie.id,
    libelle: serie.libelle,
    trait: serie.trait === 'tirets' ? 'tirets' : 'plein',
    calcul: serie.calcul,
  };
}

function copierDefinition(source: PlotDefinition): PlotDefinition {
  return {
    id: source.id,
    titre: source.titre,
    source: source.source,
    abscisse: {
      libelle: source.abscisse.libelle,
      min: source.abscisse.min,
      max: source.abscisse.max,
    },
    ordonnee: source.ordonnee,
    parametres: source.parametres
      .filter((parametre) => parametre.cle.trim().length > 0)
      .map(copierParametre),
    series: source.series.map(copierSerie),
    metadonnees: projeterMetadonnees(source.metadonnees),
  };
}

function derniereOrdonnee(tracee: SerieTracee): number {
  return tracee.echantillons[tracee.echantillons.length - 1]?.ordonnee ?? Number.NaN;
}

function premiereOrdonnee(tracee: SerieTracee): number {
  return tracee.echantillons[0]?.ordonnee ?? Number.NaN;
}

export class FpPlot extends FpBlock {
  private interne: PlotDefinition | null = null;
  private courantes: Record<string, number> = {};
  private suivi: string | null = null;

  set definition(valeur: PlotDefinition | null) {
    this.interne = valeur === null ? null : copierDefinition(valeur);
    this.courantes = {};
    this.suivi = null;
    for (const parametre of this.interne?.parametres ?? []) {
      this.courantes[parametre.cle] = borner(parametre, parametre.defaut);
    }
    this.refreshSiConnecte();
  }

  get definition(): PlotDefinition | null {
    return this.interne;
  }

  get valeurs(): Valeurs {
    return { ...this.courantes };
  }

  renderHand(): EscapedHtml {
    if (this.interne === null) {
      return safeHtml`<p>${escapeHtml(this.texte('chargement'))}</p>`;
    }
    return safeHtml`<section class="fp-carte fp-plot__atelier">${this.reglages()}${this.figure()}${this.lecture('fp-prose')}</section>`;
  }

  renderStage(): EscapedHtml {
    if (this.interne === null) {
      return safeHtml``;
    }
    return safeHtml`<section class="fp-scene fp-plot__atelier">${this.figure()}${this.lecture('fp-enonce')}</section>`;
  }

  renderBoard(): EscapedHtml {
    const definition = this.interne;
    if (definition === null) {
      return safeHtml`<p data-testid="attente">${escapeHtml(this.texte('en-attente'))}</p>`;
    }
    return safeHtml`
      <section class="fp-carte fp-plot__atelier">
        ${this.figure()}
        <div class="fp-plot__reperes">
          <span class="fp-badge" data-testid="modalite">${escapeHtml(definition.metadonnees.modalite)}</span>
          <span class="fp-badge" data-testid="duree">${definition.metadonnees.dureeMinutes} min</span>
        </div>
      </section>
    `;
  }

  bind(racine: ShadowRoot): void {
    this.suivreAffichage(this.interne?.id ?? null);
    if (this.mode() === 'hand') {
      racine
        .querySelectorAll<HTMLInputElement>('[data-testid="curseur"]')
        .forEach((curseur) => this.brancher(curseur));
    }
  }

  private brancher(curseur: HTMLInputElement): void {
    const cle = curseur.dataset['cle'] ?? '';
    curseur.addEventListener('input', () => this.deplacer(cle, Number(curseur.value)));
    curseur.addEventListener('keydown', (evenement) => this.auClavier(cle, evenement));
    if (cle === this.suivi) {
      curseur.focus();
    }
  }

  private tracees(): SerieTracee[] {
    const definition = this.interne;
    if (definition === null) {
      return [];
    }
    const valeurs = this.valeurs;
    const abscisses = jalons(
      plancherDe(definition.abscisse),
      plafondDe(definition.abscisse),
      ECHANTILLONS,
    );
    return definition.series.map((serie) => ({
      serie,
      echantillons: abscisses
        .map((abscisse) => ({
          abscisse,
          ordonnee:
            evaluerExpression(serie.calcul, { ...valeurs, x: abscisse }).valeur ?? Number.NaN,
        }))
        .filter((point) => Number.isFinite(point.ordonnee)),
    }));
  }

  private cadre(tracees: readonly SerieTracee[]): Cadre {
    const axe = this.interne?.abscisse ?? { libelle: '', min: 0, max: 1 };
    const ordonnees = tracees.flatMap((tracee) =>
      tracee.echantillons.map((point) => point.ordonnee),
    );
    return {
      depart: plancherDe(axe),
      arrivee: plafondDe(axe),
      plancher: ordonnees.length > 0 ? Math.min(...ordonnees) : 0,
      plafond: ordonnees.length > 0 ? Math.max(...ordonnees) : 1,
    };
  }

  private figure(): EscapedHtml {
    const tracees = this.tracees();
    const dessinees = tracees.filter((tracee) => tracee.echantillons.length > 0);
    const definition = this.interne;
    return safeHtml`
      <figure class="fp-plot__figure" data-testid="figure">
        ${definition?.titre === undefined ? safeHtml`` : safeHtml`<h3 class="fp-plot__titre" data-testid="titre">${escapeHtml(definition.titre)}</h3>`}
        ${this.graphique(tracees)}
        ${dessinees.length > 0 ? safeHtml`` : this.vide()}
        ${definition?.source === undefined ? safeHtml`` : safeHtml`<figcaption class="fp-plot__source" data-testid="source">${escapeHtml(definition.source)}</figcaption>`}
      </figure>
    `;
  }

  private vide(): EscapedHtml {
    return safeHtml`<p class="fp-plot__vide" data-testid="vide">${escapeHtml(this.texte('plot-aucune-serie'))}</p>`;
  }

  private graphique(tracees: readonly SerieTracee[]): EscapedHtml {
    const cadre = this.cadre(tracees);
    return safeHtml`
      <svg class="fp-plot__graphique" data-testid="graphique" viewBox="0 0 ${LARGEUR} ${HAUTEUR}" role="img" aria-labelledby="fp-plot-titre fp-plot-description">
        <title id="fp-plot-titre" data-testid="titre-svg">${escapeHtml(this.titreDuGraphique())}</title>
        <desc id="fp-plot-description" data-testid="description-svg">${escapeHtml(this.descriptionDuGraphique(tracees))}</desc>
        <g>
          <line class="fp-plot__axe" x1="${MARGE_GAUCHE}" y1="${MARGE_HAUT}" x2="${MARGE_GAUCHE}" y2="${LIGNE_BASSE}"></line>
          <line class="fp-plot__axe" x1="${MARGE_GAUCHE}" y1="${LIGNE_BASSE}" x2="${BORD_DROIT}" y2="${LIGNE_BASSE}"></line>
          ${this.graduationsHorizontales(cadre)}
          ${this.graduationsVerticales(cadre)}
        </g>
        ${tracees.map((tracee) => this.polyligne(tracee, cadre))}
      </svg>
    `;
  }

  private graduationsHorizontales(cadre: Cadre): EscapedHtml[] {
    return jalons(cadre.depart, cadre.arrivee, GRADUATIONS).map(
      (valeur) =>
        safeHtml`<text class="fp-plot__graduation" data-testid="graduation-x" text-anchor="middle" x="${arrondi(versX(cadre, valeur))}" y="${LIGNE_BASSE + DECALAGE_X}">${escapeHtml(formater(valeur))}</text>`,
    );
  }

  private graduationsVerticales(cadre: Cadre): EscapedHtml[] {
    return jalons(cadre.plancher, cadre.plafond, GRADUATIONS).map(
      (valeur) =>
        safeHtml`<text class="fp-plot__graduation" data-testid="graduation-y" text-anchor="end" x="${MARGE_GAUCHE - ECART_Y}" y="${arrondi(versY(cadre, valeur) + DECALAGE_Y)}">${escapeHtml(formater(valeur))}</text>`,
    );
  }

  private polyligne(tracee: SerieTracee, cadre: Cadre): EscapedHtml {
    if (tracee.echantillons.length === 0) {
      return safeHtml``;
    }
    const points = tracee.echantillons
      .map(
        (point) =>
          `${arrondi(versX(cadre, point.abscisse))},${arrondi(versY(cadre, point.ordonnee))}`,
      )
      .join(' ');
    return safeHtml`<polyline class="fp-plot__trace" data-testid="trace" data-serie="${escapeHtml(tracee.serie.id)}" data-trait="${escapeHtml(tracee.serie.trait)}" points="${escapeHtml(points)}"></polyline>`;
  }

  private lecture(stylePhrase: string): EscapedHtml {
    const tracees = this.tracees();
    return safeHtml`
      <div class="fp-plot__lecture">
        ${this.legende(tracees)}
        ${this.tableau(tracees)}
        <p class="${escapeHtml(stylePhrase)} fp-plot__synthese" data-testid="synthese">${escapeHtml(this.phraseDeLecture(tracees))}</p>
      </div>
    `;
  }

  private legende(tracees: readonly SerieTracee[]): EscapedHtml {
    return safeHtml`
      <ul class="fp-plot__legende" data-testid="legende" aria-label="${escapeHtml(this.texte('plot-legende'))}">
        ${tracees.map((tracee) => this.entreeDeLegende(tracee.serie))}
      </ul>
    `;
  }

  private entreeDeLegende(serie: PlotSerie): EscapedHtml {
    return safeHtml`<li class="fp-plot__serie" data-testid="serie" data-serie="${escapeHtml(serie.id)}" data-trait="${escapeHtml(serie.trait)}"><span class="fp-plot__echantillon" aria-hidden="true"></span>${escapeHtml(serie.libelle)} — ${escapeHtml(this.nomDuTrait(serie.trait))}</li>`;
  }

  private nomDuTrait(trait: TraitSerie): string {
    return this.texte(trait === 'tirets' ? 'plot-trait-tirets' : 'plot-trait-plein');
  }

  private tableau(tracees: readonly SerieTracee[]): EscapedHtml {
    const definition = this.interne;
    if (definition === null) {
      return safeHtml``;
    }
    const axe = definition.abscisse;
    return safeHtml`
      <table class="fp-plot__tableau" data-testid="tableau">
        <caption class="fp-plot__intitule">${escapeHtml(this.texte('plot-tableau'))}</caption>
        <thead>
          <tr>
            <th scope="col">${escapeHtml(this.texte('plot-serie'))}</th>
            <th scope="col">${escapeHtml(axe.libelle)} = ${escapeHtml(formater(plancherDe(axe)))}</th>
            <th scope="col">${escapeHtml(axe.libelle)} = ${escapeHtml(formater(plafondDe(axe)))}</th>
          </tr>
        </thead>
        <tbody>${tracees.map((tracee) => this.ligne(tracee))}</tbody>
      </table>
    `;
  }

  private ligne(tracee: SerieTracee): EscapedHtml {
    return safeHtml`<tr class="fp-plot__ligne" data-testid="ligne" data-serie="${escapeHtml(tracee.serie.id)}"><th scope="row">${escapeHtml(tracee.serie.libelle)}</th><td class="fp-montant" data-testid="depart">${escapeHtml(formater(premiereOrdonnee(tracee)))}</td><td class="fp-montant" data-testid="arrivee">${escapeHtml(formater(derniereOrdonnee(tracee)))}</td></tr>`;
  }

  private titreDuGraphique(): string {
    const definition = this.interne;
    if (definition === null) {
      return '';
    }
    return (
      definition.titre ??
      `${definition.ordonnee} ${this.texte('plot-selon')} ${definition.abscisse.libelle}`
    );
  }

  private descriptionDuGraphique(tracees: readonly SerieTracee[]): string {
    const definition = this.interne;
    if (definition === null) {
      return '';
    }
    const axe = definition.abscisse;
    const plage = `${axe.libelle} ${this.texte('plot-plage')} ${formater(plancherDe(axe))} ${this.texte('plot-plage-fin')} ${formater(plafondDe(axe))}`;
    const courbes = tracees
      .map((tracee) => `${tracee.serie.libelle} (${this.nomDuTrait(tracee.serie.trait)})`)
      .join(' ; ');
    return `${plage}. ${definition.ordonnee}. ${courbes}. ${this.phraseDeLecture(tracees)}`;
  }

  private phraseDeLecture(tracees: readonly SerieTracee[]): string {
    const definition = this.interne;
    if (definition === null || tracees.length === 0) {
      return this.texte('plot-aucune-serie');
    }
    const arrivees = tracees
      .map((tracee) => `${tracee.serie.libelle} : ${formater(derniereOrdonnee(tracee))}`)
      .join(' ; ');
    const entete = `${definition.abscisse.libelle} = ${formater(plafondDe(definition.abscisse))}`;
    const ecart = this.ecartFinal(tracees);
    const fin = ecart === null ? '' : ` ${this.texte('plot-ecart')} ${formater(ecart)}`;
    return `${entete} — ${arrivees} (${definition.ordonnee}).${fin}`;
  }

  private ecartFinal(tracees: readonly SerieTracee[]): number | null {
    if (tracees.length !== 2) {
      return null;
    }
    const haut = derniereOrdonnee(tracees[0]);
    const bas = derniereOrdonnee(tracees[1]);
    if (!Number.isFinite(haut) || !Number.isFinite(bas)) {
      return null;
    }
    return Math.abs(haut - bas);
  }

  private reglages(): EscapedHtml {
    return safeHtml`
      <fieldset class="fp-plot__reglages">
        <legend>${escapeHtml(this.texte('plot-reglages'))}</legend>
        ${(this.interne?.parametres ?? []).map((parametre) => this.curseur(parametre))}
      </fieldset>
    `;
  }

  private curseur(parametre: PlotParametre): EscapedHtml {
    const valeur = borner(parametre, fini(this.courantes[parametre.cle], parametre.defaut));
    const identifiant = `fp-plot-${parametre.cle}`;
    return safeHtml`
      <div class="fp-plot__curseur">
        <label class="fp-plot__etiquette" for="${escapeHtml(identifiant)}">${escapeHtml(parametre.libelle)}</label>
        <input class="fp-plot__glissiere" data-testid="curseur" data-cle="${escapeHtml(parametre.cle)}" id="${escapeHtml(identifiant)}" type="range" min="${plancherDe(parametre)}" max="${plafondDe(parametre)}" step="${pasDe(parametre)}" value="${valeur}" aria-valuetext="${escapeHtml(this.enonceValeur(parametre, valeur))}">
        <output class="fp-plot__valeur fp-montant" data-testid="valeur" data-cle="${escapeHtml(parametre.cle)}">${escapeHtml(formater(valeur))}</output>
      </div>
    `;
  }

  private enonceValeur(parametre: PlotParametre, valeur: number): string {
    const plage = `${this.texte('plot-plage')} ${formater(plancherDe(parametre))} ${this.texte('plot-plage-fin')} ${formater(plafondDe(parametre))}`;
    return `${parametre.libelle} : ${formater(valeur)} (${plage})`;
  }

  private parametre(cle: string): PlotParametre | null {
    return this.interne?.parametres.find((candidat) => candidat.cle === cle) ?? null;
  }

  private auClavier(cle: string, evenement: KeyboardEvent): void {
    const parametre = this.parametre(cle);
    const sens = PAS_CLAVIER[evenement.key];
    if (parametre === null || sens === undefined) {
      return;
    }
    evenement.preventDefault();
    const actuelle = borner(parametre, fini(this.courantes[cle], parametre.defaut));
    this.deplacer(cle, actuelle + sens * pasDe(parametre));
  }

  private deplacer(cle: string, valeur: number): void {
    const parametre = this.parametre(cle);
    if (parametre === null) {
      return;
    }
    this.courantes = { ...this.courantes, [cle]: borner(parametre, valeur) };
    this.suivi = cle;
    this.emit('fp-plot-explore', {
      definitionId: this.interne?.id,
      cle,
      valeur: this.courantes[cle],
      dureeMs: this.depuisAffichage(),
    });
    this.refresh();
  }
}
