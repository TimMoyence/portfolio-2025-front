import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-sparkline',
  standalone: true,
  template: `
    @if (points().length > 1) {
      <svg
        [attr.viewBox]="viewBox()"
        class="h-8 w-full"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path [attr.d]="areaPath()" [attr.fill]="color()" fill-opacity="0.15" />
        <polyline
          [attr.points]="polylinePoints()"
          fill="none"
          [attr.stroke]="color()"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparklineComponent {
  readonly data = input<number[]>([]);

  readonly color = input('rgba(79, 179, 162, 0.85)');

  readonly points = computed(() => {
    const raw = this.data();
    if (!raw || raw.length < 2) return [];

    const min = Math.min(...raw);
    const max = Math.max(...raw);
    const range = max - min || 1;
    const width = 100;
    const height = 30;
    const step = width / (raw.length - 1);

    return raw.map((val, i) => ({
      x: Math.round(i * step * 100) / 100,
      y: Math.round((1 - (val - min) / range) * height * 100) / 100,
    }));
  });

  readonly viewBox = computed(() => '0 0 100 30');

  readonly polylinePoints = computed(() =>
    this.points()
      .map((p) => `${p.x},${p.y}`)
      .join(' '),
  );

  readonly areaPath = computed(() => {
    const pts = this.points();
    if (pts.length < 2) return '';
    const line = pts.map((p) => `${p.x},${p.y}`).join(' L ');
    return `M ${pts[0].x},30 L ${line} L ${pts[pts.length - 1].x},30 Z`;
  });
}
