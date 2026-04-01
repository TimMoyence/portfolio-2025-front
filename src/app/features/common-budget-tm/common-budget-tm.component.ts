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
import { BudgetSummaryCardComponent } from "./components/budget-summary-card/budget-summary-card.component";
import {
  BudgetTransactionsTableComponent,
  BudgetTransactionView,
} from "./components/budget-transactions-table/budget-transactions-table.component";
import { COMMON_BUDGET_SAMPLE_CSV } from "./common-budget-sample";

type CsvRow = Record<string, string>;
type BudgetMonth = "March" | "April" | "May" | "June";

type BudgetTransaction = {
  id: string;
  startedDate: string;
  completedDate: string;
  description: string;
  type: string;
  state: string;
  amount: number;
  category: string;
};

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
    const search = this.normalizeText(this.searchTerm());
    const category = this.categoryFilter();
    const state = this.stateFilter();
    const budgetType = this.budgetTypeFilter();

    return this.transactions().filter((transaction) => {
      const matchesSearch =
        !search || this.normalizeText(transaction.description).includes(search);
      const matchesCategory =
        category === "ALL" || transaction.category === category;
      const matchesState = state === "ALL" || transaction.state === state;
      const matchesBudgetType =
        budgetType === "ALL" ||
        (budgetType === "FIXED" &&
          this.getBudgetType(transaction.category) === "FIXED") ||
        (budgetType === "VARIABLE" &&
          this.getBudgetType(transaction.category) === "VARIABLE");
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
          this.normalizeText(transaction.description).includes("tim moyence"),
        )
        .reduce((sum, transaction) => sum + Math.max(transaction.amount, 0), 0),
    ),
  );

  readonly mariaContribution = computed(() =>
    this.fmt.formatCurrency(
      this.transactions()
        .filter((transaction) =>
          this.normalizeText(transaction.description).includes(
            "maria naumenko",
          ),
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

  readonly categoryTotals = computed(() =>
    this.getCategoryFacts()
      .sort((left, right) => {
        const leftType = this.getBudgetType(left);
        const rightType = this.getBudgetType(right);

        if (leftType !== rightType) {
          return leftType === "FIXED" ? -1 : 1;
        }

        return this.getCategoryFact(right) - this.getCategoryFact(left);
      })
      .map((name) => {
        const total = this.getCategoryFact(name);
        const planValue = this.getPlanValue(name);
        const leftValue = planValue - total;
        return {
          name,
          plan: planValue > 0 ? this.fmt.formatCurrency(planValue) : "-",
          fact: this.fmt.formatCurrency(total),
          left: planValue > 0 ? this.fmt.formatCurrency(leftValue) : "-",
          isLeftNegative: planValue > 0 && leftValue < 0,
          budgetType: this.getBudgetType(name),
        };
      }),
  );

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
          this.baseTransactions.set(this.toTransactions(this.parseCsv(csv)));
          this.sourceLabel.set(
            `${this.selectedMonth()} - ${file.name} (local parse)`,
          );
        }
      } else {
        this.baseTransactions.set(this.toTransactions(this.parseCsv(csv)));
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
        this.toTransactions(this.parseCsv(COMMON_BUDGET_SAMPLE_CSV)),
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
            this.toTransactions(this.parseCsv(COMMON_BUDGET_SAMPLE_CSV)),
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

  private parseCsv(csvText: string): CsvRow[] {
    const rows: string[][] = [];
    let current = "";
    let row: string[] = [];
    let inQuotes = false;

    for (let index = 0; index < csvText.length; index += 1) {
      const character = csvText[index];
      const next = csvText[index + 1];

      if (character === '"') {
        if (inQuotes && next === '"') {
          current += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (character === "," && !inQuotes) {
        row.push(current);
        current = "";
        continue;
      }

      if ((character === "\n" || character === "\r") && !inQuotes) {
        if (character === "\r" && next === "\n") {
          index += 1;
        }
        row.push(current);
        rows.push(row);
        row = [];
        current = "";
        continue;
      }

      current += character;
    }

    if (current || row.length) {
      row.push(current);
      rows.push(row);
    }

    const [headers = [], ...dataRows] = rows.filter((entry) =>
      entry.some((cell) => cell !== ""),
    );

    return dataRows.map((dataRow) => {
      const mappedRow: CsvRow = {};
      headers.forEach((header, index) => {
        mappedRow[header] = dataRow[index] ?? "";
      });
      return mappedRow;
    });
  }

  private toTransactions(rows: CsvRow[]): BudgetTransaction[] {
    return rows.map((row) => {
      const description = (row["Description"] ?? "").trim();
      const startedDate = row["Started Date"] ?? "";
      const amount = Number.parseFloat(row["Amount"] ?? "0");
      return {
        id: `${startedDate}|${description}|${row["Amount"]}|${row["Type"]}`,
        startedDate,
        completedDate: row["Completed Date"] ?? "",
        description,
        type: row["Type"] ?? "",
        state: row["State"] ?? "",
        amount,
        category: "Autres",
      };
    });
  }

  private normalizeText(value: string): string {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  private getBudgetType(categoryName: string): "FIXED" | "VARIABLE" {
    const cat = this.apiCategories().find((c) => c.name === categoryName);
    return (cat?.budgetType as "FIXED" | "VARIABLE") ?? "VARIABLE";
  }

  private getPlanValue(categoryName: string): number {
    const cat = this.apiCategories().find((c) => c.name === categoryName);
    return cat ? Number(cat.budgetLimit) : 0;
  }

  private getCategoryFacts(): string[] {
    const categories = new Set<string>();

    this.transactions().forEach((transaction) => {
      if (transaction.category === "Contribution") {
        return;
      }

      if (
        transaction.category === "Transfer / Savings" &&
        transaction.amount >= 0
      ) {
        return;
      }

      if (
        transaction.amount < 0 &&
        transaction.category !== "Transfer / Savings"
      ) {
        categories.add(transaction.category);
      }
    });

    // Add categories with a budget limit from the API
    this.apiCategories().forEach((cat) => {
      if (cat.budgetLimit > 0) {
        categories.add(cat.name);
      }
    });

    categories.add("Pockets");

    return Array.from(categories);
  }

  private getCategoryFact(category: string): number {
    return this.transactions().reduce((sum, transaction) => {
      if (transaction.category !== category || transaction.amount >= 0) {
        return sum;
      }

      return sum + Math.abs(transaction.amount);
    }, 0);
  }
}
