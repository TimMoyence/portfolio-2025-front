import { isPlatformBrowser } from "@angular/common";
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  LOCALE_ID,
  OnDestroy,
  PLATFORM_ID,
  signal,
  ViewChild,
} from "@angular/core";
import { Chart, registerables } from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import "hammerjs";
import type { HourlyForecast } from "../../../../core/models/weather.model";
import { UnitPreferencesService } from "../../services/unit-preferences.service";
import { CHART_PARAMETERS } from "./chart-datasets.config";

Chart.register(...registerables, zoomPlugin);

/**
 * Composant affichant un graphique horaire des temperatures et precipitations.
 * Utilise Chart.js avec un guard SSR pour le rendu cote navigateur uniquement.
 * Reactif aux preferences d'unites de temperature (celsius/fahrenheit).
 */
@Component({
  selector: "app-hourly-chart",
  standalone: true,
  template: `
    <div
      class="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md"
    >
      <div class="mb-4 flex items-center justify-between">
        <h3
          class="text-lg font-semibold text-white"
          i18n="weather.hourly.title|@@weatherHourlyTitle"
        >
          Prévisions horaires
        </h3>
        <!-- Selecteur de plage temporelle -->
        <nav
          class="inline-flex rounded-xl border border-white/20 bg-white/10 p-0.5"
          role="tablist"
        >
          @for (range of timeRangeOptions; track range) {
            <button
              type="button"
              role="tab"
              [attr.aria-selected]="timeRange() === range"
              class="rounded-lg px-2 py-0.5 text-xs font-medium transition-all"
              [class]="
                timeRange() === range
                  ? 'bg-white/25 text-white shadow-sm'
                  : 'text-white/60 hover:text-white/80'
              "
              (click)="setTimeRange(range)"
            >
              {{ range }}h
            </button>
          }
        </nav>
      </div>
      <!-- Toggles parametres -->
      <div class="mb-3 flex flex-wrap gap-1.5">
        @for (param of availableParams; track param.id) {
          <button
            type="button"
            class="rounded-lg px-2.5 py-1 text-xs font-medium transition-all"
            [class]="
              visibleParams().has(param.id)
                ? 'bg-white/20 text-white'
                : 'text-white/40 hover:text-white/60'
            "
            [style.border-left]="
              visibleParams().has(param.id)
                ? '2px solid ' + param.borderColor
                : '2px solid transparent'
            "
            (click)="toggleParam(param.id)"
          >
            {{ param.label }}
          </button>
        }
      </div>
      <div class="relative h-40 w-full md:h-64">
        <canvas #chartCanvas></canvas>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HourlyChartComponent implements AfterViewInit, OnDestroy {
  /** Donnees de prevision horaire. */
  readonly hourly = input<HourlyForecast | null>(null);

  /** Plage temporelle selectionnee (en heures). */
  readonly timeRange = signal<6 | 12 | 24 | 48>(24);

  /** Options de plage temporelle disponibles. */
  readonly timeRangeOptions = [6, 12, 24, 48] as const;

  /** Ensemble des parametres actuellement visibles sur le graphique. */
  readonly visibleParams = signal<Set<string>>(
    new Set(CHART_PARAMETERS.filter((p) => p.defaultVisible).map((p) => p.id)),
  );

  /** Liste des parametres disponibles pour les toggles. */
  readonly availableParams = CHART_PARAMETERS;

  @ViewChild("chartCanvas", { static: true })
  chartCanvas!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;
  private readonly platformId = inject(PLATFORM_ID);
  private readonly localeId = inject(LOCALE_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly unitService = inject(UnitPreferencesService);

  /** Flag pour empecher l'effect de builder avant que le ViewChild soit pret. */
  private initialized = false;

  constructor() {
    // Effect reactif : rebuild le chart quand les donnees, l'unite ou la plage changent
    effect(() => {
      // Lecture des signaux pour creer les dependances reactives
      this.hourly();
      this.unitService.temperatureUnit();
      this.timeRange();
      this.visibleParams();

      // Rebuild uniquement si le composant est initialise (ViewChild pret)
      if (this.initialized) {
        if (this.chart) {
          this.chart.destroy();
          this.chart = null;
        }
        this.buildChart();
      }
    });
  }

  /** Met a jour la plage temporelle affichee dans le graphique. */
  setTimeRange(range: 6 | 12 | 24 | 48): void {
    this.timeRange.set(range);
  }

  /** Active ou desactive un parametre sur le graphique (minimum 1 visible). */
  toggleParam(id: string): void {
    this.visibleParams.update((set) => {
      const next = new Set(set);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  ngAfterViewInit(): void {
    this.initialized = true;
    this.buildChart();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.chart = null;
  }

  /** Construit le graphique Chart.js avec les donnees horaires. */
  private buildChart(): void {
    if (!this.isBrowser || !this.initialized) return;

    const data = this.hourly();
    if (!data) return;

    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return;

    const tempUnit = this.unitService.temperatureUnit();
    const isFahrenheit = tempUnit === "fahrenheit";

    // Limiter au nombre d'heures selectionne
    const count = Math.min(this.timeRange(), data.time.length);
    const labels = data.time.slice(0, count).map((t) => {
      const date = new Date(t);
      return date.toLocaleTimeString(this.localeId, {
        hour: "2-digit",
        minute: "2-digit",
      });
    });

    // Construction dynamique des datasets selon les parametres visibles
    const visible = this.visibleParams();
    const datasets = CHART_PARAMETERS.filter((p) => visible.has(p.id))
      .map((param) => {
        const rawData = data[param.dataKey] as number[] | undefined;
        if (!rawData) return null;

        let chartData = rawData.slice(0, count);
        // Conversion temperature si necessaire
        if (param.id === "temperature" && isFahrenheit) {
          chartData = chartData.map((t) => Math.round((t * 9) / 5 + 32));
        }

        return {
          type: param.type as "line" | "bar",
          label:
            param.id === "temperature"
              ? isFahrenheit
                ? `${param.label} (°F)`
                : `${param.label} (°C)`
              : `${param.label} (${param.unit})`,
          data: chartData,
          borderColor: param.borderColor,
          backgroundColor: param.backgroundColor,
          borderWidth: 2,
          pointRadius: param.type === "line" ? 2 : undefined,
          pointBackgroundColor:
            param.type === "line" ? param.borderColor : undefined,
          tension: param.type === "line" ? 0.3 : undefined,
          fill: param.type === "line",
          yAxisID: param.yAxisID,
        };
      })
      .filter((d): d is NonNullable<typeof d> => d !== null);

    // Construction dynamique des axes Y selon les parametres visibles
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scales: Record<string, any> = {
      x: {
        ticks: {
          color: "rgba(255, 255, 255, 0.6)",
          maxRotation: 45,
          font: { size: 10 },
        },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
      },
    };

    for (const param of CHART_PARAMETERS) {
      if (!visible.has(param.id)) continue;
      scales[param.yAxisID] = {
        position: param.yAxisID === "y" ? "left" : "right",
        display: param.yAxisID === "y" || param.yAxisID === "y1",
        ticks: {
          color: param.borderColor.replace("0.9", "0.7").replace("0.8", "0.7"),
          callback: (value: number) => {
            if (param.id === "temperature")
              return isFahrenheit ? `${value}°F` : `${value}°`;
            if (param.unit) return `${value}${param.unit}`;
            return String(value);
          },
        },
        grid: {
          display: param.yAxisID === "y",
          color: "rgba(255,255,255,0.1)",
        },
        beginAtZero: param.id !== "temperature",
      };
    }

    this.chart = new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets,
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
          zoom: {
            pan: {
              enabled: true,
              mode: "x",
            },
            zoom: {
              wheel: { enabled: true },
              pinch: { enabled: true },
              mode: "x",
            },
          },
        },
        scales,
      },
    });
  }
}
