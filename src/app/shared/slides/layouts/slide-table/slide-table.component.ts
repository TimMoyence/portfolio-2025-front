import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SlideEnTeteComponent } from '../slide-en-tete/slide-en-tete.component';

export interface TableColumn {
  key: string;
  label: string;
}

type TableRow = Record<string, string>;

@Component({
  selector: 'app-slide-table',
  standalone: true,
  imports: [SlideEnTeteComponent],
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

  protected cellValue(row: TableRow, key: string): string {
    return row[key] ?? '';
  }
}
