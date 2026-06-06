import { NgTemplateOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { RevealOnScrollDirective } from "../../directives/reveal-on-scroll.directive";

/**
 * Taille d'une carte projet dans la grille 6 colonnes.
 *
 * - `big` : occupe 4 colonnes (carte large, visuel 16/10).
 * - `small` : occupe 2 colonnes (carte compacte, visuel 4/3).
 */
export type AsiliProjectSize = "big" | "small";

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
  selector: "app-asili-projects-grid",
  standalone: true,
  imports: [RevealOnScrollDirective, NgTemplateOutlet],
  templateUrl: "./asili-projects-grid.component.html",
  styleUrls: ["./asili-projects-grid.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsiliProjectsGridComponent {
  /** Cartes projet a afficher dans la grille. */
  readonly projects = input.required<readonly AsiliProject[]>();

  /** Sur-titre mono de l'entete (ex. `"Preuve de savoir-faire"`). Optionnel. */
  readonly kicker = input<string | null>(null);

  /** Titre principal de la section, rendu en `<h2>`. Optionnel. */
  readonly heading = input<string | null>(null);
}
