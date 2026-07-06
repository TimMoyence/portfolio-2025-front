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
  createMeteoCities,
  needleTransform,
  sunDot,
  type DemoCity,
} from "../../shared/demos/meteo-demo";
import {
  MOCK_AIR_QUALITY,
  MOCK_CURRENT,
  MOCK_DAILY,
  MOCK_FORECAST,
  MOCK_HOURLY,
} from "./weather-presentation-data";

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
   * Quatre villes jouables aux donnees fictives (coeurs numeriques partages via
   * {@link createMeteoCities}). Seuls les libelles i18n restent LOCAUX ici : les
   * IDs `@@weatherLanding*` sont propres a la landing (distincts du hub Atelier).
   * Bordeaux calque les valeurs courantes de `MOCK_CURRENT`.
   */
  readonly cities: readonly DemoCity[] = createMeteoCities({
    bordeaux: {
      cond: $localize`:@@weatherLandingCondBordeaux:Ciel voilé · brise d'ouest`,
      aqiLabel: $localize`:@@weatherLandingAqiGood:Bon`,
      windTxt: $localize`:@@weatherLandingWindW:O`,
    },
    paris: {
      cond: $localize`:@@weatherLandingCondParis:Couvert · vent du nord`,
      aqiLabel: $localize`:@@weatherLandingAqiOk:Correct`,
      windTxt: $localize`:@@weatherLandingWindN:N`,
    },
    nice: {
      cond: $localize`:@@weatherLandingCondNice:Grand soleil · mer calme`,
      aqiLabel: $localize`:@@weatherLandingAqiGood:Bon`,
      windTxt: $localize`:@@weatherLandingWindSE:SE`,
    },
    lyon: {
      cond: $localize`:@@weatherLandingCondLyon:Éclaircies · brise du sud`,
      aqiLabel: $localize`:@@weatherLandingAqiOk:Correct`,
      windTxt: $localize`:@@weatherLandingWindS:S`,
    },
  });

  /** Identifiant de la ville actuellement selectionnee. */
  readonly activeCityId = signal<string>("bordeaux");

  /** Ville selectionnee, derivee de `activeCityId`. */
  readonly city = computed<DemoCity>(
    () =>
      this.cities.find((c) => c.id === this.activeCityId()) ?? this.cities[0],
  );

  /** Transformation SVG de l'aiguille de la boussole selon la direction du vent. */
  readonly needleTransform = computed(() =>
    needleTransform(this.city().windDeg),
  );

  /** Coordonnees (cx, cy) du soleil sur l'arc selon la progression `sun`. */
  readonly sunDot = computed(() => sunDot(this.city().sun));

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
