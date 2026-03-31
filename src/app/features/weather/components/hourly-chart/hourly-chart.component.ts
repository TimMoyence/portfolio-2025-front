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
import { Chart, registerables } from "chart.js";
import type { HourlyForecast } from "../../../../core/models/weather.model";

Chart.register(...registerables);

/**
 * Composant affichant un graphique horaire des temperatures et precipitations.
 * Utilise Chart.js avec un guard SSR pour le rendu cote navigateur uniquement.
 */
@Component({
  selector: "app-hourly-chart",
  standalone: true,
  template: `
    <div
      class="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md"
    >
      <h3
        class="mb-4 text-lg font-semibold text-white"
        i18n="weather.hourly.title|@@weatherHourlyTitle"
      >
        Prévisions horaires
      </h3>
      <div class="relative h-64 w-full">
        <canvas #chartCanvas></canvas>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HourlyChartComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  /** Donnees de prevision horaire (prochaines 24h). */
  readonly hourly = input<HourlyForecast | null>(null);

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

  /** Construit le graphique Chart.js avec les donnees horaires. */
  private buildChart(): void {
    if (!this.isBrowser) return;

    const data = this.hourly();
    if (!data) return;

    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return;

    // Limiter aux prochaines 24 heures
    const labels = data.time.slice(0, 24).map((t) => {
      const date = new Date(t);
      return date.toLocaleTimeString(this.localeId, {
        hour: "2-digit",
        minute: "2-digit",
      });
    });
    const temps = data.temperature_2m.slice(0, 24);
    const precip = data.precipitation.slice(0, 24);

    this.chart = new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            type: "line",
            label: "Température (°C)",
            data: temps,
            borderColor: "rgba(255, 255, 255, 0.9)",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            borderWidth: 2,
            pointRadius: 2,
            pointBackgroundColor: "rgba(255, 255, 255, 0.9)",
            tension: 0.3,
            fill: true,
            yAxisID: "y",
          },
          {
            type: "bar",
            label: "Précipitations (mm)",
            data: precip,
            backgroundColor: "rgba(96, 165, 250, 0.5)",
            borderColor: "rgba(96, 165, 250, 0.8)",
            borderWidth: 1,
            yAxisID: "y1",
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
            position: "left",
            ticks: {
              color: "rgba(255, 255, 255, 0.6)",
              callback: (value) => `${value}°`,
            },
            grid: { color: "rgba(255, 255, 255, 0.1)" },
          },
          y1: {
            position: "right",
            ticks: {
              color: "rgba(96, 165, 250, 0.7)",
              callback: (value) => `${value}mm`,
            },
            grid: { display: false },
            beginAtZero: true,
          },
        },
      },
    });
  }
}
