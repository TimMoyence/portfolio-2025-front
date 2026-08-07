import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  type OnDestroy,
  viewChild,
} from '@angular/core';
import { Chart, registerables } from 'chart.js';
import type { SebastianTrendData } from '../../../core/models/sebastian.model';

Chart.register(...registerables);

/**
 * Graphique de tendance Sebastian (ligne).
 * Affiche les courbes alcool, cafe et les objectifs sous forme de lignes en pointilles.
 * SSR-safe : le Chart.js est initialise uniquement via afterNextRender().
 */
@Component({
  selector: 'app-sebastian-trend-chart',
  standalone: true,
  template: `<canvas #chartCanvas class="w-full" style="max-height: 300px"></canvas>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SebastianTrendChartComponent implements OnDestroy {
  /** Donnees de tendance a afficher. */
  readonly data = input.required<SebastianTrendData>();

  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');
  private chartInstance: Chart | null = null;

  constructor() {
    afterNextRender(() => {
      this.buildChart();
    });
  }

  ngOnDestroy(): void {
    this.chartInstance?.destroy();
    this.chartInstance = null;
  }

  /** Construit le graphique Chart.js avec les datasets et objectifs. */
  private buildChart(): void {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return;

    const trendData = this.data();
    const labels = trendData.dataPoints.map((dp) => {
      const d = new Date(dp.date);
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    });

    const is30d = trendData.period === '30d';

    this.chartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        // Palette Asili dark lounge ambré (maquette asili-app.css, décisions 5/6) :
        // alcool = --gold (#e6aa46), café = --gold-deep (#b8822c, teinte ambre
        // foncée), objectifs = ambré pointillé. Seules les COULEURS changent —
        // datasets, tension, fill et labels conservés à l'identique.
        datasets: [
          {
            label: 'Alcool',
            data: trendData.dataPoints.map((dp) => dp.alcohol),
            borderColor: '#e6aa46',
            backgroundColor: is30d ? 'rgba(230, 170, 70, 0.10)' : 'transparent',
            borderWidth: 2,
            pointRadius: 3,
            tension: 0.3,
            fill: is30d,
          },
          {
            label: 'Cafe',
            data: trendData.dataPoints.map((dp) => dp.coffee),
            borderColor: '#b8822c',
            backgroundColor: is30d ? 'rgba(184, 130, 44, 0.08)' : 'transparent',
            borderWidth: 2,
            pointRadius: 3,
            tension: 0.3,
            fill: is30d,
          },
          {
            label: 'Obj. alcool',
            data: Array(trendData.dataPoints.length).fill(trendData.objectives.alcohol),
            borderColor: '#f4d18a',
            borderWidth: 1,
            borderDash: [8, 4],
            pointRadius: 0,
            fill: false,
          },
          {
            label: 'Obj. cafe',
            data: Array(trendData.dataPoints.length).fill(trendData.objectives.coffee),
            borderColor: '#f4d18a',
            borderWidth: 1,
            borderDash: [8, 4],
            pointRadius: 0,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          // Thème dark : libellés/ticks/grid en rgba(255,255,255,…) — décision 6.
          legend: {
            labels: {
              color: 'rgba(255, 255, 255, 0.8)',
              font: { size: 11 },
            },
          },
          tooltip: {
            backgroundColor: 'rgba(12, 9, 2, 0.85)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
          },
        },
        scales: {
          x: {
            ticks: {
              color: 'rgba(255, 255, 255, 0.6)',
              maxRotation: 45,
              font: { size: 10 },
            },
            grid: { color: 'rgba(255, 255, 255, 0.08)' },
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: 'rgba(255, 255, 255, 0.6)',
              font: { size: 10 },
            },
            grid: { color: 'rgba(255, 255, 255, 0.08)' },
          },
        },
      },
    });
  }
}
