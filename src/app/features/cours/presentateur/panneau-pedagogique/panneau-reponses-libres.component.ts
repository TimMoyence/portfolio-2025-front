import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { ReponseLibreFormateur } from '../../../../core/ports/formations.port';

@Component({
  selector: 'app-panneau-reponses-libres',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './panneau-reponses-libres.component.scss',
  template: `
    <section class="panneau-reponses" aria-labelledby="panneau-reponses-titre">
      <h4
        id="panneau-reponses-titre"
        class="panneau-reponses__titre"
        i18n="@@panneauReponsesLibresTitre"
      >
        Réponses libres étudiantes
      </h4>
      @if (reponsesDeLEcran().length === 0) {
        <p
          class="panneau-reponses__vide"
          data-testid="reponses-libres-vide"
          i18n="@@panneauReponsesLibresVide"
        >
          Aucune réponse reçue sur cet écran.
        </p>
      } @else {
        <ul class="panneau-reponses__liste">
          @for (reponse of reponsesDeLEcran(); track reponse.id) {
            <li data-testid="reponse-libre">{{ reponse.response }}</li>
          }
        </ul>
      }
    </section>
  `,
})
export class PanneauReponsesLibresComponent {
  readonly reponses = input.required<readonly ReponseLibreFormateur[]>();
  readonly ecranId = input.required<string>();

  protected readonly reponsesDeLEcran = computed(() =>
    this.reponses().filter((reponse) => reponse.screenId === this.ecranId()),
  );
}
