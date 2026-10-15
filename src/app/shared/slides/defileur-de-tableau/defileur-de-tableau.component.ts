import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import { suivreLaSuite } from '../../../../cours/runtime/core/defileur';
import { defileurDeTableau } from '../../../../cours/runtime/design/defileur';

@Component({
  selector: 'app-defileur-de-tableau',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: '<ng-content />',
  styles: [
    defileurDeTableau,
    'app-defileur-de-tableau { --defileur-fond: var(--card-bg, var(--slide-card-soft)); }',
  ],
  host: { class: 'defileur-de-tableau' },
})
export class DefileurDeTableauComponent {
  constructor() {
    const hote = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    let arreter = (): void => undefined;
    afterNextRender(() => {
      arreter = suivreLaSuite(hote);
    });
    inject(DestroyRef).onDestroy(() => arreter());
  }
}
