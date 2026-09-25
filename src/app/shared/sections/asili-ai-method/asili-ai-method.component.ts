import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AsiliEnTeteDirective, EN_TETE_ASILI } from '../asili-en-tete.directive';

export interface AsiliAiMethodStep {
  num: string;
  title: string;
  desc: string;
}

@Component({
  selector: 'app-asili-ai-method',
  standalone: true,
  imports: [EN_TETE_ASILI],
  templateUrl: './asili-ai-method.component.html',
  styleUrls: ['./asili-ai-method.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsiliAiMethodComponent extends AsiliEnTeteDirective {
  readonly steps = input.required<readonly AsiliAiMethodStep[]>();

  readonly lead = input<string | null>(null);

  readonly rule = input<string | null>(null);

  readonly ruleWho = input<string | null>(null);
}
