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
import { animateValue } from "../../shared/utils/animate-value";
import {
  createMeteoCities,
  needleTransform,
  sunDot,
  type DemoCity,
} from "../../shared/demos/meteo-demo";
import {
  buildDeterministicHeatmap,
  buildRandomHeatmap,
  gaugeOffset,
} from "../../shared/demos/sebastian-gauge";

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
   * Quatre villes jouables aux donnees fictives (coeurs numeriques partages via
   * {@link createMeteoCities}). Seuls les libelles i18n restent LOCAUX ici : les
   * IDs `@@atelierMeteo*` sont propres au hub (distincts de la landing Meteo).
   */
  protected readonly cities: readonly DemoCity[] = createMeteoCities({
    bordeaux: {
      cond: $localize`:@@atelierMeteoCondBordeaux:Ciel voilé · brise d'ouest`,
      aqiLabel: $localize`:@@atelierMeteoAqiGood:Bon`,
      windTxt: $localize`:@@atelierMeteoWindW:O`,
    },
    paris: {
      cond: $localize`:@@atelierMeteoCondParis:Couvert · vent du nord`,
      aqiLabel: $localize`:@@atelierMeteoAqiOk:Correct`,
      windTxt: $localize`:@@atelierMeteoWindN:N`,
    },
    nice: {
      cond: $localize`:@@atelierMeteoCondNice:Grand soleil · mer calme`,
      aqiLabel: $localize`:@@atelierMeteoAqiGood:Bon`,
      windTxt: $localize`:@@atelierMeteoWindSE:SE`,
    },
    lyon: {
      cond: $localize`:@@atelierMeteoCondLyon:Éclaircies · brise du sud`,
      aqiLabel: $localize`:@@atelierMeteoAqiOk:Correct`,
      windTxt: $localize`:@@atelierMeteoWindS:S`,
    },
  });

  /** Identifiant de la ville actuellement selectionnee. */
  protected readonly activeCityId = signal<string>("bordeaux");

  /** Ville selectionnee, derivee de `activeCityId`. */
  protected readonly city = computed<DemoCity>(
    () =>
      this.cities.find((c) => c.id === this.activeCityId()) ?? this.cities[0],
  );

  /** Transformation SVG de l'aiguille de la boussole selon la direction du vent. */
  protected readonly needleTransform = computed(() =>
    needleTransform(this.city().windDeg),
  );

  /** Coordonnees (cx, cy) du soleil sur l'arc selon la progression `sun`. */
  protected readonly sunDot = computed(() => sunDot(this.city().sun));

  /** Selectionne une ville (recalcule l'ensemble de la demo meteo). */
  protected selectCity(id: string): void {
    this.activeCityId.set(id);
  }

  // --- Demos jouables : Sebastian simule ------------------------------------

  /** Score sante cible de la jauge (fictif, calque maquette). */
  protected readonly healthTarget = 78;

  /**
   * Valeur courante de la jauge. En SSR/prerender elle reste a sa valeur cible
   * (etat lisible sans JS) ; en navigateur elle part de 0 puis s'anime via
   * `animateGauge()`.
   */
  protected readonly gaugeValue = signal<number>(this.healthTarget);

  /** `stroke-dashoffset` de la jauge derive de `gaugeValue`. */
  protected readonly gaugeOffset = computed(() =>
    gaugeOffset(this.gaugeValue()),
  );

  /**
   * Heatmap d'activite Sebastian sur 28 jours (4 semaines × 7).
   * En SSR la sequence est deterministe (pas de `Math.random`) pour un rendu
   * stable et hydratable ; en navigateur elle peut etre regeneree.
   */
  protected readonly heatmap = signal<number[]>(buildDeterministicHeatmap(28));

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Demarre la jauge a 0 puis l'anime : effet « vivant » browser-only.
      this.gaugeValue.set(0);
      this.animateGauge();
      // Regenere une heatmap variee (Math.random) uniquement cote client.
      this.heatmap.set(buildRandomHeatmap(28));
    }
  }

  /**
   * Anime la jauge de 0 a `healthTarget` via `requestAnimationFrame`.
   * Browser-only (gardee par le constructeur).
   */
  private animateGauge(): void {
    animateValue({
      from: 0,
      to: this.healthTarget,
      durationMs: 1400,
      onFrame: (v) => this.gaugeValue.set(Math.round(v)),
    });
  }
}
