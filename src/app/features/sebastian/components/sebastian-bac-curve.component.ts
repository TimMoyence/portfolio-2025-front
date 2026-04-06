import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  type OnDestroy,
  viewChild,
} from "@angular/core";
import { Chart, registerables } from "chart.js";
import type { SebastianBacResult } from "../../../core/models/sebastian.model";

Chart.register(...registerables);

/**
 * Courbe du taux d'alcoolemie (BAC) au cours de la journee.
 * Affiche une ligne de BAC avec une ligne pointillee rouge a 0.5 g/L (limite legale).
 * SSR-safe : le Chart.js est initialise uniquement via afterNextRender().
 */
@Component({
  selector: "app-sebastian-bac-curve",
  standalone: true,
  template: `<canvas
    #chartCanvas
    class="w-full"
    style="max-height: 250px"
  ></canvas>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SebastianBacCurveComponent implements OnDestroy {
  /** Donnees BAC a afficher. */
  readonly data = input.required<SebastianBacResult>();

  private readonly canvasRef =
    viewChild<ElementRef<HTMLCanvasElement>>("chartCanvas");
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

  /** Construit le graphique Chart.js avec la courbe BAC et la limite legale. */
  private buildChart(): void {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return;

    const bacData = this.data();
    if (bacData.curve.length === 0) return;

    const labels = bacData.curve.map((p) => {
      const d = new Date(p.time);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    });

    this.chartInstance = new Chart(canvas, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "BAC (g/L)",
            data: bacData.curve.map((p) => p.bac),
            borderColor: "#ef4444",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.4,
            fill: true,
          },
          {
            label: "Limite legale",
            data: Array(bacData.curve.length).fill(bacData.legalLimit),
            borderColor: "#dc2626",
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
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            labels: {
              color: "rgba(84, 82, 77, 0.8)",
              font: { size: 11 },
            },
          },
          tooltip: {
            backgroundColor: "rgba(12, 9, 2, 0.85)",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
            callbacks: {
              label: (ctx) =>
                `${ctx.dataset.label}: ${(ctx.parsed.y ?? 0).toFixed(3)} g/L`,
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color: "rgba(84, 82, 77, 0.6)",
              maxRotation: 45,
              font: { size: 10 },
            },
            grid: { color: "rgba(12, 9, 2, 0.06)" },
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: "rgba(84, 82, 77, 0.6)",
              font: { size: 10 },
            },
            grid: { color: "rgba(12, 9, 2, 0.06)" },
          },
        },
      },
    });
  }
}
