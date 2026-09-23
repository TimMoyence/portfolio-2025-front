import type { MetadonneesBrique } from '../../content/types';
import { evaluerExpression } from '../core/formula';
import { type EscapedHtml, escapeHtml, escapeUrl, safeHtml } from '../core/html';
import { brancherCurseurs, curseur } from './curseurs';
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

export interface PlotBornesOrdonnee {
  readonly min?: number;
  readonly max?: number;
  readonly minParametre?: string;
  readonly maxParametre?: string;
}

export interface PlotSerie {
  readonly id: string;
  readonly libelle: string;
  readonly trait: TraitSerie;
  readonly calcul: string;
}

export interface PlotPrereglage {
  readonly libelle: string;
  readonly valeurs: Readonly<Record<string, number>>;
}

export interface PlotDefinition {
  readonly id: string;
  readonly titre?: string;
  readonly description?: string;
  readonly source?: string;
  readonly sourceUrl?: string;
  readonly abscisse: PlotAxe;
  readonly ordonnee: string;
  readonly bornesOrdonnee?: PlotBornesOrdonnee;
  readonly parametres: readonly PlotParametre[];
  readonly series: readonly PlotSerie[];
  readonly forme?: 'courbes' | 'barres';
  readonly unite?: 'euros';
  readonly etiquettes?: readonly string[];
  readonly prereglages?: readonly PlotPrereglage[];
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
const PART_DE_BARRE = 0.6;

function centreDeBarre(rang: number, total: number): number {
  return MARGE_GAUCHE + ((rang + 0.5) * LARGEUR_TRACE) / Math.max(total, 1);
}

function fini(valeur: number, repli: number): number {
  return Number.isFinite(valeur) ? valeur : repli;
}

function arrondi(valeur: number): number {
  return Math.round(valeur * 100) / 100;
}

function formater(valeur: number): string {
  return Number.isFinite(valeur) ? String(arrondi(valeur)).replace('.', ',') : '—';
}

const EUROS = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const EUROS_COMPACTS = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const EVOLUTION = new Intl.NumberFormat('fr-FR', {
  style: 'percent',
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
});

function entiers(depart: number, arrivee: number): number[] {
  const premier = Math.ceil(depart);
  return Array.from(
    { length: Math.max(Math.floor(arrivee) - premier + 1, 0) },
    (_, rang) => premier + rang,
  );
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
    description: source.description,
    source: source.source,
    sourceUrl: source.sourceUrl,
    abscisse: {
      libelle: source.abscisse.libelle,
      min: source.abscisse.min,
      max: source.abscisse.max,
    },
    ordonnee: source.ordonnee,
    bornesOrdonnee: source.bornesOrdonnee === undefined ? undefined : { ...source.bornesOrdonnee },
    parametres: source.parametres
      .filter((parametre) => parametre.cle.trim().length > 0)
      .map(copierParametre),
    series: source.series.map(copierSerie),
    forme: source.forme === 'barres' ? 'barres' : 'courbes',
    unite: source.unite === 'euros' ? 'euros' : undefined,
    etiquettes: source.etiquettes === undefined ? undefined : [...source.etiquettes],
    prereglages: (source.prereglages ?? []).map((prereglage) => ({
      libelle: prereglage.libelle,
      valeurs: { ...prereglage.valeurs },
    })),
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
  private animation: ReturnType<typeof setInterval> | null = null;

  set definition(valeur: PlotDefinition | null) {
    this.arreterAnimation();
    this.interne = valeur === null ? null : copierDefinition(valeur);
    this.courantes = {};
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

  disconnectedCallback(): void {
    this.arreterAnimation();
  }

  renderHand(): EscapedHtml {
    if (this.interne === null) {
      return safeHtml`<p>${escapeHtml(this.texte('chargement'))}</p>`;
    }
    return safeHtml`<section class="fp-carte fp-plot__atelier">${this.description()}${this.reglages()}<div class="fp-plot__zone" data-zone="rendu">${this.rendu('fp-prose')}</div></section>`;
  }

  renderStage(): EscapedHtml {
    if (this.interne === null) {
      return safeHtml``;
    }
    return this.renderHand();
  }

  renderBoard(): EscapedHtml {
    const definition = this.interne;
    if (definition === null) {
      return safeHtml`<p data-testid="attente">${escapeHtml(this.texte('en-attente'))}</p>`;
    }
    return safeHtml`
      <section class="fp-carte fp-plot__atelier">
        ${this.description()}
        ${this.figure()}
        <div class="fp-plot__reperes">${this.reperes(definition.metadonnees)}</div>
      </section>
    `;
  }

  bind(racine: ShadowRoot): void {
    this.suivreAffichage(this.interne?.id ?? null);
    if (this.mode() !== 'board') {
      racine
        .querySelector<HTMLButtonElement>('[data-testid="animer"]')
        ?.addEventListener('click', () => {
          this.animer();
        });
      brancherCurseurs(racine, (cle, valeur) => this.regler(cle, valeur));
      racine.querySelectorAll<HTMLButtonElement>('[data-testid="prereglage"]').forEach((bouton) => {
        bouton.addEventListener('click', () => {
          this.appliquerPrereglage(Number(bouton.dataset['rang']));
        });
      });
    }
  }

  private appliquerPrereglage(rang: number): void {
    const prereglage = this.interne?.prereglages?.[rang];
    if (prereglage === undefined) {
      return;
    }
    this.arreterAnimation();
    for (const parametre of this.interne?.parametres ?? []) {
      if (Object.hasOwn(prereglage.valeurs, parametre.cle)) {
        this.courantes = {
          ...this.courantes,
          [parametre.cle]: borner(parametre, prereglage.valeurs[parametre.cle]),
        };
      }
    }
    this.refresh();
  }

  private enBarres(): boolean {
    return this.interne?.forme === 'barres';
  }

  private chiffre(valeur: number): string {
    if (this.interne?.unite === 'euros' && Number.isFinite(valeur)) {
      return EUROS.format(valeur);
    }
    return formater(valeur);
  }

  private graduation(valeur: number): string {
    if (this.interne?.unite === 'euros' && Number.isFinite(valeur)) {
      return EUROS_COMPACTS.format(valeur);
    }
    return formater(valeur);
  }

  private etiquette(abscisse: number): string {
    const definition = this.interne;
    const rang = abscisse - plancherDe(definition?.abscisse ?? { min: 0, max: 0 });
    return definition?.etiquettes?.[rang] ?? formater(abscisse);
  }

  private rendu(stylePhrase: string): EscapedHtml {
    return safeHtml`${this.figure()}${this.lecture(stylePhrase)}`;
  }

  private description(): EscapedHtml {
    const description = this.interne?.description;
    if (description === undefined || description.trim().length === 0) {
      return safeHtml``;
    }
    return safeHtml`<p class="fp-plot__description" data-testid="description">${escapeHtml(description)}</p>`;
  }

  private regler(cle: string, valeur: number): void {
    const parametre = this.interne?.parametres.find((candidat) => candidat.cle === cle);
    if (parametre === undefined) {
      return;
    }
    this.arreterAnimation();
    this.courantes = { ...this.courantes, [cle]: borner(parametre, valeur) };
    const sortie = this.racine.querySelector<HTMLOutputElement>(
      `output[data-testid="valeur"][data-cle="${cle}"]`,
    );
    if (sortie !== null) {
      sortie.textContent = this.chiffre(this.courantes[cle]);
    }
    this.rafraichirZone('rendu', this.rendu('fp-prose'));
    this.racine
      .querySelectorAll<HTMLButtonElement>('[data-testid="prereglage"]')
      .forEach((bouton) => {
        const prereglage = this.interne?.prereglages?.[Number(bouton.dataset['rang'])];
        bouton.setAttribute('aria-pressed', String(this.estActif(prereglage)));
      });
  }

  private estActif(prereglage: PlotPrereglage | undefined): boolean {
    return (
      prereglage !== undefined &&
      Object.entries(prereglage.valeurs).every(([cle, valeur]) => this.courantes[cle] === valeur)
    );
  }

  private tracees(): SerieTracee[] {
    const definition = this.interne;
    if (definition === null) {
      return [];
    }
    const valeurs = this.valeurs;
    const depart = plancherDe(definition.abscisse);
    const arrivee = plafondDe(definition.abscisse);
    const abscisses = this.enBarres()
      ? entiers(depart, arrivee)
      : jalons(depart, arrivee, ECHANTILLONS);
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
    const definition = this.interne;
    const axe = definition?.abscisse ?? { libelle: '', min: 0, max: 1 };
    const ordonnees = tracees.flatMap((tracee) =>
      tracee.echantillons.map((point) => point.ordonnee),
    );
    const bornes = definition?.bornesOrdonnee;
    const minParametre =
      bornes?.minParametre === undefined ? undefined : this.valeurs[bornes.minParametre];
    const maxParametre =
      bornes?.maxParametre === undefined ? undefined : this.valeurs[bornes.maxParametre];
    const minConfigure = minParametre ?? bornes?.min;
    const maxConfigure = maxParametre ?? bornes?.max;
    const plancher = this.borne(minConfigure, ordonnees, 0, Math.min);
    const plafond = this.borne(maxConfigure, ordonnees, 1, Math.max);
    return {
      depart: plancherDe(axe),
      arrivee: plafondDe(axe),
      plancher,
      plafond: Math.max(plafond, plancher),
    };
  }

  private borne(
    configuree: number | undefined,
    ordonnees: readonly number[],
    repli: number,
    calculer: (...valeurs: number[]) => number,
  ): number {
    if (Number.isFinite(configuree)) {
      return Number(configuree);
    }
    return ordonnees.length > 0 ? calculer(...ordonnees) : repli;
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
        ${this.source(definition)}
      </figure>
    `;
  }

  private source(definition: PlotDefinition | null): EscapedHtml {
    if (definition?.source === undefined) {
      return safeHtml``;
    }
    if (definition.sourceUrl === undefined) {
      return safeHtml`<figcaption class="fp-plot__source" data-testid="source">${escapeHtml(definition.source)}</figcaption>`;
    }
    return safeHtml`<figcaption class="fp-plot__source" data-testid="source"><a href="${escapeUrl(definition.sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(definition.source)}</a></figcaption>`;
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
          ${this.enBarres() ? this.anneesDesBarres(tracees) : this.graduationsHorizontales(cadre)}
          ${this.graduationsVerticales(cadre)}
        </g>
        ${this.enBarres() ? this.barres(tracees, cadre) : tracees.map((tracee) => this.polyligne(tracee, cadre))}
      </svg>
    `;
  }

  private anneesDesBarres(tracees: readonly SerieTracee[]): EscapedHtml[] {
    const echantillons = tracees[0]?.echantillons ?? [];
    return echantillons.map(
      (point, rang) =>
        safeHtml`<text class="fp-plot__graduation" data-testid="graduation-x" text-anchor="middle" x="${arrondi(centreDeBarre(rang, echantillons.length))}" y="${LIGNE_BASSE + DECALAGE_X}">${escapeHtml(this.etiquette(point.abscisse))}</text>`,
    );
  }

  private barres(tracees: readonly SerieTracee[], cadre: Cadre): EscapedHtml[] {
    const echantillons = tracees[0]?.echantillons ?? [];
    const largeur = (LARGEUR_TRACE / Math.max(echantillons.length, 1)) * PART_DE_BARRE;
    return echantillons.map((point, rang) => {
      const sommet = Math.min(Math.max(versY(cadre, point.ordonnee), MARGE_HAUT), LIGNE_BASSE);
      const centre = centreDeBarre(rang, echantillons.length);
      return safeHtml`<g><rect class="fp-plot__barre" data-testid="barre" x="${arrondi(centre - largeur / 2)}" y="${arrondi(sommet)}" width="${arrondi(largeur)}" height="${arrondi(LIGNE_BASSE - sommet)}"></rect><text class="fp-plot__montant-barre" data-testid="montant-barre" text-anchor="middle" x="${arrondi(centre)}" y="${arrondi(Math.max(sommet - DECALAGE_Y, DECALAGE_X))}">${escapeHtml(this.chiffre(point.ordonnee))}</text></g>`;
    });
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
        safeHtml`<text class="fp-plot__graduation" data-testid="graduation-y" text-anchor="end" x="${MARGE_GAUCHE - ECART_Y}" y="${arrondi(versY(cadre, valeur) + DECALAGE_Y)}">${escapeHtml(this.graduation(valeur))}</text>`,
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
        ${this.enBarres() ? this.rapport(tracees) : this.legende(tracees)}
        ${this.tableau(tracees)}
        <p class="${escapeHtml(stylePhrase)} fp-plot__synthese" data-testid="synthese">${escapeHtml(this.phraseDeLecture(tracees))}</p>
      </div>
    `;
  }

  private rapport(tracees: readonly SerieTracee[]): EscapedHtml {
    if (tracees.length === 0 || tracees[0].echantillons.length < 2) {
      return safeHtml``;
    }
    const [tracee] = tracees;
    const premiere = tracee.echantillons[0];
    const derniere = tracee.echantillons[tracee.echantillons.length - 1];
    const plancher = this.cadre(tracees).plancher;
    const hauteurs = (derniere.ordonnee - plancher) / (premiere.ordonnee - plancher);
    const rapport =
      premiere.ordonnee > plancher && derniere.ordonnee >= plancher
        ? `×${formater(hauteurs)}`
        : '—';
    const evolution =
      premiere.ordonnee === 0
        ? '—'
        : EVOLUTION.format((derniere.ordonnee - premiere.ordonnee) / premiere.ordonnee);
    return safeHtml`<p class="fp-plot__rapport" data-testid="rapport" aria-live="polite">${escapeHtml(this.texte('plot-rapport-hauteurs'))} ${escapeHtml(this.etiquette(derniere.abscisse))} ${escapeHtml(this.texte('plot-rapport-a'))} ${escapeHtml(this.etiquette(premiere.abscisse))} : <strong class="fp-plot__chiffre-cle" data-testid="rapport-hauteurs">${escapeHtml(rapport)}</strong> — ${escapeHtml(this.texte('plot-evolution-reelle'))} : <strong class="fp-plot__chiffre-cle" data-testid="evolution-reelle">${escapeHtml(evolution)}</strong></p>`;
  }

  private enteteAbscisse(abscisse: number): string {
    const definition = this.interne;
    if (this.enBarres() && definition?.etiquettes !== undefined) {
      return this.etiquette(abscisse);
    }
    return `${definition?.abscisse.libelle ?? ''} = ${formater(abscisse)}`;
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
      <details class="fp-plot__donnees" data-testid="voir-donnees">
        <summary class="fp-plot__bouton-donnees">${escapeHtml(this.texte('plot-voir-donnees'))}</summary>
        <table class="fp-plot__tableau" data-testid="tableau">
          <caption class="fp-plot__intitule">${escapeHtml(this.texte('plot-tableau'))}</caption>
          <thead>
            <tr>
              <th scope="col">${escapeHtml(this.texte('plot-serie'))}</th>
              <th scope="col">${escapeHtml(this.enteteAbscisse(plancherDe(axe)))}</th>
              <th scope="col">${escapeHtml(this.enteteAbscisse(plafondDe(axe)))}</th>
            </tr>
          </thead>
          <tbody>${tracees.map((tracee) => this.ligne(tracee))}</tbody>
        </table>
      </details>
    `;
  }

  private ligne(tracee: SerieTracee): EscapedHtml {
    return safeHtml`<tr class="fp-plot__ligne" data-testid="ligne" data-serie="${escapeHtml(tracee.serie.id)}"><th scope="row">${escapeHtml(tracee.serie.libelle)}</th><td class="fp-montant" data-testid="depart">${escapeHtml(this.chiffre(premiereOrdonnee(tracee)))}</td><td class="fp-montant" data-testid="arrivee">${escapeHtml(this.chiffre(derniereOrdonnee(tracee)))}</td></tr>`;
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
    const plage = `${axe.libelle} ${this.texte('plot-plage')} ${this.etiquette(plancherDe(axe))} ${this.texte('plot-plage-fin')} ${this.etiquette(plafondDe(axe))}`;
    const courbes = tracees
      .map((tracee) => `${tracee.serie.libelle} (${this.nomDuTrait(tracee.serie.trait)})`)
      .join(' ; ');
    const resume = `${plage}. ${definition.ordonnee}. ${courbes}. ${this.phraseDeLecture(tracees)}`;
    return definition.description === undefined ? resume : `${definition.description} ${resume}`;
  }

  private phraseDeLecture(tracees: readonly SerieTracee[]): string {
    const definition = this.interne;
    if (definition === null || tracees.length === 0) {
      return this.texte('plot-aucune-serie');
    }
    const arrivees = tracees
      .map((tracee) => `${tracee.serie.libelle} : ${this.chiffre(derniereOrdonnee(tracee))}`)
      .join(' ; ');
    const entete = this.enteteAbscisse(plafondDe(definition.abscisse));
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
        ${this.declencheurs()}
        <div class="fp-plot__parametres" aria-live="polite">
          ${(this.interne?.parametres ?? []).map((parametre) => this.parametreAffiche(parametre))}
        </div>
      </fieldset>
    `;
  }

  private declencheurs(): EscapedHtml {
    const prereglages = this.interne?.prereglages ?? [];
    if (prereglages.length === 0) {
      return safeHtml`<button class="fp-plot__animation" data-testid="animer" type="button">${escapeHtml(this.texte('plot-animer'))}</button>`;
    }
    return safeHtml`<div class="fp-plot__prereglages" role="group" aria-label="${escapeHtml(this.texte('plot-prereglages'))}">${prereglages.map(
      (prereglage, rang) =>
        safeHtml`<button class="fp-plot__prereglage" data-testid="prereglage" data-rang="${rang}" type="button" aria-pressed="${escapeHtml(String(this.estActif(prereglage)))}">${escapeHtml(prereglage.libelle)}</button>`,
    )}</div>`;
  }

  private parametreAffiche(parametre: PlotParametre): EscapedHtml {
    const valeur = borner(parametre, fini(this.courantes[parametre.cle], parametre.defaut));
    return safeHtml`
      <div class="fp-plot__parametre" data-testid="parametre" data-cle="${escapeHtml(parametre.cle)}">
        <span class="fp-plot__etiquette">${escapeHtml(parametre.libelle)}</span>
        ${curseur('fp-plot', parametre, valeur, this.enonceValeur(parametre, valeur))}
        <output class="fp-plot__valeur fp-montant" data-testid="valeur" data-cle="${escapeHtml(parametre.cle)}" aria-label="${escapeHtml(this.enonceValeur(parametre, valeur))}">${escapeHtml(this.chiffre(valeur))}</output>
      </div>
    `;
  }

  private enonceValeur(parametre: PlotParametre, valeur: number): string {
    const plage = `${this.texte('plot-plage')} ${this.chiffre(plancherDe(parametre))} ${this.texte('plot-plage-fin')} ${this.chiffre(plafondDe(parametre))}`;
    return `${parametre.libelle} : ${this.chiffre(valeur)} (${plage})`;
  }

  private animer(): void {
    const parametres = this.interne?.parametres ?? [];
    if (parametres.length === 0) {
      return;
    }
    this.arreterAnimation();
    const depart = Object.fromEntries(
      parametres.map((parametre) => [
        parametre.cle,
        borner(parametre, fini(this.courantes[parametre.cle], parametre.defaut)),
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
          const valeur = valeurDepart + (plafondDe(parametre) - valeurDepart) * progression;
          return [parametre.cle, borner(parametre, valeur)];
        }),
      );
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
