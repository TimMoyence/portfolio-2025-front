import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RevealOnScrollDirective } from '../../directives/reveal-on-scroll.directive';

export type AsiliPillarVariant = 'services' | 'formations';

export interface AsiliPillarLink {
  label: string;
  href: string;
}

export interface AsiliPillar {
  variant: AsiliPillarVariant;
  tag: string;
  title: string;
  desc: string;
  items: readonly string[];
  link?: AsiliPillarLink;
}

@Component({
  selector: 'app-asili-pillars',
  standalone: true,
  imports: [RevealOnScrollDirective],
  templateUrl: './asili-pillars.component.html',
  styleUrls: ['./asili-pillars.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsiliPillarsComponent {
  readonly pillars = input.required<readonly AsiliPillar[]>();

  readonly kicker = input<string | null>(null);

  readonly heading = input<string | null>(null);

  readonly intro = input<string | null>(null);
}
