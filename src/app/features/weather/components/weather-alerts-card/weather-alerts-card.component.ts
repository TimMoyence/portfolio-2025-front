import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { WeatherAlert } from '../../../../core/models/weather.model';

@Component({
  selector: 'app-weather-alerts-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (alerts().length > 0) {
      <div class="rounded-[20px] border border-teal/15 bg-white/5 p-4 backdrop-blur-xl">
        @for (alert of alerts(); track alert.type + alert.severity) {
          <div
            class="flex items-start gap-3 border-white/[0.08] py-3 first:pt-0 last:pb-0 [&:not(:first-child)]:border-t"
          >
            <span
              class="grid h-[30px] w-[30px] flex-none place-items-center rounded-lg border text-base"
              [ngClass]="severityClasses(alert.severity)"
            >
              {{ severityIcon(alert.severity) }}
            </span>
            <div class="min-w-0">
              <h4 class="text-sm font-semibold text-white">
                {{ alert.headline }}
              </h4>
              <p class="mt-0.5 text-[12.5px] text-white/55">
                {{ alert.description }}
              </p>
            </div>
          </div>
        }
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeatherAlertsCardComponent {
  readonly alerts = input.required<WeatherAlert[]>();

  severityClasses(severity: string): Record<string, boolean> {
    return {
      'bg-yellow-500/20 border-yellow-400/30 text-yellow-100': severity === 'minor',
      'bg-orange-500/20 border-orange-400/30 text-orange-100': severity === 'moderate',
      'bg-red-500/20 border-red-400/30 text-red-100': severity === 'severe',
      'bg-red-700/30 border-red-500/40 text-red-50': severity === 'extreme',
    };
  }

  severityIcon(severity: string): string {
    switch (severity) {
      case 'minor':
        return '\u26A0\uFE0F';
      case 'moderate':
        return '\uD83D\uDFE0';
      case 'severe':
        return '\uD83D\uDD34';
      case 'extreme':
        return '\uD83C\uDD98';
      default:
        return '\u2139\uFE0F';
    }
  }
}
