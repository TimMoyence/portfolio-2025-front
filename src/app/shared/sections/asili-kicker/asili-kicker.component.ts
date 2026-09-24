import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-asili-kicker',
  standalone: true,
  template: `
    @if (texte(); as t) {
      <span class="kicker">{{ t }}</span>
    }
  `,
  styles: ':host { display: contents; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsiliKickerComponent {
  readonly texte = input.required<string | null>();
}
