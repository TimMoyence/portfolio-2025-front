import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AsiliCtaBandComponent } from '../../shared/sections';
import { RevealOnScrollDirective } from '../../shared/directives/reveal-on-scroll.directive';
import { animateValue } from '../../shared/utils/animate-value';
import {
  createMeteoCities,
  needleTransform,
  sunDot,
  type DemoCity,
} from '../../shared/demos/meteo-demo';
import {
  MeteoDemoCardComponent,
  type MeteoDemoCardLabels,
} from '../../shared/demos/meteo-demo-card/meteo-demo-card.component';
import {
  buildDeterministicHeatmap,
  buildRandomHeatmap,
  gaugeOffset,
} from '../../shared/demos/sebastian-gauge';

@Component({
  selector: 'app-atelier',
  standalone: true,
  imports: [RouterLink, RevealOnScrollDirective, AsiliCtaBandComponent, MeteoDemoCardComponent],
  templateUrl: './atelier.component.html',
  styleUrl: './atelier.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AtelierComponent {
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly heroKicker = $localize`:@@atelierHeroKicker:Le bac à sable`;

  protected readonly heroLead = $localize`:@@atelierHeroLead:Pas des produits à vendre : des preuves jouables. Je teste des idées en vrai, et vous les manipulez ici, sans inscription. Deux expériences pour l'instant — Météo et Sebastian.`;

  protected readonly ctaKicker = $localize`:@@atelierCtaKicker:Ces démos vous parlent ?`;

  protected readonly ctaTitle = $localize`:@@atelierCtaTitle:Ce savoir-faire peut servir votre projet ou votre équipe.`;

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

  protected readonly meteoLabels: MeteoDemoCardLabels = {
    live: $localize`:@@atelierMeteoLive:EN DIRECT · 14:20`,
    feels: $localize`:@@atelierMeteoFeels:Ressenti`,
    humidity: $localize`:@@atelierMeteoHumidity:Humidité`,
    uv: $localize`:@@atelierMeteoUv:Indice UV`,
    air: $localize`:@@atelierMeteoAir:Qualité air`,
    compassLabel: $localize`:@@atelierMeteoCompassLabel:Boussole de vent`,
    windCap: $localize`:@@atelierMeteoWindCap:Vent`,
    solarLabel: $localize`:@@atelierMeteoSolarLabel:Arc solaire`,
    solarCap: $localize`:@@atelierMeteoSolarCap:Arc solaire`,
    citiesLabel: $localize`:@@atelierMeteoCitiesLabel:Choisir une ville`,
    hint: $localize`:@@atelierMeteoHint:Changez de ville — tout réagit, sans login.`,
  };

  protected readonly activeCityId = signal<string>('bordeaux');

  protected readonly city = computed<DemoCity>(
    () => this.cities.find((c) => c.id === this.activeCityId()) ?? this.cities[0],
  );

  protected readonly needleTransform = computed(() => needleTransform(this.city().windDeg));

  protected readonly sunDot = computed(() => sunDot(this.city().sun));

  protected selectCity(id: string): void {
    this.activeCityId.set(id);
  }

  protected readonly healthTarget = 78;

  protected readonly gaugeValue = signal<number>(this.healthTarget);

  protected readonly gaugeOffset = computed(() => gaugeOffset(this.gaugeValue()));

  protected readonly heatmap = signal<number[]>(buildDeterministicHeatmap(28));

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.gaugeValue.set(0);
      this.animateGauge();
      this.heatmap.set(buildRandomHeatmap(28));
    }
  }

  private animateGauge(): void {
    animateValue({
      from: 0,
      to: this.healthTarget,
      durationMs: 1400,
      onFrame: (v) => this.gaugeValue.set(Math.round(v)),
    });
  }
}
