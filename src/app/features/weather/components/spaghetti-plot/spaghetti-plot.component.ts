import { isPlatformBrowser } from '@angular/common';
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
} from '@angular/core';
import { Chart, registerables } from 'chart.js';
import type { EnsembleData } from '../../../../core/models/weather.model';

Chart.register(...registerables);

const MODEL_COLORS: Record<string, string> = {
  ECMWF: 'rgba(79, 179, 162, 0.9)',
  GFS: 'rgba(91, 140, 255, 0.9)',
  ICON: 'rgba(143, 176, 255, 0.9)',
};

@Component({
  selector: 'app-spaghetti-plot',
  standalone: true,
  template: `
    <div class="rounded-[20px] border border-teal/15 bg-white/5 p-6 backdrop-blur-xl">
      <h3
        class="mb-4 font-display text-xl font-normal text-white"
        i18n="weather.spaghettiPlot.title|@@weatherSpaghettiPlotTitle"
      >
        Comparaison des modèles (courbes)
      </h3>
      <div class="relative h-40 w-full md:h-64">
        <canvas #chartCanvas></canvas>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpaghettiPlotComponent implements AfterViewInit, OnChanges, OnDestroy {
  readonly ensemble = input<EnsembleData | null>(null);

  @ViewChild('chartCanvas', { static: true })
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

  private buildChart(): void {
    if (!this.isBrowser) return;

    const data = this.ensemble();
    if (!data || data.models.length === 0) return;

    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return;

    const firstModel = data.models[0];
    const labels = firstModel.hourly.time.slice(0, 24).map((t) => {
      const date = new Date(t);
      return date.toLocaleTimeString(this.localeId, {
        hour: '2-digit',
        minute: '2-digit',
      });
    });

    const datasets = data.models.map((m) => ({
      label: m.model,
      data: m.hourly.temperature_2m.slice(0, 24),
      borderColor: MODEL_COLORS[m.model] ?? 'rgba(255, 255, 255, 0.7)',
      backgroundColor: 'transparent',
      borderWidth: 2,
      pointRadius: 1,
      tension: 0.3,
      fill: false,
    }));

    this.chart = new Chart(canvas, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            labels: {
              color: 'rgba(255, 255, 255, 0.7)',
              font: { size: 11 },
            },
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            titleColor: 'white',
            bodyColor: 'white',
          },
        },
        scales: {
          x: {
            ticks: {
              color: 'rgba(255, 255, 255, 0.6)',
              maxRotation: 45,
              font: { size: 10 },
            },
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
          },
          y: {
            ticks: {
              color: 'rgba(255, 255, 255, 0.6)',
              callback: (value) => `${value}°`,
            },
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
          },
        },
      },
    });
  }
}
