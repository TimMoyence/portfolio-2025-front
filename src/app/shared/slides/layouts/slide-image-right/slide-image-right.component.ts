import { ChangeDetectionStrategy, Component, input } from "@angular/core";

/**
 * Slide contenu gauche / image droite avec inputs typés.
 *
 * Inputs :
 * - `paragraphs` : tableau rendu en `<p>` separes (espacement vertical clair)
 * - `items` : tableau rendu en `<ul><li>` avec puces stylees
 *
 * `<ng-content>` reste disponible pour insertions ad-hoc apres les listes.
 */
@Component({
  selector: "app-slide-image-right",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./slide-image-right.component.html",
  styleUrl: "./slide-image-right.component.scss",
})
export class SlideImageRightComponent {
  readonly image = input.required<string>();
  readonly imageAlt = input.required<string>();
  readonly title = input<string>("");
  readonly paragraphs = input<string[]>([]);
  readonly items = input<string[]>([]);
  readonly accent = input<string>("default");
}
