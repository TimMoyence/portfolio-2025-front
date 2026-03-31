import { isPlatformBrowser } from "@angular/common";
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  LOCALE_ID,
  OnChanges,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
} from "@angular/core";
import { Chart, Filler, registerables } from "chart.js";
import type { HistoricalData } from "../../../../core/models/weather.model";

Chart.register(...registerables, Filler);

/**
 * Carte de comparaison historique des temperatures.
 * Affiche les temperatures moyennes journalieres des 30 derniers jours
 * avec une zone min/max et une ligne de reference pour la temperature actuelle.
 * Compatible SSR : le graphique n'est rendu que cote navigateur.
 */
@Component({
  selector: "app-historical-comparison",
  standalone: true,
  template: `
    <div
      class="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md"
    >
      <h3
        class="mb-4 text-lg font-semibold text-white"
        i18n="weather.historical.title|@@weatherHistoricalTitle"
      >
        Historique (30 jours)
      </h3>
      <div class="relative h-64 w-full">
        <canvas #chartCanvas></canvas>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoricalComparisonComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  /** Donnees historiques journalieres. */
  readonly historical = input<HistoricalData | null>(null);

  /** Temperature actuelle pour la ligne de reference horizontale. */
  readonly currentTemp = input<number>(0);

  @ViewChild("chartCanvas", { static: true })
  chartCanvas!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;
  private readonly platformId = inject(PLATFORM_ID);
  private readonly localeId = inject(LOCALE_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  ngAfterViewInit(): void {
    this.buildChart();
  }

  ngOnChanges(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    this.buildChart();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.chart = null;
  }

  /** Construit le graphique Chart.js avec historique, zone min/max et reference. */
  private buildChart(): void {
    if (!this.isBrowser) return;

    const data = this.historical();
    if (!data) return;

    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return;

    const labels = data.daily.time.map((t) => {
      const date = new Date(t);
      return date.toLocaleDateString(this.localeId, {
        day: "2-digit",
        month: "short",
      });
    });

    const meanTemps = data.daily.temperature_2m_mean;
    const maxTemps = data.daily.temperature_2m_max;
    const minTemps = data.daily.temperature_2m_min;
    const currentTempValue = this.currentTemp();

    // Ligne de reference horizontale pour la temperature actuelle
    const refLine = new Array(labels.length).fill(currentTempValue);

    this.chart = new Chart(canvas, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: $localize`:weather.historical.max|@@weatherHistoricalMax:Max`,
            data: maxTemps,
            borderColor: "rgba(239, 68, 68, 0.4)",
            backgroundColor: "rgba(239, 68, 68, 0.08)",
            borderWidth: 1,
            pointRadius: 0,
            fill: "+1",
            tension: 0.3,
          },
          {
            label: $localize`:weather.historical.min|@@weatherHistoricalMin:Min`,
            data: minTemps,
            borderColor: "rgba(59, 130, 246, 0.4)",
            backgroundColor: "transparent",
            borderWidth: 1,
            pointRadius: 0,
            fill: false,
            tension: 0.3,
          },
          {
            label: $localize`:weather.historical.mean|@@weatherHistoricalMean:Moyenne`,
            data: meanTemps,
            borderColor: "rgba(255, 255, 255, 0.9)",
            backgroundColor: "transparent",
            borderWidth: 2,
            pointRadius: 1,
            fill: false,
            tension: 0.3,
          },
          {
            label: $localize`:weather.historical.current|@@weatherHistoricalCurrent:Actuelle`,
            data: refLine,
            borderColor: "rgba(250, 204, 21, 0.7)",
            backgroundColor: "transparent",
            borderWidth: 2,
            borderDash: [6, 3],
            pointRadius: 0,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          legend: {
            labels: {
              color: "rgba(255, 255, 255, 0.7)",
              font: { size: 11 },
            },
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            titleColor: "white",
            bodyColor: "white",
          },
        },
        scales: {
          x: {
            ticks: {
              color: "rgba(255, 255, 255, 0.6)",
              maxRotation: 45,
              font: { size: 10 },
            },
            grid: { color: "rgba(255, 255, 255, 0.1)" },
          },
          y: {
            ticks: {
              color: "rgba(255, 255, 255, 0.6)",
              callback: (value) => `${value}°`,
            },
            grid: { color: "rgba(255, 255, 255, 0.1)" },
          },
        },
      },
    });
  }
}
