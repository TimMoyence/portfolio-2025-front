import { Injectable } from "@angular/core";

/** Service de formatage des valeurs monetaires et temporelles pour le budget. */
@Injectable({ providedIn: "root" })
export class BudgetFormatService {
  /** Formate un nombre en devise EUR. */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  }

  /** Formate un nombre en devise EUR avec signe +/-. */
  formatSignedCurrency(value: number): string {
    return `${value > 0 ? "+" : ""}${this.formatCurrency(value)}`;
  }

  /** Formate une date ISO en format court francais. */
  formatDate(value: string): string {
    if (!value) return "-";
    const date = new Date(value.replace(" ", "T"));
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  }

  /** Parse un montant textuel en nombre. */
  parseAmount(value: string): number {
    const normalized = value.replace(",", ".").trim();
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  /** Formate un ratio part/total en pourcentage. */
  formatPercentage(part: number, total: number): string {
    if (total <= 0) return "0%";
    return new Intl.NumberFormat("fr-FR", {
      style: "percent",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(part / total);
  }
}
