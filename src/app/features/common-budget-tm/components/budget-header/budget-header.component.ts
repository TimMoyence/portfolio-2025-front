import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";
import { BudgetShareComponent } from "../budget-share/budget-share.component";
import type { BudgetMonth } from "../../../../core/services/budget-state.service";

/**
 * Composant d'en-tete du budget.
 * Affiche le titre, la selection de mois, l'upload CSV,
 * le reset et la section de partage.
 */
@Component({
  selector: "app-budget-header",
  standalone: true,
  imports: [BudgetShareComponent],
  template: `
    <div
      class="overflow-hidden rounded-[2rem] border border-black/10 bg-[linear-gradient(135deg,rgba(255,250,240,0.95),rgba(220,242,235,0.92))] px-6 py-8 shadow-[0_24px_60px_rgba(25,33,52,0.08)] md:px-10 md:py-12"
    >
      <div
        class="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"
      >
        <div class="max-w-3xl">
          <p
            class="text-sm font-semibold uppercase tracking-[0.28em] text-budget-accent"
          >
            Common account dashboard
          </p>
          <h1
            class="mt-4 max-w-[12ch] font-heading text-5xl font-black leading-[0.92] text-slate-950 md:text-7xl"
          >
            Common Budget T&amp;M
          </h1>
          <p
            class="mt-5 max-w-2xl text-base leading-7 text-slate-600 md:text-lg"
          >
            A lightweight budget cockpit for Tim and Maria: upload a CSV,
            auto-classify expenses, adjust categories manually, and keep
            contributions visible at a glance.
          </p>
        </div>

        <div
          class="grid gap-4 rounded-[1.75rem] border border-white/60 bg-white/70 p-4 backdrop-blur md:min-w-[24rem]"
        >
          <div class="flex flex-wrap gap-2">
            @for (month of months(); track month) {
              <button
                type="button"
                class="rounded-full px-4 py-2 text-sm font-semibold transition"
                [class.bg-budget-accent]="selectedMonth() === month"
                [class.text-white]="selectedMonth() === month"
                [class.bg-white]="selectedMonth() !== month"
                [class.text-slate-800]="selectedMonth() !== month"
                [class.border]="selectedMonth() !== month"
                [class.border-slate-200]="selectedMonth() !== month"
                (click)="monthSelected.emit(month)"
              >
                {{ month }}
              </button>
            }
          </div>

          <div>
            <p
              class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500"
            >
              Data source
            </p>
            <p class="mt-2 text-sm font-medium text-slate-800">
              {{ sourceLabel() }}
            </p>
          </div>

          <div class="flex flex-wrap gap-3">
            <label
              class="inline-flex cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5"
              for="budgetCsv"
            >
              Upload CSV
            </label>
            <input
              id="budgetCsv"
              class="hidden"
              type="file"
              accept=".csv"
              (change)="fileSelected.emit($event)"
            />

            <button
              type="button"
              class="rounded-full bg-budget-accent px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
              (click)="resetSample.emit()"
            >
              Reset sample
            </button>
          </div>

          @if (groupId()) {
            <app-budget-share
              [shareEmail]="shareEmail()"
              [shareMessage]="shareMessage()"
              (shareEmailChange)="shareEmailChange.emit($event)"
              (shareBudget)="shareBudget.emit()"
            />
          }
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetHeaderComponent {
  /** Mois disponibles. */
  readonly months = input.required<BudgetMonth[]>();

  /** Mois selectionne. */
  readonly selectedMonth = input.required<BudgetMonth>();

  /** Label de la source de donnees. */
  readonly sourceLabel = input.required<string>();

  /** Identifiant du groupe de budget (affiche le partage si present). */
  readonly groupId = input.required<string | null>();

  /** Email de partage courant. */
  readonly shareEmail = input.required<string>();

  /** Message de retour du partage. */
  readonly shareMessage = input.required<string>();

  /** Emission lors de la selection d'un mois. */
  readonly monthSelected = output<BudgetMonth>();

  /** Emission lors de la selection d'un fichier CSV. */
  readonly fileSelected = output<Event>();

  /** Emission lors du reset a l'exemple. */
  readonly resetSample = output<void>();

  /** Emission lors du changement de l'email de partage. */
  readonly shareEmailChange = output<string>();

  /** Emission lors de la demande de partage. */
  readonly shareBudget = output<void>();
}
