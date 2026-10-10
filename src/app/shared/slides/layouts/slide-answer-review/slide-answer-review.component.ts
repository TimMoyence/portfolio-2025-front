import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { Decompte, DecomptesParCle } from '../../../../../cours/content/types';
import { LignesDeCalculComponent } from '../../lignes-de-calcul/lignes-de-calcul.component';
import { SlideEnTeteComponent } from '../slide-en-tete/slide-en-tete.component';

export interface ExplicationRevelee {
  readonly reference: string;
  readonly texte: string;
}

interface LigneRevelee extends ExplicationRevelee {
  readonly cible: string | null;
  readonly juste: boolean | null;
  readonly reussite: Decompte | null;
}

@Component({
  selector: 'app-slide-answer-review',
  standalone: true,
  imports: [SlideEnTeteComponent, LignesDeCalculComponent],
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
  readonly reussites = input<DecomptesParCle>({});

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
