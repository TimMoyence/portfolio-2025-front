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
import { buildDarkLineChartOptions, buildReferenceLineDataset } from './sebastian-chart.utils';

Chart.register(...registerables);

@Component({
  selector: 'app-sebastian-trend-chart',
  standalone: true,
  template: `<canvas #chartCanvas class="w-full" style="max-height: 300px"></canvas>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SebastianTrendChartComponent implements OnDestroy {
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
          buildReferenceLineDataset(
            'Obj. alcool',
            trendData.objectives.alcohol,
            trendData.dataPoints.length,
            '#f4d18a',
          ),
          buildReferenceLineDataset(
            'Obj. cafe',
            trendData.objectives.coffee,
            trendData.dataPoints.length,
            '#f4d18a',
          ),
        ],
      },
      options: buildDarkLineChartOptions(),
    });
  }
}
