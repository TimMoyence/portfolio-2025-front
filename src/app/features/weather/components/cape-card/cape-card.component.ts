import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MetricCardComponent } from '../metric-card/metric-card.component';

@Component({
  selector: 'app-cape-card',
  standalone: true,
  imports: [DecimalPipe, MetricCardComponent],
  template: `
    <app-metric-card
      tooltipId="cape-explanation"
      i18n-tooltipTitle="weather.cape.tooltip.title|@@weatherCapeTooltipTitle"
      tooltipTitle="Qu'est-ce que le CAPE ?"
      i18n-tooltipContent="weather.cape.tooltip.content|@@weatherCapeTooltipContent"
      tooltipContent="CAPE mesure l'énergie disponible pour les orages. Plus la valeur est élevée, plus les orages peuvent être violents."
      [unavailable]="cape() === null"
    >
      <span cardTitle i18n="weather.cape.title|@@weatherCapeTitle">CAPE (instabilité)</span>

      @if (cape() !== null) {
        <div class="flex items-baseline gap-2">
          <span class="font-display text-4xl font-normal text-white">
            {{ cape()! | number: '1.0-0' }}
          </span>
          <span class="font-mono text-xs text-white/50">J/kg</span>
          <span [class]="'text-sm font-medium ' + labelColor()">
            {{ instabilityLabel() }}
          </span>
        </div>

        <div
          class="relative mt-3 h-2 overflow-hidden rounded-full bg-white/10"
          role="meter"
          [attr.aria-valuenow]="cape()"
          aria-valuemin="0"
          aria-valuemax="4000"
          [attr.aria-valuetext]="instabilityLabel()"
        >
          <div
            class="absolute inset-0 rounded-full"
            style="background: linear-gradient(to right, #22c55e, #eab308, #f97316, #ef4444, #a855f7)"
          ></div>
          <div
            class="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0b1220] bg-white shadow-md"
            [style.left.%]="gaugePosition()"
          ></div>
        </div>

        <div
          class="mt-1 flex justify-between font-mono text-[10px] tracking-[0.08em] text-white/40"
        >
          <span>0</span>
          <span>500</span>
          <span>1000</span>
          <span>2000</span>
          <span>3000+</span>
        </div>
      }
    </app-metric-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CapeCardComponent {
  readonly cape = input<number | null>(null);

  readonly instabilityLabel = computed(() => {
    const value = this.cape();
    if (value === null) return '';
    if (value < 500) return $localize`:weather.cape.stable|@@weatherCapeStable:Stable`;
    if (value < 1000)
      return $localize`:weather.cape.marginal|@@weatherCapeMarginal:Instabilité marginale`;
    if (value < 2000)
      return $localize`:weather.cape.moderate|@@weatherCapeModerate:Instabilité modérée`;
    if (value < 3000) return $localize`:weather.cape.strong|@@weatherCapeStrong:Instabilité forte`;
    return $localize`:weather.cape.extreme|@@weatherCapeExtreme:Instabilité extrême`;
  });

  readonly labelColor = computed(() => {
    const value = this.cape();
    if (value === null) return '';
    if (value < 500) return 'text-green-400';
    if (value < 1000) return 'text-yellow-400';
    if (value < 2000) return 'text-orange-400';
    if (value < 3000) return 'text-red-400';
    return 'text-purple-400';
  });

  readonly gaugePosition = computed(() => {
    const value = this.cape();
    if (value === null) return 0;
    return Math.min((value / 4000) * 100, 100);
  });
}
