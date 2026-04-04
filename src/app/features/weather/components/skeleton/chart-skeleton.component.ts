import { ChangeDetectionStrategy, Component } from "@angular/core";

/**
 * Skeleton loader pour les graphiques weather.
 * Simule des barres de hauteurs variees avec animation de pulsation.
 */
@Component({
  selector: "app-chart-skeleton",
  standalone: true,
  host: { class: "block" },
  template: `
    <div
      class="animate-pulse rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md"
    >
      <!-- Titre -->
      <div class="mb-4 h-5 w-40 rounded bg-white/20"></div>
      <!-- Zone du graphique avec barres simulees -->
      <div class="flex h-40 items-end gap-1 rounded bg-white/5 p-4 md:h-64">
        @for (h of bars; track $index) {
          <div class="flex-1 rounded-t bg-white/15" [style.height.%]="h"></div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartSkeletonComponent {
  /** Hauteurs aleatoires des barres simulees (en %). */
  readonly bars = [
    40, 55, 70, 65, 80, 60, 45, 75, 50, 35, 60, 70, 55, 40, 65, 80, 70, 55, 45,
    60, 75, 50, 35, 55,
  ];
}
