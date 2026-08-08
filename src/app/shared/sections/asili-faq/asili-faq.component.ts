import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RevealOnScrollDirective } from '../../directives/reveal-on-scroll.directive';

export interface AsiliFaqItem {
  readonly q: string;
  readonly a: string;
}

@Component({
  selector: 'app-asili-faq',
  standalone: true,
  imports: [RevealOnScrollDirective],
  templateUrl: './asili-faq.component.html',
  styleUrls: ['./asili-faq.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsiliFaqComponent {
  readonly kicker = input.required<string>();

  readonly title = input.required<string>();

  readonly items = input.required<readonly AsiliFaqItem[]>();
}
