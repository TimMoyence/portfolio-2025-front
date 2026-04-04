import { isPlatformBrowser } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  type OnDestroy,
  PLATFORM_ID,
  ViewChild,
  afterNextRender,
  effect,
  inject,
  input,
} from "@angular/core";
import type { Chart, ChartConfiguration } from "chart.js";
import type { BudgetCategoryModel } from "../../../../core/models/budget.model";
import type { BudgetCategoryTotal } from "../budget-category-totals/budget-category-totals.component";

/**
 * Composant graphique affichant la repartition des depenses (Doughnut)
 * et la comparaison Budget vs Reel (Bar) via Chart.js.
 * SSR-safe : ne rend les canvas que cote navigateur.
 */
@Component({
  selector: "app-budget-chart",
  standalone: true,
  template: `
    @if (isBrowser) {
      <div class="grid gap-6 lg:grid-cols-2">
        <div class="rounded-[1.75rem] border border-black/10 bg-white/95 p-6">
          <h3
            class="text-lg font-bold text-slate-950"
            i18n="@@budgetChartDoughnutTitle"
          >
            Répartition des dépenses
          </h3>
          <canvas #doughnutCanvas></canvas>
        </div>
        <div class="rounded-[1.75rem] border border-black/10 bg-white/95 p-6">
          <h3
            class="text-lg font-bold text-slate-950"
            i18n="@@budgetChartBarTitle"
          >
            Budget vs Réel
          </h3>
          <canvas #barCanvas></canvas>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetChartComponent implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly categoryTotals = input<BudgetCategoryTotal[]>([]);
  readonly apiCategories = input<BudgetCategoryModel[]>([]);

  @ViewChild("doughnutCanvas") doughnutCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild("barCanvas") barCanvas?: ElementRef<HTMLCanvasElement>;

  private doughnutChart: Chart | null = null;
  private barChart: Chart | null = null;

  constructor() {
    if (this.isBrowser) {
      afterNextRender(() => this.renderCharts());
    }

    effect(() => {
      // Lire les inputs pour declencher le tracking
      const totals = this.categoryTotals();
      this.apiCategories();

      if (this.isBrowser && totals.length > 0 && this.doughnutCanvas) {
        // Detruire les charts existants avant de recreer
        this.doughnutChart?.destroy();
        this.barChart?.destroy();
        this.doughnutChart = null;
        this.barChart = null;
        this.renderCharts();
      }
    });
  }

  ngOnDestroy(): void {
    this.doughnutChart?.destroy();
    this.barChart?.destroy();
  }

  /** Instancie les graphiques Chart.js (import dynamique pour le tree-shaking). */
  private async renderCharts(): Promise<void> {
    const totals = this.categoryTotals();
    const cats = this.apiCategories();
    if (!totals.length) return;

    const chartJs = await import("chart.js");
    chartJs.Chart.register(
      chartJs.ArcElement,
      chartJs.BarElement,
      chartJs.CategoryScale,
      chartJs.LinearScale,
      chartJs.Tooltip,
      chartJs.Legend,
    );

    const labels = totals.map((t) => t.name);
    const factValues = totals.map((t) =>
      Number.parseFloat(t.fact.replace(/[^0-9.,-]/g, "").replace(",", ".")),
    );
    const planValues = totals.map((t) => {
      if (t.plan === "-") return 0;
      return Number.parseFloat(
        t.plan.replace(/[^0-9.,-]/g, "").replace(",", "."),
      );
    });

    const defaultColors = [
      "#22C55E",
      "#3B82F6",
      "#EF4444",
      "#F59E0B",
      "#8B5CF6",
      "#EC4899",
      "#14B8A6",
      "#F97316",
      "#6366F1",
      "#84CC16",
    ];

    const colors = labels.map((name, i) => {
      const apiCat = cats.find((c) => c.name === name);
      return apiCat?.color ?? defaultColors[i % defaultColors.length];
    });

    this.renderDoughnut(chartJs.Chart, labels, factValues, colors);
    this.renderBar(chartJs.Chart, labels, planValues, factValues);
  }

  /** Cree le graphique Doughnut (repartition des depenses). */
  private renderDoughnut(
    ChartCtor: typeof Chart,
    labels: string[],
    data: number[],
    colors: string[],
  ): void {
    const ctx = this.doughnutCanvas?.nativeElement?.getContext("2d");
    if (!ctx) return;

    const config: ChartConfiguration<"doughnut"> = {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: "#fff",
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom", labels: { padding: 16 } },
        },
      },
    };
    this.doughnutChart = new ChartCtor(ctx, config);
  }

  /** Cree le graphique Bar (plan vs reel). */
  private renderBar(
    ChartCtor: typeof Chart,
    labels: string[],
    planData: number[],
    factData: number[],
  ): void {
    const ctx = this.barCanvas?.nativeElement?.getContext("2d");
    if (!ctx) return;

    const config: ChartConfiguration<"bar"> = {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Plan",
            data: planData,
            backgroundColor: "rgba(59, 130, 246, 0.6)",
            borderColor: "#3B82F6",
            borderWidth: 1,
          },
          {
            label: "Réel",
            data: factData,
            backgroundColor: "rgba(239, 68, 68, 0.6)",
            borderColor: "#EF4444",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom", labels: { padding: 16 } },
        },
        scales: {
          y: { beginAtZero: true },
        },
      },
    };
    this.barChart = new ChartCtor(ctx, config);
  }
}
