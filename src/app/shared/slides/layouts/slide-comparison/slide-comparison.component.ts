import { ChangeDetectionStrategy, Component, input } from "@angular/core";

/**
 * Tonalite visuelle d'une colonne de comparaison.
 * Mappe sur une palette semantique (danger, success, info, warning, neutral).
 */
export type ComparisonTone =
  | "danger"
  | "success"
  | "info"
  | "warning"
  | "neutral";

/**
 * Description d'une colonne de la slide comparison.
 *
 * - `label` : intitule visible en `<h3>` au sommet de la colonne
 * - `tone` : palette semantique (default `neutral`)
 * - `items` : liste rendue en `<ul><li>`
 */
export interface ComparisonColumn {
  label: string;
  tone?: ComparisonTone;
  items: string[];
}

/**
 * Slide de comparaison N colonnes.
 *
 * L'API ancienne (`leftLabel/leftItems` + `rightLabel/rightItems`) a ete
 * supprimee. Tous les consumers migrent vers `[columns]` qui accepte un
 * nombre arbitraire de colonnes typees `ComparisonColumn`.
 */
@Component({
  selector: "app-slide-comparison",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./slide-comparison.component.html",
  styleUrl: "./slide-comparison.component.scss",
})
export class SlideComparisonComponent {
  readonly title = input<string>("");
  readonly columns = input.required<ComparisonColumn[]>();
}
