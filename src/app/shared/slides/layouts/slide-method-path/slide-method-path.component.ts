import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';

export interface SlideMethodStep {
  readonly id: string;
  readonly title: string;
  readonly question: string;
  readonly proof: string;
  readonly result: string;
}

@Component({
  selector: 'app-slide-method-path',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slide-method-path.component.html',
  styleUrl: './slide-method-path.component.scss',
})
export class SlideMethodPathComponent {
  readonly title = input<string>('');
  readonly subtitle = input<string>('');
  readonly steps = input.required<readonly SlideMethodStep[]>();
  readonly autoplay = input(true);

  protected readonly currentIndex = signal(0);
  protected readonly paused = signal(false);

  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      const mouvementReduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!this.autoplay() || this.steps().length < 2 || mouvementReduit) {
        return;
      }
      const timer = window.setInterval(() => {
        if (!this.paused()) {
          this.select((this.currentIndex() + 1) % this.steps().length);
        }
      }, 2600);
      this.destroyRef.onDestroy(() => window.clearInterval(timer));
    });
  }

  protected select(index: number): void {
    if (index >= 0 && index < this.steps().length) {
      this.currentIndex.set(index);
    }
  }

  protected libelleEtape(index: number, titre: string): string {
    return $localize`:@@slideMethodPathEtape:Étape ${index + 1}:numero: : ${titre}:titre:`;
  }

  protected isCurrent(index: number): boolean {
    return this.currentIndex() === index;
  }

  protected currentStep(): SlideMethodStep | undefined {
    return this.steps()[this.currentIndex()];
  }

  protected pause(): void {
    this.paused.set(true);
  }

  protected resume(): void {
    this.paused.set(false);
  }
}
