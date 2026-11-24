import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'section[appAsiliSectionTete]',
  standalone: true,
  template: `
    <div class="wrap">
      <div class="sec-head">
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
