import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import type {
  CreateEntryPayload,
  SebastianCategory,
  SebastianEntry,
  SebastianGoal,
  SebastianStats,
} from "../../core/models/sebastian.model";
import {
  SEBASTIAN_PORT,
  type SebastianPort,
} from "../../core/ports/sebastian.port";
import { SebastianAddDrinkSheetComponent } from "./components/sebastian-add-drink-sheet.component";

/**
 * Shell du majordome Sebastian.
 * Affiche l'en-tete avec ajout rapide, les compteurs journaliers,
 * la barre d'onglets et le router-outlet pour les pages enfant.
 */
@Component({
  selector: "app-sebastian-app",
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    SebastianAddDrinkSheetComponent,
  ],
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

        <!-- Contenu des pages enfant (router-outlet pour les routes nestees) -->
        <main>
          <router-outlet />
        </main>
      </div>
    </div>

    <!-- FAB Ajout -->
    <div class="fixed bottom-6 right-6 z-40">
      <button
        type="button"
        class="flex h-14 w-14 items-center justify-center rounded-full bg-scheme-accent text-2xl font-bold text-scheme-on-accent shadow-lg transition-transform hover:scale-110 hover:bg-scheme-accent-hover"
        (click)="addSheetOpen.set(true)"
        aria-label="Ajouter une consommation"
      >
        +
      </button>
    </div>

    <!-- Bottom Sheet Ajout -->
    <app-sebastian-add-drink-sheet
      [open]="addSheetOpen()"
      [recentEntries]="recentEntries()"
      (openChange)="addSheetOpen.set($event)"
      (addDrink)="onAddDrink($event)"
    />
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

  /** Controle l'ouverture du bottom sheet d'ajout. */
  readonly addSheetOpen = signal(false);

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

  /** 3 dernieres entrees distinctes par drinkType pour le quick-add. */
  readonly recentEntries = computed(() => {
    const seen = new Set<string>();
    const recents: SebastianEntry[] = [];
    for (const entry of this.entries()) {
      const key = entry.drinkType ?? entry.category;
      if (!seen.has(key)) {
        seen.add(key);
        recents.push(entry);
      }
      if (recents.length >= 3) break;
    }
    return recents;
  });

  constructor() {
    this.loadData();
  }

  /** Callback quand le bottom sheet emet un ajout. */
  onAddDrink(payload: CreateEntryPayload): void {
    this.port.addEntry(payload).subscribe((entry) => {
      this.entries.update((list) => [entry, ...list]);
      this.triggerPulse(entry.category as SebastianCategory);
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
