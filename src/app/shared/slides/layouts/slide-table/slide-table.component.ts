import { ChangeDetectionStrategy, Component, input } from "@angular/core";

/**
 * Definition d'une colonne de tableau : `key` est la cle stable cote
 * data (matche les rows), `label` est le libelle affiche dans le `<th>`.
 * Separation indispensable pour i18n (label peut varier entre locales)
 * sans casser le lookup des cellules.
 */
export interface TableColumn {
  key: string;
  label: string;
}

/**
 * Une ligne de tableau : record clés-valeurs ou les cles correspondent
 * aux `TableColumn.key`. Les colonnes manquantes affichent "".
 */
export type TableRow = Record<string, string>;

/**
 * Layout de slide tabulaire pour donnees denses.
 *
 * Conçu pour le mode `visibility="scroll-only"` : un tableau de N
 * colonnes et M lignes, scroll horizontal sur mobile, alignements DS
 * (vert teal). Les `columns` definissent l'ordre + libelle (i18n) ;
 * chaque `row` doit fournir une valeur pour chaque `key` de colonne.
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
  readonly columns = input.required<TableColumn[]>();
  readonly rows = input.required<TableRow[]>();

  protected cellValue(row: TableRow, key: string): string {
    return row[key] ?? "";
  }
}
