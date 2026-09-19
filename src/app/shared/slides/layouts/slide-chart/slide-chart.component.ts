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
  template: `
    <figure class="slide-chart">
      <header class="slide-chart__header">
        <div>
          <p class="slide-chart__eyebrow">{{ caption() }}</p>
          <h2>{{ title() }}</h2>
          @if (context()) {
            <p class="slide-chart__context">{{ context() }}</p>
          }
        </div>
        @if (unit()) {
          <span class="slide-chart__unit">{{ unit() }}</span>
        }
      </header>

      <div
        class="slide-chart__plot"
        [class.is-line]="kind() === 'line'"
        [class.has-axes]="axisRanges().length >= 2"
        role="img"
        [attr.aria-label]="ariaLabel()"
      >
        <div class="slide-chart__grid" aria-hidden="true">
          <span></span><span></span><span></span><span></span>
        </div>

        @if (axisRanges().length >= 2) {
          <div class="slide-chart__axes" aria-hidden="true">
            <div class="slide-chart__axis slide-chart__axis--left">
              <span class="slide-chart__axis-title">{{ axisLabels()[0] }}</span>
              @for (tick of axisTicks(axisRanges()[0]); track tick) {
                <span>{{ tick }}</span>
              }
            </div>
            <div class="slide-chart__axis slide-chart__axis--right">
              <span class="slide-chart__axis-title">{{ axisLabels()[1] }}</span>
              @for (tick of axisTicks(axisRanges()[1]); track tick) {
                <span>{{ tick }}</span>
              }
            </div>
          </div>
        }

        @if (kind() === 'line') {
          <svg
            class="slide-chart__svg"
            viewBox="0 0 800 320"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            @for (serie of series(); track serie.label) {
              <polyline
                class="slide-chart__line"
                [class]="'tone-' + (serie.tone ?? 'teal')"
                [attr.points]="linePoints(serie)"
                [class.is-visible]="step() >= labels().length - 1"
              />
              @for (value of serie.values; track $index) {
                <g
                  class="slide-chart__point"
                  [class]="'tone-' + (serie.tone ?? 'teal')"
                  [class.is-visible]="$index <= step()"
                >
                  <circle [attr.cx]="pointX($index)" [attr.cy]="pointY(value)" r="7" />
                  <text [attr.x]="pointX($index)" [attr.y]="pointY(value) - 16">
                    {{ formatValue(value) }}
                  </text>
                </g>
              }
            }
          </svg>
        } @else {
          <div class="slide-chart__bars" [style.--count]="labels().length">
            @for (label of labels(); track label; let index = $index) {
              <div class="slide-chart__group">
                <div class="slide-chart__bar-set">
                  @for (serie of series(); track serie.label) {
                    <div class="slide-chart__bar-wrap">
                      <span
                        class="slide-chart__bar"
                        [class]="'tone-' + (serie.tone ?? 'teal')"
                        [class.is-visible]="index <= step()"
                        [style.--height]="hauteur(serie.values[index], $index) + '%'"
                      ></span>
                      <span class="slide-chart__value" [class.is-visible]="index <= step()">
                        {{ formatValue(serie.values[index]) }}
                      </span>
                    </div>
                  }
                </div>
                <span class="slide-chart__label">{{ label }}</span>
              </div>
            }
          </div>
        }

        @if (kind() === 'line') {
          <div class="slide-chart__labels" [style.--count]="labels().length" aria-hidden="true">
            @for (label of labels(); track label) {
              <span>{{ label }}</span>
            }
          </div>
        }
      </div>

      @if (formula()) {
        <p class="slide-chart__takeaway">{{ formula() }}</p>
      }

      @if (reading()) {
        <p class="slide-chart__reading"><strong>Lecture professionnelle</strong>{{ reading() }}</p>
      }

      <details class="slide-chart__data">
        <summary>Voir les données</summary>
        <div class="slide-chart__table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">{{ caption() || 'Période' }}</th>
                @for (label of labels(); track label) {
                  <th scope="col">{{ label }}</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (serie of series(); track serie.label) {
                <tr>
                  <th scope="row">{{ serie.label }}</th>
                  @for (value of serie.values; track $index) {
                    <td>{{ formatValue(value) }}</td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
        @if (source()) {
          <p class="slide-chart__source">Source : {{ source() }}</p>
        }
      </details>

      <ul class="slide-chart__legend" aria-label="Légende">
        @for (serie of series(); track serie.label) {
          <li [class]="'tone-' + (serie.tone ?? 'teal')">
            <span aria-hidden="true"></span>{{ serie.label }}
          </li>
        }
      </ul>
    </figure>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
    }

    .slide-chart {
      display: grid;
      align-content: center;
      gap: 1.1rem;
      width: min(100%, 74rem);
      min-height: 100vh;
      margin: 0 auto;
      padding: clamp(4rem, 8vw, 7rem) clamp(1.25rem, 6vw, 7rem);
      box-sizing: border-box;
    }

    .slide-chart__header {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 2rem;
    }

    .slide-chart__eyebrow {
      margin: 0 0 0.75rem;
      color: var(--accent-dark, var(--teal-dark));
      font-family: var(--font-mono, ui-monospace, monospace);
      font-size: 0.73rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    h2 {
      max-width: 22ch;
      margin: 0;
      color: var(--ink, #0c0902);
      font-family: var(--font-display, Georgia, serif);
      font-size: clamp(2.25rem, 5vw, 4.7rem);
      font-weight: 400;
      line-height: 0.98;
      text-wrap: balance;
    }

    .slide-chart__context {
      max-width: 58ch;
      margin: 1rem 0 0;
      color: var(--ink-soft, #3c3529);
      font-size: clamp(1rem, 1.4vw, 1.15rem);
      line-height: 1.5;
    }

    .slide-chart__unit {
      flex: 0 0 auto;
      padding: 0.55rem 0.8rem;
      border: 1px solid var(--border, rgba(var(--ink-rgb), 0.16));
      border-radius: var(--r-pill, 999px);
      color: var(--text-muted, var(--slide-text-muted));
      font-family: var(--font-mono, ui-monospace, monospace);
      font-size: 0.75rem;
    }

    .slide-chart__plot {
      position: relative;
      min-height: 25rem;
      padding: 1.7rem 1.25rem 4.5rem;
      border-block: 1px solid var(--border, rgba(var(--ink-rgb), 0.16));
      isolation: isolate;
    }

    .slide-chart__plot.has-axes {
      padding-inline: 3.25rem;
    }

    .slide-chart__axes {
      position: absolute;
      inset: 1.7rem 0.35rem 4.5rem;
      display: flex;
      justify-content: space-between;
      pointer-events: none;
    }

    .slide-chart__axis {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      color: var(--text-muted, var(--slide-text-muted));
      font-family: var(--font-mono, ui-monospace, monospace);
      font-size: 0.68rem;
      line-height: 1;
    }

    .slide-chart__axis-title {
      color: var(--ink, #0c0902);
      font-weight: 800;
    }

    .slide-chart__grid {
      position: absolute;
      z-index: -1;
      inset: 1.7rem 1.25rem 4.5rem;
      display: grid;
      grid-template-rows: repeat(4, 1fr);
    }

    .slide-chart__grid span {
      border-top: 1px solid rgba(var(--ink-rgb), 0.1);
    }

    .slide-chart__plot.has-axes .slide-chart__grid {
      inset-inline: 3.25rem;
    }

    .slide-chart__bars {
      display: grid;
      grid-template-columns: repeat(var(--count, 1), minmax(0, 1fr));
      align-items: end;
      gap: clamp(0.55rem, 2vw, 1.5rem);
      height: 100%;
    }

    .slide-chart__group {
      display: grid;
      grid-template-rows: 1fr auto;
      min-width: 0;
      height: 100%;
    }

    .slide-chart__bar-set {
      display: flex;
      align-items: end;
      justify-content: center;
      gap: clamp(0.25rem, 0.7vw, 0.55rem);
      min-height: 0;
    }

    .slide-chart__bar-wrap {
      position: relative;
      display: flex;
      align-items: end;
      justify-content: center;
      width: min(3.2rem, 42%);
      height: 100%;
    }

    .slide-chart__bar {
      display: block;
      width: 100%;
      height: var(--height);
      min-height: 0.25rem;
      border-radius: 0.35rem 0.35rem 0 0;
      background: var(--bar, #4fb3a2);
      opacity: 0.15;
      transform: scaleY(0.06);
      transform-origin: bottom;
      transition:
        opacity 300ms ease,
        transform 520ms cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .slide-chart__bar.is-visible {
      opacity: 0.92;
      transform: scaleY(1);
    }

    .slide-chart__value {
      position: absolute;
      bottom: calc(var(--height) + 0.45rem);
      color: var(--ink, #0c0902);
      font-family: var(--font-mono, ui-monospace, monospace);
      font-size: clamp(0.68rem, 1.1vw, 0.82rem);
      font-weight: 700;
      opacity: 0;
      transform: translateY(0.25rem);
      transition:
        opacity 220ms ease,
        transform 220ms ease;
      white-space: nowrap;
    }

    .slide-chart__value.is-visible {
      opacity: 1;
      transform: translateY(0);
    }

    .slide-chart__label,
    .slide-chart__labels {
      color: var(--text-muted, var(--slide-text-muted));
      font-family: var(--font-mono, ui-monospace, monospace);
      font-size: 0.75rem;
      text-align: center;
    }

    .slide-chart__label {
      padding-top: 0.9rem;
    }

    .slide-chart__svg {
      display: block;
      width: 100%;
      height: calc(100% - 0.5rem);
      overflow: visible;
    }

    .slide-chart__line {
      fill: none;
      stroke: var(--bar, #277c70);
      stroke-width: 5;
      stroke-linecap: round;
      stroke-linejoin: round;
      opacity: 0.18;
      transition: opacity 300ms ease;
    }

    .slide-chart__line.is-visible {
      opacity: 0.92;
    }

    .slide-chart__point {
      fill: var(--bar, #277c70);
      opacity: 0.14;
      transition: opacity 240ms ease;
    }

    .slide-chart__point.is-visible {
      opacity: 1;
    }

    .slide-chart__point text {
      fill: var(--ink, #0c0902);
      font-family: var(--font-mono, ui-monospace, monospace);
      font-size: 16px;
      font-weight: 700;
      text-anchor: middle;
    }

    .slide-chart__labels {
      position: absolute;
      right: 1.25rem;
      bottom: 1.15rem;
      left: 1.25rem;
      display: grid;
      grid-template-columns: repeat(var(--count, 1), 1fr);
      gap: 0.5rem;
    }

    .slide-chart__plot.has-axes .slide-chart__labels {
      inset-inline: 3.25rem;
    }

    .slide-chart__takeaway {
      margin: 0;
      color: var(--ink-soft, #3c3529);
      font-size: clamp(1rem, 1.4vw, 1.2rem);
      font-weight: 650;
      line-height: 1.45;
    }

    .slide-chart__reading {
      margin: -0.35rem 0 0;
      padding-left: 1rem;
      border-left: 3px solid var(--accent, #4fb3a2);
      color: var(--ink-soft, #3c3529);
      line-height: 1.5;
    }

    .slide-chart__reading strong {
      display: block;
      margin-bottom: 0.2rem;
      color: var(--accent-dark, var(--teal-dark));
      font-size: 0.78rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .slide-chart__data {
      border-top: 1px solid var(--border, rgba(var(--ink-rgb), 0.16));
      color: var(--text-muted, var(--slide-text-muted));
      font-size: 0.8rem;
    }

    .slide-chart__data summary {
      width: fit-content;
      padding: 0.55rem 0;
      cursor: pointer;
      color: var(--ink, #0c0902);
      font-weight: 700;
    }

    .slide-chart__table-wrap {
      overflow-x: auto;
    }

    .slide-chart__data table {
      width: 100%;
      border-collapse: collapse;
      min-width: 34rem;
      text-align: left;
    }

    .slide-chart__data th,
    .slide-chart__data td {
      padding: 0.45rem 0.7rem;
      border-top: 1px solid rgba(var(--ink-rgb), 0.1);
      white-space: nowrap;
    }

    .slide-chart__data th {
      color: var(--ink, #0c0902);
      font-weight: 700;
    }

    .slide-chart__source {
      margin: 0.65rem 0 0;
      font-size: 0.74rem;
    }

    .slide-chart__legend {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem 1.5rem;
      margin: 0;
      padding: 0;
      list-style: none;
      color: var(--text-muted, var(--slide-text-muted));
      font-size: 0.82rem;
    }

    .slide-chart__legend li {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
    }

    .slide-chart__legend li span {
      width: 0.65rem;
      height: 0.65rem;
      border-radius: 50%;
      background: var(--bar, #4fb3a2);
    }

    .tone-teal {
      --bar: #277c70;
    }
    .tone-gold {
      --bar: #c39238;
    }
    .tone-ink {
      --bar: #0c0902;
    }

    @media (max-width: 700px) {
      .slide-chart__header {
        align-items: flex-start;
        flex-direction: column;
        gap: 1rem;
      }

      .slide-chart__plot {
        min-height: 21rem;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .slide-chart__bar,
      .slide-chart__value,
      .slide-chart__line,
      .slide-chart__point {
        transition: none;
      }
    }
  `,
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
  protected readonly playing = signal(false);
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
    this.playing.set(true);
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
    this.playing.set(false);
  }
}
