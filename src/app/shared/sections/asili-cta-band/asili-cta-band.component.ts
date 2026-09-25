import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealOnScrollDirective } from '../../directives/reveal-on-scroll.directive';

export interface AsiliCtaAction {
  readonly libelle: string;
  readonly lien: string;
  readonly variante: 'principale' | 'secondaire';
}

export interface AsiliCta {
  readonly kicker?: string;
  readonly title: string;
  readonly lead?: string;
  readonly actions?: readonly AsiliCtaAction[];
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
  readonly contenu = input.required<AsiliCta>();
}
