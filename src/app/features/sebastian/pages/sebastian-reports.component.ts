import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import type {
  SebastianPeriodReport,
  SebastianReportPeriod,
} from "../../../core/models/sebastian.model";
import {
  SEBASTIAN_PORT,
  type SebastianPort,
} from "../../../core/ports/sebastian.port";
import { SebastianHeatmapComponent } from "../components/sebastian-heatmap.component";

/** Configuration d'une option de periode. */
interface PeriodOption {
  value: SebastianReportPeriod;
  label: string;
}

/** Label d'un jour de la semaine pour la distribution. */
interface DayLabel {
  index: number;
  label: string;
}

/**
 * Page de rapports Sebastian.
 * Affiche un rapport de periode avec totaux, comparaison,
 * heatmap et distribution par jour de la semaine.
 */
@Component({
  selector: "app-sebastian-reports",
  standalone: true,
  imports: [SebastianHeatmapComponent],
  template: `
    <div class="space-y-6">
      <!-- Selecteur de periode -->
      <div class="flex gap-2">
        @for (p of periods; track p.value) {
          <button
            data-testid="period-button"
            (click)="selectPeriod(p.value)"
            [class]="
              selectedPeriod() === p.value
                ? 'bg-scheme-accent text-scheme-on-accent'
                : 'bg-scheme-surface text-scheme-text-muted hover:bg-scheme-surface-hover'
            "
            class="rounded-button border border-scheme-border px-4 py-2 font-heading text-small"
          >
            {{ p.label }}
          </button>
        }
      </div>

      <!-- Navigateur temporel -->
      <div data-testid="period-nav" class="flex items-center justify-between">
        <button
          data-testid="prev-period"
          (click)="prevPeriod()"
          class="rounded-button border border-scheme-border bg-scheme-surface px-3 py-2 text-scheme-text hover:bg-scheme-surface-hover"
        >
          &larr;
        </button>
        <span data-testid="period-label" class="font-heading text-scheme-text">
          {{ periodLabel() }}
        </span>
        <button
          data-testid="next-period"
          (click)="nextPeriod()"
          class="rounded-button border border-scheme-border bg-scheme-surface px-3 py-2 text-scheme-text hover:bg-scheme-surface-hover"
        >
          &rarr;
        </button>
      </div>

      @if (report()) {
        <!-- Totaux -->
        <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div
            class="rounded-card border border-scheme-border bg-scheme-surface p-4"
          >
            <p class="text-small text-scheme-text-muted">Total alcool</p>
            <p class="font-heading text-h4 text-scheme-text">
              {{ report()!.totals.alcohol }}
            </p>
          </div>
          <div
            class="rounded-card border border-scheme-border bg-scheme-surface p-4"
          >
            <p class="text-small text-scheme-text-muted">Total cafe</p>
            <p class="font-heading text-h4 text-scheme-text">
              {{ report()!.totals.coffee }}
            </p>
          </div>
          <div
            class="rounded-card border border-scheme-border bg-scheme-surface p-4"
          >
            <p class="text-small text-scheme-text-muted">Moy. alcool/jour</p>
            <p class="font-heading text-h4 text-scheme-text">
              {{ report()!.dailyAvg.alcohol.toFixed(1) }}
            </p>
          </div>
          <div
            class="rounded-card border border-scheme-border bg-scheme-surface p-4"
          >
            <p class="text-small text-scheme-text-muted">Moy. cafe/jour</p>
            <p class="font-heading text-h4 text-scheme-text">
              {{ report()!.dailyAvg.coffee.toFixed(1) }}
            </p>
          </div>
        </div>

        <!-- Comparaison vs periode precedente -->
        <div
          class="rounded-card border border-scheme-border bg-scheme-surface p-4"
        >
          <p class="mb-2 text-small text-scheme-text-muted">
            vs periode precedente :
          </p>
          <div class="flex gap-4">
            <span
              [class]="
                report()!.comparison.alcoholDelta < 0
                  ? 'text-green-500'
                  : 'text-red-500'
              "
            >
              {{ report()!.comparison.alcoholDelta > 0 ? "+" : ""
              }}{{ report()!.comparison.alcoholDelta }}% alcool
            </span>
            <span
              [class]="
                report()!.comparison.coffeeDelta < 0
                  ? 'text-green-500'
                  : 'text-red-500'
              "
            >
              {{ report()!.comparison.coffeeDelta > 0 ? "+" : ""
              }}{{ report()!.comparison.coffeeDelta }}% cafe
            </span>
          </div>
        </div>

        <!-- Meilleur / Pire jour -->
        <div class="grid grid-cols-2 gap-4">
          <div
            class="rounded-card border border-scheme-border bg-scheme-surface p-4"
          >
            <p class="text-small text-scheme-text-muted">Meilleur jour</p>
            <p class="font-heading text-scheme-text">
              {{ report()!.best.date }}
            </p>
            <p class="text-xs text-green-500">
              Score {{ report()!.best.score }}
            </p>
          </div>
          <div
            class="rounded-card border border-scheme-border bg-scheme-surface p-4"
          >
            <p class="text-small text-scheme-text-muted">Pire jour</p>
            <p class="font-heading text-scheme-text">
              {{ report()!.worst.date }}
            </p>
            <p class="text-xs text-red-500">
              Score {{ report()!.worst.score }}
            </p>
          </div>
        </div>

        <!-- Heatmap -->
        <app-sebastian-heatmap [data]="report()!.heatmap" />

        <!-- Distribution par jour de la semaine -->
        <div
          data-testid="day-distribution"
          class="rounded-card border border-scheme-border bg-scheme-surface p-4"
        >
          <h3 class="mb-3 font-heading text-h5">Distribution par jour</h3>
          <div class="grid grid-cols-7 gap-2 text-center">
            @for (day of dayLabels; track day.index) {
              <div>
                <p class="text-small text-scheme-text-muted">
                  {{ day.label }}
                </p>
                <p class="font-heading text-scheme-text">
                  {{ getDayTotal(day.index) }}
                </p>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SebastianReportsComponent {
  private readonly port: SebastianPort = inject(SEBASTIAN_PORT);

  /** Periodes disponibles. */
  readonly periods: PeriodOption[] = [
    { value: "week", label: "Semaine" },
    { value: "month", label: "Mois" },
    { value: "quarter", label: "Trimestre" },
  ];

  /** Labels des jours de la semaine pour la distribution. */
  readonly dayLabels: DayLabel[] = [
    { index: 1, label: "Lun" },
    { index: 2, label: "Mar" },
    { index: 3, label: "Mer" },
    { index: 4, label: "Jeu" },
    { index: 5, label: "Ven" },
    { index: 6, label: "Sam" },
    { index: 0, label: "Dim" },
  ];

  /** Periode selectionnee. */
  readonly selectedPeriod = signal<SebastianReportPeriod>("week");

  /** Date de debut de la periode courante (ISO YYYY-MM-DD). */
  readonly currentStartDate = signal<string>(this.getThisMonday());

  /** Rapport de la periode courante. */
  readonly report = signal<SebastianPeriodReport | null>(null);

  /** Label affiche dans le navigateur temporel. */
  readonly periodLabel = computed(() => {
    const date = new Date(this.currentStartDate() + "T00:00:00");
    const day = date.getDate();
    const monthNames = [
      "janvier",
      "fevrier",
      "mars",
      "avril",
      "mai",
      "juin",
      "juillet",
      "aout",
      "septembre",
      "octobre",
      "novembre",
      "decembre",
    ];
    const month = monthNames[date.getMonth()];

    switch (this.selectedPeriod()) {
      case "week":
        return `Semaine du ${day} ${month}`;
      case "month":
        return `${month.charAt(0).toUpperCase() + month.slice(1)} ${date.getFullYear()}`;
      case "quarter":
        return `T${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
    }
  });

  constructor() {
    this.loadReport();
  }

  /** Selectionne une nouvelle periode et recharge le rapport. */
  selectPeriod(period: SebastianReportPeriod): void {
    this.selectedPeriod.set(period);
    this.loadReport();
  }

  /** Navigue vers la periode precedente. */
  prevPeriod(): void {
    this.currentStartDate.set(this.offsetDate(-1));
    this.loadReport();
  }

  /** Navigue vers la periode suivante. */
  nextPeriod(): void {
    this.currentStartDate.set(this.offsetDate(1));
    this.loadReport();
  }

  /**
   * Retourne le total combine pour un jour de la semaine donne.
   * Utilise la distribution du rapport.
   */
  getDayTotal(dayOfWeek: number): number {
    const dist = this.report()?.distribution.find(
      (d) => d.dayOfWeek === dayOfWeek,
    );
    return dist ? dist.alcohol + dist.coffee : 0;
  }

  /** Charge le rapport pour la periode et date courantes. */
  private loadReport(): void {
    this.port
      .getPeriodReport(this.selectedPeriod(), this.currentStartDate())
      .subscribe((report) => this.report.set(report));
  }

  /** Retourne la date du lundi de la semaine courante au format ISO. */
  private getThisMonday(): string {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    return monday.toISOString().slice(0, 10);
  }

  /**
   * Decale la date de debut selon la direction et la periode selectionnee.
   * @param direction -1 pour precedent, 1 pour suivant
   */
  private offsetDate(direction: number): string {
    const date = new Date(this.currentStartDate() + "T00:00:00");
    switch (this.selectedPeriod()) {
      case "week":
        date.setDate(date.getDate() + direction * 7);
        break;
      case "month":
        date.setMonth(date.getMonth() + direction);
        break;
      case "quarter":
        date.setMonth(date.getMonth() + direction * 3);
        break;
    }
    return date.toISOString().slice(0, 10);
  }
}
