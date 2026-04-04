import { isPlatformBrowser, DatePipe, DecimalPipe } from "@angular/common";
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  type OnDestroy,
  PLATFORM_ID,
  signal,
  viewChild,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Chart, registerables } from "chart.js";
import type {
  CreateGoalPayload,
  SebastianCategory,
  SebastianEntry,
  SebastianGoal,
  SebastianPeriod,
  SebastianStats,
} from "../../core/models/sebastian.model";
import {
  SEBASTIAN_PORT,
  type SebastianPort,
} from "../../core/ports/sebastian.port";

Chart.register(...registerables);

/**
 * Dashboard complet du majordome Sebastian.
 * Suivi de consommation (alcool, cafe) avec graphiques Chart.js,
 * compteurs journaliers, objectifs et historique.
 */
@Component({
  selector: "app-sebastian-app",
  standalone: true,
  imports: [FormsModule, DatePipe, DecimalPipe],
  template: `
    <div
      class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 px-4 py-8 sm:px-6 lg:px-8"
    >
      <div class="mx-auto max-w-7xl">
        <!-- Header -->
        <header class="mb-8 text-center">
          <h1
            class="mb-2 text-4xl font-bold text-white"
            i18n="sebastian.title|@@sebastianTitle"
          >
            Sebastian
          </h1>
          <p
            class="text-lg text-white/70"
            i18n="sebastian.description|@@sebastianDescription"
          >
            Votre majordome de suivi de consommation
          </p>
        </header>

        <!-- Ajout rapide -->
        <section class="mb-8 flex justify-center gap-4">
          <button
            type="button"
            class="flex items-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-500/20 px-6 py-3 text-lg font-semibold text-amber-400 backdrop-blur-xl transition-all hover:bg-amber-500/30"
            [class.animate-pulse]="alcoholPulse()"
            (click)="quickAdd('alcohol')"
            i18n="sebastian.quickAdd.alcohol|@@sebastianQuickAddAlcohol"
          >
            +1 Alcool 🍺
          </button>
          <button
            type="button"
            class="flex items-center gap-2 rounded-2xl border border-violet-400/30 bg-violet-500/20 px-6 py-3 text-lg font-semibold text-violet-400 backdrop-blur-xl transition-all hover:bg-violet-500/30"
            [class.animate-pulse]="coffeePulse()"
            (click)="quickAdd('coffee')"
            i18n="sebastian.quickAdd.coffee|@@sebastianQuickAddCoffee"
          >
            +1 Café ☕
          </button>
        </section>

        <!-- Grille principale -->
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <!-- Compteur du jour : Alcool -->
          <div
            class="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl"
          >
            <div class="mb-3 flex items-center justify-between">
              <h2 class="text-lg font-semibold text-amber-400">
                🍺
                <span i18n="sebastian.counter.alcohol|@@sebastianCounterAlcohol"
                  >Alcool aujourd'hui</span
                >
              </h2>
              <span class="text-2xl font-bold text-amber-400">{{
                todayAlcohol()
              }}</span>
            </div>
            @if (dailyAlcoholGoal(); as goal) {
              <div class="mb-1 flex justify-between text-sm text-white/60">
                <span i18n="sebastian.counter.goal|@@sebastianCounterGoal"
                  >Objectif</span
                >
                <span>{{ todayAlcohol() }}/{{ goal.targetQuantity }}</span>
              </div>
              <div class="h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  class="h-full rounded-full bg-amber-400 transition-all duration-500"
                  [style.width.%]="alcoholProgress()"
                ></div>
              </div>
            } @else {
              <p
                class="text-sm text-white/40"
                i18n="sebastian.counter.noGoal|@@sebastianCounterNoGoal"
              >
                Aucun objectif défini
              </p>
            }
          </div>

          <!-- Compteur du jour : Cafe -->
          <div
            class="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl"
          >
            <div class="mb-3 flex items-center justify-between">
              <h2 class="text-lg font-semibold text-violet-400">
                ☕
                <span i18n="sebastian.counter.coffee|@@sebastianCounterCoffee"
                  >Café aujourd'hui</span
                >
              </h2>
              <span class="text-2xl font-bold text-violet-400">{{
                todayCoffee()
              }}</span>
            </div>
            @if (dailyCoffeeGoal(); as goal) {
              <div class="mb-1 flex justify-between text-sm text-white/60">
                <span i18n="sebastian.counter.goal|@@sebastianCounterGoal"
                  >Objectif</span
                >
                <span>{{ todayCoffee() }}/{{ goal.targetQuantity }}</span>
              </div>
              <div class="h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  class="h-full rounded-full bg-violet-400 transition-all duration-500"
                  [style.width.%]="coffeeProgress()"
                ></div>
              </div>
            } @else {
              <p
                class="text-sm text-white/40"
                i18n="sebastian.counter.noGoal|@@sebastianCounterNoGoal"
              >
                Aucun objectif défini
              </p>
            }
          </div>

          <!-- Stats semaine -->
          <div
            class="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl"
          >
            <h2
              class="mb-4 text-lg font-semibold text-white"
              i18n="sebastian.stats.weekTitle|@@sebastianStatsWeekTitle"
            >
              Statistiques de la semaine
            </h2>
            @if (stats(); as s) {
              @for (cat of s.byCategory; track cat.category) {
                <div class="mb-3">
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-white/70">{{
                      cat.category === "alcohol" ? "🍺 Alcool" : "☕ Café"
                    }}</span>
                    <span
                      class="font-semibold"
                      [class]="
                        cat.category === 'alcohol'
                          ? 'text-amber-400'
                          : 'text-violet-400'
                      "
                    >
                      {{ cat.total }}
                      <span class="text-xs text-white/40"
                        >(moy. {{ cat.average | number: "1.1-1" }})</span
                      >
                    </span>
                  </div>
                  <div class="mt-1 flex items-center gap-1 text-xs">
                    @if (cat.trend > 0) {
                      <span class="text-red-400">↑ {{ cat.trend }}%</span>
                    } @else if (cat.trend < 0) {
                      <span class="text-green-400"
                        >↓ {{ cat.trend * -1 }}%</span
                      >
                    } @else {
                      <span class="text-white/40">— 0%</span>
                    }
                    <span
                      class="text-white/40"
                      i18n="
                        sebastian.stats.vsPrevious|@@sebastianStatsVsPrevious"
                      >vs semaine précédente</span
                    >
                  </div>
                </div>
              }
            } @else {
              <p
                class="text-sm text-white/40"
                i18n="sebastian.loading|@@sebastianLoading"
              >
                Chargement...
              </p>
            }
          </div>

          <!-- Graphe hebdomadaire -->
          <div
            class="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl md:col-span-2 lg:col-span-2"
          >
            <h2
              class="mb-4 text-lg font-semibold text-white"
              i18n="sebastian.chart.weekTitle|@@sebastianChartWeekTitle"
            >
              7 derniers jours
            </h2>
            <div class="relative h-48 w-full md:h-64">
              <canvas #weeklyChart></canvas>
            </div>
          </div>

          <!-- Graphe mensuel -->
          <div
            class="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl md:col-span-2 lg:col-span-1"
          >
            <h2
              class="mb-4 text-lg font-semibold text-white"
              i18n="sebastian.chart.monthTitle|@@sebastianChartMonthTitle"
            >
              30 derniers jours
            </h2>
            <div class="relative h-48 w-full md:h-64">
              <canvas #monthlyChart></canvas>
            </div>
          </div>

          <!-- Historique -->
          <div
            class="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl md:col-span-2 lg:col-span-2"
          >
            <h2
              class="mb-4 text-lg font-semibold text-white"
              i18n="sebastian.history.title|@@sebastianHistoryTitle"
            >
              Historique récent
            </h2>
            <div class="max-h-64 overflow-y-auto">
              @for (entry of entries(); track entry.id) {
                <div
                  class="mb-2 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div class="flex items-center gap-3">
                    <span class="text-xl">{{
                      entry.category === "alcohol" ? "🍺" : "☕"
                    }}</span>
                    <div>
                      <span class="font-medium text-white"
                        >{{ entry.quantity }}
                        {{
                          entry.category === "alcohol" ? "verre(s)" : "tasse(s)"
                        }}</span
                      >
                      <p class="text-xs text-white/40">
                        {{ entry.date | date: "dd/MM/yyyy" }}
                        @if (entry.notes) {
                          — {{ entry.notes }}
                        }
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="rounded-lg px-2 py-1 text-sm text-red-400 transition-colors hover:bg-red-400/20"
                    (click)="removeEntry(entry.id)"
                    i18n="sebastian.history.delete|@@sebastianHistoryDelete"
                  >
                    Supprimer
                  </button>
                </div>
              } @empty {
                <p
                  class="text-center text-sm text-white/40"
                  i18n="sebastian.history.empty|@@sebastianHistoryEmpty"
                >
                  Aucune entrée enregistrée
                </p>
              }
            </div>
          </div>

          <!-- Gestion des objectifs -->
          <div
            class="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl"
          >
            <h2
              class="mb-4 text-lg font-semibold text-white"
              i18n="sebastian.goals.title|@@sebastianGoalsTitle"
            >
              Objectifs
            </h2>

            <!-- Formulaire ajout objectif -->
            <div class="mb-4 space-y-3">
              <select
                class="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white"
                [(ngModel)]="goalCategory"
              >
                <option
                  value="alcohol"
                  i18n="sebastian.goals.alcohol|@@sebastianGoalsAlcohol"
                >
                  Alcool
                </option>
                <option
                  value="coffee"
                  i18n="sebastian.goals.coffee|@@sebastianGoalsCoffee"
                >
                  Café
                </option>
              </select>
              <input
                type="number"
                min="1"
                class="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40"
                [(ngModel)]="goalQuantity"
                i18n-placeholder="
                  sebastian.goals.quantityPlaceholder|@@sebastianGoalsQuantityPlaceholder"
                placeholder="Quantité max"
              />
              <select
                class="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white"
                [(ngModel)]="goalPeriod"
              >
                <option
                  value="daily"
                  i18n="sebastian.goals.daily|@@sebastianGoalsDaily"
                >
                  Quotidien
                </option>
                <option
                  value="weekly"
                  i18n="sebastian.goals.weekly|@@sebastianGoalsWeekly"
                >
                  Hebdomadaire
                </option>
                <option
                  value="monthly"
                  i18n="sebastian.goals.monthly|@@sebastianGoalsMonthly"
                >
                  Mensuel
                </option>
              </select>
              <button
                type="button"
                class="w-full rounded-xl bg-violet-500/30 px-4 py-2 text-sm font-semibold text-violet-300 transition-colors hover:bg-violet-500/40"
                (click)="addGoal()"
                i18n="sebastian.goals.add|@@sebastianGoalsAdd"
              >
                Définir l'objectif
              </button>
            </div>

            <!-- Liste objectifs actifs -->
            @for (goal of goals(); track goal.id) {
              <div
                class="mb-2 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2"
              >
                <div>
                  <span class="text-sm font-medium text-white">
                    {{ goal.category === "alcohol" ? "🍺" : "☕" }}
                    {{ goal.targetQuantity }}/{{
                      goal.period === "daily"
                        ? "jour"
                        : goal.period === "weekly"
                          ? "sem."
                          : "mois"
                    }}
                  </span>
                </div>
                <button
                  type="button"
                  class="text-xs text-red-400 hover:text-red-300"
                  (click)="removeGoal(goal.id)"
                >
                  ✕
                </button>
              </div>
            } @empty {
              <p
                class="text-center text-xs text-white/40"
                i18n="sebastian.goals.empty|@@sebastianGoalsEmpty"
              >
                Aucun objectif actif
              </p>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SebastianAppComponent implements OnDestroy {
  private readonly port: SebastianPort = inject(SEBASTIAN_PORT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /** Toutes les entrees chargees. */
  readonly entries = signal<SebastianEntry[]>([]);

  /** Objectifs actifs. */
  readonly goals = signal<SebastianGoal[]>([]);

  /** Statistiques de la semaine. */
  readonly stats = signal<SebastianStats | null>(null);

  /** Animations pulse apres ajout rapide. */
  readonly alcoholPulse = signal(false);
  readonly coffeePulse = signal(false);

  /** Champs du formulaire objectif. */
  goalCategory: SebastianCategory = "coffee";
  goalQuantity = 3;
  goalPeriod: SebastianPeriod = "daily";

  /** References aux canvas Chart.js. */
  private readonly weeklyChartRef =
    viewChild<ElementRef<HTMLCanvasElement>>("weeklyChart");
  private readonly monthlyChartRef =
    viewChild<ElementRef<HTMLCanvasElement>>("monthlyChart");

  private weeklyChartInstance: Chart | null = null;
  private monthlyChartInstance: Chart | null = null;

  /** Total alcool du jour. */
  readonly todayAlcohol = computed(() =>
    this.entries()
      .filter((e) => e.category === "alcohol" && e.date === this.todayIso())
      .reduce((sum, e) => sum + e.quantity, 0),
  );

  /** Total cafe du jour. */
  readonly todayCoffee = computed(() =>
    this.entries()
      .filter((e) => e.category === "coffee" && e.date === this.todayIso())
      .reduce((sum, e) => sum + e.quantity, 0),
  );

  /** Objectif alcool quotidien. */
  readonly dailyAlcoholGoal = computed(
    () =>
      this.goals().find(
        (g) => g.category === "alcohol" && g.period === "daily" && g.isActive,
      ) ?? null,
  );

  /** Objectif cafe quotidien. */
  readonly dailyCoffeeGoal = computed(
    () =>
      this.goals().find(
        (g) => g.category === "coffee" && g.period === "daily" && g.isActive,
      ) ?? null,
  );

  /** Progression alcool en pourcentage. */
  readonly alcoholProgress = computed(() => {
    const goal = this.dailyAlcoholGoal();
    if (!goal) return 0;
    return Math.min(100, (this.todayAlcohol() / goal.targetQuantity) * 100);
  });

  /** Progression cafe en pourcentage. */
  readonly coffeeProgress = computed(() => {
    const goal = this.dailyCoffeeGoal();
    if (!goal) return 0;
    return Math.min(100, (this.todayCoffee() / goal.targetQuantity) * 100);
  });

  constructor() {
    this.loadData();

    afterNextRender(() => {
      this.buildWeeklyChart();
      this.buildMonthlyChart();
    });
  }

  ngOnDestroy(): void {
    this.weeklyChartInstance?.destroy();
    this.monthlyChartInstance?.destroy();
  }

  /** Ajout rapide d'une consommation. */
  quickAdd(category: SebastianCategory): void {
    const payload = {
      category,
      quantity: 1,
      date: this.todayIso(),
    };
    this.port.addEntry(payload).subscribe((entry) => {
      this.entries.update((list) => [entry, ...list]);
      this.triggerPulse(category);
      this.refreshCharts();
    });
  }

  /** Supprime une entree. */
  removeEntry(id: string): void {
    this.port.deleteEntry(id).subscribe(() => {
      this.entries.update((list) => list.filter((e) => e.id !== id));
      this.refreshCharts();
    });
  }

  /** Ajoute un objectif. */
  addGoal(): void {
    const payload: CreateGoalPayload = {
      category: this.goalCategory,
      targetQuantity: this.goalQuantity,
      period: this.goalPeriod,
    };
    this.port.setGoal(payload).subscribe((goal) => {
      this.goals.update((list) => [...list, goal]);
    });
  }

  /** Supprime un objectif. */
  removeGoal(id: string): void {
    this.port.deleteGoal(id).subscribe(() => {
      this.goals.update((list) => list.filter((g) => g.id !== id));
    });
  }

  /** Retourne la date du jour au format ISO (YYYY-MM-DD). */
  private todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }

  /** Charge les donnees initiales (entrees, objectifs, stats). */
  private loadData(): void {
    this.port.getEntries().subscribe((entries) => {
      this.entries.set(entries);
      if (this.isBrowser) {
        this.buildWeeklyChart();
        this.buildMonthlyChart();
      }
    });
    this.port.getGoals().subscribe((goals) => this.goals.set(goals));
    this.port.getStats("week").subscribe((stats) => this.stats.set(stats));
  }

  /** Declenche l'animation pulse sur le bouton correspondant. */
  private triggerPulse(category: SebastianCategory): void {
    const sig = category === "alcohol" ? this.alcoholPulse : this.coffeePulse;
    sig.set(true);
    setTimeout(() => sig.set(false), 600);
  }

  /** Reconstruit les deux graphiques apres modification des donnees. */
  private refreshCharts(): void {
    if (!this.isBrowser) return;
    this.buildWeeklyChart();
    this.buildMonthlyChart();
  }

  /** Construit le graphique en barres des 7 derniers jours. */
  private buildWeeklyChart(): void {
    if (!this.isBrowser) return;
    const canvas = this.weeklyChartRef()?.nativeElement;
    if (!canvas) return;

    if (this.weeklyChartInstance) {
      this.weeklyChartInstance.destroy();
      this.weeklyChartInstance = null;
    }

    const { labels, alcoholData, coffeeData } = this.aggregateByDay(7);

    this.weeklyChartInstance = new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Alcool",
            data: alcoholData,
            backgroundColor: "rgba(245, 158, 11, 0.6)",
            borderColor: "rgba(245, 158, 11, 0.9)",
            borderWidth: 1,
            borderRadius: 4,
          },
          {
            label: "Café",
            data: coffeeData,
            backgroundColor: "rgba(139, 92, 246, 0.6)",
            borderColor: "rgba(139, 92, 246, 0.9)",
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: this.chartOptions(),
    });
  }

  /** Construit le graphique en lignes des 30 derniers jours. */
  private buildMonthlyChart(): void {
    if (!this.isBrowser) return;
    const canvas = this.monthlyChartRef()?.nativeElement;
    if (!canvas) return;

    if (this.monthlyChartInstance) {
      this.monthlyChartInstance.destroy();
      this.monthlyChartInstance = null;
    }

    const { labels, alcoholData, coffeeData } = this.aggregateByDay(30);

    this.monthlyChartInstance = new Chart(canvas, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Alcool",
            data: alcoholData,
            borderColor: "rgba(245, 158, 11, 0.9)",
            backgroundColor: "rgba(245, 158, 11, 0.1)",
            borderWidth: 2,
            pointRadius: 2,
            tension: 0.3,
            fill: true,
          },
          {
            label: "Café",
            data: coffeeData,
            borderColor: "rgba(139, 92, 246, 0.9)",
            backgroundColor: "rgba(139, 92, 246, 0.1)",
            borderWidth: 2,
            pointRadius: 2,
            tension: 0.3,
            fill: true,
          },
        ],
      },
      options: this.chartOptions(),
    });
  }

  /**
   * Agregue les entrees par jour sur les N derniers jours.
   * Retourne les labels, donnees alcool et cafe.
   */
  private aggregateByDay(days: number): {
    labels: string[];
    alcoholData: number[];
    coffeeData: number[];
  } {
    const labels: string[] = [];
    const alcoholData: number[] = [];
    const coffeeData: number[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const shortLabel = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
      labels.push(shortLabel);
      alcoholData.push(
        this.entries()
          .filter((e) => e.category === "alcohol" && e.date === iso)
          .reduce((s, e) => s + e.quantity, 0),
      );
      coffeeData.push(
        this.entries()
          .filter((e) => e.category === "coffee" && e.date === iso)
          .reduce((s, e) => s + e.quantity, 0),
      );
    }
    return { labels, alcoholData, coffeeData };
  }

  /** Options partagees pour les graphiques Chart.js avec style glassmorphism. */
  private chartOptions(): Chart["options"] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index" as const, intersect: false },
      plugins: {
        legend: {
          labels: { color: "rgba(255, 255, 255, 0.7)", font: { size: 11 } },
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
          beginAtZero: true,
          ticks: { color: "rgba(255, 255, 255, 0.6)", font: { size: 10 } },
          grid: { color: "rgba(255, 255, 255, 0.1)" },
        },
      },
    };
  }
}
