import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { RevealOnScrollDirective } from '../../shared/directives/reveal-on-scroll.directive';
import {
  createMeteoCities,
  needleTransform,
  sunDot,
  type DemoCity,
} from '../../shared/demos/meteo-demo';
import {
  MOCK_AIR_QUALITY,
  MOCK_CURRENT,
  MOCK_DAILY,
  MOCK_FORECAST,
  MOCK_HOURLY,
} from './weather-presentation-data';

@Component({
  selector: 'app-weather-presentation',
  standalone: true,
  imports: [RouterModule, RevealOnScrollDirective],
  templateUrl: './weather-presentation.component.html',
  styleUrl: './weather-presentation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeatherPresentationComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  readonly current = MOCK_CURRENT;

  readonly hourly = MOCK_HOURLY;

  readonly daily = MOCK_DAILY;

  readonly forecast = MOCK_FORECAST;

  readonly airQuality = MOCK_AIR_QUALITY;

  parallaxOffset = 0;

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

  readonly activeCityId = signal<string>('bordeaux');

  readonly city = computed<DemoCity>(
    () => this.cities.find((c) => c.id === this.activeCityId()) ?? this.cities[0],
  );

  readonly needleTransform = computed(() => needleTransform(this.city().windDeg));

  readonly sunDot = computed(() => sunDot(this.city().sun));

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

    window.addEventListener('scroll', onScroll, { passive: true });

    this.destroyRef.onDestroy(() => {
      window.removeEventListener('scroll', onScroll);
    });
  }
}
