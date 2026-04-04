import { isPlatformBrowser } from "@angular/common";
import {
  computed,
  inject,
  Injectable,
  PLATFORM_ID,
  signal,
} from "@angular/core";
import { firstValueFrom } from "rxjs";
import type {
  BudgetCategoryModel,
  BudgetEntryModel,
  BudgetGroup,
} from "../models/budget.model";
import { BUDGET_PORT } from "../ports/budget.port";
import { BudgetFormatService } from "./budget-format.service";
import type { BudgetTransaction } from "../../features/common-budget-tm/utils/budget-csv-parser.utils";
import {
  parseCsv,
  toTransactions,
} from "../../features/common-budget-tm/utils/budget-csv-parser.utils";
import { COMMON_BUDGET_SAMPLE_CSV } from "../../features/common-budget-tm/common-budget-sample";

/** Mois du budget. */
export type BudgetMonth = "March" | "April" | "May" | "June";

/** Mois disponibles pour le budget. */
export const MONTHS: BudgetMonth[] = ["March", "April", "May", "June"];

/** Correspondance mois → numero. */
const MONTH_NUMBER_MAP: Record<BudgetMonth, number> = {
  March: 3,
  April: 4,
  May: 5,
  June: 6,
};

/**
 * Etat de la vue budget sous forme de machine a etats.
 * Permet de distinguer clairement idle, chargement, succes et erreur.
 */
export type BudgetViewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "loaded"; entriesCount: number }
  | { status: "error"; message: string };

/**
 * Service centralisant l'etat du budget.
 * Gere le chargement des groupes, categories et entrees via le port budget.
 * Expose des signals reactifs pour l'UI.
 */
@Injectable({ providedIn: "root" })
export class BudgetStateService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly browser = isPlatformBrowser(this.platformId);
  private readonly budgetPort = inject(BUDGET_PORT);
  readonly fmt = inject(BudgetFormatService);

  /** Identifiant du groupe de budget actif. */
  readonly groupId = signal<string | null>(null);

  /** Categories chargees depuis l'API. */
  readonly apiCategories = signal<BudgetCategoryModel[]>([]);

  /** Etat de la vue (machine a etats). */
  readonly viewState = signal<BudgetViewState>({ status: "idle" });

  /** Transactions de base issues du CSV ou de l'API. */
  readonly baseTransactions = signal<BudgetTransaction[]>([]);

  /** Surcharges de categories appliquees manuellement par l'utilisateur. */
  readonly overrides = signal<Record<string, string>>({});

  /** Mois selectionne. */
  readonly selectedMonth = signal<BudgetMonth>("March");

  /** Annee courante. */
  readonly currentYear = signal(new Date().getFullYear());

  /** Label indiquant la source des donnees affichees. */
  readonly sourceLabel = signal("Embedded March 1-15 sample");

  /** Noms de categories derives des categories API. */
  readonly categories = computed(() => this.apiCategories().map((c) => c.name));

  /** Transactions avec les surcharges de categories appliquees. */
  readonly transactions = computed(() =>
    this.baseTransactions().map((transaction) => ({
      ...transaction,
      category: this.overrides()[transaction.id] ?? transaction.category,
    })),
  );

  /**
   * Initialise le budget : charge le groupe, les categories et les entrees.
   * En cas d'echec API, utilise les donnees d'exemple embarquees.
   */
  async initBudget(): Promise<void> {
    if (!this.browser) {
      return;
    }
    this.viewState.set({ status: "loading" });
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
      const txs = toTransactions(parseCsv(COMMON_BUDGET_SAMPLE_CSV));
      this.baseTransactions.set(txs);
      this.sourceLabel.set("Fallback - Embedded sample");
      this.viewState.set({ status: "loaded", entriesCount: txs.length });
    }
  }

  /**
   * Charge les entrees pour le mois et l'annee selectionnes.
   * Fallback sur les donnees embarquees pour mars si aucune entree n'est trouvee.
   */
  async loadEntries(): Promise<void> {
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
        this.viewState.set({
          status: "loaded",
          entriesCount: entries.length,
        });
      } else {
        // No entries yet for this month — show empty or sample
        if (month === "March") {
          const txs = toTransactions(parseCsv(COMMON_BUDGET_SAMPLE_CSV));
          this.baseTransactions.set(txs);
          this.sourceLabel.set("March - Embedded sample (no API data yet)");
          this.viewState.set({ status: "loaded", entriesCount: txs.length });
        } else {
          this.baseTransactions.set([]);
          this.sourceLabel.set(`${month} - No data yet`);
          this.viewState.set({ status: "loaded", entriesCount: 0 });
        }
      }
    } catch {
      this.baseTransactions.set([]);
      this.sourceLabel.set(`${month} - Error loading entries`);
      this.viewState.set({
        status: "error",
        message: `Erreur lors du chargement des entrees pour ${month}`,
      });
    }
  }

  /**
   * Convertit les entrees API en transactions budgetaires.
   * Associe chaque entree a sa categorie par nom (defaut: "Autres").
   */
  apiEntriesToTransactions(entries: BudgetEntryModel[]): BudgetTransaction[] {
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
