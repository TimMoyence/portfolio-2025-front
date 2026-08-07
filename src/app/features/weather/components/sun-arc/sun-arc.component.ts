import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  LOCALE_ID,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LearningTooltipComponent } from '../learning-tooltip/learning-tooltip.component';
import { clamp } from '../../../../shared/utils/math.utils';

@Component({
  selector: 'app-sun-arc',
  standalone: true,
  imports: [LearningTooltipComponent],
  template: `
    <div
      class="rounded-[20px] border border-teal/15 bg-white/5 p-4 backdrop-blur-xl transition-colors hover:border-teal/30"
    >
      <div class="mb-3 flex items-center justify-between">
        <h3
          class="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-white/55"
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
          <svg viewBox="0 0 200 110" class="h-24 w-full max-w-[200px]" aria-hidden="true">
            <path
              d="M 20 90 Q 100 -10 180 90"
              fill="none"
              stroke="rgba(255,255,255,0.16)"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-dasharray="3 5"
            />

            @if (sunProgress() > 0 && sunProgress() <= 1) {
              <path
                [attr.d]="litArcPath()"
                fill="none"
                stroke="rgba(91,140,255,0.5)"
                stroke-width="2"
                stroke-linecap="round"
              />
            }

            @if (sunProgress() > 0 && sunProgress() <= 1) {
              <line
                x1="100"
                y1="90"
                [attr.x2]="sunX()"
                [attr.y2]="sunY()"
                stroke="rgba(91,140,255,0.35)"
                stroke-width="1.5"
              />
              <circle
                [attr.cx]="sunX()"
                [attr.cy]="sunY()"
                r="9"
                fill="none"
                stroke="rgba(91,140,255,0.35)"
                stroke-width="6"
              />
              <circle
                [attr.cx]="sunX()"
                [attr.cy]="sunY()"
                r="6"
                fill="#5b8cff"
                class="drop-shadow-lg"
              />
            }

            <line
              x1="15"
              y1="90"
              x2="185"
              y2="90"
              stroke="rgba(255,255,255,0.12)"
              stroke-width="1"
            />
          </svg>

          <div
            class="mt-2 flex w-full max-w-[200px] justify-between font-mono text-[11px] text-white/60"
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
        <p class="text-sm text-white/40" i18n="weather.sun.unavailable|@@weatherSunUnavailable">
          Données indisponibles
        </p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SunArcComponent {
  readonly sunrise = input<string>('');

  readonly sunset = input<string>('');

  private readonly localeId = inject(LOCALE_ID);
  private readonly platformId = inject(PLATFORM_ID);

  readonly sunriseFormatted = computed(() => this.formatTime(this.sunrise()));

  readonly sunsetFormatted = computed(() => this.formatTime(this.sunset()));

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

  readonly sunX = computed(() => {
    const t = clamp(this.sunProgress(), 0, 1);
    return 20 + t * 160;
  });

  readonly sunY = computed(() => {
    const t = clamp(this.sunProgress(), 0, 1);
    // Courbe de Bezier quadratique : P = (1-t)²*P0 + 2*(1-t)*t*P1 + t²*P2
    const p0y = 90;
    const p1y = -10;
    const p2y = 90;
    return (1 - t) * (1 - t) * p0y + 2 * (1 - t) * t * p1y + t * t * p2y;
  });

  readonly litArcPath = computed(() => {
    const t = clamp(this.sunProgress(), 0, 1);
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

  private formatTime(iso: string): string {
    if (!iso) return '';
    try {
      const date = new Date(iso);
      return date.toLocaleTimeString(this.localeId, {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  }

  private parseTime(iso: string): number | null {
    if (!iso) return null;
    const ts = new Date(iso).getTime();
    return isNaN(ts) ? null : ts;
  }
}
