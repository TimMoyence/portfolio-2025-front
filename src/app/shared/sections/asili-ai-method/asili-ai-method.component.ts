import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RevealOnScrollDirective } from '../../directives/reveal-on-scroll.directive';

export interface AsiliAiMethodStep {
  num: string;
  title: string;
  desc: string;
}

@Component({
  selector: 'app-asili-ai-method',
  standalone: true,
  imports: [RevealOnScrollDirective],
  templateUrl: './asili-ai-method.component.html',
  styleUrls: ['./asili-ai-method.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsiliAiMethodComponent {
  readonly steps = input.required<readonly AsiliAiMethodStep[]>();

  readonly kicker = input<string | null>(null);

  readonly heading = input<string | null>(null);

  readonly lead = input<string | null>(null);

  readonly rule = input<string | null>(null);

  readonly ruleWho = input<string | null>(null);
}
