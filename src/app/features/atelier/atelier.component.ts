import { isPlatformBrowser } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { AsiliCtaBandComponent } from "../../shared/sections";
import { RevealOnScrollDirective } from "../../shared/directives/reveal-on-scroll.directive";

/**
 * Donnees meteo simulees pour une ville de la demo jouable du hub.
 * Toutes les valeurs sont fictives et autonomes : la demo ne depend
 * d'aucune des vraies apps (Lots 4/5) ni d'un appel reseau.
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
 * Page hub de l'Atelier (`/atelier`) — le « bac a sable ».
 *
 * Compose la maquette `AsiliNewDesign/atelier.html` : hero `.page-hero`
 * (kicker « Le bac a sable »), deux blocs `.lab-big` cote a cote (Meteo /
 * Sebastian, teasers vers les landings), une bande immersive `.atelier` de
 * deux demos jouables **simulees** (meteo interactive a 4 villes + panneau
 * Sebastian avec jauge animee et heatmap), puis une bande CTA (`app-asili-cta-band`).
 *
 * Les demos sont **autonomes** : aucune dependance aux vraies apps Meteo /
 * Sebastian (Lots 4/5). Le markup SVG (boussole, arc solaire, jauge) est porte
 * verbatim de la maquette ; les valeurs sont des constantes fictives recalculees
 * cote composant a la selection d'une ville.
 *
 * Standalone, OnPush, SSR-safe : la jauge animee et la heatmap generee ne
 * s'activent qu'en environnement navigateur (`isPlatformBrowser`) ; le rendu
 * serveur expose un etat statique lisible (heatmap deterministe pre-calculee,
 * jauge a sa valeur cible). Les revelations au scroll passent par `appReveal`.
 *
 * Tout le texte est fourni en `$localize` (source FR verbatim de la maquette,
 * IDs `@@atelier*`) ; la traduction EN vit dans les XLF.
 */
@Component({
  selector: "app-atelier",
  standalone: true,
  imports: [RouterLink, RevealOnScrollDirective, AsiliCtaBandComponent],
  templateUrl: "./atelier.component.html",
  styleUrl: "./atelier.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AtelierComponent {
  private readonly platformId = inject(PLATFORM_ID);

  // --- Hero -----------------------------------------------------------------

  /** Sur-titre mono du hero. */
  protected readonly heroKicker = $localize`:@@atelierHeroKicker:Le bac à sable`;

  /** Accroche du hero (verbatim maquette). */
  protected readonly heroLead = $localize`:@@atelierHeroLead:Pas des produits à vendre : des preuves jouables. Je teste des idées en vrai, et vous les manipulez ici, sans inscription. Deux expériences pour l'instant — Météo et Sebastian.`;

  // --- Bande CTA ------------------------------------------------------------

  /** Sur-titre de la bande CTA (verbatim maquette). */
  protected readonly ctaKicker = $localize`:@@atelierCtaKicker:Ces démos vous parlent ?`;

  /** Titre de la bande CTA (verbatim maquette). */
  protected readonly ctaTitle = $localize`:@@atelierCtaTitle:Ce savoir-faire peut servir votre projet ou votre équipe.`;

  // --- Demos jouables : Meteo simulee ---------------------------------------

  /**
   * Quatre villes jouables aux donnees fictives (calque des valeurs de la
   * maquette pour Bordeaux ; les trois autres sont coherentes et autonomes).
   */
  protected readonly cities: readonly DemoCity[] = [
    {
      id: "bordeaux",
      name: "Bordeaux",
      cond: $localize`:@@atelierMeteoCondBordeaux:Ciel voilé · brise d'ouest`,
      temp: 19,
      feels: 18,
      hum: 64,
      uv: 4,
      aqi: 22,
      aqiLabel: $localize`:@@atelierMeteoAqiGood:Bon`,
      wind: 14,
      windTxt: $localize`:@@atelierMeteoWindW:O`,
      windDeg: 270,
      sun: 0.5,
      sunrise: "06:42",
      sunset: "21:18",
    },
    {
      id: "paris",
      name: "Paris",
      cond: $localize`:@@atelierMeteoCondParis:Couvert · vent du nord`,
      temp: 16,
      feels: 14,
      hum: 71,
      uv: 3,
      aqi: 34,
      aqiLabel: $localize`:@@atelierMeteoAqiOk:Correct`,
      wind: 18,
      windTxt: $localize`:@@atelierMeteoWindN:N`,
      windDeg: 0,
      sun: 0.32,
      sunrise: "06:31",
      sunset: "21:34",
    },
    {
      id: "nice",
      name: "Nice",
      cond: $localize`:@@atelierMeteoCondNice:Grand soleil · mer calme`,
      temp: 24,
      feels: 25,
      hum: 52,
      uv: 7,
      aqi: 18,
      aqiLabel: $localize`:@@atelierMeteoAqiGood:Bon`,
      wind: 9,
      windTxt: $localize`:@@atelierMeteoWindSE:SE`,
      windDeg: 135,
      sun: 0.68,
      sunrise: "06:18",
      sunset: "21:06",
    },
    {
      id: "lyon",
      name: "Lyon",
      cond: $localize`:@@atelierMeteoCondLyon:Éclaircies · brise du sud`,
      temp: 21,
      feels: 20,
      hum: 58,
      uv: 5,
      aqi: 27,
      aqiLabel: $localize`:@@atelierMeteoAqiOk:Correct`,
      wind: 12,
      windTxt: $localize`:@@atelierMeteoWindS:S`,
      windDeg: 180,
      sun: 0.45,
      sunrise: "06:25",
      sunset: "21:22",
    },
  ];

  /** Identifiant de la ville actuellement selectionnee. */
  protected readonly activeCityId = signal<string>("bordeaux");

  /** Ville selectionnee, derivee de `activeCityId`. */
  protected readonly city = computed<DemoCity>(
    () =>
      this.cities.find((c) => c.id === this.activeCityId()) ?? this.cities[0],
  );

  /** Transformation SVG de l'aiguille de la boussole selon la direction du vent. */
  protected readonly needleTransform = computed(
    () => `rotate(${this.city().windDeg}, 90, 90)`,
  );

  /** Coordonnees (cx, cy) du soleil sur l'arc selon la progression `sun`. */
  protected readonly sunDot = computed(() => {
    const angle = Math.PI * (1 - this.city().sun); // 0 (gauche) → PI (droite)
    return {
      x: ARC.cx - Math.cos(angle) * ARC.r,
      y: ARC.cy - Math.sin(angle) * (ARC.cy - ARC.rayTop),
    };
  });

  /** Selectionne une ville (recalcule l'ensemble de la demo meteo). */
  protected selectCity(id: string): void {
    this.activeCityId.set(id);
  }

  // --- Demos jouables : Sebastian simule ------------------------------------

  /** Perimetre du cercle SVG de la jauge (r=40 → 2·π·40 ≈ 251). */
  private static readonly GAUGE_PERIMETER = 251;

  /** Score sante cible de la jauge (fictif, calque maquette). */
  protected readonly healthTarget = 78;

  /**
   * Valeur courante de la jauge. En SSR/prerender elle reste a sa valeur cible
   * (etat lisible sans JS) ; en navigateur elle part de 0 puis s'anime via
   * `animateGauge()`.
   */
  protected readonly gaugeValue = signal<number>(this.healthTarget);

  /** `stroke-dashoffset` de la jauge derive de `gaugeValue`. */
  protected readonly gaugeOffset = computed(
    () =>
      AtelierComponent.GAUGE_PERIMETER -
      (this.gaugeValue() / 100) * AtelierComponent.GAUGE_PERIMETER,
  );

  /**
   * Heatmap d'activite Sebastian sur 28 jours (4 semaines × 7).
   * En SSR la sequence est deterministe (pas de `Math.random`) pour un rendu
   * stable et hydratable ; en navigateur elle peut etre regeneree.
   */
  protected readonly heatmap = signal<number[]>(
    this.buildDeterministicHeatmap(),
  );

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Demarre la jauge a 0 puis l'anime : effet « vivant » browser-only.
      this.gaugeValue.set(0);
      this.animateGauge();
      // Regenere une heatmap variee (Math.random) uniquement cote client.
      this.heatmap.set(this.buildRandomHeatmap());
    }
  }

  /**
   * Heatmap deterministe (SSR-safe) : motif pseudo-aleatoire stable derive de
   * l'index, sans `Math.random`, pour un rendu serveur reproductible.
   */
  private buildDeterministicHeatmap(): number[] {
    return Array.from({ length: 28 }, (_, i) => {
      const v = (Math.sin(i * 1.7) + 1) / 2; // 0..1 deterministe
      return v > 0.78 ? 3 : v > 0.55 ? 2 : v > 0.3 ? 1 : 0;
    });
  }

  /** Heatmap variee generee en navigateur (calque du script de la maquette). */
  private buildRandomHeatmap(): number[] {
    return Array.from({ length: 28 }, () => {
      const r = Math.random();
      return r > 0.78 ? 3 : r > 0.55 ? 2 : r > 0.3 ? 1 : 0;
    });
  }

  /**
   * Anime la jauge de 0 a `healthTarget` via `requestAnimationFrame`.
   * Browser-only (gardee par le constructeur).
   */
  private animateGauge(): void {
    const target = this.healthTarget;
    const duration = 1400;
    const start = performance.now();

    const step = (now: number): void => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      this.gaugeValue.set(Math.round(eased * target));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }
}
