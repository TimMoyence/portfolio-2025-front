import { formatDate } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import type {
  SebastianPeriodReport,
  SebastianReportPeriod,
} from '../../../core/models/sebastian.model';
import { SEBASTIAN_PORT, type SebastianPort } from '../../../core/ports/sebastian.port';
import { SebastianHeatmapComponent } from '../components/sebastian-heatmap.component';

interface PeriodOption {
  value: SebastianReportPeriod;
  label: string;
}

interface DayLabel {
  index: number;
  label: string;
}

@Component({
  selector: 'app-sebastian-reports',
  standalone: true,
  imports: [SebastianHeatmapComponent],
  template: `
    <div class="space-y-6">
      <div class="flex gap-2">
        @for (p of periods; track p.value) {
          <button
            data-testid="period-button"
            (click)="selectPeriod(p.value)"
            [class]="
              selectedPeriod() === p.value
                ? 'bg-gold text-[#1a1206] border-gold'
                : 'bg-white/[0.04] text-white/55 hover:text-white hover:border-[rgba(230,170,70,0.35)]'
            "
            class="rounded-full border border-[rgba(230,170,70,0.14)] px-4 py-2 font-mono text-xs uppercase tracking-[0.06em] transition-colors"
          >
            {{ p.label }}
          </button>
        }
      </div>

      <div data-testid="period-nav" class="flex items-center justify-between">
        <button
          data-testid="prev-period"
          (click)="prevPeriod()"
          class="rounded-full border border-[rgba(230,170,70,0.14)] bg-white/[0.04] px-3 py-2 text-white/70 transition-colors hover:border-[rgba(230,170,70,0.35)] hover:text-white"
        >
          &larr;
        </button>
        <span data-testid="period-label" class="font-display text-xl text-white">
          {{ periodLabel() }}
        </span>
        <button
          data-testid="next-period"
          (click)="nextPeriod()"
          class="rounded-full border border-[rgba(230,170,70,0.14)] bg-white/[0.04] px-3 py-2 text-white/70 transition-colors hover:border-[rgba(230,170,70,0.35)] hover:text-white"
        >
          &rarr;
        </button>
      </div>

      @if (report()) {
        <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div class="rounded-[20px] border border-[rgba(230,170,70,0.14)] bg-white/[0.04] p-4">
            <p
              class="font-mono text-xs uppercase tracking-[0.06em] text-white/45"
              i18n="@@sebastianReportsTotalAlcohol"
            >
              Total alcool
            </p>
            <p class="font-display text-3xl text-white">
              {{ report()!.totals.alcohol }}
            </p>
          </div>
          <div class="rounded-[20px] border border-[rgba(230,170,70,0.14)] bg-white/[0.04] p-4">
            <p
              class="font-mono text-xs uppercase tracking-[0.06em] text-white/45"
              i18n="@@sebastianReportsTotalCoffee"
            >
              Total cafe
            </p>
            <p class="font-display text-3xl text-white">
              {{ report()!.totals.coffee }}
            </p>
          </div>
          <div class="rounded-[20px] border border-[rgba(230,170,70,0.14)] bg-white/[0.04] p-4">
            <p
              class="font-mono text-xs uppercase tracking-[0.06em] text-white/45"
              i18n="@@sebastianReportsAvgAlcohol"
            >
              Moy. alcool/jour
            </p>
            <p class="font-display text-3xl text-white">
              {{ report()!.dailyAvg.alcohol.toFixed(1) }}
            </p>
          </div>
          <div class="rounded-[20px] border border-[rgba(230,170,70,0.14)] bg-white/[0.04] p-4">
            <p
              class="font-mono text-xs uppercase tracking-[0.06em] text-white/45"
              i18n="@@sebastianReportsAvgCoffee"
            >
              Moy. cafe/jour
            </p>
            <p class="font-display text-3xl text-white">
              {{ report()!.dailyAvg.coffee.toFixed(1) }}
            </p>
          </div>
        </div>

        <div class="rounded-[20px] border border-[rgba(230,170,70,0.14)] bg-white/[0.04] p-4">
          <p
            class="mb-2 font-mono text-xs uppercase tracking-[0.06em] text-white/45"
            i18n="@@sebastianReportsVsPrevious"
          >
            vs periode precedente :
          </p>
          <div class="flex gap-4 text-sm">
            <span
              [class]="report()!.comparison.alcoholDelta < 0 ? 'text-green-500' : 'text-red-500'"
              i18n="@@sebastianReportsAlcoholDelta"
            >
              {{ report()!.comparison.alcoholDelta > 0 ? '+' : ''
              }}{{ report()!.comparison.alcoholDelta }}% alcool
            </span>
            <span
              [class]="report()!.comparison.coffeeDelta < 0 ? 'text-green-500' : 'text-red-500'"
              i18n="@@sebastianReportsCoffeeDelta"
            >
              {{ report()!.comparison.coffeeDelta > 0 ? '+' : ''
              }}{{ report()!.comparison.coffeeDelta }}% cafe
            </span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="rounded-[20px] border border-[rgba(230,170,70,0.14)] bg-white/[0.04] p-4">
            <p
              class="font-mono text-xs uppercase tracking-[0.06em] text-white/45"
              i18n="@@sebastianReportsBestDay"
            >
              Meilleur jour
            </p>
            <p class="font-display text-lg text-white">
              {{ report()!.best.date }}
            </p>
            <p class="text-xs text-green-500" i18n="@@sebastianReportsBestScore">
              Score {{ report()!.best.score }}
            </p>
          </div>
          <div class="rounded-[20px] border border-[rgba(230,170,70,0.14)] bg-white/[0.04] p-4">
            <p
              class="font-mono text-xs uppercase tracking-[0.06em] text-white/45"
              i18n="@@sebastianReportsWorstDay"
            >
              Pire jour
            </p>
            <p class="font-display text-lg text-white">
              {{ report()!.worst.date }}
            </p>
            <p class="text-xs text-red-500" i18n="@@sebastianReportsWorstScore">
              Score {{ report()!.worst.score }}
            </p>
          </div>
        </div>

        <app-sebastian-heatmap [data]="report()!.heatmap" />

        <div
          data-testid="day-distribution"
          class="rounded-[20px] border border-[rgba(230,170,70,0.14)] bg-white/[0.04] p-4"
        >
          <h3 class="mb-3 font-display text-xl text-white" i18n="@@sebastianReportsDistribution">
            Distribution par jour
          </h3>
          <div class="grid grid-cols-7 gap-2 text-center">
            @for (day of dayLabels; track day.index) {
              <div>
                <p class="font-mono text-xs uppercase tracking-[0.04em] text-white/45">
                  {{ day.label }}
                </p>
                <p class="font-display text-lg text-gold-soft">
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

  readonly periods: PeriodOption[] = [
    { value: 'week', label: $localize`:@@sebastianReportsPeriodWeek:Semaine` },
    { value: 'month', label: $localize`:@@sebastianReportsPeriodMonth:Mois` },
    { value: 'quarter', label: $localize`:@@sebastianReportsPeriodQuarter:Trimestre` },
  ];

  readonly dayLabels: DayLabel[] = [
    { index: 1, label: $localize`:@@sebastianDayMonShort:Lun` },
    { index: 2, label: $localize`:@@sebastianDayTueShort:Mar` },
    { index: 3, label: $localize`:@@sebastianDayWedShort:Mer` },
    { index: 4, label: $localize`:@@sebastianDayThuShort:Jeu` },
    { index: 5, label: $localize`:@@sebastianDayFriShort:Ven` },
    { index: 6, label: $localize`:@@sebastianDaySatShort:Sam` },
    { index: 0, label: $localize`:@@sebastianDaySunShort:Dim` },
  ];

  readonly selectedPeriod = signal<SebastianReportPeriod>('week');

  readonly currentStartDate = signal<string>(this.getThisMonday());

  readonly report = signal<SebastianPeriodReport | null>(null);

  private readonly localeId = inject(LOCALE_ID);

  readonly periodLabel = computed(() => {
    const date = new Date(this.currentStartDate() + 'T00:00:00');
    const day = date.getDate();
    const month = formatDate(date, 'MMMM', this.localeId);
    const year = date.getFullYear();

    switch (this.selectedPeriod()) {
      case 'week':
        return $localize`:@@sebastianReportsWeekOf:Semaine du ${day}:day: ${month}:month:`;
      case 'month':
        return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
      case 'quarter':
        return $localize`:@@sebastianReportsQuarterOf:T${Math.floor(date.getMonth() / 3) + 1}:quarter: ${year}:year:`;
    }
  });

  constructor() {
    this.loadReport();
  }

  selectPeriod(period: SebastianReportPeriod): void {
    this.selectedPeriod.set(period);
    this.loadReport();
  }

  prevPeriod(): void {
    this.currentStartDate.set(this.offsetDate(-1));
    this.loadReport();
  }

  nextPeriod(): void {
    this.currentStartDate.set(this.offsetDate(1));
    this.loadReport();
  }

  getDayTotal(dayOfWeek: number): number {
    const dist = this.report()?.distribution.find((d) => d.dayOfWeek === dayOfWeek);
    return dist ? dist.alcohol + dist.coffee : 0;
  }

  private loadReport(): void {
    this.port
      .getPeriodReport(this.selectedPeriod(), this.currentStartDate())
      .subscribe((report) => this.report.set(report));
  }

  private getThisMonday(): string {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    return monday.toISOString().slice(0, 10);
  }

  private offsetDate(direction: number): string {
    const date = new Date(this.currentStartDate() + 'T00:00:00');
    switch (this.selectedPeriod()) {
      case 'week':
        date.setDate(date.getDate() + direction * 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() + direction);
        break;
      case 'quarter':
        date.setMonth(date.getMonth() + direction * 3);
        break;
    }
    return date.toISOString().slice(0, 10);
  }
}
