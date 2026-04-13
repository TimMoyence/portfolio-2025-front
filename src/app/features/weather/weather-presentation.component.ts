import { DecimalPipe, isPlatformBrowser } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  PLATFORM_ID,
} from "@angular/core";
import { RouterModule } from "@angular/router";
import { SlideInDirective } from "../../shared/directives/slide-in.directive";
import { UnitPreferencesService } from "./services/unit-preferences.service";
import { WeatherLevelService } from "./services/weather-level.service";
import { AirQualityCardComponent } from "./components/air-quality-card/air-quality-card.component";
import { SunArcComponent } from "./components/sun-arc/sun-arc.component";
import { UvIndexCardComponent } from "./components/uv-index-card/uv-index-card.component";
import { WindCompassComponent } from "./components/wind-compass/wind-compass.component";
import {
  buildWeekDays,
  MOCK_AIR_QUALITY,
  MOCK_CURRENT,
  MOCK_DAILY,
  MOCK_FORECAST,
  MOCK_HOURLY,
} from "./weather-presentation-data";
import type { WeekDay } from "./weather-presentation-data";

/**
 * Page de presentation immersive de l'application meteo.
 * Affiche des donnees fictives realistes dans un design full-bleed
 * avec effet parallaxe, animations au scroll et composants meteo reels.
 * Destinee aux utilisateurs non authentifies.
 */
@Component({
  selector: "app-weather-presentation",
  standalone: true,
  imports: [
    DecimalPipe,
    RouterModule,
    SlideInDirective,
    WindCompassComponent,
    SunArcComponent,
    UvIndexCardComponent,
    AirQualityCardComponent,
  ],
  providers: [WeatherLevelService, UnitPreferencesService],
  templateUrl: "./weather-presentation.component.html",
  styleUrl: "./weather-presentation.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeatherPresentationComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  /** Donnees meteo courantes fictives. */
  readonly current = MOCK_CURRENT;

  /** Previsions horaires fictives (48 h). */
  readonly hourly = MOCK_HOURLY;

  /** Previsions journalieres fictives (7 jours). */
  readonly daily = MOCK_DAILY;

  /** Reponse de previsions complete. */
  readonly forecast = MOCK_FORECAST;

  /** Donnees de qualite de l'air fictives. */
  readonly airQuality = MOCK_AIR_QUALITY;

  /** Bandeau des 7 jours pour le template. */
  readonly weekDays: readonly WeekDay[] = buildWeekDays(MOCK_DAILY);

  /** Offset vertical pour l'effet parallaxe du hero (en pixels). */
  parallaxOffset = 0;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    let ticking = false;

    const onScroll = (): void => {
      if (!ticking) {
        requestAnimationFrame(() => {
          this.parallaxOffset = Math.min(Math.round(window.scrollY * 0.15), 80);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    this.destroyRef.onDestroy(() => {
      window.removeEventListener("scroll", onScroll);
    });
  }
}
