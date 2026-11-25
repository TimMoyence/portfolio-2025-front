import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, PLATFORM_ID, inject } from '@angular/core';

@Component({
  selector: 'app-couche-de-nuit',
  standalone: true,
  template: `@if (navigateur) {
    <canvas class="couche-de-nuit" aria-hidden="true"></canvas>
  }`,
  styles: `
    :host {
      position: absolute;
      inset: 0;
      z-index: 0;
      pointer-events: none;
    }

    .couche-de-nuit {
      display: block;
      width: 100%;
      height: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoucheDeNuitComponent {
  protected readonly navigateur = isPlatformBrowser(inject(PLATFORM_ID));
}
