import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AsiliEnTeteDirective, EN_TETE_ASILI } from '../asili-en-tete.directive';

type AsiliPillarVariant = 'services' | 'formations';

interface AsiliPillarLink {
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
  imports: [EN_TETE_ASILI],
  templateUrl: './asili-pillars.component.html',
  styleUrls: ['./asili-pillars.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsiliPillarsComponent extends AsiliEnTeteDirective {
  readonly pillars = input.required<readonly AsiliPillar[]>();

  readonly intro = input<string | null>(null);
}
