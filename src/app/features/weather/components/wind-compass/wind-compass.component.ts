import { DecimalPipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { MetricCardComponent } from "../metric-card/metric-card.component";

/**
 * Boussole de vent SVG avec directions cardinales en francais,
 * fleche directionnelle et affichage de la vitesse et des rafales.
 */
@Component({
  selector: "app-wind-compass",
  standalone: true,
  imports: [DecimalPipe, MetricCardComponent],
  template: `
    <app-metric-card
      tooltipId="wind"
      i18n-tooltipTitle="weather.wind.tooltip.title|@@weatherWindTooltipTitle"
      tooltipTitle="Vent"
      i18n-tooltipContent="
        weather.wind.tooltip.content|@@weatherWindTooltipContent"
      tooltipContent="La vitesse du vent est mesurée à 10 m du sol. La direction indique d'où vient le vent (un vent de Nord souffle du nord vers le sud). Les rafales sont des accélérations brèves pouvant dépasser le double de la vitesse moyenne."
    >
      <span cardTitle i18n="weather.wind.title|@@weatherWindTitle">Vent</span>

      <div class="flex flex-col items-center">
        <!-- Boussole SVG -->
        <svg viewBox="0 0 120 120" class="h-32 w-32" aria-hidden="true">
          <!-- Cercle exterieur -->
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            stroke-width="2"
          />
          <circle
            cx="60"
            cy="60"
            r="40"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            stroke-width="1"
          />

          <!-- Directions cardinales -->
          <text
            x="60"
            y="14"
            text-anchor="middle"
            class="fill-white/70 text-[10px] font-medium"
          >
            N
          </text>
          <text
            x="110"
            y="64"
            text-anchor="middle"
            class="fill-white/70 text-[10px] font-medium"
          >
            E
          </text>
          <text
            x="60"
            y="116"
            text-anchor="middle"
            class="fill-white/70 text-[10px] font-medium"
          >
            S
          </text>
          <text
            x="10"
            y="64"
            text-anchor="middle"
            class="fill-white/70 text-[10px] font-medium"
          >
            O
          </text>

          <!-- Fleche directionnelle (pointe vers la direction d'ou vient le vent) -->
          <g [attr.transform]="arrowTransform()">
            <polygon points="60,22 55,42 65,42" class="fill-white/90" />
            <line
              x1="60"
              y1="42"
              x2="60"
              y2="78"
              stroke="rgba(255,255,255,0.4)"
              stroke-width="2"
            />
          </g>

          <!-- Vitesse au centre -->
          <text
            x="60"
            y="57"
            text-anchor="middle"
            class="fill-white text-[16px] font-light"
          >
            {{ speed() | number: "1.0-0" }}
          </text>
          <text
            x="60"
            y="70"
            text-anchor="middle"
            class="fill-white/50 text-[8px]"
          >
            km/h
          </text>
        </svg>

        <!-- Rafales -->
        @if (gusts() !== null) {
          <p class="mt-2 text-sm text-white/60">
            <span i18n="weather.wind.gusts|@@weatherWindGusts">Rafales</span> :
            {{ gusts()! | number: "1.0-0" }} km/h
          </p>
        }

        <!-- Direction textuelle -->
        <p class="mt-1 text-xs text-white/40">
          {{ cardinalDirection() }} ({{ direction() }}°)
        </p>
      </div>
    </app-metric-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WindCompassComponent {
  /** Vitesse du vent en km/h. */
  readonly speed = input<number>(0);

  /** Direction du vent en degres (0 = Nord). */
  readonly direction = input<number>(0);

  /** Rafales de vent en km/h. */
  readonly gusts = input<number | null>(null);

  /** Transformation SVG pour orienter la fleche selon la direction du vent. */
  readonly arrowTransform = computed(
    () => `rotate(${this.direction()}, 60, 60)`,
  );

  /** Direction cardinale en francais (N, NE, E, SE, S, SO, O, NO). */
  readonly cardinalDirection = computed(() => {
    const deg = this.direction() % 360;
    const directions = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
  });
}
