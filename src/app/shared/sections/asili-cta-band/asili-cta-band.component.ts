import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealOnScrollDirective } from '../../directives/reveal-on-scroll.directive';

export interface AsiliCtaAction {
  readonly libelle: string;
  readonly lien: string;
  readonly variante: 'principale' | 'secondaire';
}

@Component({
  selector: 'app-asili-cta-band',
  standalone: true,
  imports: [RevealOnScrollDirective, RouterLink],
  templateUrl: './asili-cta-band.component.html',
  styleUrls: ['./asili-cta-band.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsiliCtaBandComponent {
  readonly title = input.required<string>();

  readonly kicker = input<string | null>(null);

  readonly lead = input<string | null>(null);

  readonly actions = input<readonly AsiliCtaAction[]>([]);
}
