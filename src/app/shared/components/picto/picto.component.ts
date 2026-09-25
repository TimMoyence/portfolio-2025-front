import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type NomDePicto = 'coche' | 'enveloppe' | 'courrier' | 'cadenas' | 'alerte';

@Component({
  selector: 'svg[appPicto]',
  standalone: true,
  template: `
    @switch (appPicto()) {
      @case ('coche') {
        <svg:path
          d="M5 12.5 10 17l9-10"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      }
      @case ('enveloppe') {
        <svg:rect
          x="3"
          y="5"
          width="18"
          height="14"
          rx="2"
          stroke="currentColor"
          stroke-width="1.6"
        />
        <svg:path
          d="m4 7 8 6 8-6"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linejoin="round"
        />
      }
      @case ('courrier') {
        <svg:path
          d="M3 8l9 6 9-6"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linejoin="round"
        />
        <svg:rect
          x="3"
          y="5"
          width="18"
          height="14"
          rx="2"
          stroke="currentColor"
          stroke-width="1.6"
        />
      }
      @case ('cadenas') {
        <svg:rect
          x="5"
          y="11"
          width="14"
          height="9"
          rx="2"
          stroke="currentColor"
          stroke-width="1.6"
        />
        <svg:path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="1.6" />
      }
      @case ('alerte') {
        <svg:circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6" />
        <svg:path
          d="M12 7v6M12 16.5v.5"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
        />
      }
    }
  `,
  host: {
    '[attr.width]': 'taille()',
    '[attr.height]': 'taille()',
    viewBox: '0 0 24 24',
    fill: 'none',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PictoComponent {
  readonly appPicto = input.required<NomDePicto>();
  readonly taille = input(34);
}
