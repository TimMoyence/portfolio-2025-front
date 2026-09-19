import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-slide-hero',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slide-hero.component.html',
  styleUrl: './slide-hero.component.scss',
})
export class SlideHeroComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly bullets = input<string[]>([]);
  readonly bgImage = input<string | null>(null);
  readonly bgImageAlt = input<string>('');
  readonly accent = input<string>('default');
  readonly ctaLabel = input<string>('');
  readonly ctaHref = input<string>('');
  readonly priority = input(false);
}
