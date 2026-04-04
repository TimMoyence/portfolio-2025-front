import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import type { WeatherAlert } from "../../../../core/models/weather.model";

/** Carte d'alertes meteo avec codes couleur par severite. */
@Component({
  selector: "app-weather-alerts-card",
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (alerts().length > 0) {
      <div class="space-y-2">
        @for (alert of alerts(); track alert.type + alert.severity) {
          <div
            class="rounded-xl p-4 backdrop-blur-md border"
            [ngClass]="severityClasses(alert.severity)"
          >
            <div class="flex items-center gap-2 mb-1">
              <span class="text-lg">{{ severityIcon(alert.severity) }}</span>
              <h4 class="font-semibold text-sm">{{ alert.headline }}</h4>
            </div>
            <p class="text-xs opacity-80">{{ alert.description }}</p>
          </div>
        }
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeatherAlertsCardComponent {
  /** Liste des alertes meteo a afficher. */
  readonly alerts = input.required<WeatherAlert[]>();

  /** Retourne les classes CSS correspondant a la severite de l'alerte. */
  severityClasses(severity: string): Record<string, boolean> {
    return {
      "bg-yellow-500/20 border-yellow-400/30 text-yellow-100":
        severity === "minor",
      "bg-orange-500/20 border-orange-400/30 text-orange-100":
        severity === "moderate",
      "bg-red-500/20 border-red-400/30 text-red-100": severity === "severe",
      "bg-red-700/30 border-red-500/40 text-red-50": severity === "extreme",
    };
  }

  /** Retourne l'icone correspondant a la severite de l'alerte. */
  severityIcon(severity: string): string {
    switch (severity) {
      case "minor":
        return "\u26A0\uFE0F";
      case "moderate":
        return "\uD83D\uDFE0";
      case "severe":
        return "\uD83D\uDD34";
      case "extreme":
        return "\uD83C\uDD98";
      default:
        return "\u2139\uFE0F";
    }
  }
}
