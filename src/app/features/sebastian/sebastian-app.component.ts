import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import type {
  CreateEntryPayload,
  SebastianCategory,
  SebastianEntry,
  SebastianGoal,
  SebastianStats,
} from '../../core/models/sebastian.model';
import { SEBASTIAN_PORT, type SebastianPort } from '../../core/ports/sebastian.port';
import { SebastianAddDrinkSheetComponent } from './components/sebastian-add-drink-sheet.component';

/**
 * Shell du majordome Sebastian.
 * Affiche l'en-tete avec ajout rapide, les compteurs journaliers,
 * la barre d'onglets et le router-outlet pour les pages enfant.
 */
@Component({
  selector: 'app-sebastian-app',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, SebastianAddDrinkSheetComponent],
  template: `
    <!--
      Shell App Sebastian — thème "dark lounge ambré" porté de la maquette
      AsiliNewDesign/sebastian-app.html + asili-app.css :
      .seb-app { --app-bg:#14100a }, .seb-pagehead, .seb-cards, .sc (sk/sv),
      .app-pill, .seb-nav button(.on). Décision nav (3) = OPTION A : on conserve
      l'ossature réelle (header + barre d'onglets HORIZONTALE + router-outlet)
      et on lui applique le STYLE Asili (pas la sidebar .seb-side, qui ferait
      double chrome avec la navbar globale conservée — décisions Lot 3f/4).
      Tokens : --gold/--gold-soft/--gold-deep, --font-display (Instrument Serif),
      --font-mono (Geist Mono), opacités ambrées rgba(230,170,70,x) de la maquette.
    -->
    <div class="min-h-screen bg-[#14100a] px-4 py-8 font-sans sm:px-6 lg:px-8">
      <div class="mx-auto max-w-7xl">
        <!-- Header — titre display, sous-titre mono ambré (.seb-pagehead h1/.sub) -->
        <header class="mb-8 text-center">
          <h1
            class="mb-2 font-display text-4xl text-white sm:text-5xl"
            i18n="sebastian.title|@@sebastianTitle"
          >
            Sebastian
          </h1>
          <p class="text-lg text-white/55" i18n="sebastian.description|@@sebastianDescription">
            Votre majordome de suivi de consommation
          </p>
        </header>

        <!-- Compteurs journaliers (format .sc Asili : sk mono / sv display / barre gold) -->
        <section class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <!-- Compteur Alcool -->
          <div
            class="rounded-[20px] border border-[rgba(230,170,70,0.14)] bg-white/[0.04] p-5 transition-colors duration-300 hover:border-[rgba(230,170,70,0.35)]"
          >
            <div class="mb-2 flex items-center justify-between">
              <span
                class="font-mono text-[10.5px] uppercase tracking-[0.12em] text-gold-soft"
                i18n="sebastian.counter.alcohol|@@sebastianCounterAlcohol"
                >Alcool aujourd'hui</span
              >
              <span class="font-display text-4xl leading-none text-white">{{
                todayAlcohol()
              }}</span>
            </div>
            @if (dailyAlcoholGoal(); as goal) {
              <div class="mb-1 flex justify-between text-xs text-white/45">
                <span
                  class="font-mono uppercase tracking-[0.08em]"
                  i18n="sebastian.counter.goal|@@sebastianCounterGoal"
                  >Objectif</span
                >
                <span>{{ todayAlcohol() }}/{{ goal.targetQuantity }}</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-[rgba(230,170,70,0.12)]">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-gold to-gold-soft transition-all duration-500"
                  [style.width.%]="alcoholProgress()"
                ></div>
              </div>
            }
          </div>

          <!-- Compteur Cafe (décision 5 : café conservé, teinte gold-deep) -->
          <div
            class="rounded-[20px] border border-[rgba(230,170,70,0.14)] bg-white/[0.04] p-5 transition-colors duration-300 hover:border-[rgba(230,170,70,0.35)]"
          >
            <div class="mb-2 flex items-center justify-between">
              <span
                class="font-mono text-[10.5px] uppercase tracking-[0.12em] text-gold-deep"
                i18n="sebastian.counter.coffee|@@sebastianCounterCoffee"
                >Cafe aujourd'hui</span
              >
              <span class="font-display text-4xl leading-none text-white">{{ todayCoffee() }}</span>
            </div>
            @if (dailyCoffeeGoal(); as goal) {
              <div class="mb-1 flex justify-between text-xs text-white/45">
                <span
                  class="font-mono uppercase tracking-[0.08em]"
                  i18n="sebastian.counter.goal|@@sebastianCounterGoal"
                  >Objectif</span
                >
                <span>{{ todayCoffee() }}/{{ goal.targetQuantity }}</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-[rgba(230,170,70,0.12)]">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-gold-deep to-gold transition-all duration-500"
                  [style.width.%]="coffeeProgress()"
                ></div>
              </div>
            }
          </div>
        </section>

        <!-- Barre d'onglets restylée (pills ambrés, état actif gold .seb-nav button.on) -->
        <nav class="mb-6 flex gap-1.5 overflow-x-auto border-b border-[rgba(230,170,70,0.14)] pb-2">
          @for (tab of tabs; track tab.route) {
            <a
              [routerLink]="tab.route"
              routerLinkActive="!bg-[rgba(230,170,70,0.16)] !text-gold-soft"
              class="whitespace-nowrap rounded-full px-4 py-2 font-mono text-sm text-white/62 transition-colors duration-200 hover:bg-[rgba(230,170,70,0.08)] hover:text-white"
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

    <!-- FAB Ajout — gold glow (cercle ambré lumineux) -->
    <div class="fixed bottom-6 right-6 z-40">
      <button
        type="button"
        class="flex h-14 w-14 items-center justify-center rounded-full bg-gold text-2xl font-bold text-[#1a1206] shadow-[0_0_24px_rgba(230,170,70,0.5)] transition-transform duration-300 hover:scale-110 hover:bg-gold-soft motion-reduce:transition-none"
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
    { label: 'Dashboard', route: 'dashboard' },
    { label: 'Rapports', route: 'rapports' },
    { label: 'Badges', route: 'badges' },
    { label: 'Historique', route: 'historique' },
    { label: 'Objectifs', route: 'objectifs' },
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
      .filter((e) => e.category === 'alcohol' && e.date === this.todayIso())
      .reduce((sum, e) => sum + e.quantity, 0),
  );

  /** Total cafe du jour. */
  readonly todayCoffee = computed(() =>
    this.entries()
      .filter((e) => e.category === 'coffee' && e.date === this.todayIso())
      .reduce((sum, e) => sum + e.quantity, 0),
  );

  /** Objectif alcool quotidien. */
  readonly dailyAlcoholGoal = computed(
    () =>
      this.goals().find((g) => g.category === 'alcohol' && g.period === 'daily' && g.isActive) ??
      null,
  );

  /** Objectif cafe quotidien. */
  readonly dailyCoffeeGoal = computed(
    () =>
      this.goals().find((g) => g.category === 'coffee' && g.period === 'daily' && g.isActive) ??
      null,
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
    this.port.getStats('week').subscribe((stats) => this.stats.set(stats));
  }

  /** Declenche l'animation pulse sur le bouton correspondant. */
  private triggerPulse(category: SebastianCategory): void {
    const sig = category === 'alcohol' ? this.alcoholPulse : this.coffeePulse;
    sig.set(true);
    setTimeout(() => sig.set(false), 600);
  }
}
