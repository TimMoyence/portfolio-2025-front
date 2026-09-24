import { ChangeDetectionStrategy, Component, computed, input, linkedSignal } from '@angular/core';
import type { GuideFormateur } from '../../../../../cours/content/types';

type CleRubrique = 'question' | 'reponse' | 'relance';

interface Rubrique {
  readonly cle: CleRubrique;
  readonly libelle: string;
  readonly texte: string;
}

const ORDRE: readonly CleRubrique[] = ['question', 'reponse', 'relance'];

const LIBELLES: Readonly<Record<CleRubrique, string>> = {
  question: $localize`:@@panneauGuideQuestion:Question à poser`,
  reponse: $localize`:@@panneauGuideReponse:Réponse attendue`,
  relance: $localize`:@@panneauGuideRelance:Relance`,
};

@Component({
  selector: 'app-panneau-guide',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './panneau-guide.component.scss',
  template: `
    @if (rubriques().length > 0) {
      <section
        class="panneau-guide"
        data-testid="presentateur-guide"
        aria-labelledby="panneau-guide-titre"
      >
        <h3 id="panneau-guide-titre" class="panneau-guide__titre" i18n="@@panneauGuideTitre">
          Guide de facilitation
        </h3>
        <dl class="panneau-guide__liste">
          @for (rubrique of rubriques(); track rubrique.cle) {
            <div
              class="panneau-guide__rubrique"
              data-testid="panneau-guide-rubrique"
              [attr.data-rubrique]="rubrique.cle"
            >
              <dt>{{ rubrique.libelle }}</dt>
              <dd>
                @if (rubrique.cle === 'reponse') {
                  @if (reponseVisible()) {
                    <span data-testid="panneau-guide-reponse">{{ rubrique.texte }}</span>
                  }
                  <button
                    type="button"
                    class="panneau-guide__reveler"
                    data-testid="panneau-guide-reveler"
                    [attr.aria-expanded]="reponseVisible()"
                    (click)="basculerLaReponse()"
                  >
                    @if (reponseVisible()) {
                      <span i18n="@@panneauGuideMasquer">Masquer la réponse attendue</span>
                    } @else {
                      <span i18n="@@panneauGuideReveler">Révéler la réponse attendue</span>
                    }
                  </button>
                } @else {
                  {{ rubrique.texte }}
                }
              </dd>
            </div>
          }
        </dl>
      </section>
    }
  `,
})
export class PanneauGuideComponent {
  readonly guide = input<GuideFormateur | undefined>(undefined);
  readonly ecranId = input.required<string>();

  protected readonly reponseVisible = linkedSignal({
    source: this.ecranId,
    computation: () => false,
  });

  protected readonly rubriques = computed<readonly Rubrique[]>(() => {
    const guide = this.guide() ?? {};
    return ORDRE.map((cle) => {
      const servi = guide[cle] ?? '';
      return { cle, libelle: LIBELLES[cle], texte: servi };
    }).filter((rubrique) => rubrique.texte !== '');
  });

  protected basculerLaReponse(): void {
    this.reponseVisible.update((visible) => !visible);
  }
}
