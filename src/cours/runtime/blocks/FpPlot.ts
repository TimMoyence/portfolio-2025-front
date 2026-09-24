import type { MetadonneesBrique } from '../../content/types';
import { evaluerExpression } from '../core/formula';
import { type EscapedHtml, escapeHtml, escapeUrl, safeHtml } from '../core/html';
import { type Reglages, borner } from './animation';
import { type ParametreReglable, curseur } from './curseurs';
import {
  FpReglable,
  type Prereglage,
  arrondi,
  copierParametres,
  copierPrereglages,
  fini,
  formater,
  plafondDe,
  plancherDe,
} from './reglable';
import { projeterMetadonnees } from './projection';

export type TraitSerie = 'plein' | 'tirets';

export type PlotParametre = ParametreReglable;

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

export type PlotPrereglage = Prereglage;

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
  readonly reference?: string;
  readonly animation?: readonly Reglages[];
  readonly metadonnees: MetadonneesBrique;
}

type Valeurs = Reglages;

interface Echantillon {
  readonly abscisse: number;
  readonly ordonnee: number;
}

interface SerieTracee {
  readonly serie: PlotSerie;
  readonly echantillons: readonly Echantillon[];
}

interface VueComparee {
  readonly nom: 'reference' | 'reglable';
  readonly libelle: string;
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
    parametres: copierParametres(source.parametres),
    series: source.series.map(copierSerie),
    forme: source.forme === 'barres' ? 'barres' : 'courbes',
    unite: source.unite === 'euros' ? 'euros' : undefined,
    etiquettes: source.etiquettes === undefined ? undefined : [...source.etiquettes],
    prereglages: copierPrereglages(source.prereglages),
    reference: source.reference,
    animation: source.animation?.map((etape) => ({ ...etape })),
    metadonnees: projeterMetadonnees(source.metadonnees),
  };
}

function derniereOrdonnee(tracee: SerieTracee): number {
  return tracee.echantillons[tracee.echantillons.length - 1]?.ordonnee ?? Number.NaN;
}

function premiereOrdonnee(tracee: SerieTracee): number {
  return tracee.echantillons[0]?.ordonnee ?? Number.NaN;
}

export class FpPlot extends FpReglable<PlotDefinition> {
  protected readonly evenementDeReglage = 'fp-plot-reglage';

  protected copier(valeur: PlotDefinition): PlotDefinition {
    return copierDefinition(valeur);
  }

  protected rafraichirLeRendu(): void {
    this.rafraichirZone('rendu', this.rendu());
  }

  protected override afficherValeur(valeur: number): string {
    return this.chiffre(valeur);
  }

  render(): EscapedHtml {
    if (this.interne === null) {
      return this.attente();
    }
    return safeHtml`<section class="fp-carte fp-scene fp-plot__atelier">${this.description()}${this.panneauDeReglages()}<div class="fp-plot__zone" data-zone="rendu">${this.rendu()}</div></section>`;
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

  private rendu(): EscapedHtml {
    const reference = this.prereglageDeReference();
    if (reference === undefined) {
      return safeHtml`${this.figure(this.valeurs, null)}${this.lecture(true)}`;
    }
    return safeHtml`<div class="fp-plot__comparaison" data-testid="comparaison">${this.titre()}<div class="fp-plot__vues">${this.figure(
      this.valeursDu(reference),
      { nom: 'reference', libelle: `${reference.libelle} · ${this.texte('plot-reference')}` },
    )}${this.figure(this.valeurs, { nom: 'reglable', libelle: this.texte('plot-reglable') })}</div>${this.sourceCommune()}</div>${this.lecture(false)}`;
  }

  private prereglageDeReference(): PlotPrereglage | undefined {
    const definition = this.interne;
    return definition?.prereglages?.find(
      (prereglage) => prereglage.libelle === definition.reference,
    );
  }

  private valeursDu(prereglage: PlotPrereglage): Valeurs {
    return Object.fromEntries(
      (this.interne?.parametres ?? []).map((parametre) => [
        parametre.cle,
        borner(
          parametre,
          Object.hasOwn(prereglage.valeurs, parametre.cle)
            ? prereglage.valeurs[parametre.cle]
            : parametre.defaut,
        ),
      ]),
    );
  }

  private description(): EscapedHtml {
    const description = this.interne?.description;
    if (description === undefined || description.trim().length === 0) {
      return safeHtml``;
    }
    return safeHtml`<p class="fp-plot__description" data-testid="description">${escapeHtml(description)}</p>`;
  }

  private tracees(valeurs: Valeurs): SerieTracee[] {
    const definition = this.interne;
    if (definition === null) {
      return [];
    }
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

  private cadre(tracees: readonly SerieTracee[], valeurs: Valeurs): Cadre {
    const definition = this.interne;
    const axe = definition?.abscisse ?? { libelle: '', min: 0, max: 1 };
    const ordonnees = tracees.flatMap((tracee) =>
      tracee.echantillons.map((point) => point.ordonnee),
    );
    const bornes = definition?.bornesOrdonnee;
    const minParametre =
      bornes?.minParametre === undefined ? undefined : valeurs[bornes.minParametre];
    const maxParametre =
      bornes?.maxParametre === undefined ? undefined : valeurs[bornes.maxParametre];
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

  private titre(): EscapedHtml {
    const titre = this.interne?.titre;
    return titre === undefined
      ? safeHtml``
      : safeHtml`<h3 class="fp-plot__titre" data-testid="titre">${escapeHtml(titre)}</h3>`;
  }

  private figure(valeurs: Valeurs, vue: VueComparee | null): EscapedHtml {
    const tracees = this.tracees(valeurs);
    const cadre = this.cadre(tracees, valeurs);
    const dessinees = tracees.filter((tracee) => tracee.echantillons.length > 0);
    const definition = this.interne;
    return safeHtml`
      <figure class="fp-plot__figure" data-testid="figure" data-vue="${escapeHtml(vue?.nom ?? 'unique')}">
        ${vue === null ? this.titre() : safeHtml`<p class="fp-plot__vue" data-testid="vue">${escapeHtml(vue.libelle)}</p>`}
        ${this.graphique(tracees, cadre, vue)}
        ${dessinees.length > 0 ? safeHtml`` : this.vide()}
        ${vue !== null && this.enBarres() ? this.rapport(tracees, cadre, vue.nom === 'reglable') : safeHtml``}
        ${vue === null ? this.source(definition) : safeHtml``}
      </figure>
    `;
  }

  private source(definition: PlotDefinition | null): EscapedHtml {
    const libelle = this.libelleDeSource(definition);
    return libelle === null
      ? safeHtml``
      : safeHtml`<figcaption class="fp-plot__source" data-testid="source">${libelle}</figcaption>`;
  }

  private sourceCommune(): EscapedHtml {
    const libelle = this.libelleDeSource(this.interne);
    return libelle === null
      ? safeHtml``
      : safeHtml`<p class="fp-plot__source" data-testid="source">${libelle}</p>`;
  }

  private libelleDeSource(definition: PlotDefinition | null): EscapedHtml | null {
    if (definition?.source === undefined) {
      return null;
    }
    if (definition.sourceUrl === undefined) {
      return escapeHtml(definition.source);
    }
    return safeHtml`<a href="${escapeUrl(definition.sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(definition.source)}</a>`;
  }

  private vide(): EscapedHtml {
    return safeHtml`<p class="fp-plot__vide" data-testid="vide">${escapeHtml(this.texte('plot-aucune-serie'))}</p>`;
  }

  private graphique(
    tracees: readonly SerieTracee[],
    cadre: Cadre,
    vue: VueComparee | null,
  ): EscapedHtml {
    const suffixe = vue === null ? '' : `-${vue.nom}`;
    const titre =
      vue === null ? this.titreDuGraphique() : `${this.titreDuGraphique()} — ${vue.libelle}`;
    return safeHtml`
      <svg class="fp-plot__graphique" data-testid="graphique" viewBox="0 0 ${LARGEUR} ${HAUTEUR}" role="img" aria-labelledby="${escapeHtml(`fp-plot-titre${suffixe} fp-plot-description${suffixe}`)}">
        <title id="${escapeHtml(`fp-plot-titre${suffixe}`)}" data-testid="titre-svg">${escapeHtml(titre)}</title>
        <desc id="${escapeHtml(`fp-plot-description${suffixe}`)}" data-testid="description-svg">${escapeHtml(this.descriptionDuGraphique(tracees))}</desc>
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

  private lecture(avecRapport: boolean): EscapedHtml {
    const valeurs = this.valeurs;
    const tracees = this.tracees(valeurs);
    const rapport = avecRapport
      ? this.rapport(tracees, this.cadre(tracees, valeurs), true)
      : safeHtml``;
    return safeHtml`
      <div class="fp-plot__lecture">
        ${this.enBarres() ? rapport : this.legende(tracees)}
        ${this.tableau(tracees)}
        ${this.enBarres() ? safeHtml`` : safeHtml`<p class="fp-prose fp-plot__synthese" data-testid="synthese">${escapeHtml(this.phraseDeLecture(tracees))}</p>`}
      </div>
    `;
  }

  private rapport(tracees: readonly SerieTracee[], cadre: Cadre, vivant: boolean): EscapedHtml {
    if (tracees.length === 0 || tracees[0].echantillons.length < 2) {
      return safeHtml``;
    }
    const [tracee] = tracees;
    const premiere = tracee.echantillons[0];
    const derniere = tracee.echantillons[tracee.echantillons.length - 1];
    const plancher = cadre.plancher;
    const hauteurs = (derniere.ordonnee - plancher) / (premiere.ordonnee - plancher);
    const rapport =
      premiere.ordonnee > plancher && derniere.ordonnee >= plancher
        ? `×${formater(hauteurs)}`
        : '—';
    const evolution =
      premiere.ordonnee === 0
        ? '—'
        : EVOLUTION.format((derniere.ordonnee - premiere.ordonnee) / premiere.ordonnee);
    return safeHtml`<p class="fp-plot__rapport" data-testid="rapport" aria-live="${escapeHtml(vivant ? 'polite' : 'off')}">${escapeHtml(this.texte('plot-rapport-hauteurs'))} ${escapeHtml(this.etiquette(derniere.abscisse))} ${escapeHtml(this.texte('plot-rapport-a'))} ${escapeHtml(this.etiquette(premiere.abscisse))} : <strong class="fp-plot__chiffre-cle" data-testid="rapport-hauteurs">${escapeHtml(rapport)}</strong> — ${escapeHtml(this.texte('plot-evolution-reelle'))} : <strong class="fp-plot__chiffre-cle" data-testid="evolution-reelle">${escapeHtml(evolution)}</strong></p>`;
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

  private panneauDeReglages(): EscapedHtml {
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
    return safeHtml`<div class="fp-plot__prereglages" role="group" aria-label="${escapeHtml(this.texte('plot-prereglages'))}">${this.boutonsDePrereglage('fp-plot')}</div>`;
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
}
