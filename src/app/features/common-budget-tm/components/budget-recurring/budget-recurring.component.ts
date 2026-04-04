import {
  ChangeDetectionStrategy,
  Component,
  type OnInit,
  inject,
  input,
  signal,
} from "@angular/core";
import { firstValueFrom } from "rxjs";
import type {
  BudgetCategoryModel,
  BudgetType,
  Frequency,
  RecurringEntryModel,
} from "../../../../core/models/budget.model";
import { BUDGET_PORT } from "../../../../core/ports/budget.port";

/**
 * Composant CRUD pour les entrees recurrentes du budget.
 * Permet de lister, creer, activer/desactiver et supprimer.
 */
@Component({
  selector: "app-budget-recurring",
  standalone: true,
  template: `
    <section
      class="rounded-[1.75rem] border border-black/10 bg-white/95 p-6 shadow-[0_18px_40px_rgba(25,33,52,0.08)]"
    >
      <div
        class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
      >
        <div>
          <p
            class="text-sm font-semibold uppercase tracking-[0.22em] text-[#0f7b65]"
            i18n="@@budgetRecurringEyebrow"
          >
            Automatisation
          </p>
          <h2
            class="mt-3 text-2xl font-black text-slate-950"
            i18n="@@budgetRecurringTitle"
          >
            Entrées récurrentes
          </h2>
        </div>
        <button
          type="button"
          class="rounded-full bg-[#0f7b65] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
          (click)="toggleForm()"
        >
          @if (showForm()) {
            <span i18n="@@budgetRecurringCancelBtn">Annuler</span>
          } @else {
            <span i18n="@@budgetRecurringAddBtn"
              >Ajouter une entrée récurrente</span
            >
          }
        </button>
      </div>

      @if (errorMessage()) {
        <p class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {{ errorMessage() }}
        </p>
      }

      @if (showForm()) {
        <div
          class="mt-6 grid gap-4 rounded-[1.5rem] border border-[#ddd5c7] bg-[#fffaf2] p-5 md:grid-cols-2 lg:grid-cols-3"
        >
          <label
            class="grid gap-1 text-sm text-slate-600"
            i18n="@@budgetRecurringFormDescription"
          >
            Description
            <input
              class="rounded-xl border border-[#d7cfbf] bg-[#fffdf8] px-3 py-2 text-slate-900"
              type="text"
              [value]="formDescription()"
              (input)="formDescription.set(readInput($event))"
            />
          </label>
          <label
            class="grid gap-1 text-sm text-slate-600"
            i18n="@@budgetRecurringFormAmount"
          >
            Montant
            <input
              class="rounded-xl border border-[#d7cfbf] bg-[#fffdf8] px-3 py-2 text-slate-900"
              type="number"
              step="0.01"
              [value]="formAmount()"
              (input)="formAmount.set(toNumber(readInput($event)))"
            />
          </label>
          <label class="grid gap-1 text-sm text-slate-600">
            <span i18n="@@budgetRecurringFormFrequency">Fréquence</span>
            <select
              class="rounded-xl border border-[#d7cfbf] bg-[#fffdf8] px-3 py-2 text-slate-900"
              [value]="formFrequency()"
              (change)="formFrequency.set(readFrequency($event))"
            >
              <option value="MONTHLY">{{ frequencyLabel("MONTHLY") }}</option>
              <option value="WEEKLY">{{ frequencyLabel("WEEKLY") }}</option>
              <option value="BIWEEKLY">{{ frequencyLabel("BIWEEKLY") }}</option>
            </select>
          </label>
          <label class="grid gap-1 text-sm text-slate-600">
            <span i18n="@@budgetRecurringFormType">Type</span>
            <select
              class="rounded-xl border border-[#d7cfbf] bg-[#fffdf8] px-3 py-2 text-slate-900"
              [value]="formType()"
              (change)="formType.set(readBudgetType($event))"
            >
              <option value="FIXED">{{ budgetTypeLabel("FIXED") }}</option>
              <option value="VARIABLE">
                {{ budgetTypeLabel("VARIABLE") }}
              </option>
            </select>
          </label>
          <label class="grid gap-1 text-sm text-slate-600">
            <span i18n="@@budgetRecurringFormCategory">Catégorie</span>
            <select
              class="rounded-xl border border-[#d7cfbf] bg-[#fffdf8] px-3 py-2 text-slate-900"
              [value]="formCategoryId()"
              (change)="formCategoryId.set(readSelect($event))"
            >
              <option value="">{{ categoryNoneLabel }}</option>
              @for (cat of categories(); track cat.id) {
                <option [value]="cat.id">{{ cat.name }}</option>
              }
            </select>
          </label>
          @if (formFrequency() === "MONTHLY") {
            <label
              class="grid gap-1 text-sm text-slate-600"
              i18n="@@budgetRecurringFormDayOfMonth"
            >
              Jour du mois
              <input
                class="rounded-xl border border-[#d7cfbf] bg-[#fffdf8] px-3 py-2 text-slate-900"
                type="number"
                min="1"
                max="31"
                [value]="formDayOfMonth()"
                (input)="formDayOfMonth.set(toNumber(readInput($event)))"
              />
            </label>
          }
          @if (formFrequency() === "WEEKLY" || formFrequency() === "BIWEEKLY") {
            <label class="grid gap-1 text-sm text-slate-600">
              <span i18n="@@budgetRecurringFormDayOfWeek"
                >Jour de la semaine</span
              >
              <select
                class="rounded-xl border border-[#d7cfbf] bg-[#fffdf8] px-3 py-2 text-slate-900"
                [value]="formDayOfWeek()"
                (change)="formDayOfWeek.set(toNumber(readSelect($event)))"
              >
                @for (day of dayOfWeekOptions; track day.value) {
                  <option [value]="day.value">{{ day.label }}</option>
                }
              </select>
            </label>
          }
          <label
            class="grid gap-1 text-sm text-slate-600"
            i18n="@@budgetRecurringFormStartDate"
          >
            Date de début
            <input
              class="rounded-xl border border-[#d7cfbf] bg-[#fffdf8] px-3 py-2 text-slate-900"
              type="date"
              [value]="formStartDate()"
              (input)="formStartDate.set(readInput($event))"
            />
          </label>
          <label
            class="grid gap-1 text-sm text-slate-600"
            i18n="@@budgetRecurringFormEndDate"
          >
            Date de fin (optionnel)
            <input
              class="rounded-xl border border-[#d7cfbf] bg-[#fffdf8] px-3 py-2 text-slate-900"
              type="date"
              [value]="formEndDate()"
              (input)="formEndDate.set(readInput($event))"
            />
          </label>
          <div class="flex items-end">
            <button
              type="button"
              class="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5"
              (click)="createEntry()"
            >
              <span i18n="@@budgetRecurringCreateBtn">Créer</span>
            </button>
          </div>
        </div>
      }

      <div
        class="mt-6 overflow-hidden rounded-[1.5rem] border border-[#ddd5c7]"
      >
        <div
          class="grid grid-cols-[1.5fr_0.7fr_0.7fr_0.8fr_0.5fr_0.5fr] gap-4 bg-[#f7f1e8] px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500"
        >
          <span i18n="@@budgetRecurringColDescription">Description</span>
          <span i18n="@@budgetRecurringColAmount">Montant</span>
          <span i18n="@@budgetRecurringColFrequency">Fréquence</span>
          <span i18n="@@budgetRecurringColCategory">Catégorie</span>
          <span i18n="@@budgetRecurringColActive">Actif</span>
          <span></span>
        </div>
        @for (entry of recurringEntries(); track entry.id) {
          <div
            class="grid grid-cols-[1.5fr_0.7fr_0.7fr_0.8fr_0.5fr_0.5fr] items-center gap-4 border-t border-[#ebe3d6] bg-white px-4 py-3"
          >
            <span class="font-medium text-slate-700">{{
              entry.description
            }}</span>
            <span class="text-slate-900">{{ entry.amount }} €</span>
            <span class="text-sm text-slate-500">{{
              frequencyLabel(entry.frequency)
            }}</span>
            <span class="text-sm text-slate-500">{{
              categoryName(entry.categoryId)
            }}</span>
            <button
              type="button"
              class="rounded-full px-3 py-1 text-xs font-semibold transition"
              [class.bg-emerald-100]="entry.isActive"
              [class.text-emerald-700]="entry.isActive"
              [class.bg-slate-100]="!entry.isActive"
              [class.text-slate-500]="!entry.isActive"
              (click)="toggleActive(entry.id, entry.isActive)"
            >
              {{ entry.isActive ? "Oui" : "Non" }}
            </button>
            <button
              type="button"
              class="text-sm text-red-500 hover:text-red-700"
              (click)="deleteEntry(entry.id)"
            >
              <span i18n="@@budgetRecurringDeleteBtn">Supprimer</span>
            </button>
          </div>
        } @empty {
          <p
            class="border-t border-[#ebe3d6] px-4 py-6 text-sm text-slate-500"
            i18n="@@budgetRecurringEmpty"
          >
            Aucune entrée récurrente configurée.
          </p>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetRecurringComponent implements OnInit {
  private readonly budgetPort = inject(BUDGET_PORT);

  readonly groupId = input.required<string>();
  readonly categories = input<BudgetCategoryModel[]>([]);

  readonly recurringEntries = signal<RecurringEntryModel[]>([]);
  readonly showForm = signal(false);
  readonly errorMessage = signal("");

  // Champs du formulaire
  readonly formDescription = signal("");
  readonly formAmount = signal(0);
  readonly formFrequency = signal<Frequency>("MONTHLY");
  readonly formType = signal<BudgetType>("FIXED");
  readonly formCategoryId = signal("");
  readonly formDayOfMonth = signal<number>(1);
  readonly formDayOfWeek = signal<number>(0);
  readonly formStartDate = signal(new Date().toISOString().split("T")[0]);
  readonly formEndDate = signal("");

  ngOnInit(): void {
    this.loadEntries();
  }

  /** Bascule la visibilite du formulaire. */
  toggleForm(): void {
    this.showForm.update((v) => !v);
  }

  /** Charge les entrees recurrentes depuis l'API. */
  async loadEntries(): Promise<void> {
    this.errorMessage.set("");
    try {
      const entries = await firstValueFrom(
        this.budgetPort.getRecurringEntries(this.groupId()),
      );
      this.recurringEntries.set(entries ?? []);
    } catch {
      this.recurringEntries.set([]);
      this.errorMessage.set(
        "Erreur lors du chargement des entrées récurrentes.",
      );
    }
  }

  /** Cree une nouvelle entree recurrente. */
  async createEntry(): Promise<void> {
    this.errorMessage.set("");
    try {
      const freq = this.formFrequency();
      const isWeekly = freq === "WEEKLY" || freq === "BIWEEKLY";
      const entry = await firstValueFrom(
        this.budgetPort.createRecurringEntry({
          groupId: this.groupId(),
          categoryId: this.formCategoryId() || undefined,
          description: this.formDescription(),
          amount: this.formAmount(),
          type: this.formType(),
          frequency: freq,
          dayOfMonth: !isWeekly
            ? this.formDayOfMonth() || undefined
            : undefined,
          dayOfWeek: isWeekly ? this.formDayOfWeek() : undefined,
          startDate: this.formStartDate(),
          endDate: this.formEndDate() || undefined,
        }),
      );
      if (entry) {
        this.recurringEntries.update((entries) => [...entries, entry]);
      }
      this.resetForm();
      this.showForm.set(false);
    } catch {
      this.errorMessage.set("Erreur lors de la création.");
    }
  }

  /** Supprime une entree recurrente. */
  async deleteEntry(id: string): Promise<void> {
    this.errorMessage.set("");
    try {
      await firstValueFrom(this.budgetPort.deleteRecurringEntry(id));
      this.recurringEntries.update((entries) =>
        entries.filter((e) => e.id !== id),
      );
    } catch {
      this.errorMessage.set("Erreur lors de la suppression.");
    }
  }

  /** Active ou desactive une entree recurrente. */
  async toggleActive(id: string, currentState: boolean): Promise<void> {
    this.errorMessage.set("");
    try {
      const updated = await firstValueFrom(
        this.budgetPort.updateRecurringEntry(id, {
          isActive: !currentState,
        }),
      );
      if (updated) {
        this.recurringEntries.update((entries) =>
          entries.map((e) => (e.id === id ? updated : e)),
        );
      }
    } catch {
      this.errorMessage.set("Erreur lors de la mise à jour.");
    }
  }

  /** Label pour la categorie "Aucune" dans le formulaire. */
  readonly categoryNoneLabel = $localize`:@@budgetRecurringCategoryNone:Aucune`;

  /** Options des jours de la semaine pour le formulaire. */
  readonly dayOfWeekOptions = [
    { value: 0, label: $localize`:@@budgetRecurringDaySunday:Dimanche` },
    { value: 1, label: $localize`:@@budgetRecurringDayMonday:Lundi` },
    { value: 2, label: $localize`:@@budgetRecurringDayTuesday:Mardi` },
    { value: 3, label: $localize`:@@budgetRecurringDayWednesday:Mercredi` },
    { value: 4, label: $localize`:@@budgetRecurringDayThursday:Jeudi` },
    { value: 5, label: $localize`:@@budgetRecurringDayFriday:Vendredi` },
    { value: 6, label: $localize`:@@budgetRecurringDaySaturday:Samedi` },
  ];

  /** Retourne le libelle de la frequence. */
  frequencyLabel(frequency: Frequency): string {
    const labels: Record<Frequency, string> = {
      MONTHLY: "Mensuelle",
      WEEKLY: "Hebdomadaire",
      BIWEEKLY: "Bimensuelle",
    };
    return labels[frequency];
  }

  /** Retourne le libelle du type de budget. */
  budgetTypeLabel(type: BudgetType): string {
    const labels: Record<BudgetType, string> = {
      FIXED: $localize`:@@budgetRecurringTypeFixed:Fixe`,
      VARIABLE: $localize`:@@budgetRecurringTypeVariable:Variable`,
    };
    return labels[type];
  }

  /** Retourne le nom de la categorie a partir de son identifiant. */
  categoryName(categoryId: string | null): string {
    if (!categoryId) return "-";
    return (
      this.categories().find((c) => c.id === categoryId)?.name ?? "Inconnue"
    );
  }

  /** Lit la valeur d'un input texte. */
  readInput(event: Event): string {
    return (event.target as HTMLInputElement | null)?.value ?? "";
  }

  /** Lit la valeur d'un select comme Frequency. */
  readFrequency(event: Event): Frequency {
    return ((event.target as HTMLSelectElement | null)?.value ??
      "MONTHLY") as Frequency;
  }

  /** Lit la valeur d'un select comme BudgetType. */
  readBudgetType(event: Event): BudgetType {
    return ((event.target as HTMLSelectElement | null)?.value ??
      "FIXED") as BudgetType;
  }

  /** Lit la valeur d'un select. */
  readSelect(event: Event): string {
    return (event.target as HTMLSelectElement | null)?.value ?? "";
  }

  /** Convertit une chaine en nombre. */
  toNumber(value: string): number {
    const n = Number.parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  }

  private resetForm(): void {
    this.formDescription.set("");
    this.formAmount.set(0);
    this.formFrequency.set("MONTHLY");
    this.formType.set("FIXED");
    this.formCategoryId.set("");
    this.formDayOfMonth.set(1);
    this.formDayOfWeek.set(0);
    this.formStartDate.set(new Date().toISOString().split("T")[0]);
    this.formEndDate.set("");
  }
}
