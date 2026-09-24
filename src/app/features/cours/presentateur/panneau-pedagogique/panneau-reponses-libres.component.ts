import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { ReponseLibreFormateur } from '../../../../core/ports/formations.port';

export interface GroupeDeReponses {
  readonly activityId: string;
  readonly enonce: string | null;
  readonly reponses: readonly ReponseLibreFormateur[];
}

export function grouperLesReponses(
  reponses: readonly ReponseLibreFormateur[],
  enonces: ReadonlyMap<string, string>,
): readonly GroupeDeReponses[] {
  const parActivite = new Map<string, ReponseLibreFormateur[]>(
    [...enonces.keys()].map((activityId) => [activityId, []]),
  );
  for (const reponse of reponses) {
    const groupe = parActivite.get(reponse.activityId) ?? [];
    groupe.push(reponse);
    parActivite.set(reponse.activityId, groupe);
  }
  return [...parActivite].map(([activityId, groupe]) => ({
    activityId,
    enonce: enonces.get(activityId) ?? null,
    reponses: groupe,
  }));
}

@Component({
  selector: 'app-panneau-reponses-libres',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './panneau-reponses-libres.component.scss',
  template: `
    @if (groupes().length > 0) {
      <section class="panneau-reponses" aria-labelledby="panneau-reponses-titre">
        <h4
          id="panneau-reponses-titre"
          class="panneau-reponses__titre"
          i18n="@@panneauReponsesLibresTitre"
        >
          Réponses libres étudiantes
        </h4>
        @for (groupe of groupes(); track groupe.activityId) {
          <div
            class="panneau-reponses__groupe"
            data-testid="reponses-libres-groupe"
            [attr.data-activite]="groupe.activityId"
          >
            @if (groupe.enonce !== null) {
              <p class="panneau-reponses__question" data-testid="reponses-libres-question">
                {{ groupe.enonce }}
              </p>
            }
            @if (groupe.reponses.length === 0) {
              <p
                class="panneau-reponses__vide"
                data-testid="reponses-libres-vide"
                i18n="@@panneauReponsesLibresVide"
              >
                Aucune réponse reçue pour l’instant.
              </p>
            } @else {
              <ul class="panneau-reponses__liste">
                @for (reponse of groupe.reponses; track reponse.id) {
                  <li data-testid="reponse-libre">{{ reponse.response }}</li>
                }
              </ul>
            }
          </div>
        }
      </section>
    }
  `,
})
export class PanneauReponsesLibresComponent {
  readonly reponses = input.required<readonly ReponseLibreFormateur[]>();
  readonly ecranId = input.required<string>();
  readonly renvoi = input<string | undefined>(undefined);
  readonly enonces = input<ReadonlyMap<string, string>>(new Map());

  protected readonly groupes = computed(() => {
    const ecrans = new Set([this.ecranId(), this.renvoi()]);
    return grouperLesReponses(
      this.reponses().filter((reponse) => ecrans.has(reponse.screenId)),
      this.enonces(),
    );
  });
}
