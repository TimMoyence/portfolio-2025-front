import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RevealOnScrollDirective } from '../../directives/reveal-on-scroll.directive';

@Component({
  selector: 'app-asili-hero',
  standalone: true,
  imports: [RevealOnScrollDirective],
  templateUrl: './asili-hero.component.html',
  styleUrls: ['./asili-hero.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsiliHeroComponent {
  readonly kicker = input<string | null>(null);

  readonly liveChip = input<string | null>(null);

  readonly titlePre = input<string | null>(null);

  readonly accent = input<string | null>(null);

  readonly titlePost = input<string | null>(null);

  readonly lead = input<string | null>(null);

  readonly scrollHint = input<string | null>(null);
}
