import { DecimalPipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from "@angular/core";
import type {
  BudgetMember,
  BudgetMemberContribution,
} from "../../../../core/models/budget.model";

/** Vue enrichie d'une ligne contribution pour le template. */
interface ContributionRow {
  userId: string;
  displayName: string;
  salary: number | null;
  placeholderSalary: number | null;
  share: number | null;
  isCurrentUser: boolean;
}

/**
 * Panneau de saisie et visualisation des contributions salariales mensuelles.
 * Chaque membre voit son salaire et sa part ; seul l'utilisateur courant peut modifier le sien.
 */
@Component({
  selector: "app-budget-contributions-panel",
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <section
      class="rounded-[1.75rem] border border-black/10 bg-white/95 p-6 shadow-[0_18px_40px_rgba(25,33,52,0.08)]"
    >
      <div>
        <p
          class="text-sm font-semibold uppercase tracking-[0.22em] text-budget-accent"
          i18n="@@budgetContributionsPanelEyebrow"
        >
          Contributions
        </p>
        <h2
          class="mt-3 text-2xl font-black text-slate-950"
          i18n="@@budgetContributionsPanelTitle"
        >
          Salaires du mois
        </h2>
      </div>

      <div class="mt-6 divide-y divide-slate-100">
        @for (row of rows(); track row.userId) {
          <div class="flex items-center gap-4 py-3">
            <span class="w-32 font-semibold text-slate-900 truncate">
              {{ row.displayName }}
            </span>

            @if (row.isCurrentUser) {
              <input
                type="number"
                min="0"
                step="1"
                class="w-36 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm focus:border-budget-accent focus:outline-none"
                [value]="row.salary ?? row.placeholderSalary ?? ''"
                [placeholder]="
                  row.placeholderSalary !== null
                    ? row.placeholderSalary.toString()
                    : '0'
                "
                (change)="onSalaryChange($any($event).target.value)"
              />
            } @else {
              @if (row.salary !== null) {
                <span class="w-36 text-sm font-medium text-slate-700">
                  {{ row.salary | number: "1.0-0" }} €
                </span>
              } @else if (row.placeholderSalary !== null) {
                <span class="w-36 text-sm italic text-slate-400">
                  {{ row.placeholderSalary | number: "1.0-0" }} € (mois préc.)
                </span>
              } @else {
                <span class="w-36 text-sm text-slate-400">—</span>
              }
            }

            @if (totalSalary() > 0 && row.share !== null) {
              <span
                class="ml-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600"
              >
                {{ row.share }}%
              </span>
            }
          </div>
        }
      </div>

      @if (totalSalary() === 0) {
        <p
          class="mt-4 text-sm text-slate-500"
          i18n="@@budgetContributionsPanelZeroTotal"
        >
          Renseigne ton salaire pour voir ta contribution.
        </p>
      } @else {
        <div
          class="mt-4 flex items-center justify-between rounded-xl bg-[#f7f2e8] px-4 py-3"
        >
          <span
            class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"
            i18n="@@budgetContributionsPanelTotal"
          >
            Total
          </span>
          <span class="text-lg font-black text-slate-950">
            {{ totalSalary() | number: "1.0-0" }} €
          </span>
        </div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetContributionsPanelComponent {
  /** Liste des membres du groupe. */
  readonly members = input.required<BudgetMember[]>();

  /** Contributions du mois courant (peut etre vide). */
  readonly contributions = input.required<BudgetMemberContribution[]>();

  /** Identifiant de l'utilisateur courant. */
  readonly currentUserId = input.required<string>();

  /** Contributions du mois precedent pour pre-remplissage des placeholders. */
  readonly previousMonthContributions = input<BudgetMemberContribution[]>([]);

  /** Emis quand l'utilisateur courant modifie son salaire. */
  readonly mySalaryChange = output<number>();

  /** Total des salaires renseignes ce mois. */
  readonly totalSalary = computed<number>(() =>
    this.contributions().reduce((sum, c) => sum + c.monthlySalary, 0),
  );

  /** Lignes enrichies pour l'affichage. */
  readonly rows = computed<ContributionRow[]>(() => {
    const total = this.totalSalary();
    return this.members().map((m) => {
      const contrib = this.contributions().find((c) => c.userId === m.userId);
      const prevContrib = this.previousMonthContributions().find(
        (c) => c.userId === m.userId,
      );
      const salary = contrib?.monthlySalary ?? null;
      const placeholderSalary = prevContrib?.monthlySalary ?? null;
      const share =
        total > 0 && salary !== null
          ? Number(((salary / total) * 100).toFixed(1))
          : null;
      return {
        userId: m.userId,
        displayName: m.displayName,
        salary,
        placeholderSalary,
        share,
        isCurrentUser: m.userId === this.currentUserId(),
      };
    });
  });

  /** Gere le changement de salaire de l'utilisateur courant. */
  onSalaryChange(value: string): void {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed) && parsed >= 0) {
      this.mySalaryChange.emit(parsed);
    }
  }
}
