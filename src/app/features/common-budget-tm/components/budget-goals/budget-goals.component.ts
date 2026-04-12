import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { firstValueFrom } from "rxjs";
import type { BudgetCategoryModel } from "../../../../core/models/budget.model";
import { BUDGET_PORT } from "../../../../core/ports/budget.port";
import { BudgetFormatService } from "../../../../core/services/budget-format.service";
import type { BudgetCategoryTotal } from "../budget-category-totals/budget-category-totals.component";

/** Vue enrichie d'une categorie avec sa progression vers l'objectif. */
export interface CategoryGoalView {
  id: string;
  name: string;
  progress: number;
  spent: string;
  limit: string;
  budgetLimit: number;
}

/**
 * Composant de visualisation et edition des objectifs par categorie.
 * Affiche une jauge de progression pour chaque categorie avec un budgetLimit > 0.
 */
@Component({
  selector: "app-budget-goals",
  standalone: true,
  imports: [FormsModule],
  template: `
    <section
      class="rounded-[1.75rem] border border-black/10 bg-white/95 p-6 shadow-[0_18px_40px_rgba(25,33,52,0.08)]"
    >
      <div>
        <p
          class="text-sm font-semibold uppercase tracking-[0.22em] text-budget-accent"
          i18n="@@budgetGoalsEyebrow"
        >
          Objectifs
        </p>
        <h2
          class="mt-3 text-2xl font-black text-slate-950"
          i18n="@@budgetGoalsTitle"
        >
          Suivi par catégorie
        </h2>
      </div>

      @if (errorMessage()) {
        <p class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {{ errorMessage() }}
        </p>
      }

      <div class="mt-6">
        @for (cat of categoriesWithGoals(); track cat.id) {
          <div class="flex items-center gap-4 py-3">
            <span class="w-40 font-medium text-slate-700">{{ cat.name }}</span>
            <div class="h-4 flex-1 overflow-hidden rounded-full bg-slate-200">
              <div
                class="h-full rounded-full transition-all"
                [style.width.%]="Math.min(cat.progress, 100)"
                [class.bg-emerald-500]="cat.progress <= 80"
                [class.bg-amber-500]="cat.progress > 80 && cat.progress <= 100"
                [class.bg-red-500]="cat.progress > 100"
              ></div>
            </div>
            <span class="w-24 text-right text-sm text-slate-600">
              {{ cat.spent }} / {{ cat.limit }}
            </span>
            @if (editingCategoryId() === cat.id) {
              <input
                type="number"
                class="w-24 rounded border border-slate-300 px-2 py-1 text-sm"
                [ngModel]="cat.budgetLimit"
                (keydown.enter)="confirmEdit($any($event).target.value, cat.id)"
                (keydown.escape)="cancelEdit()"
              />
              <button
                class="text-xs font-medium text-emerald-600 hover:text-emerald-800"
                (click)="confirmEdit(editInput()!.toString(), cat.id)"
              >
                OK
              </button>
            } @else {
              <button
                class="text-slate-400 transition-colors hover:text-slate-700"
                title="Modifier l'objectif"
                (click)="startEdit(cat.id, cat.budgetLimit)"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
                  />
                </svg>
              </button>
            }
          </div>
        } @empty {
          <p class="py-6 text-sm text-slate-500" i18n="@@budgetGoalsEmpty">
            Aucune catégorie avec un objectif défini.
          </p>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetGoalsComponent {
  private readonly budgetPort = inject(BUDGET_PORT);
  private readonly fmt = inject(BudgetFormatService);

  readonly categories = input<BudgetCategoryModel[]>([]);
  readonly categoryTotals = input<BudgetCategoryTotal[]>([]);
  readonly groupId = input.required<string>();

  /** Expose Math.min pour le template. */
  readonly Math = Math;

  readonly errorMessage = signal("");

  /** ID de la categorie en cours d'edition, null si aucune. */
  readonly editingCategoryId = signal<string | null>(null);

  /** Valeur temporaire du champ d'edition. */
  readonly editInput = signal<number | null>(null);

  /** Categories avec un objectif (budgetLimit > 0) enrichies de la progression. */
  readonly categoriesWithGoals = computed<CategoryGoalView[]>(() => {
    const cats = this.categories();
    const totals = this.categoryTotals();

    return cats
      .filter((c) => c.budgetLimit > 0)
      .map((cat) => {
        const total = totals.find((t) => t.name === cat.name);
        const spentRaw = total
          ? Number.parseFloat(
              total.fact.replace(/[^0-9.,-]/g, "").replace(",", "."),
            )
          : 0;
        const spent = Number.isFinite(spentRaw) ? spentRaw : 0;
        const progress =
          cat.budgetLimit > 0 ? Math.round((spent / cat.budgetLimit) * 100) : 0;

        return {
          id: cat.id,
          name: cat.name,
          progress,
          spent: this.fmt.formatCurrency(spent),
          limit: this.fmt.formatCurrency(cat.budgetLimit),
          budgetLimit: cat.budgetLimit,
        };
      });
  });

  /** Demarre l'edition inline de la limite budgetaire d'une categorie. */
  startEdit(categoryId: string, currentLimit: number): void {
    this.editingCategoryId.set(categoryId);
    this.editInput.set(currentLimit);
  }

  /** Annule l'edition en cours. */
  cancelEdit(): void {
    this.editingCategoryId.set(null);
    this.editInput.set(null);
  }

  /** Confirme l'edition et met a jour la limite via l'API. */
  async confirmEdit(rawValue: string, categoryId: string): Promise<void> {
    const newLimit = Number.parseFloat(rawValue);
    if (!Number.isFinite(newLimit) || newLimit < 0) {
      this.cancelEdit();
      return;
    }
    await this.updateBudgetLimit(categoryId, newLimit);
    this.cancelEdit();
  }

  /** Met a jour la limite budgetaire d'une categorie via l'API. */
  async updateBudgetLimit(categoryId: string, newLimit: number): Promise<void> {
    this.errorMessage.set("");
    try {
      await firstValueFrom(
        this.budgetPort.updateCategory(categoryId, { budgetLimit: newLimit }),
      );
    } catch {
      this.errorMessage.set("Erreur lors de la mise à jour de l'objectif.");
    }
  }
}
