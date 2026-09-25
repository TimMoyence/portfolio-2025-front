import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AsiliEnTeteDirective, EN_TETE_ASILI } from '../asili-en-tete.directive';

export interface AsiliMethodStep {
  num: string;
  index?: string;
  title: string;
  desc: string;
}

@Component({
  selector: 'app-asili-method',
  standalone: true,
  imports: [EN_TETE_ASILI],
  templateUrl: './asili-method.component.html',
  styleUrls: ['./asili-method.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsiliMethodComponent extends AsiliEnTeteDirective {
  readonly steps = input.required<readonly AsiliMethodStep[]>();

  readonly intro = input<string | null>(null);

  protected revealDelay(index: number): 1 | 2 | 3 | 4 | null {
    const delay = index % 4;
    return delay === 0 ? null : (delay as 1 | 2 | 3);
  }
}
