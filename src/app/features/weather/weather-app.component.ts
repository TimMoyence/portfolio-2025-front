import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, switchMap } from 'rxjs';
import { BreakpointService } from '../../core/services/breakpoint.service';
import type {
  AirQualityData,
  CityResult,
  DetailedCurrentWeather,
  EnsembleData,
  FavoriteCity,
  ForecastResponse,
  HistoricalData,
  OverviewGranularity,
  WeatherAlert,
  WeatherLevel,
} from '../../core/models/weather.model';
import type { WeatherPort } from '../../core/ports/weather.port';
import { WEATHER_PORT } from '../../core/ports/weather.port';
import { AirQualityCardComponent } from './components/air-quality-card/air-quality-card.component';
import { CapeCardComponent } from './components/cape-card/cape-card.component';
import { CitySearchComponent } from './components/city-search/city-search.component';
import { CloudVisibilityCardComponent } from './components/cloud-visibility-card/cloud-visibility-card.component';
import { CurrentConditionsComponent } from './components/current-conditions/current-conditions.component';
import { DayDetailPanelComponent } from './components/day-detail-panel/day-detail-panel.component';
import { DataExportComponent } from './components/data-export/data-export.component';
import { WeeklyOverviewComponent } from './components/weekly-overview/weekly-overview.component';
import { FavoriteCitiesBarComponent } from './components/favorite-cities-bar/favorite-cities-bar.component';
import { WeatherAlertsCardComponent } from './components/weather-alerts-card/weather-alerts-card.component';
import { RadarMapComponent } from './components/radar-map/radar-map.component';
import { HistoricalComparisonComponent } from './components/historical-comparison/historical-comparison.component';
import { HourlyChartComponent } from './components/hourly-chart/hourly-chart.component';
import { HumidityCardComponent } from './components/humidity-card/humidity-card.component';
import { LevelSelectorComponent } from './components/level-selector/level-selector.component';
import { ModelComparisonComponent } from './components/model-comparison/model-comparison.component';
import { PressureCardComponent } from './components/pressure-card/pressure-card.component';
import { SpaghettiPlotComponent } from './components/spaghetti-plot/spaghetti-plot.component';
import { SunArcComponent } from './components/sun-arc/sun-arc.component';
import { TransitionPromptComponent } from './components/transition-prompt/transition-prompt.component';
import { UnitSelectorComponent } from './components/unit-selector/unit-selector.component';
import { UvIndexCardComponent } from './components/uv-index-card/uv-index-card.component';
import { WindCompassComponent } from './components/wind-compass/wind-compass.component';
import { BottomSheetComponent } from '../../shared/components/bottom-sheet/bottom-sheet.component';
import { SlideInDirective } from '../../shared/directives/slide-in.directive';
import { ChartSkeletonComponent } from './components/skeleton/chart-skeleton.component';
import { WeatherCardSkeletonComponent } from './components/skeleton/weather-card-skeleton.component';
import { GeolocationService } from './services/geolocation.service';
import { UnitPreferencesService } from './services/unit-preferences.service';
import { WeatherLevelService } from './services/weather-level.service';
import { extractErrorMessage } from '../../shared/utils/http-error.utils';
import { weatherCodeToBackground } from './utils/weather-code-background';

@Component({
  selector: 'app-weather-app',
  standalone: true,
  imports: [
    CommonModule,
    CitySearchComponent,
    CurrentConditionsComponent,
    HourlyChartComponent,
    DayDetailPanelComponent,
    LevelSelectorComponent,
    TransitionPromptComponent,
    UnitSelectorComponent,
    UvIndexCardComponent,
    AirQualityCardComponent,
    PressureCardComponent,
    WindCompassComponent,
    SunArcComponent,
    HumidityCardComponent,
    CloudVisibilityCardComponent,
    ModelComparisonComponent,
    SpaghettiPlotComponent,
    CapeCardComponent,
    HistoricalComparisonComponent,
    DataExportComponent,
    WeeklyOverviewComponent,
    FavoriteCitiesBarComponent,
    WeatherAlertsCardComponent,
    RadarMapComponent,
    BottomSheetComponent,
    SlideInDirective,
    ChartSkeletonComponent,
    WeatherCardSkeletonComponent,
  ],
  templateUrl: './weather-app.component.html',
  styleUrl: './weather-app.component.scss',
  providers: [WeatherLevelService, UnitPreferencesService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeatherAppComponent implements OnInit {
  readonly forecast = signal<ForecastResponse | null>(null);

  readonly airQuality = signal<AirQualityData | null>(null);

  readonly ensemble = signal<EnsembleData | null>(null);

  readonly historical = signal<HistoricalData | null>(null);

  readonly detailedCurrent = signal<DetailedCurrentWeather | null>(null);

  readonly alerts = signal<WeatherAlert[]>([]);

  readonly defaultCityIndex = signal<number | null>(null);

  readonly selectedCity = signal<CityResult | null>(null);

  readonly loading = signal(false);

  readonly error = signal<string | null>(null);

  readonly favoriteCities = signal<FavoriteCity[]>([]);

  readonly selectedDayIndex = signal<number | null>(null);

  readonly forecastDays = signal<7 | 14>(7);

  readonly overviewGranularity = signal<OverviewGranularity>('day');

  private readonly weatherService: WeatherPort = inject(WEATHER_PORT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly breakpointService = inject(BreakpointService);
  private readonly geoService = inject(GeolocationService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly levelService = inject(WeatherLevelService);

  readonly unitService = inject(UnitPreferencesService);

  readonly isMobile = this.breakpointService.isMobile;

  readonly hasForecast = computed(() => !!this.forecast());

  readonly backgroundClasses = computed(() => {
    const data = this.forecast();
    if (!data) return '';
    return weatherCodeToBackground(data.current.weather_code);
  });

  readonly previousBackground = signal('');

  readonly backgroundTransitioning = signal(false);

  readonly scrollY = signal(0);

  readonly parallaxOffset = computed(() => Math.min(Math.round(this.scrollY() * 0.15), 60));

  readonly contentTransitioning = signal(false);

  constructor() {
    effect(() => {
      const current = this.backgroundClasses();
      const prev = this.previousBackground();
      if (current && current !== prev) {
        this.backgroundTransitioning.set(true);
        setTimeout(() => {
          this.previousBackground.set(current);
          this.backgroundTransitioning.set(false);
        }, 1200);
      }
    });

    if (this.isBrowser) {
      const handler = (): void => this.scrollY.set(window.scrollY);
      window.addEventListener('scroll', handler, { passive: true });
      this.destroyRef.onDestroy(() => window.removeEventListener('scroll', handler));
    }
  }

  ngOnInit(): void {
    this.levelService.loadPreferences();
    this.levelService.recordUsage();
    this.loadFavorites();
  }

  onCitySelected(city: CityResult): void {
    if (this.forecast()) {
      this.contentTransitioning.set(true);
      setTimeout(() => this.contentTransitioning.set(false), 300);
    }

    this.selectedCity.set(city);
    this.loading.set(true);
    this.error.set(null);
    this.airQuality.set(null);
    this.ensemble.set(null);
    this.historical.set(null);
    this.detailedCurrent.set(null);
    this.alerts.set([]);

    this.weatherService
      .getAlerts(city.latitude, city.longitude)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.alerts.set(data.alerts),
        error: () => {
          /* Echec silencieux : les alertes ne sont pas essentielles */
        },
      });

    this.weatherService
      .getForecast(city.latitude, city.longitude, undefined, this.forecastDays())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.forecast.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(
            extractErrorMessage(err, { includeTopLevelMessage: false }) ??
              $localize`:weather.error.loading|@@weatherErrorLoading:Erreur lors du chargement des prévisions.`,
          );
          this.loading.set(false);
        },
      });

    if (this.levelService.level() !== 'discovery') {
      this.weatherService
        .getAirQuality(city.latitude, city.longitude)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data) => this.airQuality.set(data),
          error: () => {
            /* Echec silencieux : la carte affichera "Donnees indisponibles" */
          },
        });

      this.weatherService
        .getDetailedCurrent(city.latitude, city.longitude)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data) => this.detailedCurrent.set(data),
          error: () => {
            /* Echec silencieux */
          },
        });
    }

    if (this.levelService.level() === 'expert') {
      this.loadExpertData(city.latitude, city.longitude);
    }
  }

  onLevelChanged(level: WeatherLevel): void {
    const city = this.selectedCity();
    if (!city) return;

    if (level !== 'discovery' && !this.airQuality()) {
      this.weatherService
        .getAirQuality(city.latitude, city.longitude)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data) => this.airQuality.set(data),
          error: () => {
            /* Echec silencieux : la carte affichera "Donnees indisponibles" */
          },
        });
    }

    if (level !== 'discovery' && !this.detailedCurrent()) {
      if (city) {
        this.weatherService
          .getDetailedCurrent(city.latitude, city.longitude)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (data) => this.detailedCurrent.set(data),
            error: () => {
              /* Echec silencieux */
            },
          });
      }
    }

    if (level === 'expert' && !this.ensemble()) {
      this.loadExpertData(city.latitude, city.longitude);
    }
  }

  extractCape(): number | null {
    const data = this.ensemble();
    if (!data) return null;

    const gfs = data.models.find((m) => m.model === 'GFS');
    if (!gfs?.hourly.cape?.length) return null;

    return gfs.hourly.cape[0];
  }

  addFavorite(city: FavoriteCity): void {
    const current = this.favoriteCities();
    if (current.some((c) => c.latitude === city.latitude && c.longitude === city.longitude)) return;
    const updated = [...current, city];
    this.favoriteCities.set(updated);
    this.weatherService
      .updatePreferences({ favoriteCities: updated })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => this.favoriteCities.set(current),
      });
  }

  removeFavorite(city: FavoriteCity): void {
    const previous = this.favoriteCities();
    const updated = previous.filter(
      (c) => c.latitude !== city.latitude || c.longitude !== city.longitude,
    );
    this.favoriteCities.set(updated);
    this.weatherService
      .updatePreferences({ favoriteCities: updated })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => this.favoriteCities.set(previous),
      });
  }

  setDefaultCity(index: number | null): void {
    const previous = this.defaultCityIndex();
    this.defaultCityIndex.set(index);
    this.weatherService
      .updatePreferences({ defaultCityIndex: index })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => this.defaultCityIndex.set(previous),
      });
  }

  onDaySelected(index: number): void {
    this.selectedDayIndex.set(this.selectedDayIndex() === index ? null : index);
  }

  onGranularityChange(granularity: OverviewGranularity): void {
    const previous = this.overviewGranularity();
    this.overviewGranularity.set(granularity);
    this.weatherService
      .updatePreferences({ overviewGranularity: granularity })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => this.overviewGranularity.set(previous),
      });
  }

  onForecastDaysChange(days: number): void {
    this.forecastDays.set(days as 7 | 14);
    const city = this.selectedCity();
    if (city) {
      this.weatherService
        .getForecast(city.latitude, city.longitude, undefined, days)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data) => this.forecast.set(data),
          error: () => {
            /* Echec silencieux : les previsions actuelles restent affichees */
          },
        });
    }
  }

  private loadFavorites(): void {
    this.weatherService
      .getPreferences()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (prefs) => {
          this.favoriteCities.set(prefs.favoriteCities ?? []);
          this.unitService.loadFromPreferences(prefs);
          this.defaultCityIndex.set(prefs.defaultCityIndex ?? null);
          this.overviewGranularity.set(prefs.overviewGranularity ?? 'day');
          const idx = prefs.defaultCityIndex;
          if (idx !== null && prefs.favoriteCities?.[idx]) {
            const fav = prefs.favoriteCities[idx];
            this.onCitySelected({
              id: 0,
              name: fav.name,
              latitude: fav.latitude,
              longitude: fav.longitude,
              country: fav.country,
              country_code: '',
            });
          } else {
            this.autoGeolocate();
          }
        },
        error: () => {
          this.autoGeolocate();
        },
      });
  }

  private autoGeolocate(): void {
    this.geoService
      .locate()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((city) =>
          this.geoService.reverseGeocode(city.latitude, city.longitude).pipe(
            map((name) => ({
              ...city,
              name: name ?? city.name,
              country: name ? city.country : '',
            })),
          ),
        ),
      )
      .subscribe({
        next: (city) => {
          this.onCitySelected(city);
          const fav: FavoriteCity = {
            name: city.name,
            latitude: city.latitude,
            longitude: city.longitude,
            country: city.country,
          };
          this.addFavorite(fav);
          this.setDefaultCity(0);
        },
        error: () => {
          /* Geolocalisation refusee ou non disponible : ne rien faire */
        },
      });
  }

  private loadExpertData(latitude: number, longitude: number): void {
    this.weatherService
      .getEnsemble(latitude, longitude)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.ensemble.set(data),
        error: () => {
          /* Echec silencieux : les cartes afficheront "Donnees indisponibles" */
        },
      });

    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() - 1);
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 30);

    const formatDate = (d: Date): string => d.toISOString().split('T')[0];

    this.weatherService
      .getHistorical(latitude, longitude, formatDate(startDate), formatDate(endDate))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.historical.set(data),
        error: () => {
          /* Echec silencieux : la carte affichera "Donnees indisponibles" */
        },
      });
  }
}
