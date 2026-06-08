import { isPlatformBrowser } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
} from "@angular/core";
import { RouterModule } from "@angular/router";
import { RevealOnScrollDirective } from "../../shared/directives/reveal-on-scroll.directive";
import {
  MOCK_AIR_QUALITY,
  MOCK_CURRENT,
  MOCK_DAILY,
  MOCK_FORECAST,
  MOCK_HOURLY,
} from "./weather-presentation-data";

/**
 * Donnees meteo simulees pour une ville de la demo jouable de la landing.
 * Toutes les valeurs sont fictives et autonomes : la demo ne depend d'aucune
 * des vraies apps (Lots 4/5) ni d'un appel reseau. La premiere ville
 * (Bordeaux) calque les valeurs courantes du jeu de donnees de presentation
 * (`MOCK_CURRENT`) ; les trois autres sont coherentes et autonomes.
 */
interface DemoCity {
  /** Identifiant technique (clef du bouton). */
  readonly id: string;
  /** Nom affiche de la ville. */
  readonly name: string;
  /** Condition meteo resumee (ex. « Ciel voile · brise d'ouest »). */
  readonly cond: string;
  /** Temperature en degres (entier). */
  readonly temp: number;
  /** Temperature ressentie en degres (entier). */
  readonly feels: number;
  /** Humidite relative en pourcent. */
  readonly hum: number;
  /** Indice UV (0–11). */
  readonly uv: number;
  /** Indice de qualite de l'air (european AQI). */
  readonly aqi: number;
  /** Libelle qualitatif de l'AQI (ex. « Bon »). */
  readonly aqiLabel: string;
  /** Vitesse du vent en km/h. */
  readonly wind: number;
  /** Direction cardinale du vent (ex. « O »). */
  readonly windTxt: string;
  /** Angle de la boussole en degres (0 = N, sens horaire). */
  readonly windDeg: number;
  /** Progression du soleil dans l'arc, 0 (lever) → 1 (coucher). */
  readonly sun: number;
  /** Heure de lever du soleil affichee. */
  readonly sunrise: string;
  /** Heure de coucher du soleil affichee. */
  readonly sunset: string;
}

/** Geometrie de l'arc solaire (calque du SVG `solar` de la maquette). */
const ARC = {
  cx: 95,
  cy: 92,
  r: 78,
  rayTop: 14,
} as const;

/**
 * Landing marketing de l'application Meteo (`/atelier/meteo`).
 *
 * Compose la maquette `AsiliNewDesign/landing-meteo.html` au format landing
 * Asili (`.lp-hero` split, `.lp-features`, `.lp-demo-grid`, `.lp-final`) : hero
 * split avec accroche + stats + CTA vers l'app complete, une **demo jouable
 * simulee** (selecteur de 4 villes recalculant boussole de vent, arc solaire,
 * dials UV / qualite de l'air), trois cartes features, une demo band et un CTA
 * final.
 *
 * La demo est **autonome** : aucune dependance aux vraies apps (Lots 4/5). Le
 * markup SVG (boussole, arc solaire) est porte verbatim de la maquette ; les
 * valeurs sont recalculees cote composant a la selection d'une ville. Les
 * donnees fictives de presentation (`weather-presentation-data.ts`) restent
 * exposees pour l'apercu 7 jours et la coherence du contenu.
 *
 * Standalone, OnPush, SSR-safe : l'effet parallaxe du hero ne s'active qu'en
 * environnement navigateur (`isPlatformBrowser`). Les revelations au scroll
 * passent par `appReveal` (fail-open). Destinee aux utilisateurs non
 * authentifies (guard `redirectIfAuthorizedGuard('weather')` sur la route).
 *
 * Tout le texte est fourni en `$localize` (source FR verbatim de la maquette,
 * IDs `@@weatherLanding*`) ; la traduction EN vit dans les XLF.
 */
@Component({
  selector: "app-weather-presentation",
  standalone: true,
  imports: [RouterModule, RevealOnScrollDirective],
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

  /** Offset vertical pour l'effet parallaxe du hero (en pixels). */
  parallaxOffset = 0;

  // --- Demo jouable : meteo simulee -----------------------------------------

  /**
   * Quatre villes jouables aux donnees fictives. Bordeaux calque les valeurs
   * courantes de `MOCK_CURRENT` ; les autres sont coherentes et autonomes.
   */
  readonly cities: readonly DemoCity[] = [
    {
      id: "bordeaux",
      name: "Bordeaux",
      cond: $localize`:@@weatherLandingCondBordeaux:Ciel voilé · brise d'ouest`,
      temp: 19,
      feels: 18,
      hum: 64,
      uv: 4,
      aqi: 22,
      aqiLabel: $localize`:@@weatherLandingAqiGood:Bon`,
      wind: 14,
      windTxt: $localize`:@@weatherLandingWindW:O`,
      windDeg: 270,
      sun: 0.5,
      sunrise: "06:42",
      sunset: "21:18",
    },
    {
      id: "paris",
      name: "Paris",
      cond: $localize`:@@weatherLandingCondParis:Couvert · vent du nord`,
      temp: 16,
      feels: 14,
      hum: 71,
      uv: 3,
      aqi: 34,
      aqiLabel: $localize`:@@weatherLandingAqiOk:Correct`,
      wind: 18,
      windTxt: $localize`:@@weatherLandingWindN:N`,
      windDeg: 0,
      sun: 0.32,
      sunrise: "06:31",
      sunset: "21:34",
    },
    {
      id: "nice",
      name: "Nice",
      cond: $localize`:@@weatherLandingCondNice:Grand soleil · mer calme`,
      temp: 24,
      feels: 25,
      hum: 52,
      uv: 7,
      aqi: 18,
      aqiLabel: $localize`:@@weatherLandingAqiGood:Bon`,
      wind: 9,
      windTxt: $localize`:@@weatherLandingWindSE:SE`,
      windDeg: 135,
      sun: 0.68,
      sunrise: "06:18",
      sunset: "21:06",
    },
    {
      id: "lyon",
      name: "Lyon",
      cond: $localize`:@@weatherLandingCondLyon:Éclaircies · brise du sud`,
      temp: 21,
      feels: 20,
      hum: 58,
      uv: 5,
      aqi: 27,
      aqiLabel: $localize`:@@weatherLandingAqiOk:Correct`,
      wind: 12,
      windTxt: $localize`:@@weatherLandingWindS:S`,
      windDeg: 180,
      sun: 0.45,
      sunrise: "06:25",
      sunset: "21:22",
    },
  ];

  /** Identifiant de la ville actuellement selectionnee. */
  readonly activeCityId = signal<string>("bordeaux");

  /** Ville selectionnee, derivee de `activeCityId`. */
  readonly city = computed<DemoCity>(
    () =>
      this.cities.find((c) => c.id === this.activeCityId()) ?? this.cities[0],
  );

  /** Transformation SVG de l'aiguille de la boussole selon la direction du vent. */
  readonly needleTransform = computed(
    () => `rotate(${this.city().windDeg}, 90, 90)`,
  );

  /** Coordonnees (cx, cy) du soleil sur l'arc selon la progression `sun`. */
  readonly sunDot = computed(() => {
    const angle = Math.PI * (1 - this.city().sun); // 0 (gauche) → PI (droite)
    return {
      x: ARC.cx - Math.cos(angle) * ARC.r,
      y: ARC.cy - Math.sin(angle) * (ARC.cy - ARC.rayTop),
    };
  });

  /** Selectionne une ville (recalcule l'ensemble de la demo meteo). */
  selectCity(id: string): void {
    this.activeCityId.set(id);
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    let ticking = false;

    const onScroll = (): void => {
      if (!ticking) {
        requestAnimationFrame(() => {
          this.parallaxOffset = Math.min(Math.round(window.scrollY * 0.06), 60);
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
