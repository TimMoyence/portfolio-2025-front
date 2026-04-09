import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import type {
  CreateEntryPayload,
  SebastianDrinkType,
  SebastianEntry,
} from "../../../core/models/sebastian.model";
import { BottomSheetComponent } from "../../../shared/components/bottom-sheet/bottom-sheet.component";

/** Mode de selection temporelle pour l'heure de consommation. */
export type TimeMode = "now" | "30m" | "1h" | "yesterday-evening" | "custom";

/** Valeurs par defaut de degre et volume par type de boisson. */
const DRINK_DEFAULTS: Record<
  SebastianDrinkType,
  { category: "alcohol" | "coffee"; degree: number; volumeCl: number }
> = {
  beer: { category: "alcohol", degree: 5, volumeCl: 25 },
  wine: { category: "alcohol", degree: 12, volumeCl: 12.5 },
  champagne: { category: "alcohol", degree: 12, volumeCl: 12.5 },
  cocktail: { category: "alcohol", degree: 15, volumeCl: 20 },
  spiritueux: { category: "alcohol", degree: 40, volumeCl: 4 },
  cidre: { category: "alcohol", degree: 5, volumeCl: 25 },
  coffee: { category: "coffee", degree: 0, volumeCl: 0 },
};

/** Labels et icones pour l'affichage des types de boisson. */
const DRINK_UI: Record<
  SebastianDrinkType,
  { label: string; icon: string; colorClass: string }
> = {
  beer: { label: "Biere", icon: "🍺", colorClass: "text-scheme-warning" },
  wine: { label: "Vin", icon: "🍷", colorClass: "text-red-400" },
  champagne: {
    label: "Champagne",
    icon: "🥂",
    colorClass: "text-yellow-400",
  },
  cocktail: { label: "Cocktail", icon: "🍸", colorClass: "text-pink-400" },
  spiritueux: {
    label: "Spiritueux",
    icon: "🥃",
    colorClass: "text-amber-600",
  },
  cidre: { label: "Cidre", icon: "🍏", colorClass: "text-green-400" },
  coffee: {
    label: "Cafe",
    icon: "☕",
    colorClass: "text-scheme-accent-active",
  },
};

/** Liste ordonnee des types de boisson pour la grille de selection. */
const DRINK_TYPES: SebastianDrinkType[] = [
  "beer",
  "wine",
  "champagne",
  "cocktail",
  "spiritueux",
  "cidre",
  "coffee",
];

/** Options de temps predefinies. */
const TIME_OPTIONS: { mode: TimeMode; label: string }[] = [
  { mode: "now", label: "Maintenant" },
  { mode: "30m", label: "Il y a 30m" },
  { mode: "1h", label: "Il y a 1h" },
  { mode: "yesterday-evening", label: "Hier soir" },
  { mode: "custom", label: "Personnalise" },
];

/**
 * Bottom sheet d'ajout de boisson pour le module Sebastian.
 * Permet de selectionner un type de boisson, quantite, degre, volume,
 * heure de consommation et notes avant d'emettre un payload de creation.
 */
@Component({
  selector: "app-sebastian-add-drink-sheet",
  standalone: true,
  imports: [BottomSheetComponent, FormsModule],
  template: `
    <app-bottom-sheet
      [open]="open()"
      [title]="'Ajouter une boisson'"
      (openChange)="openChange.emit($event)"
    >
      <div class="space-y-5">
        <!-- Recents -->
        @if (recentEntries().length > 0) {
          <section>
            <h4 class="mb-2 text-sm font-semibold text-white/60">Recents</h4>
            <div class="flex flex-wrap gap-2">
              @for (entry of recentEntries(); track entry.id) {
                <button
                  type="button"
                  data-testid="recent-chip"
                  class="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white transition-colors hover:bg-white/10"
                  (click)="quickAddRecent(entry)"
                >
                  <span>{{ drinkIcon(entry.drinkType) }}</span>
                  <span>{{ drinkLabel(entry.drinkType) }}</span>
                  @if (entry.alcoholDegree) {
                    <span class="text-white/40"
                      >{{ entry.alcoholDegree }}%</span
                    >
                  }
                </button>
              }
            </div>
          </section>

          <!-- Separateur -->
          <div class="border-t border-white/10"></div>
        }

        <!-- Type de boisson -->
        <section>
          <h4 class="mb-2 text-sm font-semibold text-white/60">Type</h4>
          <div class="grid grid-cols-4 gap-2 md:grid-cols-7">
            @for (type of drinkTypes; track type) {
              <button
                type="button"
                [attr.data-testid]="'drink-type-' + type"
                class="flex flex-col items-center gap-1 rounded-xl border p-2 text-center transition-all"
                [class]="
                  selectedDrinkType() === type
                    ? 'border-white/30 bg-white/10 ' + drinkUi[type].colorClass
                    : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                "
                (click)="selectDrinkType(type)"
              >
                <span class="text-xl">{{ drinkUi[type].icon }}</span>
                <span class="text-xs">{{ drinkUi[type].label }}</span>
              </button>
            }
          </div>
        </section>

        <!-- Quantite -->
        <section>
          <h4 class="mb-2 text-sm font-semibold text-white/60">Quantite</h4>
          <div class="flex items-center gap-4">
            <button
              type="button"
              data-testid="quantity-decrement"
              class="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-white transition-colors hover:bg-white/10"
              (click)="decrementQuantity()"
            >
              -
            </button>
            <span
              data-testid="quantity-value"
              class="min-w-[2rem] text-center text-2xl font-bold text-white"
            >
              {{ quantity() }}
            </span>
            <button
              type="button"
              data-testid="quantity-increment"
              class="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-white transition-colors hover:bg-white/10"
              (click)="incrementQuantity()"
            >
              +
            </button>
          </div>
        </section>

        <!-- Degre + Volume (masques pour coffee) -->
        @if (selectedDrinkType() !== "coffee") {
          <section>
            <div class="grid grid-cols-2 gap-4">
              <!-- Degre -->
              <div>
                <h4 class="mb-2 text-sm font-semibold text-white/60">
                  Degre (%)
                </h4>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    data-testid="degree-decrement"
                    class="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm text-white transition-colors hover:bg-white/10"
                    (click)="degree.set(Math.max(0, degree() - 0.5))"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    data-testid="degree-input"
                    class="w-16 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-center text-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    [ngModel]="degree()"
                    (ngModelChange)="degree.set($event)"
                    step="0.5"
                    min="0"
                  />
                  <button
                    type="button"
                    data-testid="degree-increment"
                    class="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm text-white transition-colors hover:bg-white/10"
                    (click)="degree.set(degree() + 0.5)"
                  >
                    +
                  </button>
                </div>
              </div>

              <!-- Volume -->
              <div>
                <h4 class="mb-2 text-sm font-semibold text-white/60">
                  Volume (cL)
                </h4>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    data-testid="volume-decrement"
                    class="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm text-white transition-colors hover:bg-white/10"
                    (click)="volumeCl.set(Math.max(0, volumeCl() - 1))"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    data-testid="volume-input"
                    class="w-16 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-center text-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    [ngModel]="volumeCl()"
                    (ngModelChange)="volumeCl.set($event)"
                    step="1"
                    min="0"
                  />
                  <button
                    type="button"
                    data-testid="volume-increment"
                    class="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm text-white transition-colors hover:bg-white/10"
                    (click)="volumeCl.set(volumeCl() + 1)"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </section>
        }

        <!-- Quand -->
        <section>
          <h4 class="mb-2 text-sm font-semibold text-white/60">Quand</h4>
          <div class="flex flex-wrap gap-2">
            @for (opt of timeOptions; track opt.mode) {
              <button
                type="button"
                [attr.data-testid]="'time-' + opt.mode"
                class="rounded-full border px-3 py-1.5 text-sm transition-all"
                [class]="
                  timeMode() === opt.mode
                    ? 'border-white/30 bg-white/10 text-white'
                    : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                "
                (click)="timeMode.set(opt.mode)"
              >
                {{ opt.label }}
              </button>
            }
          </div>

          @if (timeMode() === "custom") {
            <div class="mt-3 flex gap-3">
              <input
                type="date"
                data-testid="custom-date"
                class="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white"
                [ngModel]="customDate()"
                (ngModelChange)="customDate.set($event)"
              />
              <input
                type="time"
                data-testid="custom-time"
                class="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white"
                [ngModel]="customTime()"
                (ngModelChange)="customTime.set($event)"
              />
            </div>
          }
        </section>

        <!-- Notes -->
        <section>
          <h4 class="mb-2 text-sm font-semibold text-white/60">Notes</h4>
          <input
            type="text"
            data-testid="notes-input"
            placeholder="Ajouter une note..."
            class="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30"
            [ngModel]="notes()"
            (ngModelChange)="notes.set($event)"
          />
        </section>

        <!-- Bouton submit -->
        <button
          type="button"
          data-testid="submit-button"
          class="w-full rounded-xl bg-scheme-accent px-4 py-3 font-semibold text-white transition-colors hover:bg-scheme-accent-active"
          (click)="submit()"
        >
          Ajouter {{ quantity() }}
          {{ drinkUi[selectedDrinkType()].icon }}
          {{ drinkUi[selectedDrinkType()].label }}
        </button>
      </div>
    </app-bottom-sheet>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SebastianAddDrinkSheetComponent {
  /** Controle l'ouverture du bottom sheet. */
  readonly open = input(false);

  /** Entrees recentes pour le raccourci d'ajout rapide. */
  readonly recentEntries = input<SebastianEntry[]>([]);

  /** Emis quand l'etat ouvert/ferme change. */
  readonly openChange = output<boolean>();

  /** Emis quand l'utilisateur valide l'ajout d'une boisson. */
  readonly addDrink = output<CreateEntryPayload>();

  /** Type de boisson selectionne. */
  readonly selectedDrinkType = signal<SebastianDrinkType>("beer");

  /** Quantite de boissons. */
  readonly quantity = signal(1);

  /** Degre d'alcool. */
  readonly degree = signal(DRINK_DEFAULTS.beer.degree);

  /** Volume en centilitres. */
  readonly volumeCl = signal(DRINK_DEFAULTS.beer.volumeCl);

  /** Mode de selection temporelle. */
  readonly timeMode = signal<TimeMode>("now");

  /** Date personnalisee (format YYYY-MM-DD). */
  readonly customDate = signal(new Date().toISOString().slice(0, 10));

  /** Heure personnalisee (format HH:MM). */
  readonly customTime = signal(new Date().toTimeString().slice(0, 5));

  /** Notes optionnelles. */
  readonly notes = signal("");

  /** Expose Math pour le template. */
  protected readonly Math = Math;

  /** Types de boisson disponibles pour la grille. */
  protected readonly drinkTypes = DRINK_TYPES;

  /** Configuration UI par type de boisson. */
  protected readonly drinkUi = DRINK_UI;

  /** Options de temps pour la selection. */
  protected readonly timeOptions = TIME_OPTIONS;

  /**
   * Change le type de boisson selectionne et met a jour
   * les valeurs de degre et volume avec les defauts du type.
   */
  selectDrinkType(type: SebastianDrinkType): void {
    this.selectedDrinkType.set(type);
    const defaults = DRINK_DEFAULTS[type];
    this.degree.set(defaults.degree);
    this.volumeCl.set(defaults.volumeCl);
  }

  /** Incremente la quantite de 1. */
  incrementQuantity(): void {
    this.quantity.update((q) => q + 1);
  }

  /** Decremente la quantite de 1 (minimum 1). */
  decrementQuantity(): void {
    this.quantity.update((q) => Math.max(1, q - 1));
  }

  /**
   * Ajout rapide depuis une entree recente.
   * Emet le payload avec les donnees de l'entree et ferme le sheet.
   */
  quickAddRecent(entry: SebastianEntry): void {
    const payload: CreateEntryPayload = {
      category: entry.category,
      quantity: entry.quantity,
      date: new Date().toISOString().slice(0, 10),
      drinkType: entry.drinkType ?? undefined,
      alcoholDegree: entry.alcoholDegree ?? undefined,
      volumeCl: entry.volumeCl ?? undefined,
      notes: entry.notes ?? undefined,
    };
    this.addDrink.emit(payload);
    this.openChange.emit(false);
  }

  /**
   * Construit le payload de creation et l'emet.
   * Resout consumedAt selon le timeMode selectionne, puis ferme le sheet.
   */
  submit(): void {
    const drinkType = this.selectedDrinkType();
    const defaults = DRINK_DEFAULTS[drinkType];
    const consumedAt = this.resolveConsumedAt();

    const payload: CreateEntryPayload = {
      category: defaults.category,
      quantity: this.quantity(),
      date: new Date().toISOString().slice(0, 10),
      drinkType,
      alcoholDegree: this.degree() || undefined,
      volumeCl: this.volumeCl() || undefined,
      notes: this.notes() || undefined,
      consumedAt,
    };

    this.addDrink.emit(payload);
    this.openChange.emit(false);
  }

  /** Retourne l'icone emoji du type de boisson. */
  drinkIcon(drinkType: SebastianDrinkType | null): string {
    if (!drinkType) return "";
    return DRINK_UI[drinkType]?.icon ?? "";
  }

  /** Retourne le label du type de boisson. */
  drinkLabel(drinkType: SebastianDrinkType | null): string {
    if (!drinkType) return "";
    return DRINK_UI[drinkType]?.label ?? "";
  }

  /**
   * Resout la date/heure de consommation en fonction du timeMode.
   * - 'now' : undefined (le backend utilise new Date())
   * - '30m' : il y a 30 minutes
   * - '1h' : il y a 1 heure
   * - 'yesterday-evening' : hier a 21h
   * - 'custom' : date et heure personnalisees
   */
  private resolveConsumedAt(): string | undefined {
    const mode = this.timeMode();

    switch (mode) {
      case "now":
        return undefined;
      case "30m": {
        const d = new Date();
        d.setMinutes(d.getMinutes() - 30);
        return d.toISOString();
      }
      case "1h": {
        const d = new Date();
        d.setHours(d.getHours() - 1);
        return d.toISOString();
      }
      case "yesterday-evening": {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        d.setHours(21, 0, 0, 0);
        return d.toISOString();
      }
      case "custom":
        return new Date(
          `${this.customDate()}T${this.customTime()}:00`,
        ).toISOString();
    }
  }
}
