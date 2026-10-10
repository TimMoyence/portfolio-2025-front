import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LignesDeCalculComponent } from '../../lignes-de-calcul/lignes-de-calcul.component';
import { SlideEnTeteComponent } from '../slide-en-tete/slide-en-tete.component';
import type { Decompte, DecomptesParCle } from '../../../../../cours/content/types';

export interface CategorieDuTri {
  readonly id: string;
  readonly label: string;
}

export interface CarteDuTri {
  readonly id: string;
  readonly label: string;
  readonly category: string;
  readonly justification: string;
}

interface ZoneDuTri extends CategorieDuTri {
  readonly cartes: readonly (CarteDuTri & {
    readonly malPlacee: boolean;
    readonly bienPlacee: boolean;
    readonly compte: Decompte | null;
  })[];
}

@Component({
  selector: 'app-slide-sort-review',
  standalone: true,
  imports: [SlideEnTeteComponent, LignesDeCalculComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slide-sort-review.component.html',
  styleUrl: './slide-sort-review.component.scss',
})
export class SlideSortReviewComponent {
  readonly title = input<string>('');
  readonly subtitle = input<string>('');
  readonly categories = input.required<readonly CategorieDuTri[]>();
  readonly cards = input.required<readonly CarteDuTri[]>();
  readonly misplaced = input<readonly string[]>([]);
  readonly wellPlaced = input<readonly string[]>([]);
  readonly comptes = input<DecomptesParCle>({});

  protected readonly zones = computed<readonly ZoneDuTri[]>(() => {
    const malPlacees = new Set(this.misplaced());
    const bienPlacees = new Set(this.wellPlaced());
    return this.categories().map((categorie) => ({
      ...categorie,
      cartes: this.cards()
        .filter((carte) => carte.category === categorie.id)
        .map((carte) => ({
          ...carte,
          malPlacee: malPlacees.has(carte.id),
          bienPlacee: !malPlacees.has(carte.id) && bienPlacees.has(carte.id),
          compte: this.comptes()[carte.id] ?? null,
        })),
    }));
  });
}
