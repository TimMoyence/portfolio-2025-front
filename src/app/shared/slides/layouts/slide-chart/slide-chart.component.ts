import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  input,
  signal,
} from '@angular/core';

export interface SlideChartSeries {
  readonly label: string;
  readonly values: readonly number[];
  readonly tone?: 'teal' | 'gold' | 'ink';
}

export type SlideChartKind = 'bars' | 'line';

@Component({
  selector: 'app-slide-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slide-chart.component.html',
  styleUrl: './slide-chart.component.scss',
})
export class SlideChartComponent {
  readonly title = input.required<string>();
  readonly caption = input<string>('');
  readonly context = input<string>('');
  readonly labels = input.required<readonly string[]>();
  readonly series = input.required<readonly SlideChartSeries[]>();
  readonly formula = input<string>('');
  readonly source = input<string>('');
  readonly unit = input<string>('');
  readonly kind = input<SlideChartKind>('bars');
  readonly axisRanges = input<readonly (readonly [number, number])[]>([]);
  readonly axisLabels = input<readonly [string, string]>(['A', 'B']);
  readonly reading = input<string>('');

  protected readonly step = signal(-1);
  private readonly hasPlayed = signal(false);

  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private timer: ReturnType<typeof setInterval> | null = null;
  private observer: IntersectionObserver | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.stop();
      this.observer?.disconnect();
    });

    afterNextRender(() => this.observeVisibility());
  }

  protected ariaLabel(): string {
    const data = this.series()
      .map((serie) => `${serie.label}: ${serie.values.join(', ')}`)
      .join('; ');
    return `${this.title()}: ${this.caption()}: ${data}`.trim();
  }

  protected hauteur(value: number, seriesIndex = 0): number {
    const range = this.axisRanges()[seriesIndex];
    if (range) {
      const [min, max] = range;
      return Math.max(8, Math.round(((value - min) / Math.max(max - min, 1)) * 100));
    }
    const values = this.series().flatMap((serie) => serie.values);
    const max = Math.max(...values, 1);
    return Math.max(8, Math.round((value / max) * 100));
  }

  protected formatValue(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(2).replace('.', ',');
  }

  protected axisTicks(range: readonly [number, number]): readonly string[] {
    const [min, max] = range;
    return [max, min + (max - min) / 2, min].map((value) => this.formatValue(value));
  }

  protected pointX(index: number): number {
    const count = Math.max(1, this.labels().length - 1);
    return 28 + (index / count) * 744;
  }

  protected pointY(value: number): number {
    const values = this.series().flatMap((serie) => serie.values);
    const min = Math.min(...values);
    const max = Math.max(...values, min + 1);
    return 270 - ((value - min) / (max - min)) * 220;
  }

  protected linePoints(serie: SlideChartSeries): string {
    return serie.values
      .map((value, index) => `${this.pointX(index)},${this.pointY(value)}`)
      .join(' ');
  }

  protected play(): void {
    this.stop();
    const lastStep = Math.max(0, this.labels().length - 1);
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      this.step.set(lastStep);
      return;
    }

    this.step.set(0);
    this.timer = setInterval(() => {
      const next = this.step() + 1;
      if (next >= lastStep) {
        this.step.set(lastStep);
        this.stop();
        return;
      }
      this.step.set(next);
    }, 560);
  }

  private observeVisibility(): void {
    if (typeof IntersectionObserver === 'undefined') {
      this.hasPlayed.set(true);
      this.play();
      return;
    }

    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !this.hasPlayed()) {
          this.hasPlayed.set(true);
          this.play();
          this.observer?.disconnect();
        }
      },
      { threshold: 0.45 },
    );
    this.observer.observe(this.elementRef.nativeElement);
  }

  private stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
