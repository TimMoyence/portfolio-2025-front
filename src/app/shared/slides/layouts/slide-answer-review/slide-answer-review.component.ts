import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface ExplicationRevelee {
  readonly reference: string;
  readonly texte: string;
}

export interface ReussiteDeLaClasse {
  readonly justes: number;
  readonly total: number;
}

interface LigneRevelee extends ExplicationRevelee {
  readonly cible: string | null;
  readonly juste: boolean | null;
  readonly reussite: ReussiteDeLaClasse | null;
}

@Component({
  selector: 'app-slide-answer-review',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slide-answer-review.component.html',
  styleUrl: './slide-answer-review.component.scss',
})
export class SlideAnswerReviewComponent {
  readonly title = input<string>('');
  readonly subtitle = input<string>('');
  readonly explications = input.required<readonly ExplicationRevelee[]>();
  readonly verdicts = input<Readonly<Record<string, boolean>>>({});
  readonly cibles = input<Readonly<Record<string, string>>>({});
  readonly reussites = input<Readonly<Record<string, ReussiteDeLaClasse>>>({});

  protected readonly lignes = computed<readonly LigneRevelee[]>(() => {
    const verdicts = this.verdicts();
    const cibles = this.cibles();
    const reussites = this.reussites();
    return this.explications().map((explication) => ({
      ...explication,
      cible: cibles[explication.reference] ?? null,
      juste: verdicts[explication.reference] ?? null,
      reussite: reussites[explication.reference] ?? null,
    }));
  });
}
