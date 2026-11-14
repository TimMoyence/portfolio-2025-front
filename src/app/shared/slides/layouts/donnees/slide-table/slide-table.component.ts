import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LIGNES_AVANT_RESSERREMENT } from '../../../../../../cours/runtime/blocks/activites/FpSheet';
import { DefileurDeTableauComponent } from '../../../defileur-de-tableau/defileur-de-tableau.component';
import { TableauDeCellulesComponent } from '../../../defileur-de-tableau/tableau-de-cellules.component';
import { SlideEnTeteComponent } from '../../texte/slide-en-tete/slide-en-tete.component';

export interface TableColumn {
  key: string;
  label: string;
}

type TableRow = Record<string, string>;

@Component({
  selector: 'app-slide-table',
  standalone: true,
  imports: [DefileurDeTableauComponent, SlideEnTeteComponent, TableauDeCellulesComponent],
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
  protected readonly entete = computed(() => this.columns().map(({ label }) => label));
  protected readonly lignes = computed(() =>
    this.rows().map((row) => this.columns().map(({ key }) => row[key] ?? '')),
  );
}
