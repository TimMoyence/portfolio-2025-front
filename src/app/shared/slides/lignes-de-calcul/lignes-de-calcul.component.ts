import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { lignesDeCalcul } from '../../../../cours/content/lignes-de-calcul';

@Component({
  selector: '[appLignesDeCalcul]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (ligne of lignes(); track $index) {
      <span class="ligne-de-calcul">{{ ligne }}</span>
    }
  `,
  styles: `
    .ligne-de-calcul {
      display: block;
    }
  `,
})
export class LignesDeCalculComponent {
  readonly appLignesDeCalcul = input.required<string>();

  protected readonly lignes = computed(() => lignesDeCalcul(this.appLignesDeCalcul()));
}
