import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SlideEnTeteComponent } from '../slide-en-tete/slide-en-tete.component';

interface SlideStat {
  value: string;
  label: string;
  source?: string;
}

@Component({
  selector: 'app-slide-stats',
  standalone: true,
  imports: [SlideEnTeteComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slide-stats.component.html',
  styleUrl: './slide-stats.component.scss',
})
export class SlideStatsComponent {
  readonly title = input<string>('');
  readonly subtitle = input<string>('');
  readonly stats = input.required<SlideStat[]>();
}
