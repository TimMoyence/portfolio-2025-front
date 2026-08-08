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
import type { SebastianBacResult } from '../../../core/models/sebastian.model';
import {
  buildDarkLineChartOptions,
  buildReferenceLineDataset,
  formatBloodAlcoholTooltip,
} from './sebastian-chart.utils';

Chart.register(...registerables);

@Component({
  selector: 'app-sebastian-bac-curve',
  standalone: true,
  template: `<canvas #chartCanvas class="w-full" style="max-height: 250px"></canvas>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SebastianBacCurveComponent implements OnDestroy {
  readonly data = input.required<SebastianBacResult>();

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

    const bacData = this.data();
    if (bacData.curve.length === 0) return;

    const labels = bacData.curve.map((p) => {
      const d = new Date(p.time);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    });

    this.chartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'BAC (g/L)',
            data: bacData.curve.map((p) => p.bac),
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.4,
            fill: true,
          },
          buildReferenceLineDataset(
            'Limite legale',
            bacData.legalLimit,
            bacData.curve.length,
            '#dc2626',
          ),
        ],
      },
      options: buildDarkLineChartOptions({ label: formatBloodAlcoholTooltip }),
    });
  }
}
