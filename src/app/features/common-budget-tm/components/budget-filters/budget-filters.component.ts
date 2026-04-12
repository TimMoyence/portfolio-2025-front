import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";

/**
 * Composant de filtres pour le tableau de transactions budget.
 * Permet de filtrer par recherche, categorie, etat et type de budget.
 */
@Component({
  selector: "app-budget-filters",
  standalone: true,
  template: `
    <section
      class="rounded-[1.75rem] border border-black/10 bg-white/95 p-6 shadow-[0_18px_40px_rgba(25,33,52,0.08)]"
    >
      <p
        class="text-sm font-semibold uppercase tracking-[0.22em] text-budget-accent"
      >
        Filters
      </p>
      <h2 class="mt-3 text-2xl font-black text-slate-950">Focus the table</h2>
      <p class="mt-3 max-w-md text-sm leading-6 text-slate-500">
        Search by merchant, keep only one category, or isolate pending rows
        before you correct the classifications.
      </p>

      <div class="mt-6 grid gap-4">
        <label class="grid gap-2 text-sm text-slate-600">
          Search description
          <input
            class="rounded-2xl border border-[#d7cfbf] bg-[#fffdf8] px-4 py-3 text-slate-900"
            type="search"
            placeholder="Amazon, EDF, Carrefour..."
            [value]="searchTerm()"
            (input)="searchChange.emit(readTextInput($event))"
          />
        </label>

        <label class="grid gap-2 text-sm text-slate-600">
          Category
          <select
            class="rounded-2xl border border-[#d7cfbf] bg-[#fffdf8] px-4 py-3 text-slate-900"
            [value]="categoryFilter()"
            (change)="categoryFilterChange.emit(readSelectValue($event))"
          >
            <option value="ALL">All categories</option>
            @for (category of categories(); track category) {
              <option [value]="category">{{ category }}</option>
            }
          </select>
        </label>

        <label class="grid gap-2 text-sm text-slate-600">
          State
          <select
            class="rounded-2xl border border-[#d7cfbf] bg-[#fffdf8] px-4 py-3 text-slate-900"
            [value]="stateFilter()"
            (change)="stateFilterChange.emit(readSelectValue($event))"
          >
            <option value="ALL">All states</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
          </select>
        </label>

        <label class="grid gap-2 text-sm text-slate-600">
          Fixed or variable
          <select
            class="rounded-2xl border border-[#d7cfbf] bg-[#fffdf8] px-4 py-3 text-slate-900"
            [value]="budgetTypeFilter()"
            (change)="budgetTypeFilterChange.emit(readSelectValue($event))"
          >
            <option value="ALL">All</option>
            <option value="FIXED">Fixed</option>
            <option value="VARIABLE">Variable</option>
          </select>
        </label>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetFiltersComponent {
  /** Terme de recherche courant. */
  readonly searchTerm = input.required<string>();

  /** Filtre de categorie courant. */
  readonly categoryFilter = input.required<string>();

  /** Filtre d'etat courant. */
  readonly stateFilter = input.required<string>();

  /** Filtre de type de budget courant. */
  readonly budgetTypeFilter = input.required<string>();

  /** Liste des categories disponibles. */
  readonly categories = input.required<string[]>();

  /** Emission lors du changement de recherche. */
  readonly searchChange = output<string>();

  /** Emission lors du changement de filtre categorie. */
  readonly categoryFilterChange = output<string>();

  /** Emission lors du changement de filtre etat. */
  readonly stateFilterChange = output<string>();

  /** Emission lors du changement de filtre type de budget. */
  readonly budgetTypeFilterChange = output<string>();

  /** Lit la valeur d'un champ texte depuis un evenement DOM. */
  readTextInput(event: Event): string {
    return (event.target as HTMLInputElement | null)?.value ?? "";
  }

  /** Lit la valeur d'un select depuis un evenement DOM. */
  readSelectValue(event: Event): string {
    return (event.target as HTMLSelectElement | null)?.value ?? "";
  }
}
