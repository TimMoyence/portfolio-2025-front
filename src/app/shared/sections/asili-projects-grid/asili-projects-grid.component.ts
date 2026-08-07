import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RevealOnScrollDirective } from '../../directives/reveal-on-scroll.directive';

/**
 * Taille d'une carte projet dans la grille 6 colonnes.
 *
 * - `big` : occupe 4 colonnes (carte large, visuel 16/10).
 * - `small` : occupe 2 colonnes (carte compacte, visuel 4/3).
 */
export type AsiliProjectSize = 'big' | 'small';

/**
 * Etiquette technique d'un projet (rendue en `.tag`).
 *
 * - `label` : libelle de l'etiquette (ex. `"Angular"`, `"En production"`).
 * - `prod` : si vrai, l'etiquette adopte le style « en production » (`.tag-prod`,
 *   point vert) pour signaler un projet reellement en ligne.
 */
export interface AsiliProjectTag {
  label: string;
  prod?: boolean;
}

/**
 * Une carte projet de la grille.
 *
 * - `title` : titre du projet, rendu en `<h3>`.
 * - `desc` : description courte.
 * - `tags` : etiquettes techniques (peuvent etre vides).
 * - `image` : URL d'une capture (optionnelle). Si absente, un placeholder raye
 *   est affiche.
 * - `imageAlt` : texte alternatif de l'image — requis des qu'`image` est fourni
 *   (a11y). Sert aussi de legende au placeholder quand l'image est absente.
 * - `href` : lien cible (optionnel). Si fourni, le visuel devient cliquable.
 * - `size` : `big` (span 4) ou `small` (span 2).
 */
export interface AsiliProject {
  title: string;
  desc: string;
  tags: readonly AsiliProjectTag[];
  image?: string;
  imageAlt?: string;
  href?: string;
  size: AsiliProjectSize;
}

/**
 * Dimensions intrinseques declarees sur les `<img>`, par taille de carte.
 *
 * Les captures sources ont des ratios heterogenes (de 0.87 a 1.44) alors que le
 * visuel est toujours recadre en `object-fit: cover` dans une boite a ratio fixe
 * (`.proj-shot` : 16/10 en `big`, 4/3 en `small`). Declarer les dimensions du
 * fichier ferait donc mentir le ratio intrinseque sur la place reellement
 * occupee : on declare celui de la boite, ce qui reserve la bonne hauteur meme
 * si la feuille de style arrive apres le HTML (zero CLS).
 */
const IMAGE_DIMENSIONS: Readonly<
  Record<AsiliProjectSize, { readonly width: number; readonly height: number }>
> = {
  big: { width: 1600, height: 1000 },
  small: { width: 800, height: 600 },
};

/**
 * Section « Projets » Asili : grille editoriale 6 colonnes melant cartes larges
 * (`big`, span 4) et compactes (`small`, span 2). Portee de `.proj-grid` /
 * `.proj` de la maquette `AsiliNewDesign/asili-sections.css`.
 *
 * Composant de presentation pur : tout le texte arrive via inputs ou projection
 * (l'i18n est delegue aux pages appelantes). Standalone, OnPush, SSR-safe (la
 * revelation au scroll passe par `appReveal`, browser-only et fail-open).
 *
 * Entete : `kicker` / `heading` peuvent etre fournis en inputs, ou
 * remplaces/enrichis par projection via les slots `[kicker]` et `[heading]`
 * (pour les titres riches avec `<br>` ou accent serif). Le slot `[headLink]`
 * accueille un lien d'action optionnel (ex. « Voir tous les projets »).
 *
 * Niveaux de titre : l'entete utilise `<h2>`, chaque carte `<h3>` — la page
 * appelante doit garantir la coherence de la hierarchie (un `<h1>` en amont).
 *
 * Chaque carte sans image affiche un placeholder raye legende par `imageAlt`
 * (ou un libelle generique). Quand `imageAlt` accompagne une image, il sert
 * d'`alt` (obligatoire pour l'accessibilite).
 */
@Component({
  selector: 'app-asili-projects-grid',
  standalone: true,
  imports: [RevealOnScrollDirective, NgTemplateOutlet],
  templateUrl: './asili-projects-grid.component.html',
  styleUrls: ['./asili-projects-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsiliProjectsGridComponent {
  /** Cartes projet a afficher dans la grille. */
  readonly projects = input.required<readonly AsiliProject[]>();

  /** Sur-titre mono de l'entete (ex. `"Preuve de savoir-faire"`). Optionnel. */
  readonly kicker = input<string | null>(null);

  /** Titre principal de la section, rendu en `<h2>`. Optionnel. */
  readonly heading = input<string | null>(null);

  /**
   * Nombre de cartes de tete dont la capture est chargee en `eager` — les
   * suivantes passent en `loading="lazy"`.
   *
   * Le defaut est `0` : sur les deux pages qui montent cette grille, aucune
   * capture n'est visible au chargement. `/projets` la place sous un
   * `<app-asili-hero>` haut de `89svh` (asili-hero.component.scss) et sans
   * image — son candidat LCP est le titre du hero, pas une carte ; l'accueil
   * la place en bas de document. Charger des captures hors ecran en `eager`
   * ne ferait que disputer la bande passante au vrai LCP.
   *
   * Une page qui placerait la grille au-dessus de la ligne de flottaison doit
   * passer explicitement le nombre de cartes de sa premiere rangee.
   */
  readonly eagerImages = input(0);

  /**
   * Strategie de chargement de la capture d'une carte selon son rang.
   *
   * @param index Rang de la carte dans la grille (0-based).
   */
  protected imageLoading(index: number): 'eager' | 'lazy' {
    return index < this.eagerImages() ? 'eager' : 'lazy';
  }

  /**
   * `fetchpriority` de la capture : `high` sur la seule premiere carte quand
   * elle est chargee en `eager` (candidat LCP), `null` partout ailleurs pour ne
   * pas disputer la bande passante aux ressources critiques.
   *
   * @param index Rang de la carte dans la grille (0-based).
   */
  protected imageFetchPriority(index: number): 'high' | null {
    return index === 0 && this.eagerImages() > 0 ? 'high' : null;
  }

  /** Largeur intrinseque declaree sur la capture, selon la taille de carte. */
  protected imageWidth(size: AsiliProjectSize): number {
    return IMAGE_DIMENSIONS[size].width;
  }

  /** Hauteur intrinseque declaree sur la capture, selon la taille de carte. */
  protected imageHeight(size: AsiliProjectSize): number {
    return IMAGE_DIMENSIONS[size].height;
  }
}
