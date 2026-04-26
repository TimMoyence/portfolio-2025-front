import { ChangeDetectionStrategy, Component, input } from "@angular/core";

/**
 * Item enrichi pour les layouts image-left / image-right / grid.
 *
 * `title` : nom de l'outil ou intitule (rendu en gras).
 * `description` : phrase descriptive (texte courant).
 * `meta` : optionnel — chip discret (prix, tagline courte).
 * `logo` : URL d'image optionnel ; sinon une puce DS s'affiche avec
 *          l'initiale du `title`.
 */
export interface RichListItem {
  title: string;
  description: string;
  meta?: string;
  logo?: string;
}

/**
 * Slide image gauche / contenu droite.
 *
 * Inputs structures :
 * - `subtitle` : intro courte au-dessus de la liste
 * - `paragraphs` : `<p>` separes
 * - `items` : `<ul><li>` simples
 * - `richItems` : liste enrichie avec logo + titre gras + description + meta
 *
 * `<ng-content>` reste disponible pour insertions ad-hoc apres les listes.
 */
@Component({
  selector: "app-slide-image-left",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./slide-image-left.component.html",
  styleUrl: "./slide-image-left.component.scss",
})
export class SlideImageLeftComponent {
  readonly image = input.required<string>();
  readonly imageAlt = input.required<string>();
  readonly title = input<string>("");
  readonly subtitle = input<string>("");
  readonly paragraphs = input<string[]>([]);
  readonly items = input<string[]>([]);
  readonly richItems = input<RichListItem[]>([]);
  readonly accent = input<string>("default");

  protected initial(label: string): string {
    return label.trim().charAt(0).toUpperCase();
  }
}
