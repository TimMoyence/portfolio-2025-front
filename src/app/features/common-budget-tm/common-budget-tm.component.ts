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
  BudgetGroup,
} from "../../core/models/budget.model";
import { BUDGET_PORT } from "../../core/ports/budget.port";
import { BudgetFormatService } from "../../core/services/budget-format.service";
import { BudgetCategoryTotalsComponent } from "./components/budget-category-totals/budget-category-totals.component";
import { BudgetChartComponent } from "./components/budget-chart/budget-chart.component";
import { BudgetExportComponent } from "./components/budget-export/budget-export.component";
import { BudgetGoalsComponent } from "./components/budget-goals/budget-goals.component";
import { BudgetRecurringComponent } from "./components/budget-recurring/budget-recurring.component";
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
  selector: "app-common-budget-tm",
  standalone: true,
  imports: [
    CommonModule,
    BudgetSummaryCardComponent,
    BudgetCategoryTotalsComponent,
    BudgetChartComponent,
    BudgetExportComponent,
    BudgetGoalsComponent,
    BudgetRecurringComponent,
    BudgetTransactionsTableComponent,
  ],
  templateUrl: "./common-budget-tm.component.html",
  styleUrl: "./common-budget-tm.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonBudgetTmComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly browser = isPlatformBrowser(this.platformId);
  private readonly budgetPort = inject(BUDGET_PORT);
  private readonly fmt = inject(BudgetFormatService);

  readonly groupId = signal<string | null>(null);
  readonly apiCategories = signal<BudgetCategoryModel[]>([]);
  readonly loading = signal(false);
  readonly shareEmail = signal("");
  readonly shareMessage = signal("");

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
    this.fmt.formatCurrency(
      this.transactions()
        .filter((transaction) =>
          normalizeText(transaction.description).includes("tim moyence"),
        )
        .reduce((sum, transaction) => sum + Math.max(transaction.amount, 0), 0),
    ),
  );

  readonly mariaContribution = computed(() =>
    this.fmt.formatCurrency(
      this.transactions()
        .filter((transaction) =>
          normalizeText(transaction.description).includes("maria naumenko"),
        )
        .reduce((sum, transaction) => sum + Math.max(transaction.amount, 0), 0),
    ),
  );

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

    this.loadEntries();
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
        } catch {
          // Fallback to local parsing
          this.baseTransactions.set(toTransactions(parseCsv(csv)));
          this.sourceLabel.set(
            `${this.selectedMonth()} - ${file.name} (local parse)`,
          );
        }
      } else {
        this.baseTransactions.set(toTransactions(parseCsv(csv)));
        this.sourceLabel.set(`${this.selectedMonth()} - ${file.name}`);
      }
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
    } catch {
      // Fallback to sample data if API is unreachable
      this.baseTransactions.set(
        toTransactions(parseCsv(COMMON_BUDGET_SAMPLE_CSV)),
      );
      this.sourceLabel.set("Fallback - Embedded sample");
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
      }
    } catch {
      this.baseTransactions.set([]);
      this.sourceLabel.set(`${month} - Error loading entries`);
    }
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
}
