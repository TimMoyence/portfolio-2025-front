import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import type {
  AirQualityData,
  CityResult,
  EnsembleData,
  ForecastResponse,
  HistoricalData,
} from "../../core/models/weather.model";
import { WeatherService } from "../../core/services/weather.service";
import { AirQualityCardComponent } from "./components/air-quality-card/air-quality-card.component";
import { CapeCardComponent } from "./components/cape-card/cape-card.component";
import { CitySearchComponent } from "./components/city-search/city-search.component";
import { CloudVisibilityCardComponent } from "./components/cloud-visibility-card/cloud-visibility-card.component";
import { CurrentConditionsComponent } from "./components/current-conditions/current-conditions.component";
import { DailyForecastComponent } from "./components/daily-forecast/daily-forecast.component";
import { DataExportComponent } from "./components/data-export/data-export.component";
import { HistoricalComparisonComponent } from "./components/historical-comparison/historical-comparison.component";
import { HourlyChartComponent } from "./components/hourly-chart/hourly-chart.component";
import { HumidityCardComponent } from "./components/humidity-card/humidity-card.component";
import { LevelSelectorComponent } from "./components/level-selector/level-selector.component";
import { ModelComparisonComponent } from "./components/model-comparison/model-comparison.component";
import { PressureCardComponent } from "./components/pressure-card/pressure-card.component";
import { SpaghettiPlotComponent } from "./components/spaghetti-plot/spaghetti-plot.component";
import { SunArcComponent } from "./components/sun-arc/sun-arc.component";
import { TransitionPromptComponent } from "./components/transition-prompt/transition-prompt.component";
import { UvIndexCardComponent } from "./components/uv-index-card/uv-index-card.component";
import { WindCompassComponent } from "./components/wind-compass/wind-compass.component";
import { WeatherLevelService } from "./services/weather-level.service";
import { weatherCodeToBackground } from "./utils/weather-code-background";

/**
 * Composant principal de l'application meteo.
 * Orchestre la recherche de ville, le chargement des previsions,
 * le systeme de niveaux et l'affichage des sous-composants.
 */
@Component({
  selector: "app-weather-app",
  standalone: true,
  imports: [
    CommonModule,
    CitySearchComponent,
    CurrentConditionsComponent,
    HourlyChartComponent,
    DailyForecastComponent,
    LevelSelectorComponent,
    TransitionPromptComponent,
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
  ],
  templateUrl: "./weather-app.component.html",
  styleUrl: "./weather-app.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeatherAppComponent implements OnInit {
  /** Previsions meteo chargees depuis l'API. */
  readonly forecast = signal<ForecastResponse | null>(null);

  /** Donnees de qualite de l'air chargees depuis l'API. */
  readonly airQuality = signal<AirQualityData | null>(null);

  /** Donnees d'ensemble multi-modeles chargees depuis l'API. */
  readonly ensemble = signal<EnsembleData | null>(null);

  /** Donnees historiques journalieres chargees depuis l'API. */
  readonly historical = signal<HistoricalData | null>(null);

  /** Ville actuellement selectionnee. */
  readonly selectedCity = signal<CityResult | null>(null);

  /** Indicateur de chargement. */
  readonly loading = signal(false);

  /** Message d'erreur eventuel. */
  readonly error = signal<string | null>(null);

  private readonly weatherService = inject(WeatherService);

  /** Service de gestion du niveau d'experience. */
  readonly levelService = inject(WeatherLevelService);

  /** Classes CSS de gradient dynamique basees sur le code meteo courant. */
  readonly backgroundClasses = computed(() => {
    const data = this.forecast();
    if (!data) return "from-blue-900 via-indigo-900 to-purple-900";
    return weatherCodeToBackground(data.current.weather_code);
  });

  ngOnInit(): void {
    this.levelService.loadPreferences();
    this.levelService.recordUsage();
  }

  /** Charge les previsions meteo pour la ville selectionnee. */
  onCitySelected(city: CityResult): void {
    this.selectedCity.set(city);
    this.loading.set(true);
    this.error.set(null);
    this.airQuality.set(null);
    this.ensemble.set(null);
    this.historical.set(null);

    this.weatherService.getForecast(city.latitude, city.longitude).subscribe({
      next: (data) => {
        this.forecast.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(
          err?.error?.message ??
            $localize`:weather.error.loading|@@weatherErrorLoading:Erreur lors du chargement des prévisions.`,
        );
        this.loading.set(false);
      },
    });

    // Charge la qualite de l'air en parallele pour les niveaux Curieux+
    if (this.levelService.level() !== "discovery") {
      this.weatherService
        .getAirQuality(city.latitude, city.longitude)
        .subscribe({
          next: (data) => this.airQuality.set(data),
          error: () => {
            /* Echec silencieux : la carte affichera "Donnees indisponibles" */
          },
        });
    }

    // Charge les donnees Expert (ensemble + historique) pour le niveau expert
    if (this.levelService.level() === "expert") {
      this.loadExpertData(city.latitude, city.longitude);
    }
  }

  /**
   * Extrait la premiere valeur CAPE du modele GFS dans les donnees d'ensemble.
   * Retourne null si les donnees sont indisponibles.
   */
  extractCape(): number | null {
    const data = this.ensemble();
    if (!data) return null;

    const gfs = data.models.find((m) => m.model === "GFS");
    if (!gfs?.hourly.cape?.length) return null;

    return gfs.hourly.cape[0];
  }

  /**
   * Charge les donnees ensemble et historiques pour le niveau Expert.
   * Utilise les 30 derniers jours pour les donnees historiques.
   */
  private loadExpertData(latitude: number, longitude: number): void {
    // Donnees ensemble multi-modeles
    this.weatherService.getEnsemble(latitude, longitude).subscribe({
      next: (data) => this.ensemble.set(data),
      error: () => {
        /* Echec silencieux : les cartes afficheront "Donnees indisponibles" */
      },
    });

    // Donnees historiques : 30 derniers jours
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() - 1);
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 30);

    const formatDate = (d: Date): string => d.toISOString().split("T")[0];

    this.weatherService
      .getHistorical(
        latitude,
        longitude,
        formatDate(startDate),
        formatDate(endDate),
      )
      .subscribe({
        next: (data) => this.historical.set(data),
        error: () => {
          /* Echec silencieux : la carte affichera "Donnees indisponibles" */
        },
      });
  }
}
