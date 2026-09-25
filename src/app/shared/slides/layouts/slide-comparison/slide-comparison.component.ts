import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SlideEnTeteComponent } from '../slide-en-tete/slide-en-tete.component';

type ComparisonTone = 'danger' | 'success' | 'info' | 'warning' | 'neutral';

export interface ComparisonColumn {
  label: string;
  tone?: ComparisonTone;
  items: string[];
}

@Component({
  selector: 'app-slide-comparison',
  standalone: true,
  imports: [SlideEnTeteComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slide-comparison.component.html',
  styleUrl: './slide-comparison.component.scss',
})
export class SlideComparisonComponent {
  readonly title = input<string>('');
  readonly subtitle = input<string>('');
  readonly note = input<string>('');
  readonly columns = input.required<ComparisonColumn[]>();
}
