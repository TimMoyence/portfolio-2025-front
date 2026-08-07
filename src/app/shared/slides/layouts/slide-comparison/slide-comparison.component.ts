import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ComparisonTone = 'danger' | 'success' | 'info' | 'warning' | 'neutral';

export interface ComparisonColumn {
  label: string;
  tone?: ComparisonTone;
  items: string[];
}

@Component({
  selector: 'app-slide-comparison',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slide-comparison.component.html',
  styleUrl: './slide-comparison.component.scss',
})
export class SlideComparisonComponent {
  readonly title = input<string>('');
  readonly columns = input.required<ComparisonColumn[]>();
}
