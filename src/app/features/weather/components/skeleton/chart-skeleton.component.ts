import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-chart-skeleton',
  standalone: true,
  host: { class: 'block' },
  template: `
    <div class="animate-pulse rounded-[20px] border border-teal/15 bg-white/5 p-6 backdrop-blur-xl">
      <div class="mb-4 h-5 w-40 rounded bg-white/15"></div>
      <div class="flex h-40 items-end gap-1 rounded bg-white/[0.03] p-4 md:h-64">
        @for (h of bars; track $index) {
          <div class="flex-1 rounded-t bg-teal/15" [style.height.%]="h"></div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartSkeletonComponent {
  readonly bars = [
    40, 55, 70, 65, 80, 60, 45, 75, 50, 35, 60, 70, 55, 40, 65, 80, 70, 55, 45, 60, 75, 50, 35, 55,
  ];
}
