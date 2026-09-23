import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

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
  readonly cartes: readonly (CarteDuTri & { readonly malPlacee: boolean })[];
}

@Component({
  selector: 'app-slide-sort-review',
  standalone: true,
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

  protected readonly zones = computed<readonly ZoneDuTri[]>(() => {
    const malPlacees = new Set(this.misplaced());
    return this.categories().map((categorie) => ({
      ...categorie,
      cartes: this.cards()
        .filter((carte) => carte.category === categorie.id)
        .map((carte) => ({ ...carte, malPlacee: malPlacees.has(carte.id) })),
    }));
  });
}
