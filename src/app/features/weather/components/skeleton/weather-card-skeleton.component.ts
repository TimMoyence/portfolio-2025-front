import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-weather-card-skeleton',
  standalone: true,
  host: { class: 'block' },
  template: `
    <div
      class="animate-pulse rounded-[20px] border border-teal/15 bg-white/5 p-4 backdrop-blur-xl"
      [class.p-3]="compact()"
    >
      <div class="mb-3 h-4 w-24 rounded bg-white/15"></div>
      <div class="h-8 w-16 rounded bg-white/10"></div>
      <div class="mt-2 h-3 w-32 rounded bg-white/[0.06]"></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeatherCardSkeletonComponent {
  readonly compact = input(false);
}
