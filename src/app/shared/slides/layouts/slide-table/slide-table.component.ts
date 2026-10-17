import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LIGNES_AVANT_RESSERREMENT } from '../../../../../cours/runtime/blocks/FpSheet';
import { DefileurDeTableauComponent } from '../../defileur-de-tableau/defileur-de-tableau.component';
import { SlideEnTeteComponent } from '../slide-en-tete/slide-en-tete.component';

export interface TableColumn {
  key: string;
  label: string;
}

type TableRow = Record<string, string>;

@Component({
  selector: 'app-slide-table',
  standalone: true,
  imports: [DefileurDeTableauComponent, SlideEnTeteComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slide-table.component.html',
  styleUrl: './slide-table.component.scss',
})
export class SlideTableComponent {
  readonly title = input<string>('');
  readonly subtitle = input<string>('');
  readonly note = input<string>('');
  readonly columns = input.required<TableColumn[]>();
  readonly rows = input.required<TableRow[]>();
  protected readonly dense = computed(() => this.rows().length > LIGNES_AVANT_RESSERREMENT);

  protected cellValue(row: TableRow, key: string): string {
    return row[key] ?? '';
  }
}
