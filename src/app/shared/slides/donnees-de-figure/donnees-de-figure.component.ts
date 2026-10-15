import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';
import { DefileurDeTableauComponent } from '../defileur-de-tableau/defileur-de-tableau.component';

@Component({
  selector: 'app-donnees-de-figure',
  standalone: true,
  imports: [DefileurDeTableauComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './donnees-de-figure.component.html',
  styleUrl: './donnees-de-figure.component.scss',
  host: { '[class]': "bloc() + '__data'" },
})
export class DonneesDeFigureComponent {
  readonly bloc = input.required<string>();
  readonly resume = input.required<string>();
  readonly source = input<string>('');
}
