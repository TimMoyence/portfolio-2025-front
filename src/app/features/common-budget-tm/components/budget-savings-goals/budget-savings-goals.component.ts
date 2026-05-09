import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import type {
  BudgetCategoryModel,
  BudgetGoalKind,
  BudgetGoalWithProgress,
  CreateBudgetGoalPayload,
  UpdateBudgetGoalPayload,
} from "../../../../core/models/budget.model";

/**
 * Composant de gestion des objectifs d'epargne et plafonds du budget.
 * Affiche la progression de chaque goal avec une barre coloree et un formulaire d'ajout.
 * Distinct du composant budget-goals (qui gere les category-limits UI uniquement).
 */
@Component({
  selector: "app-budget-savings-goals",
  standalone: true,
  imports: [FormsModule],
  template: `
    <section
      class="rounded-[1.75rem] border border-black/10 bg-white/95 p-6 shadow-[0_18px_40px_rgba(25,33,52,0.08)]"
    >
      <div>
        <p
          class="text-sm font-semibold uppercase tracking-[0.22em] text-budget-accent"
          i18n="@@budgetSavingsGoalsEyebrow"
        >
          Objectifs
        </p>
        <h2
          class="mt-3 text-2xl font-black text-slate-950"
          i18n="@@budgetSavingsGoalsTitle"
        >
          Epargne & Plafonds
        </h2>
      </div>

      <div class="mt-6 space-y-4">
        @for (goal of goals(); track goal.id) {
          <div class="rounded-2xl bg-[#f7f2e8] p-4">
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-slate-900 truncate">
                  {{ goal.name }}
                </p>
                <p class="text-xs text-slate-500 mt-0.5">
                  {{ goal.currentAmount | number: "1.0-0" }} € /
                  {{ goal.targetAmount | number: "1.0-0" }} €
                </p>
              </div>
              <div class="flex items-center gap-2">
                <span
                  class="text-sm font-bold"
                  [class.text-emerald-600]="goal.progressPercent < 80"
                  [class.text-amber-600]="
                    goal.progressPercent >= 80 && goal.progressPercent <= 100
                  "
                  [class.text-red-600]="goal.progressPercent > 100"
                >
                  {{ goal.progressPercent | number: "1.0-0" }}%
                </span>
                <button
                  class="rounded-lg px-2 py-1 text-xs text-red-500 border border-red-200 hover:bg-red-50 transition-colors"
                  (click)="onDeleteClick(goal.id)"
                  i18n="@@budgetSavingsGoalsDeleteBtn"
                >
                  Supprimer
                </button>
              </div>
            </div>
            <div class="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                class="h-full rounded-full transition-all"
                [style.width.%]="Math.min(goal.progressPercent, 100)"
                [class.bg-emerald-500]="goal.progressPercent < 80"
                [class.bg-amber-500]="
                  goal.progressPercent >= 80 && goal.progressPercent <= 100
                "
                [class.bg-red-500]="goal.progressPercent > 100"
              ></div>
            </div>
          </div>
        } @empty {
          <p
            class="py-6 text-sm text-slate-500"
            i18n="@@budgetSavingsGoalsEmpty"
          >
            Aucun objectif defini pour ce groupe.
          </p>
        }
      </div>

      <!-- Formulaire d'ajout -->
      <form
        class="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
        (ngSubmit)="onSubmit()"
      >
        <p
          class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"
          i18n="@@budgetSavingsGoalsFormTitle"
        >
          Nouvel objectif
        </p>

        <input
          type="text"
          class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-budget-accent focus:outline-none"
          [(ngModel)]="formName"
          name="formName"
          required
          i18n-placeholder="@@budgetSavingsGoalsFormNamePlaceholder"
          placeholder="Nom de l'objectif"
        />

        <select
          class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-budget-accent focus:outline-none"
          [(ngModel)]="formKind"
          name="formKind"
        >
          <option value="SAVINGS" i18n="@@budgetSavingsGoalsKindSavings">
            Epargne
          </option>
          <option
            value="SPENDING_LIMIT"
            i18n="@@budgetSavingsGoalsKindSpendingLimit"
          >
            Plafond de depenses
          </option>
          <option
            value="CATEGORY_LIMIT"
            i18n="@@budgetSavingsGoalsKindCategoryLimit"
          >
            Plafond par categorie
          </option>
        </select>

        <input
          type="number"
          min="0"
          step="1"
          class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-budget-accent focus:outline-none"
          [(ngModel)]="formTargetAmount"
          name="formTargetAmount"
          required
          i18n-placeholder="@@budgetSavingsGoalsFormAmountPlaceholder"
          placeholder="Montant cible (€)"
        />

        @if (formKind === "CATEGORY_LIMIT") {
          <select
            class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-budget-accent focus:outline-none"
            [(ngModel)]="formCategoryId"
            name="formCategoryId"
          >
            <option value="" i18n="@@budgetSavingsGoalsFormCategoryPlaceholder">
              -- Choisir une categorie --
            </option>
            @for (cat of categories(); track cat.id) {
              <option [value]="cat.id">{{ cat.name }}</option>
            }
          </select>
        }

        <input
          type="date"
          class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-budget-accent focus:outline-none"
          [(ngModel)]="formDeadline"
          name="formDeadline"
          i18n-placeholder="@@budgetSavingsGoalsFormDeadlinePlaceholder"
          placeholder="Echeance (optionnel)"
        />

        <button
          type="submit"
          class="w-full rounded-xl bg-budget-accent px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90 transition-opacity"
          i18n="@@budgetSavingsGoalsFormSubmitBtn"
        >
          Ajouter l'objectif
        </button>
      </form>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetSavingsGoalsComponent {
  /** Expose Math pour le template. */
  readonly Math = Math;

  /** Liste des goals avec progression. */
  readonly goals = input.required<BudgetGoalWithProgress[]>();

  /** Categories disponibles pour le select CATEGORY_LIMIT. */
  readonly categories = input.required<BudgetCategoryModel[]>();

  /** Emis quand un nouvel objectif est soumis (sans groupId, ajoute par le container). */
  readonly createGoal = output<Omit<CreateBudgetGoalPayload, "groupId">>();

  /** Emis quand un objectif est modifie. */
  readonly updateGoal = output<{
    id: string;
    payload: UpdateBudgetGoalPayload;
  }>();

  /** Emis quand un objectif est supprime. */
  readonly deleteGoal = output<string>();

  /** Etat du formulaire d'ajout. */
  readonly formName = signal("");
  readonly formKind = signal<BudgetGoalKind>("SAVINGS");
  readonly formTargetAmount = signal<number | null>(null);
  readonly formCategoryId = signal<string>("");
  readonly formDeadline = signal<string>("");

  /** Soumet le formulaire d'ajout. */
  onSubmit(): void {
    const name = this.formName().trim();
    const kind = this.formKind();
    const targetAmount = this.formTargetAmount();

    if (!name || targetAmount === null || targetAmount <= 0) {
      return;
    }

    const payload: Omit<CreateBudgetGoalPayload, "groupId"> = {
      name,
      kind,
      targetAmount,
      categoryId:
        kind === "CATEGORY_LIMIT" && this.formCategoryId()
          ? this.formCategoryId()
          : null,
      deadline: this.formDeadline() || null,
    };

    this.createGoal.emit(payload);
    this.resetForm();
  }

  /** Ouvre une confirmation puis emet deleteGoal. */
  onDeleteClick(goalId: string): void {
    const confirmed = window.confirm("Supprimer cet objectif ?");
    if (confirmed) {
      this.deleteGoal.emit(goalId);
    }
  }

  /** Reinitialise le formulaire apres soumission. */
  private resetForm(): void {
    this.formName.set("");
    this.formKind.set("SAVINGS");
    this.formTargetAmount.set(null);
    this.formCategoryId.set("");
    this.formDeadline.set("");
  }
}
