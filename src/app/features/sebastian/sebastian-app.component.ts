import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";
import type {
  SebastianCategory,
  SebastianDrinkType,
  SebastianEntry,
  SebastianGoal,
  SebastianStats,
} from "../../core/models/sebastian.model";
import {
  SEBASTIAN_PORT,
  type SebastianPort,
} from "../../core/ports/sebastian.port";

/**
 * Shell du majordome Sebastian.
 * Affiche l'en-tete avec ajout rapide, les compteurs journaliers,
 * la barre d'onglets et le router-outlet pour les pages enfant.
 */
@Component({
  selector: "app-sebastian-app",
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <div
      class="min-h-screen bg-scheme-background px-4 py-8 font-body sm:px-6 lg:px-8"
    >
      <div class="mx-auto max-w-7xl">
        <!-- Header -->
        <header class="mb-8 text-center">
          <h1
            class="mb-2 font-heading text-4xl font-bold text-scheme-text"
            i18n="sebastian.title|@@sebastianTitle"
          >
            Sebastian
          </h1>
          <p
            class="text-lg text-scheme-text-muted"
            i18n="sebastian.description|@@sebastianDescription"
          >
            Votre majordome de suivi de consommation
          </p>
        </header>

        <!-- Ajout rapide -->
        <section class="mb-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            class="flex items-center gap-2 rounded-button border border-scheme-border bg-scheme-surface px-5 py-3 text-base font-semibold text-scheme-warning transition-all hover:bg-scheme-surface-hover"
            [class.animate-pulse]="alcoholPulse()"
            (click)="quickAddDrink('beer')"
          >
            +1 Biere
          </button>
          <button
            type="button"
            class="flex items-center gap-2 rounded-button border border-scheme-border bg-scheme-surface px-5 py-3 text-base font-semibold text-red-400 transition-all hover:bg-scheme-surface-hover"
            [class.animate-pulse]="alcoholPulse()"
            (click)="quickAddDrink('wine')"
          >
            +1 Vin
          </button>
          <button
            type="button"
            class="flex items-center gap-2 rounded-button border border-scheme-border bg-scheme-surface px-5 py-3 text-base font-semibold text-yellow-400 transition-all hover:bg-scheme-surface-hover"
            [class.animate-pulse]="alcoholPulse()"
            (click)="quickAddDrink('champagne')"
          >
            +1 Champagne
          </button>
          <button
            type="button"
            class="flex items-center gap-2 rounded-button border border-scheme-border bg-scheme-surface px-5 py-3 text-base font-semibold text-scheme-accent-active transition-all hover:bg-scheme-surface-hover"
            [class.animate-pulse]="coffeePulse()"
            (click)="quickAddDrink('coffee')"
          >
            +1 Cafe
          </button>
        </section>

        <!-- Compteurs journaliers -->
        <section class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <!-- Compteur Alcool -->
          <div
            class="rounded-card border border-scheme-border bg-scheme-surface p-4 shadow-xs"
          >
            <div class="mb-2 flex items-center justify-between">
              <span
                class="font-heading text-sm font-semibold text-scheme-warning"
                i18n="sebastian.counter.alcohol|@@sebastianCounterAlcohol"
                >Alcool aujourd'hui</span
              >
              <span class="text-2xl font-bold text-scheme-warning">{{
                todayAlcohol()
              }}</span>
            </div>
            @if (dailyAlcoholGoal(); as goal) {
              <div
                class="mb-1 flex justify-between text-xs text-scheme-text-muted"
              >
                <span i18n="sebastian.counter.goal|@@sebastianCounterGoal"
                  >Objectif</span
                >
                <span>{{ todayAlcohol() }}/{{ goal.targetQuantity }}</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-scheme-border">
                <div
                  class="h-full rounded-full bg-scheme-warning transition-all duration-500"
                  [style.width.%]="alcoholProgress()"
                ></div>
              </div>
            }
          </div>

          <!-- Compteur Cafe -->
          <div
            class="rounded-card border border-scheme-border bg-scheme-surface p-4 shadow-xs"
          >
            <div class="mb-2 flex items-center justify-between">
              <span
                class="font-heading text-sm font-semibold text-scheme-accent-active"
                i18n="sebastian.counter.coffee|@@sebastianCounterCoffee"
                >Cafe aujourd'hui</span
              >
              <span class="text-2xl font-bold text-scheme-accent-active">{{
                todayCoffee()
              }}</span>
            </div>
            @if (dailyCoffeeGoal(); as goal) {
              <div
                class="mb-1 flex justify-between text-xs text-scheme-text-muted"
              >
                <span i18n="sebastian.counter.goal|@@sebastianCounterGoal"
                  >Objectif</span
                >
                <span>{{ todayCoffee() }}/{{ goal.targetQuantity }}</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-scheme-border">
                <div
                  class="h-full rounded-full bg-scheme-accent-active transition-all duration-500"
                  [style.width.%]="coffeeProgress()"
                ></div>
              </div>
            }
          </div>
        </section>

        <!-- Barre d'onglets -->
        <nav
          class="mb-6 flex gap-1 overflow-x-auto border-b border-scheme-border px-4"
        >
          @for (tab of tabs; track tab.route) {
            <a
              [routerLink]="tab.route"
              routerLinkActive="text-scheme-accent border-b-2 border-scheme-accent"
              class="whitespace-nowrap px-4 py-2 font-heading text-scheme-text-muted transition-colors hover:text-scheme-text"
            >
              {{ tab.label }}
            </a>
          }
        </nav>

        <!-- Contenu des pages enfant (projete depuis sebastian.component) -->
        <main>
          <ng-content />
        </main>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SebastianAppComponent {
  private readonly port: SebastianPort = inject(SEBASTIAN_PORT);

  /** Configuration des onglets de navigation. */
  readonly tabs = [
    { label: "Dashboard", route: "dashboard" },
    { label: "Rapports", route: "rapports" },
    { label: "Badges", route: "badges" },
    { label: "Historique", route: "historique" },
    { label: "Objectifs", route: "objectifs" },
  ] as const;

  /** Toutes les entrees chargees. */
  readonly entries = signal<SebastianEntry[]>([]);

  /** Objectifs actifs. */
  readonly goals = signal<SebastianGoal[]>([]);

  /** Statistiques de la semaine. */
  readonly stats = signal<SebastianStats | null>(null);

  /** Animations pulse apres ajout rapide. */
  readonly alcoholPulse = signal(false);
  readonly coffeePulse = signal(false);

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
  }

  /** Valeurs par defaut pour chaque type de boisson. */
  private readonly drinkDefaults: Record<
    SebastianDrinkType,
    { category: SebastianCategory; alcoholDegree: number; volumeCl: number }
  > = {
    beer: { category: "alcohol", alcoholDegree: 5, volumeCl: 25 },
    wine: { category: "alcohol", alcoholDegree: 12, volumeCl: 12.5 },
    champagne: { category: "alcohol", alcoholDegree: 12, volumeCl: 12.5 },
    cocktail: { category: "alcohol", alcoholDegree: 15, volumeCl: 20 },
    spiritueux: { category: "alcohol", alcoholDegree: 40, volumeCl: 4 },
    cidre: { category: "alcohol", alcoholDegree: 5, volumeCl: 25 },
    coffee: { category: "coffee", alcoholDegree: 0, volumeCl: 0 },
  };

  /** Ajout rapide d'une consommation par type de boisson. */
  quickAddDrink(drinkType: SebastianDrinkType): void {
    const defaults = this.drinkDefaults[drinkType];
    const payload = {
      category: defaults.category,
      quantity: 1,
      date: this.todayIso(),
      drinkType,
      alcoholDegree: defaults.alcoholDegree || undefined,
      volumeCl: defaults.volumeCl || undefined,
    };
    this.port.addEntry(payload).subscribe((entry) => {
      this.entries.update((list) => [entry, ...list]);
      this.triggerPulse(defaults.category);
    });
  }

  /** Retourne la date du jour au format ISO (YYYY-MM-DD). */
  private todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }

  /** Charge les donnees initiales (entrees, objectifs, stats). */
  private loadData(): void {
    this.port.getEntries().subscribe((entries) => this.entries.set(entries));
    this.port.getGoals().subscribe((goals) => this.goals.set(goals));
    this.port.getStats("week").subscribe((stats) => this.stats.set(stats));
  }

  /** Declenche l'animation pulse sur le bouton correspondant. */
  private triggerPulse(category: SebastianCategory): void {
    const sig = category === "alcohol" ? this.alcoholPulse : this.coffeePulse;
    sig.set(true);
    setTimeout(() => sig.set(false), 600);
  }
}
