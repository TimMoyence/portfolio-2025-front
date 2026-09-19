import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
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

type MarqueurDeSerie = 'rond' | 'carre' | 'losange';

const GRADUATIONS = 5;
const MARQUEURS: readonly MarqueurDeSerie[] = ['rond', 'carre', 'losange'];

let compteurDeGraphiques = 0;

function prochainIdentifiantDeDescription(): string {
  compteurDeGraphiques += 1;
  return `slide-chart-description-${compteurDeGraphiques}`;
}

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
  readonly description = input<string>('');

  protected readonly libellePeriode = $localize`:@@slideChartPeriode:Période`;
  protected readonly idDescription = prochainIdentifiantDeDescription();
  protected readonly step = signal(-1);
  protected readonly echelle = computed<readonly [number, number]>(() => {
    const plage = this.axisRanges().at(0);
    if (plage !== undefined) {
      return plage;
    }
    const valeurs = this.series().flatMap((serie) => serie.values);
    const max = Math.max(...valeurs, 0);
    if (this.kind() === 'bars') {
      return [0, max > 0 ? max : 1];
    }
    const min = Math.min(...valeurs);
    return [min, Math.max(max, min + 1)];
  });
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
    const [min, max] = this.axisRanges()[seriesIndex] ?? this.echelle();
    const part = ((value - min) / Math.max(max - min, Number.EPSILON)) * 100;
    return Math.round(Math.min(Math.max(part, 0), 100));
  }

  protected formatValue(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(2).replace('.', ',');
  }

  protected axisTicks(range: readonly [number, number]): readonly string[] {
    const [min, max] = range;
    return Array.from({ length: GRADUATIONS }, (_, rang) =>
      this.formatValue(max - ((max - min) * rang) / (GRADUATIONS - 1)),
    );
  }

  protected pointX(index: number): number {
    const count = Math.max(1, this.labels().length - 1);
    return 28 + (index / count) * 744;
  }

  protected pointY(value: number): number {
    const [min, max] = this.echelle();
    const part = (value - min) / Math.max(max - min, Number.EPSILON);
    return 270 - Math.min(Math.max(part, 0), 1) * 220;
  }

  protected marqueur(seriesIndex: number): MarqueurDeSerie {
    return MARQUEURS[seriesIndex % MARQUEURS.length];
  }

  protected losange(x: number, y: number): string {
    return `${x},${y - 8} ${x + 8},${y} ${x},${y + 8} ${x - 8},${y}`;
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
