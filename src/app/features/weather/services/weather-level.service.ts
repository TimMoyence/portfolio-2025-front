import { computed, inject, Injectable, signal } from "@angular/core";
import { take } from "rxjs/operators";
import type { WeatherLevel } from "../../../core/models/weather.model";
import { WeatherService } from "../../../core/services/weather.service";

/**
 * Service de gestion du niveau d'experience meteo.
 * Synchronise le niveau, les tooltips vus et l'utilisation quotidienne
 * avec le backend via le WeatherService.
 */
@Injectable({ providedIn: "root" })
export class WeatherLevelService {
  private readonly weatherService = inject(WeatherService);

  /** Niveau d'experience actuel de l'utilisateur. */
  readonly level = signal<WeatherLevel>("discovery");

  /** Nombre de jours d'utilisation cumules. */
  readonly daysUsed = signal(0);

  /** Identifiants des tooltips deja vus par l'utilisateur. */
  readonly tooltipsSeen = signal<string[]>([]);

  /** Indicateur de chargement des preferences. */
  readonly loading = signal(false);

  /**
   * Niveau suggere pour la prochaine transition.
   * Retourne null si l'utilisateur n'est pas eligible a une transition.
   */
  readonly showTransitionPrompt = computed<WeatherLevel | null>(() => {
    const l = this.level();
    const d = this.daysUsed();
    if (l === "discovery" && d >= 7) return "curious";
    if (l === "curious" && d >= 30) return "expert";
    return null;
  });

  /** Charge les preferences depuis le backend. */
  loadPreferences(): void {
    this.loading.set(true);
    this.weatherService
      .getPreferences()
      .pipe(take(1))
      .subscribe({
        next: (prefs) => {
          this.level.set(prefs.level);
          this.daysUsed.set(prefs.daysUsed);
          this.tooltipsSeen.set(prefs.tooltipsSeen);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  /** Change le niveau et synchronise avec le backend. */
  setLevel(level: WeatherLevel): void {
    this.level.set(level);
    this.weatherService
      .updatePreferences({ level })
      .pipe(take(1))
      .subscribe({
        next: (prefs) => {
          this.level.set(prefs.level);
        },
        error: () => {
          /* Le signal est deja mis a jour optimistiquement */
        },
      });
  }

  /** Marque un tooltip comme vu et synchronise avec le backend. */
  markTooltipSeen(tooltipId: string): void {
    const current = this.tooltipsSeen();
    if (current.includes(tooltipId)) return;

    const updated = [...current, tooltipId];
    this.tooltipsSeen.set(updated);
    this.weatherService
      .updatePreferences({ tooltipsSeen: updated })
      .pipe(take(1))
      .subscribe();
  }

  /** Verifie si un tooltip a deja ete vu. */
  isTooltipSeen(tooltipId: string): boolean {
    return this.tooltipsSeen().includes(tooltipId);
  }

  /** Enregistre l'utilisation quotidienne aupres du backend. */
  recordUsage(): void {
    this.weatherService.recordUsage().pipe(take(1)).subscribe();
  }
}
