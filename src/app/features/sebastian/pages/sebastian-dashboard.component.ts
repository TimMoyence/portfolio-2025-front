import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type {
  SebastianBacResult,
  SebastianHealthScore,
  SebastianTrendData,
} from '../../../core/models/sebastian.model';
import { SEBASTIAN_PORT, type SebastianPort } from '../../../core/ports/sebastian.port';
import { SebastianBacCurveComponent } from '../components/sebastian-bac-curve.component';
import { SebastianScoreCardComponent } from '../components/sebastian-score-card.component';
import { SebastianTrendChartComponent } from '../components/sebastian-trend-chart.component';

/**
 * Page dashboard Sebastian.
 * Affiche le score de sante, les tendances 7j et 30j,
 * et un resume mensuel.
 */
@Component({
  selector: 'app-sebastian-dashboard',
  standalone: true,
  imports: [
    SebastianBacCurveComponent,
    SebastianScoreCardComponent,
    SebastianTrendChartComponent,
    RouterLink,
  ],
  template: `
    <!--
      Dashboard App Sebastian — thème "dark lounge ambré" porté de la maquette
      AsiliNewDesign/sebastian-app.html + asili-app.css : .panel (glass
      bg-white/4 + bordure ambrée rgba(230,170,70,0.14), titre font-display),
      .bac/.bac-info (en-tête alcoolémie), .barchart (graphes de tendance).
      Restyle 100 % visuel : seuils BAC 0.25/0.5, formatTime, bloc conditionnel
      score/invitation, datasets Chart.js et strings assertées (« Taux
      d'alcoolemie », « 7 derniers jours », « 30 derniers jours », « Moy.
      alcool », « Moy. cafe ») conservés à l'identique (décision 6).
    -->
    <div class="space-y-6">
      <!-- Score card ou invitation a definir un objectif -->
      @if (healthScore(); as score) {
        @if (score.score === 0 && score.phase === 1) {
          <div
            class="rounded-[20px] border border-[rgba(230,170,70,0.14)] bg-white/[0.04] p-6 text-center"
          >
            <p class="mb-3 text-white/55">{{ score.message }}</p>
            <a
              routerLink="../objectifs"
              class="inline-block rounded-full bg-gold px-6 py-2 font-semibold text-[#1a1206] transition-colors hover:bg-gold-soft"
            >
              Definir un objectif
            </a>
          </div>
        } @else {
          <div class="flex items-start justify-between gap-4">
            <app-sebastian-score-card class="flex-1" [score]="score" />
            <a
              routerLink="../objectifs"
              class="mt-2 whitespace-nowrap rounded-full border border-[rgba(230,170,70,0.14)] px-4 py-2 text-sm text-white/55 transition-colors hover:border-[rgba(230,170,70,0.35)] hover:text-white"
            >
              Modifier les objectifs
            </a>
          </div>
        }
      }

      <!-- Taux d'alcoolemie (en-tête .bac/.bac-info, seuils couleur 0.25/0.5) -->
      @if (bacResult(); as bac) {
        <section class="rounded-[20px] border border-[rgba(230,170,70,0.14)] bg-white/[0.04] p-6">
          <h3 class="mb-3 font-display text-2xl text-white">Taux d'alcoolemie</h3>
          <div class="mb-3 flex items-center gap-4">
            <span
              class="font-display text-4xl leading-none"
              [class]="
                bac.currentBac >= 0.5
                  ? 'text-red-500'
                  : bac.currentBac >= 0.25
                    ? 'text-orange-400'
                    : 'text-green-500'
              "
            >
              {{ bac.currentBac.toFixed(2) }} g/L
            </span>
            @if (bac.estimatedSoberAt) {
              <span class="text-sm text-white/55">
                Sobriete estimee : {{ formatTime(bac.estimatedSoberAt) }}
              </span>
            }
          </div>
          @if (bac.curve.length > 0) {
            <app-sebastian-bac-curve [data]="bac" />
          }
        </section>
      }

      <!-- Grille des graphiques de tendance (.panel glass + barchart gold) -->
      <div class="grid gap-6 md:grid-cols-2">
        <section class="rounded-[20px] border border-[rgba(230,170,70,0.14)] bg-white/[0.04] p-6">
          <h3 class="mb-3 font-display text-2xl text-white">7 derniers jours</h3>
          @if (trends7d()) {
            <app-sebastian-trend-chart [data]="trends7d()!" />
          }
        </section>
        <section class="rounded-[20px] border border-[rgba(230,170,70,0.14)] bg-white/[0.04] p-6">
          <h3 class="mb-3 font-display text-2xl text-white">30 derniers jours</h3>
          @if (trends30d()) {
            <app-sebastian-trend-chart [data]="trends30d()!" />
          }
          <!-- Resume mensuel sous le graphe 30d -->
          @if (trends30d()) {
            <div class="mt-3 flex justify-between text-sm text-white/55">
              <span class="font-mono">Moy. alcool : {{ trends30d()!.summary.avgAlcohol }}/j</span>
              <span class="font-mono">Moy. cafe : {{ trends30d()!.summary.avgCoffee }}/j</span>
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

  /** Resultat BAC courant. */
  readonly bacResult = signal<SebastianBacResult | null>(null);

  /** Tendances sur 7 jours. */
  readonly trends7d = signal<SebastianTrendData | null>(null);

  /** Tendances sur 30 jours. */
  readonly trends30d = signal<SebastianTrendData | null>(null);

  constructor() {
    this.loadData();
  }

  /** Charge les donnees initiales (score, BAC, tendances 7d et 30d). */
  private loadData(): void {
    this.port.getHealthScore().subscribe((score) => this.healthScore.set(score));
    this.port.getBac().subscribe((bac) => this.bacResult.set(bac));
    this.port.getTrends('7d').subscribe((trends) => this.trends7d.set(trends));
    this.port.getTrends('30d').subscribe((trends) => this.trends30d.set(trends));
  }

  /** Formate une date ISO en HH:MM. */
  formatTime(iso: string): string {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
}
