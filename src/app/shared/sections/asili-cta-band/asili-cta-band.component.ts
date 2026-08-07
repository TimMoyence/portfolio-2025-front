import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RevealOnScrollDirective } from '../../directives/reveal-on-scroll.directive';

@Component({
  selector: 'app-asili-cta-band',
  standalone: true,
  imports: [RevealOnScrollDirective],
  templateUrl: './asili-cta-band.component.html',
  styleUrls: ['./asili-cta-band.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsiliCtaBandComponent {
  readonly title = input.required<string>();

  readonly kicker = input<string | null>(null);

  readonly lead = input<string | null>(null);
}
