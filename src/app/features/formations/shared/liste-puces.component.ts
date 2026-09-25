import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ul[appListePuces]',
  standalone: true,
  template: `
    @for (puce of appListePuces(); track puce) {
      <li>{{ puce }}</li>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListePucesComponent {
  readonly appListePuces = input.required<readonly string[]>();
}
