import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";

/**
 * Composant de calcul du ratio de contribution salariale.
 * Affiche les champs de saisie des salaires et le total combine.
 */
@Component({
  selector: "app-budget-salary",
  standalone: true,
  imports: [CommonModule],
  template: `
    <section
      class="mt-8 rounded-[1.75rem] border border-black/10 bg-white/95 p-6 shadow-[0_18px_40px_rgba(25,33,52,0.08)]"
    >
      <div
        class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
      >
        <div>
          <p
            class="text-sm font-semibold uppercase tracking-[0.22em] text-[#0f7b65]"
          >
            Budget calculation
          </p>
          <h2 class="mt-3 text-2xl font-black text-slate-950">
            Salary contribution ratio
          </h2>
        </div>
        <p class="max-w-xl text-sm leading-6 text-slate-500">
          Enter Tim and Maria salaries to calculate what percentage each salary
          represents from the combined total.
        </p>
      </div>

      <div class="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr_0.9fr]">
        <label class="grid gap-2 text-sm text-slate-600">
          Tim salary
          <input
            class="rounded-2xl border border-[#d7cfbf] bg-[#fffdf8] px-4 py-3 text-slate-900"
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            [value]="timSalary()"
            (input)="timSalaryChange.emit(readTextInput($event))"
          />
          <span class="text-xs text-slate-500"
            >Share: {{ timSalaryShare() }}</span
          >
        </label>

        <label class="grid gap-2 text-sm text-slate-600">
          Maria salary
          <input
            class="rounded-2xl border border-[#d7cfbf] bg-[#fffdf8] px-4 py-3 text-slate-900"
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            [value]="mariaSalary()"
            (input)="mariaSalaryChange.emit(readTextInput($event))"
          />
          <span class="text-xs text-slate-500"
            >Share: {{ mariaSalaryShare() }}</span
          >
        </label>

        <div class="rounded-[1.5rem] border border-[#ddd5c7] bg-[#fffaf2] p-5">
          <p
            class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
          >
            Combined salaries
          </p>
          <p class="mt-3 text-3xl font-black text-slate-950">
            {{ totalSalary() | number: "1.0-2" }} &euro;
          </p>
          <p class="mt-3 text-sm leading-6 text-slate-500">
            This gives you a quick rule for how to split contributions to the
            common account.
          </p>
        </div>
      </div>

      <div class="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="button"
          class="rounded-full bg-[#0f7b65] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
          (click)="validate.emit()"
        >
          Validate
        </button>

        @if (budgetValidationMessage()) {
          <p class="text-sm text-slate-600">{{ budgetValidationMessage() }}</p>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetSalaryComponent {
  /** Salaire de Tim (texte). */
  readonly timSalary = input.required<string>();

  /** Salaire de Maria (texte). */
  readonly mariaSalary = input.required<string>();

  /** Part de Tim en pourcentage. */
  readonly timSalaryShare = input.required<string>();

  /** Part de Maria en pourcentage. */
  readonly mariaSalaryShare = input.required<string>();

  /** Total combine des salaires. */
  readonly totalSalary = input.required<number>();

  /** Message de validation du budget. */
  readonly budgetValidationMessage = input.required<string>();

  /** Emission lors du changement du salaire de Tim. */
  readonly timSalaryChange = output<string>();

  /** Emission lors du changement du salaire de Maria. */
  readonly mariaSalaryChange = output<string>();

  /** Emission lors du clic sur Validate. */
  readonly validate = output<void>();

  /** Lit la valeur d'un champ texte depuis un evenement DOM. */
  readTextInput(event: Event): string {
    return (event.target as HTMLInputElement | null)?.value ?? "";
  }
}
