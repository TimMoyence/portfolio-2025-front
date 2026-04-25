import { ChangeDetectionStrategy, Component, input } from "@angular/core";

/**
 * Slide image gauche / contenu droite avec inputs typés.
 *
 * Inputs :
 * - `paragraphs` : tableau rendu en `<p>` separes (espacement vertical clair)
 * - `items` : tableau rendu en `<ul><li>` avec puces stylees
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
  readonly paragraphs = input<string[]>([]);
  readonly items = input<string[]>([]);
  readonly accent = input<string>("default");
}
