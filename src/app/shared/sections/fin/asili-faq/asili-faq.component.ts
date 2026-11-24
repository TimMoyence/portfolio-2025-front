import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { QuestionDeFaq } from '../../../offre/prix-et-delai';
import { FiletDeSectionDirective } from '../../../directives/filet-de-section.directive';

@Component({
  selector: 'app-asili-faq',
  standalone: true,
  imports: [FiletDeSectionDirective],
  templateUrl: './asili-faq.component.html',
  styleUrls: ['./asili-faq.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsiliFaqComponent {
  readonly kicker = input.required<string>();

  readonly title = input.required<string>();

  readonly items = input.required<readonly QuestionDeFaq[]>();
}
