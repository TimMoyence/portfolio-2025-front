import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RevealOnScrollDirective } from '../../directives/reveal-on-scroll.directive';

export interface AsiliMethodStep {
  num: string;
  index?: string;
  title: string;
  desc: string;
}

@Component({
  selector: 'app-asili-method',
  standalone: true,
  imports: [RevealOnScrollDirective],
  templateUrl: './asili-method.component.html',
  styleUrls: ['./asili-method.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsiliMethodComponent {
  readonly steps = input.required<readonly AsiliMethodStep[]>();

  readonly kicker = input<string | null>(null);

  readonly heading = input<string | null>(null);

  readonly intro = input<string | null>(null);

  protected revealDelay(index: number): 1 | 2 | 3 | 4 | null {
    const delay = index % 4;
    return delay === 0 ? null : (delay as 1 | 2 | 3);
  }
}
