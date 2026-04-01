import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  LOCALE_ID,
  PLATFORM_ID,
} from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { LearningTooltipComponent } from "../learning-tooltip/learning-tooltip.component";

/**
 * Arc solaire SVG montrant la trajectoire du soleil entre lever et coucher.
 * Position courante affichee sous forme de point sur l'arc.
 * Compatible SSR : pas d'acces direct a Date sans verification de plateforme.
 */
@Component({
  selector: "app-sun-arc",
  standalone: true,
  imports: [LearningTooltipComponent],
  template: `
    <div
      class="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md"
    >
      <div class="mb-3 flex items-center justify-between">
        <h3
          class="text-sm font-medium text-white/70"
          i18n="weather.sun.title|@@weatherSunTitle"
        >
          Lever & coucher du soleil
        </h3>
        <app-learning-tooltip
          id="sun-arc"
          i18n-title="weather.sun.tooltip.title|@@weatherSunTooltipTitle"
          title="Lever & coucher du soleil"
          i18n-content="weather.sun.tooltip.content|@@weatherSunTooltipContent"
          content="L'arc montre la trajectoire du soleil dans le ciel. Le point jaune indique sa position actuelle. La durée du jour varie selon la saison : environ 16h en été et 8h en hiver en France métropolitaine."
        />
      </div>

      @if (sunrise() && sunset()) {
        <div class="flex flex-col items-center">
          <!-- Arc SVG -->
          <svg
            viewBox="0 0 200 110"
            class="h-24 w-full max-w-[200px]"
            aria-hidden="true"
          >
            <!-- Arc de trajectoire -->
            <path
              d="M 20 90 Q 100 -10 180 90"
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              stroke-width="2"
              stroke-linecap="round"
            />

            <!-- Portion eclairee de l'arc (du lever a la position courante) -->
            @if (sunProgress() > 0 && sunProgress() <= 1) {
              <path
                [attr.d]="litArcPath()"
                fill="none"
                stroke="rgba(250,204,21,0.6)"
                stroke-width="2"
                stroke-linecap="round"
              />
            }

            <!-- Point de position du soleil -->
            @if (sunProgress() > 0 && sunProgress() <= 1) {
              <circle
                [attr.cx]="sunX()"
                [attr.cy]="sunY()"
                r="6"
                fill="#FBBF24"
                class="drop-shadow-lg"
              />
              <circle
                [attr.cx]="sunX()"
                [attr.cy]="sunY()"
                r="9"
                fill="none"
                stroke="rgba(251,191,36,0.3)"
                stroke-width="2"
              />
            }

            <!-- Ligne d'horizon -->
            <line
              x1="15"
              y1="90"
              x2="185"
              y2="90"
              stroke="rgba(255,255,255,0.1)"
              stroke-width="1"
            />
          </svg>

          <!-- Heures de lever et coucher -->
          <div
            class="mt-2 flex w-full max-w-[200px] justify-between text-xs text-white/60"
          >
            <div class="flex items-center gap-1">
              <span>↑</span>
              <span>{{ sunriseFormatted() }}</span>
            </div>
            <div class="flex items-center gap-1">
              <span>{{ sunsetFormatted() }}</span>
              <span>↓</span>
            </div>
          </div>
        </div>
      } @else {
        <p
          class="text-sm text-white/40"
          i18n="weather.sun.unavailable|@@weatherSunUnavailable"
        >
          Données indisponibles
        </p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SunArcComponent {
  /** Heure de lever du soleil (chaine ISO). */
  readonly sunrise = input<string>("");

  /** Heure de coucher du soleil (chaine ISO). */
  readonly sunset = input<string>("");

  private readonly localeId = inject(LOCALE_ID);
  private readonly platformId = inject(PLATFORM_ID);

  /** Heure de lever formatee selon la locale. */
  readonly sunriseFormatted = computed(() => this.formatTime(this.sunrise()));

  /** Heure de coucher formatee selon la locale. */
  readonly sunsetFormatted = computed(() => this.formatTime(this.sunset()));

  /**
   * Progression du soleil sur l'arc (0 = lever, 1 = coucher).
   * Retourne -1 avant le lever et 2 apres le coucher (hors arc).
   * Retourne 0.5 par defaut cote serveur (SSR).
   */
  readonly sunProgress = computed(() => {
    if (!isPlatformBrowser(this.platformId)) return 0.5;
    const rise = this.parseTime(this.sunrise());
    const set = this.parseTime(this.sunset());
    if (!rise || !set) return 0.5;

    const now = Date.now();
    const total = set - rise;
    if (total <= 0) return 0.5;
    const elapsed = now - rise;
    return elapsed / total;
  });

  /** Coordonnee X du soleil sur l'arc SVG. */
  readonly sunX = computed(() => {
    const t = Math.max(0, Math.min(1, this.sunProgress()));
    return 20 + t * 160;
  });

  /** Coordonnee Y du soleil sur l'arc SVG (courbe quadratique). */
  readonly sunY = computed(() => {
    const t = Math.max(0, Math.min(1, this.sunProgress()));
    // Courbe de Bezier quadratique : P = (1-t)²*P0 + 2*(1-t)*t*P1 + t²*P2
    const p0y = 90;
    const p1y = -10;
    const p2y = 90;
    return (1 - t) * (1 - t) * p0y + 2 * (1 - t) * t * p1y + t * t * p2y;
  });

  /** Chemin SVG de la portion eclairee de l'arc (du lever au point courant). */
  readonly litArcPath = computed(() => {
    const t = Math.max(0, Math.min(1, this.sunProgress()));
    // Approximation : on coupe l'arc quadratique au parametre t
    // Subdivision de De Casteljau pour le segment [0, t]
    const p0 = { x: 20, y: 90 };
    const p1 = { x: 100, y: -10 };
    const p2 = { x: 180, y: 90 };

    const q0 = p0;
    const q1 = {
      x: p0.x + t * (p1.x - p0.x),
      y: p0.y + t * (p1.y - p0.y),
    };
    const q2 = {
      x: (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x,
      y: (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y,
    };

    return `M ${q0.x} ${q0.y} Q ${q1.x} ${q1.y} ${q2.x} ${q2.y}`;
  });

  /** Formate une chaine ISO en heure lisible selon la locale injectee. */
  private formatTime(iso: string): string {
    if (!iso) return "";
    try {
      const date = new Date(iso);
      return date.toLocaleTimeString(this.localeId, {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }

  /** Parse une chaine ISO en timestamp. Retourne null si invalide. */
  private parseTime(iso: string): number | null {
    if (!iso) return null;
    const ts = new Date(iso).getTime();
    return isNaN(ts) ? null : ts;
  }
}
