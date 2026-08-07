import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RevealOnScrollDirective } from '../../directives/reveal-on-scroll.directive';

export type AsiliProjectSize = 'big' | 'small';

export interface AsiliProjectTag {
  label: string;
  prod?: boolean;
}

/**
 * `imageAlt` est requis des qu'`image` est fourni (a11y) — le type ne peut pas
 * l'exprimer. Il sert aussi de legende au placeholder quand l'image est absente.
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

@Component({
  selector: 'app-asili-projects-grid',
  standalone: true,
  imports: [RevealOnScrollDirective, NgTemplateOutlet],
  templateUrl: './asili-projects-grid.component.html',
  styleUrls: ['./asili-projects-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsiliProjectsGridComponent {
  readonly projects = input.required<readonly AsiliProject[]>();

  readonly kicker = input<string | null>(null);

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

  protected imageLoading(index: number): 'eager' | 'lazy' {
    return index < this.eagerImages() ? 'eager' : 'lazy';
  }

  /**
   * `fetchpriority` de la capture : `high` sur la seule premiere carte quand
   * elle est chargee en `eager` (candidat LCP), `null` partout ailleurs pour ne
   * pas disputer la bande passante aux ressources critiques.
   */
  protected imageFetchPriority(index: number): 'high' | null {
    return index === 0 && this.eagerImages() > 0 ? 'high' : null;
  }

  protected imageWidth(size: AsiliProjectSize): number {
    return IMAGE_DIMENSIONS[size].width;
  }

  protected imageHeight(size: AsiliProjectSize): number {
    return IMAGE_DIMENSIONS[size].height;
  }
}
