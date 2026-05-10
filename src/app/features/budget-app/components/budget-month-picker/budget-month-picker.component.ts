import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from "@angular/core";

/** Paire mois/annee utilisee comme valeur du picker. */
export type MonthYear = { month: number; year: number };

/**
 * Selecteur de mois natif (select HTML) pour le budget.
 * Utilise Intl.DateTimeFormat pour formater les labels en francais.
 * SSR-safe : pas d'acces a window/document.
 */
@Component({
  selector: "app-budget-month-picker",
  standalone: true,
  templateUrl: "./budget-month-picker.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetMonthPickerComponent {
  /** Mois courant selectionne (1-12). */
  readonly currentMonth = input.required<number>();

  /** Annee courante selectionnee. */
  readonly currentYear = input.required<number>();

  /** Mois disponibles recuperes depuis le backend. */
  readonly availableMonths = input<MonthYear[]>([]);

  /** Emis quand l'utilisateur change de mois. */
  readonly monthChange = output<MonthYear>();

  /**
   * Liste des options du select incluant toujours le mois courant.
   * Si le mois courant n'est pas dans availableMonths, il est ajoute en tete.
   */
  readonly options = computed<MonthYear[]>(() => {
    const current = { month: this.currentMonth(), year: this.currentYear() };
    const months = this.availableMonths();
    const exists = months.some(
      (m) => m.month === current.month && m.year === current.year,
    );
    return exists ? months : [current, ...months];
  });

  /** Valeur courante du select au format "month-year". */
  readonly selectedValue = computed(
    () => `${this.currentMonth()}-${this.currentYear()}`,
  );

  /** Formatte un mois/annee en label francais via Intl (ex: "mai 2026"). */
  formatLabel(monthYear: MonthYear): string {
    const date = new Date(monthYear.year, monthYear.month - 1, 1);
    return new Intl.DateTimeFormat("fr-FR", {
      month: "long",
      year: "numeric",
    }).format(date);
  }

  /** Encode un MonthYear en valeur de l'option select. */
  optionValue(monthYear: MonthYear): string {
    return `${monthYear.month}-${monthYear.year}`;
  }

  /** Handler du changement de selection dans le select. */
  onSelectionChange(event: Event): void {
    const value = (event.target as HTMLSelectElement | null)?.value ?? "";
    const [monthStr, yearStr] = value.split("-");
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);
    if (!isNaN(month) && !isNaN(year)) {
      this.monthChange.emit({ month, year });
    }
  }
}
