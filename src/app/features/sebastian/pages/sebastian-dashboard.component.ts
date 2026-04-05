import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import type {
  SebastianHealthScore,
  SebastianTrendData,
} from "../../../core/models/sebastian.model";
import {
  SEBASTIAN_PORT,
  type SebastianPort,
} from "../../../core/ports/sebastian.port";
import { SebastianScoreCardComponent } from "../components/sebastian-score-card.component";
import { SebastianTrendChartComponent } from "../components/sebastian-trend-chart.component";

/**
 * Page dashboard Sebastian.
 * Affiche le score de sante, les tendances 7j et 30j,
 * et un resume mensuel.
 */
@Component({
  selector: "app-sebastian-dashboard",
  standalone: true,
  imports: [SebastianScoreCardComponent, SebastianTrendChartComponent],
  template: `
    <div class="space-y-6">
      <!-- Score card -->
      @if (healthScore()) {
        <app-sebastian-score-card [score]="healthScore()!" />
      }

      <!-- Grille des graphiques de tendance -->
      <div class="grid gap-6 md:grid-cols-2">
        <section
          class="rounded-card border border-scheme-border bg-scheme-surface p-4 shadow-xs"
        >
          <h3 class="mb-3 font-heading text-h5 text-scheme-text">
            7 derniers jours
          </h3>
          @if (trends7d()) {
            <app-sebastian-trend-chart [data]="trends7d()!" />
          }
        </section>
        <section
          class="rounded-card border border-scheme-border bg-scheme-surface p-4 shadow-xs"
        >
          <h3 class="mb-3 font-heading text-h5 text-scheme-text">
            30 derniers jours
          </h3>
          @if (trends30d()) {
            <app-sebastian-trend-chart [data]="trends30d()!" />
          }
          <!-- Resume mensuel sous le graphe 30d -->
          @if (trends30d()) {
            <div
              class="mt-3 flex justify-between text-small text-scheme-text-muted"
            >
              <span>Moy. alcool : {{ trends30d()!.summary.avgAlcohol }}/j</span>
              <span>Moy. cafe : {{ trends30d()!.summary.avgCoffee }}/j</span>
            </div>
          }
        </section>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SebastianDashboardComponent {
  private readonly port: SebastianPort = inject(SEBASTIAN_PORT);

  /** Score de sante courant. */
  readonly healthScore = signal<SebastianHealthScore | null>(null);

  /** Tendances sur 7 jours. */
  readonly trends7d = signal<SebastianTrendData | null>(null);

  /** Tendances sur 30 jours. */
  readonly trends30d = signal<SebastianTrendData | null>(null);

  constructor() {
    this.loadData();
  }

  /** Charge les donnees initiales (score, tendances 7d et 30d). */
  private loadData(): void {
    this.port
      .getHealthScore()
      .subscribe((score) => this.healthScore.set(score));
    this.port.getTrends("7d").subscribe((trends) => this.trends7d.set(trends));
    this.port
      .getTrends("30d")
      .subscribe((trends) => this.trends30d.set(trends));
  }
}
