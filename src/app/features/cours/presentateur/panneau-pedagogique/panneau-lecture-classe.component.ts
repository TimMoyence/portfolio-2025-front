import { PercentPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { ResultatQuestion } from '../../../../../cours/content/types';

type Confiance = 'aucune' | 'a-confirmer' | 'solide';

interface LectureClasse {
  readonly reponses: number;
  readonly taux: number | null;
  readonly confiance: Confiance;
}

const COUVERTURE_SOLIDE = 0.9;

const LIBELLES_CONFIANCE: Readonly<Record<Confiance, string>> = {
  aucune: $localize`:@@panneauLectureConfianceAucune:Aucune donnée`,
  'a-confirmer': $localize`:@@panneauLectureConfianceAConfirmer:À confirmer`,
  solide: $localize`:@@panneauLectureConfianceSolide:Solide`,
};

function lireLaClasse(
  questionIds: readonly string[],
  resultats: readonly ResultatQuestion[],
  participants: number,
): LectureClasse {
  const correspondants = resultats.filter((resultat) => questionIds.includes(resultat.questionId));
  const reponses = correspondants.reduce((total, resultat) => total + resultat.total, 0);
  const correctes = correspondants.reduce((total, resultat) => total + resultat.correctes, 0);
  if (reponses === 0) {
    return { reponses, taux: null, confiance: 'aucune' };
  }
  const couverture = participants > 0 ? reponses / participants : 0;
  return {
    reponses,
    taux: correctes / reponses,
    confiance: couverture >= COUVERTURE_SOLIDE ? 'solide' : 'a-confirmer',
  };
}

@Component({
  selector: 'app-panneau-lecture-classe',
  standalone: true,
  imports: [PercentPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './panneau-lecture-classe.component.scss',
  template: `
    <section class="panneau-lecture" aria-labelledby="panneau-lecture-titre">
      <h4 id="panneau-lecture-titre" class="panneau-lecture__titre" i18n="@@panneauLectureTitre">
        Lecture de la classe
      </h4>
      <dl class="panneau-lecture__indicateurs">
        <div>
          <dt i18n="@@panneauLectureTaux">Taux de réussite</dt>
          <dd data-testid="lecture-classe-taux">
            {{ lecture().taux === null ? '—' : (lecture().taux | percent) }}
          </dd>
        </div>
        <div>
          <dt i18n="@@panneauLectureReponses">Réponses</dt>
          <dd data-testid="lecture-classe-reponses">
            {{ lecture().reponses }} / {{ participants() }}
          </dd>
        </div>
        <div>
          <dt i18n="@@panneauLectureConfiance">Confiance du diagnostic</dt>
          <dd data-testid="lecture-classe-confiance">{{ libelleConfiance() }}</dd>
        </div>
      </dl>
    </section>
  `,
})
export class PanneauLectureClasseComponent {
  readonly questionIds = input.required<readonly string[]>();
  readonly resultats = input.required<readonly ResultatQuestion[]>();
  readonly participants = input.required<number>();

  protected readonly lecture = computed(() =>
    lireLaClasse(this.questionIds(), this.resultats(), this.participants()),
  );

  protected readonly libelleConfiance = computed(
    () => LIBELLES_CONFIANCE[this.lecture().confiance],
  );
}
