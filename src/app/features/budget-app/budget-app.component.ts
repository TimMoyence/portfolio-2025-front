import { CommonModule, isPlatformBrowser } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from "@angular/core";
import { firstValueFrom } from "rxjs";
import type {
  BudgetCategoryModel,
  BudgetEntryModel,
  BudgetGoalWithProgress,
  BudgetGroup,
  BudgetMember,
  BudgetMemberContribution,
  CreateBudgetGoalPayload,
  UpdateBudgetGoalPayload,
} from "../../core/models/budget.model";
import { BUDGET_PORT } from "../../core/ports/budget.port";
import { AuthStateService } from "../../core/services/auth-state.service";
import { BudgetFormatService } from "../../core/services/budget-format.service";
import { BudgetCategoryTotalsComponent } from "./components/budget-category-totals/budget-category-totals.component";
import { BudgetChartComponent } from "./components/budget-chart/budget-chart.component";
import { BudgetContributionsPanelComponent } from "./components/budget-contributions-panel/budget-contributions-panel.component";
import { BudgetExportComponent } from "./components/budget-export/budget-export.component";
import { BudgetGoalsComponent } from "./components/budget-goals/budget-goals.component";
import { BudgetMembersPanelComponent } from "./components/budget-members-panel/budget-members-panel.component";
import { BudgetRecurringComponent } from "./components/budget-recurring/budget-recurring.component";
import { BudgetSavingsGoalsComponent } from "./components/budget-savings-goals/budget-savings-goals.component";
import { BudgetSummaryCardComponent } from "./components/budget-summary-card/budget-summary-card.component";
import {
  BudgetTransactionsTableComponent,
  BudgetTransactionView,
} from "./components/budget-transactions-table/budget-transactions-table.component";
import { COMMON_BUDGET_SAMPLE_CSV } from "./common-budget-sample";
import {
  getBudgetType,
  getCategoryFact,
  getCategoryFacts,
  getPlanValue,
} from "./utils/budget-category.utils";
import {
  parseCsv,
  toTransactions,
  type BudgetTransaction,
} from "./utils/budget-csv-parser.utils";
import { normalizeText } from "./utils/text.utils";

type BudgetMonth = "March" | "April" | "May" | "June";

const MONTHS: BudgetMonth[] = ["March", "April", "May", "June"];

const MONTH_NUMBER_MAP: Record<BudgetMonth, number> = {
  March: 3,
  April: 4,
  May: 5,
  June: 6,
};

@Component({
  selector: "app-budget-app",
  standalone: true,
  imports: [
    CommonModule,
    BudgetSummaryCardComponent,
    BudgetCategoryTotalsComponent,
    BudgetChartComponent,
    BudgetExportComponent,
    BudgetGoalsComponent,
    BudgetMembersPanelComponent,
    BudgetContributionsPanelComponent,
    BudgetSavingsGoalsComponent,
    BudgetRecurringComponent,
    BudgetTransactionsTableComponent,
  ],
  templateUrl: "./budget-app.component.html",
  styleUrl: "./budget-app.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetAppComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly browser = isPlatformBrowser(this.platformId);
  private readonly budgetPort = inject(BUDGET_PORT);
  private readonly fmt = inject(BudgetFormatService);
  private readonly authState = inject(AuthStateService);

  readonly groupId = signal<string | null>(null);
  readonly apiCategories = signal<BudgetCategoryModel[]>([]);
  readonly loading = signal(false);
  readonly shareEmail = signal("");
  readonly shareMessage = signal("");
  readonly uploadStatus = signal("");

  readonly categories = computed(() => this.apiCategories().map((c) => c.name));
  readonly months = MONTHS;
  readonly selectedMonth = signal<BudgetMonth>("March");
  readonly searchTerm = signal("");
  readonly categoryFilter = signal<string>("ALL");
  readonly stateFilter = signal<"ALL" | "COMPLETED" | "PENDING">("ALL");
  readonly budgetTypeFilter = signal<"ALL" | "FIXED" | "VARIABLE">("ALL");
  readonly sourceLabel = signal("Embedded March 1-15 sample");
  readonly timSalary = signal("");
  readonly mariaSalary = signal("");
  readonly budgetValidationMessage = signal("");
  readonly currentYear = signal(new Date().getFullYear());
  readonly members = signal<BudgetMember[]>([]);
  readonly contributions = signal<BudgetMemberContribution[]>([]);
  readonly previousMonthContributions = signal<BudgetMemberContribution[]>([]);
  readonly savingsGoals = signal<BudgetGoalWithProgress[]>([]);
  readonly currentUserId = computed<string>(
    () => this.authState.user()?.id ?? "",
  );

  private readonly baseTransactions = signal<BudgetTransaction[]>([]);
  private readonly overrides = signal<Record<string, string>>({});
  private readonly salaryByMonth = signal<
    Record<BudgetMonth, { tim: string; maria: string }>
  >({
    March: { tim: "", maria: "" },
    April: { tim: "", maria: "" },
    May: { tim: "", maria: "" },
    June: { tim: "", maria: "" },
  });

  constructor() {
    this.initBudget();
  }

  readonly transactions = computed(() =>
    this.baseTransactions().map((transaction) => ({
      ...transaction,
      category: this.overrides()[transaction.id] ?? transaction.category,
    })),
  );

  readonly filteredTransactions = computed(() => {
    const search = normalizeText(this.searchTerm());
    const category = this.categoryFilter();
    const state = this.stateFilter();
    const budgetTypeValue = this.budgetTypeFilter();
    const cats = this.apiCategories();

    return this.transactions().filter((transaction) => {
      const matchesSearch =
        !search || normalizeText(transaction.description).includes(search);
      const matchesCategory =
        category === "ALL" || transaction.category === category;
      const matchesState = state === "ALL" || transaction.state === state;
      const matchesBudgetType =
        budgetTypeValue === "ALL" ||
        (budgetTypeValue === "FIXED" &&
          getBudgetType(transaction.category, cats) === "FIXED") ||
        (budgetTypeValue === "VARIABLE" &&
          getBudgetType(transaction.category, cats) === "VARIABLE");
      return (
        matchesSearch && matchesCategory && matchesState && matchesBudgetType
      );
    });
  });

  readonly transactionViews = computed<BudgetTransactionView[]>(() =>
    this.filteredTransactions().map((transaction) => ({
      id: transaction.id,
      dateLabel: this.fmt.formatDate(
        transaction.completedDate || transaction.startedDate,
      ),
      description: transaction.description,
      type: transaction.type,
      state: transaction.state,
      amountLabel: this.fmt.formatSignedCurrency(transaction.amount),
      isExpense: transaction.amount < 0,
      category: transaction.category,
    })),
  );

  readonly totalExpenses = computed(() =>
    this.fmt.formatCurrency(
      Math.abs(
        this.transactions()
          .filter((transaction) => transaction.amount < 0)
          .reduce((sum, transaction) => sum + transaction.amount, 0),
      ),
    ),
  );

  readonly totalIncoming = computed(() =>
    this.fmt.formatCurrency(
      this.transactions()
        .filter((transaction) => transaction.amount > 0)
        .reduce((sum, transaction) => sum + transaction.amount, 0),
    ),
  );

  readonly timContribution = computed(() =>
    this.fmt.formatCurrency(this.getContributionTotalFor("tim moyence")),
  );

  readonly mariaContribution = computed(() =>
    this.fmt.formatCurrency(this.getContributionTotalFor("maria naumenko")),
  );

  readonly timContributionLines = computed(() => [
    {
      label: $localize`:@@budgetSummaryTimAdded:Tim a ajouté`,
      value: this.timContribution(),
    },
    {
      label: $localize`:@@budgetSummaryTimLeftToAdd:Tim reste à ajouter`,
      value: "",
    },
  ]);

  readonly mariaContributionLines = computed(() => [
    {
      label: $localize`:@@budgetSummaryMariaAdded:Maria a ajouté`,
      value: this.mariaContribution(),
    },
    {
      label: $localize`:@@budgetSummaryMariaLeftToAdd:Maria reste à ajouter`,
      value: "",
    },
  ]);

  readonly pocketsTotal = computed(() =>
    this.fmt.formatCurrency(
      Math.abs(
        this.transactions()
          .filter(
            (transaction) =>
              transaction.category === "Pockets" && transaction.amount < 0,
          )
          .reduce((sum, transaction) => sum + transaction.amount, 0),
      ),
    ),
  );

  readonly categoryTotals = computed(() => {
    const txs = this.transactions();
    const cats = this.apiCategories();

    return getCategoryFacts(txs, cats)
      .sort((left, right) => {
        const leftType = getBudgetType(left, cats);
        const rightType = getBudgetType(right, cats);

        if (leftType !== rightType) {
          return leftType === "FIXED" ? -1 : 1;
        }

        return getCategoryFact(right, txs) - getCategoryFact(left, txs);
      })
      .map((name) => {
        const total = getCategoryFact(name, txs);
        const plan = getPlanValue(name, cats);
        const leftValue = plan - total;
        return {
          name,
          plan: plan > 0 ? this.fmt.formatCurrency(plan) : "-",
          fact: this.fmt.formatCurrency(total),
          left: plan > 0 ? this.fmt.formatCurrency(leftValue) : "-",
          isLeftNegative: plan > 0 && leftValue < 0,
          budgetType: getBudgetType(name, cats),
        };
      });
  });

  readonly fixedCategoryTotals = computed(() =>
    this.categoryTotals().filter((item) => item.budgetType === "FIXED"),
  );

  readonly variableCategoryTotals = computed(() =>
    this.categoryTotals().filter((item) => item.budgetType === "VARIABLE"),
  );

  readonly monthNumber = computed(() => MONTH_NUMBER_MAP[this.selectedMonth()]);

  readonly totalSalary = computed(
    () =>
      this.fmt.parseAmount(this.timSalary()) +
      this.fmt.parseAmount(this.mariaSalary()),
  );

  readonly timSalaryShare = computed(() =>
    this.fmt.formatPercentage(
      this.fmt.parseAmount(this.timSalary()),
      this.totalSalary(),
    ),
  );

  readonly mariaSalaryShare = computed(() =>
    this.fmt.formatPercentage(
      this.fmt.parseAmount(this.mariaSalary()),
      this.totalSalary(),
    ),
  );

  onCategoryChange(event: { id: string; category: string }): void {
    const nextCategory = event.category;
    this.overrides.update((current) => ({
      ...current,
      [event.id]: nextCategory,
    }));

    // Persister le changement de categorie en base
    const cat = this.apiCategories().find((c) => c.name === nextCategory);
    if (cat) {
      firstValueFrom(this.budgetPort.updateEntry(event.id, cat.id)).catch(
        () => {
          /* fallback silencieux — l'override local reste actif */
        },
      );
    }
  }

  /**
   * Supprime une entree budget apres confirmation utilisateur.
   * - SSR-safe : window.confirm n'est appele que cote navigateur.
   * - Optimistic UI : retire la transaction localement, puis tente
   *   la suppression API. En cas d'echec API, on recharge depuis
   *   le serveur pour rester coherent.
   */
  onDeleteEntry(entryId: string): void {
    if (!this.browser) {
      return;
    }

    const confirmed = window.confirm(
      $localize`:@@budgetTransactionsDeleteConfirm:Supprimer cette transaction ?`,
    );
    if (!confirmed) {
      return;
    }

    this.baseTransactions.update((current) =>
      current.filter((tx) => tx.id !== entryId),
    );

    firstValueFrom(this.budgetPort.deleteEntry(entryId)).catch(
      (error: unknown) => {
        // Rollback : on recharge l'etat serveur en cas d'echec API
        // pour eviter une UI desynchronisee.
        console.error("[budget] deleteEntry a echoue, rollback", error);
        void this.loadEntries();
      },
    );
  }

  onShareEmailChange(value: string): void {
    this.shareEmail.set(value);
  }

  async shareBudgetWith(): Promise<void> {
    const gid = this.groupId();
    const email = this.shareEmail().trim();
    if (!gid || !email) {
      this.shareMessage.set("Veuillez entrer un email valide.");
      return;
    }

    try {
      await firstValueFrom(
        this.budgetPort.shareBudget({ groupId: gid, targetEmail: email }),
      );
      this.shareMessage.set(`Budget partage avec ${email} !`);
      this.shareEmail.set("");
    } catch (error: unknown) {
      const msg = (error as { error?: { message?: string } })?.error?.message;
      if (msg && msg.includes("Aucun compte")) {
        this.shareMessage.set(
          `Aucun compte pour ${email}. Demandez-lui de s'inscrire d'abord sur le site.`,
        );
      } else {
        this.shareMessage.set(
          "Erreur lors du partage. Verifiez l'email et reessayez.",
        );
      }
    }
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
  }

  onCategoryFilterChange(value: string): void {
    this.categoryFilter.set(value);
  }

  onCategorySpotlight(category: string): void {
    this.categoryFilter.set(category);
  }

  onStateFilterChange(value: string): void {
    this.stateFilter.set(value as "ALL" | "COMPLETED" | "PENDING");
  }

  onBudgetTypeFilterChange(value: string): void {
    this.budgetTypeFilter.set(value as "ALL" | "FIXED" | "VARIABLE");
  }

  onTimSalaryChange(value: string): void {
    this.timSalary.set(value);
  }

  onMariaSalaryChange(value: string): void {
    this.mariaSalary.set(value);
  }

  selectMonth(month: BudgetMonth): void {
    if (this.selectedMonth() === month) {
      return;
    }

    this.selectedMonth.set(month);

    const savedSalaries = this.salaryByMonth()[month] ?? {
      tim: "",
      maria: "",
    };
    this.timSalary.set(savedSalaries.tim);
    this.mariaSalary.set(savedSalaries.maria);
    this.budgetValidationMessage.set("");
    this.uploadStatus.set("");

    this.loadEntries();
    const gid = this.groupId();
    if (gid) {
      this.loadMembersAndContributions(
        gid,
        MONTH_NUMBER_MAP[month],
        this.currentYear(),
      );
    }
  }

  validateBudgetCalculation(): void {
    const nextState = {
      ...this.salaryByMonth(),
      [this.selectedMonth()]: {
        tim: this.timSalary(),
        maria: this.mariaSalary(),
      },
    };
    this.salaryByMonth.set(nextState);
    this.budgetValidationMessage.set(
      `Saved for ${this.selectedMonth()}: Tim ${this.timSalaryShare()} and Maria ${this.mariaSalaryShare()}.`,
    );
  }

  readTextInput(event: Event): string {
    return (event.target as HTMLInputElement | null)?.value ?? "";
  }

  readSelectValue(event: Event): string {
    return (event.target as HTMLSelectElement | null)?.value ?? "";
  }

  onFileSelected(event: Event): void {
    if (!this.browser) {
      return;
    }

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const csv = String(reader.result ?? "");
      const fallbackTransactions = toTransactions(parseCsv(csv));

      if (!fallbackTransactions.length) {
        this.uploadStatus.set(
          `No transactions were found in ${file.name}. Check the CSV separator and headers.`,
        );
        input.value = "";
        return;
      }

      const gid = this.groupId();

      if (gid) {
        try {
          const entries = await firstValueFrom(
            this.budgetPort.importEntries({ groupId: gid, csvContent: csv }),
          );
          this.baseTransactions.set(this.apiEntriesToTransactions(entries));
          this.sourceLabel.set(
            `${this.selectedMonth()} - ${file.name} (${entries.length} imported)`,
          );
          this.uploadStatus.set(
            `${entries.length} transactions loaded from ${file.name}.`,
          );
        } catch {
          // Fallback to local parsing
          this.baseTransactions.set(fallbackTransactions);
          this.sourceLabel.set(
            `${this.selectedMonth()} - ${file.name} (local parse)`,
          );
          this.uploadStatus.set(
            `${fallbackTransactions.length} transactions loaded locally from ${file.name}.`,
          );
        }
      } else {
        this.baseTransactions.set(fallbackTransactions);
        this.sourceLabel.set(`${this.selectedMonth()} - ${file.name}`);
        this.uploadStatus.set(
          `${fallbackTransactions.length} transactions loaded from ${file.name}.`,
        );
      }

      this.searchTerm.set("");
      this.categoryFilter.set("ALL");
      this.stateFilter.set("ALL");
      this.budgetTypeFilter.set("ALL");
      input.value = "";
    };
    reader.onerror = () => {
      this.uploadStatus.set(`Could not read ${file.name}.`);
      input.value = "";
    };
    reader.readAsText(file);
  }

  resetToSample(): void {
    this.loadEntries();
  }

  private async initBudget(): Promise<void> {
    if (!this.browser) {
      return;
    }
    this.loading.set(true);
    try {
      let groups: BudgetGroup[] = [];
      try {
        groups = await firstValueFrom(this.budgetPort.getGroups());
      } catch {
        // getGroups failed, will create below
      }

      const group =
        groups.length > 0
          ? groups[0]
          : await firstValueFrom(
              this.budgetPort.createGroup("Budget couple T&M"),
            );
      this.groupId.set(group.id);

      const cats = await firstValueFrom(
        this.budgetPort.getCategories(group.id),
      );
      this.apiCategories.set(cats);

      await this.loadEntries();
      this.loadMembersAndContributions(
        group.id,
        MONTH_NUMBER_MAP[this.selectedMonth()],
        this.currentYear(),
      );
    } catch {
      // Fallback to sample data if API is unreachable
      this.baseTransactions.set(
        toTransactions(parseCsv(COMMON_BUDGET_SAMPLE_CSV)),
      );
      this.sourceLabel.set("Fallback - Embedded sample");
      this.uploadStatus.set("");
    } finally {
      this.loading.set(false);
    }
  }

  private async loadEntries(): Promise<void> {
    const gid = this.groupId();
    if (!gid) {
      return;
    }

    const month = this.selectedMonth();
    const monthIndex = MONTH_NUMBER_MAP[month];
    const year = this.currentYear();

    try {
      const entries = await firstValueFrom(
        this.budgetPort.getEntries(gid, { month: monthIndex, year }),
      );

      if (entries.length > 0) {
        this.baseTransactions.set(this.apiEntriesToTransactions(entries));
        this.sourceLabel.set(`${month} - ${entries.length} entries from API`);
        this.uploadStatus.set("");
      } else {
        // No entries yet for this month — show empty or sample
        if (month === "March") {
          this.baseTransactions.set(
            toTransactions(parseCsv(COMMON_BUDGET_SAMPLE_CSV)),
          );
          this.sourceLabel.set("March - Embedded sample (no API data yet)");
        } else {
          this.baseTransactions.set([]);
          this.sourceLabel.set(`${month} - No data yet`);
        }
        this.uploadStatus.set("");
      }
    } catch {
      this.baseTransactions.set([]);
      this.sourceLabel.set(`${month} - Error loading entries`);
      this.uploadStatus.set("");
    }
  }

  /** Charge membres, contributions et objectifs depuis le backend pour le groupe courant. */
  private loadMembersAndContributions(
    groupId: string,
    monthNumber: number,
    year: number,
  ): void {
    this.budgetPort.getMembers(groupId).subscribe({
      next: (members) => this.members.set(members),
      error: () => this.members.set([]),
    });

    this.budgetPort.getContributions(groupId, monthNumber, year).subscribe({
      next: (contribs) => this.contributions.set(contribs),
      error: () => this.contributions.set([]),
    });

    const prevMonth = monthNumber === 1 ? 12 : monthNumber - 1;
    const prevYear = monthNumber === 1 ? year - 1 : year;
    this.budgetPort.getContributions(groupId, prevMonth, prevYear).subscribe({
      next: (contribs) => this.previousMonthContributions.set(contribs),
      error: () => this.previousMonthContributions.set([]),
    });

    this.budgetPort.getGoals(groupId, monthNumber, year).subscribe({
      next: (goals) => this.savingsGoals.set(goals),
      error: () => this.savingsGoals.set([]),
    });
  }

  /** Handler pour BudgetMembersPanel.removeMember. */
  onRemoveMember(userId: string): void {
    const gid = this.groupId();
    if (!gid) return;
    this.budgetPort.removeMember(gid, userId).subscribe({
      next: () => {
        this.members.update((m) => m.filter((mm) => mm.userId !== userId));
        this.contributions.update((c) =>
          c.filter((cc) => cc.userId !== userId),
        );
      },
      error: (err) => console.error("removeMember failed", err),
    });
  }

  /** Handler pour BudgetMembersPanel.inviteMember. */
  onInviteMember(email: string): void {
    const gid = this.groupId();
    if (!gid || !email) return;
    this.budgetPort
      .shareBudget({ groupId: gid, targetEmail: email })
      .subscribe({
        next: () => this.shareMessage.set(`Invitation envoyee a ${email}`),
        error: (err) =>
          this.shareMessage.set(`Echec invitation : ${(err as Error).message}`),
      });
  }

  /** Handler pour BudgetContributionsPanel.mySalaryChange. */
  onMySalaryChange(monthlySalary: number): void {
    const gid = this.groupId();
    if (!gid) return;
    this.budgetPort
      .upsertMyContribution({
        groupId: gid,
        month: this.monthNumber(),
        year: this.currentYear(),
        monthlySalary,
      })
      .subscribe({
        next: (contrib) => {
          this.contributions.update((list) => {
            const filtered = list.filter((c) => c.userId !== contrib.userId);
            return [...filtered, contrib];
          });
        },
        error: (err) => console.error("upsertMyContribution failed", err),
      });
  }

  /** Handler pour BudgetSavingsGoals.createGoal. */
  onCreateSavingsGoal(payload: Omit<CreateBudgetGoalPayload, "groupId">): void {
    const gid = this.groupId();
    if (!gid) return;
    this.budgetPort.createGoal({ ...payload, groupId: gid }).subscribe({
      next: (goal) => this.savingsGoals.update((g) => [...g, goal]),
      error: (err) => console.error("createGoal failed", err),
    });
  }

  /** Handler pour BudgetSavingsGoals.updateGoal. */
  onUpdateSavingsGoal(event: {
    id: string;
    payload: UpdateBudgetGoalPayload;
  }): void {
    this.budgetPort.updateGoal(event.id, event.payload).subscribe({
      next: (updated) => {
        this.savingsGoals.update((list) =>
          list.map((g) => (g.id === updated.id ? updated : g)),
        );
      },
      error: (err) => console.error("updateGoal failed", err),
    });
  }

  /** Handler pour BudgetSavingsGoals.deleteGoal. */
  onDeleteSavingsGoal(goalId: string): void {
    this.budgetPort.deleteGoal(goalId).subscribe({
      next: () =>
        this.savingsGoals.update((list) => list.filter((g) => g.id !== goalId)),
      error: (err) => console.error("deleteGoal failed", err),
    });
  }

  getCategoryLabel(category: string | "ALL"): string {
    if (category === "ALL") {
      return $localize`:@@budgetFiltersCategoryAll:Toutes les catégories`;
    }

    if (category === "Voiture utilisation") {
      return "Voiture 🚗";
    }

    if (category === "Forfait telephone Tim & Maria") {
      return "FREE Tim & Maria";
    }

    if (category === "Netflix & Amazon & Ororo") {
      return "Subscriptions";
    }

    return category;
  }

  getMonthLabel(month: BudgetMonth): string {
    const labels: Record<BudgetMonth, string> = {
      March: $localize`:@@budgetMonthMarch:Mars`,
      April: $localize`:@@budgetMonthApril:Avril`,
      May: $localize`:@@budgetMonthMay:Mai`,
      June: $localize`:@@budgetMonthJune:Juin`,
    };
    return labels[month];
  }

  private apiEntriesToTransactions(
    entries: BudgetEntryModel[],
  ): BudgetTransaction[] {
    return entries.map((entry) => {
      const cat = this.apiCategories().find((c) => c.id === entry.categoryId);
      return {
        id: entry.id,
        startedDate: entry.date,
        completedDate: entry.date,
        description: entry.description,
        type: entry.type,
        state: entry.state,
        amount: entry.amount,
        category: cat?.name ?? "Autres",
      };
    });
  }

  private getContributionTotalFor(personNeedle: string): number {
    const orderedTransactions = [...this.transactions()].sort(
      (left, right) =>
        this.getTransactionTimestamp(left) -
        this.getTransactionTimestamp(right),
    );

    return orderedTransactions.reduce((sum, transaction, index) => {
      if (transaction.amount <= 0) {
        return sum;
      }

      if (!normalizeText(transaction.description).includes(personNeedle)) {
        return sum;
      }

      const nextTransaction = orderedTransactions[index + 1];
      if (this.isPocketPassThrough(transaction, nextTransaction)) {
        return sum;
      }

      return sum + transaction.amount;
    }, 0);
  }

  private getTransactionTimestamp(transaction: BudgetTransaction): number {
    const value = transaction.completedDate || transaction.startedDate;
    const date = new Date(value.replace(" ", "T"));
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }

  private isPocketPassThrough(
    contribution: BudgetTransaction,
    nextTransaction?: BudgetTransaction,
  ): boolean {
    if (!nextTransaction) {
      return false;
    }

    if (nextTransaction.category !== "Pockets" || nextTransaction.amount >= 0) {
      return false;
    }

    const sameAmount =
      Math.abs(Math.abs(nextTransaction.amount) - contribution.amount) < 0.01;

    if (!sameAmount) {
      return false;
    }

    const contributionTime = this.getTransactionTimestamp(contribution);
    const pocketTime = this.getTransactionTimestamp(nextTransaction);

    return (
      pocketTime >= contributionTime &&
      pocketTime - contributionTime <= 5 * 60 * 1000
    );
  }
}
