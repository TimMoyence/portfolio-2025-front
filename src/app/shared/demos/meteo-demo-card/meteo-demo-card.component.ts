import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { DemoCity } from '../meteo-demo';

export interface MeteoDemoCardLabels {
  readonly live: string;
  readonly feels: string;
  readonly humidity: string;
  readonly uv: string;
  readonly air: string;
  readonly compassLabel: string;
  readonly windCap: string;
  readonly solarLabel: string;
  readonly solarCap: string;
  readonly citiesLabel: string;
  readonly hint: string;
}

@Component({
  selector: '[appMeteoDemoCard]',
  standalone: true,
  templateUrl: './meteo-demo-card.component.html',
  styleUrl: './meteo-demo-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeteoDemoCardComponent {
  readonly labels = input.required<MeteoDemoCardLabels>();

  readonly cities = input.required<readonly DemoCity[]>();

  readonly city = input.required<DemoCity>();

  readonly activeCityId = input.required<string>();

  readonly needleTransform = input.required<string>();

  readonly sunDot = input.required<{ x: number; y: number }>();

  readonly citySelected = output<string>();
}
