import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from "@angular/core";
import type { SebastianHeatmapPoint } from "../../../core/models/sebastian.model";

/** Mode d'affichage du heatmap. */
type HeatmapMode = "combined" | "alcohol" | "coffee";

/** Configuration d'un bouton de mode. */
interface ModeOption {
  value: HeatmapMode;
  label: string;
}

/**
 * Heatmap calendaire de consommation Sebastian.
 * Affiche une grille de jours avec une intensite de couleur
 * basee sur les niveaux de consommation (combine, alcool ou cafe).
 */
@Component({
  selector: "app-sebastian-heatmap",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      data-testid="heatmap-container"
      class="rounded-card border border-scheme-border bg-scheme-surface p-4"
    >
      <!-- Selecteur de mode -->
      <div class="mb-4 flex gap-2">
        @for (m of modes; track m.value) {
          <button
            data-testid="mode-button"
            (click)="mode.set(m.value)"
            [class]="
              mode() === m.value
                ? 'bg-scheme-accent text-scheme-on-accent'
                : 'bg-scheme-surface text-scheme-text-muted hover:bg-scheme-surface-hover'
            "
            class="rounded-button border border-scheme-border px-3 py-1 font-heading text-small"
          >
            {{ m.label }}
          </button>
        }
      </div>

      <!-- Labels jours de la semaine -->
      <div class="mb-1 grid grid-cols-7 gap-1 text-center">
        @for (label of dayLabels; track label) {
          <span class="text-xs text-scheme-text-muted">{{ label }}</span>
        }
      </div>

      <!-- Grille heatmap -->
      <div class="grid grid-cols-7 gap-1">
        @for (cell of cells(); track cell.date) {
          <div
            data-testid="heatmap-cell"
            [class]="cellClass(cell)"
            class="flex h-8 w-full items-center justify-center rounded text-xs font-medium"
          >
            {{ cell.dayNumber }}
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SebastianHeatmapComponent {
  /** Points de donnees du heatmap. */
  readonly data = input.required<SebastianHeatmapPoint[]>();

  /** Mode d'affichage actif. */
  readonly mode = signal<HeatmapMode>("combined");

  /** Options de mode disponibles. */
  readonly modes: ModeOption[] = [
    { value: "combined", label: "Combine" },
    { value: "alcohol", label: "Alcool" },
    { value: "coffee", label: "Cafe" },
  ];

  /** Labels des jours de la semaine. */
  readonly dayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  /** Cellules calculees a partir des donnees et du mode. */
  readonly cells = computed(() => {
    return this.data().map((point) => ({
      date: point.date,
      dayNumber: new Date(point.date).getDate(),
      value: this.getValue(point),
    }));
  });

  /** Valeur maximale pour le calcul d'intensite. */
  private readonly maxValue = computed(() => {
    const values = this.cells().map((c) => c.value);
    return Math.max(...values, 1);
  });

  /**
   * Retourne la classe CSS d'intensite pour une cellule.
   * L'intensite est determinee par le ratio valeur/max.
   */
  cellClass(cell: { value: number }): string {
    if (cell.value === 0) {
      return "bg-scheme-surface border border-scheme-border text-scheme-text-muted";
    }

    const ratio = cell.value / this.maxValue();

    if (ratio <= 0.25) {
      return "bg-scheme-accent/20 text-scheme-text";
    }
    if (ratio <= 0.5) {
      return "bg-scheme-accent/40 text-scheme-text";
    }
    if (ratio <= 0.75) {
      return "bg-scheme-accent/60 text-scheme-on-accent";
    }
    return "bg-scheme-accent text-scheme-on-accent";
  }

  /**
   * Extrait la valeur d'un point selon le mode actif.
   */
  private getValue(point: SebastianHeatmapPoint): number {
    switch (this.mode()) {
      case "alcohol":
        return point.alcohol;
      case "coffee":
        return point.coffee;
      case "combined":
      default:
        return point.combined;
    }
  }
}
