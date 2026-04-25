import { ChangeDetectionStrategy, Component, input } from "@angular/core";

/**
 * Une ligne de tableau pour `SlideTableComponent`.
 *
 * Cle = colonne (libre cote consommateur), valeur = contenu textuel a
 * afficher. Permet de presenter des donnees tabulaires denses (ex : 16
 * outils en 4 colonnes : Outil / Categorie / Prix / Tagline) sans
 * forcer une structure rigide cote layout.
 */
export type TableRow = Record<string, string>;

/**
 * Layout de slide tabulaire pour donnees denses.
 *
 * Conçu pour le mode `visibility="scroll-only"` : un tableau de N
 * colonnes et M lignes, scroll horizontal sur mobile, alignements
 * design system (vert teal). Les `headers` definissent l'ordre et le
 * libelle des colonnes ; chaque `row` doit fournir une cle pour chaque
 * header (les cles non couvertes sont ignorees).
 */
@Component({
  selector: "app-slide-table",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./slide-table.component.html",
  styleUrl: "./slide-table.component.scss",
})
export class SlideTableComponent {
  readonly title = input<string>("");
  readonly headers = input.required<string[]>();
  readonly rows = input.required<TableRow[]>();

  /**
   * Recupere la valeur d'une cellule via la cle de header. Retourne
   * une chaine vide si la cle n'existe pas — evite les `undefined`
   * dans le DOM.
   */
  protected cellValue(row: TableRow, header: string): string {
    return row[header] ?? "";
  }
}
