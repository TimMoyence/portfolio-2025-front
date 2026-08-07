import { ChangeDetectionStrategy, Component, input } from '@angular/core';

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

export type TableRow = Record<string, string>;

@Component({
  selector: 'app-slide-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slide-table.component.html',
  styleUrl: './slide-table.component.scss',
})
export class SlideTableComponent {
  readonly title = input<string>('');
  readonly columns = input.required<TableColumn[]>();
  readonly rows = input.required<TableRow[]>();

  protected cellValue(row: TableRow, key: string): string {
    return row[key] ?? '';
  }
}
