import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface SlideGuideItem {
  readonly title: string;
  readonly description: string;
  readonly detail?: string;
}

@Component({
  selector: 'app-slide-guide',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slide-guide.component.html',
  styleUrl: './slide-guide.component.scss',
})
export class SlideGuideComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly context = input<string>('');
  readonly items = input.required<readonly SlideGuideItem[]>();
  readonly takeaway = input<string>('');
  readonly nextAction = input<string>('');
}
