import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RevealOnScrollDirective } from '../../directives/reveal-on-scroll.directive';

@Component({
  selector: 'section[appAsiliSectionTete]',
  standalone: true,
  imports: [RevealOnScrollDirective],
  template: `
    <div class="wrap">
      <div class="sec-head" appReveal>
        <div>
          <span class="kicker">{{ kicker() }}</span>
          <ng-content select="h2" />
        </div>
        <ng-content select=".link-arrow" />
      </div>
      <ng-content />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsiliSectionTeteComponent {
  readonly kicker = input.required<string>();
}
