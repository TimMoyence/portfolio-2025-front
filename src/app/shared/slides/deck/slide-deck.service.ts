import { Injectable, computed, signal } from '@angular/core';

export type SlideDeckMode = 'scroll' | 'fullscreen';

@Injectable({ providedIn: 'any' })
export class SlideDeckService {
  private readonly slides = signal<string[]>([]);
  private readonly currentId = signal<string | null>(null);
  private readonly modeSignal = signal<SlideDeckMode>('scroll');

  readonly current = this.currentId.asReadonly();
  readonly mode = this.modeSignal.asReadonly();
  readonly total = computed(() => this.slides().length);
  readonly currentIndexInAllSlides = computed(() => {
    const id = this.currentId();
    if (id === null) {
      return -1;
    }
    return this.slides().indexOf(id);
  });

  register(id: string): void {
    this.slides.update((list) => (list.includes(id) ? list : [...list, id]));
  }

  unregister(id: string): void {
    this.slides.update((list) => list.filter((s) => s !== id));
    if (this.currentId() === id) {
      this.currentId.set(null);
    }
  }

  goTo(id: string): void {
    if (!this.slides().includes(id)) {
      return;
    }
    this.currentId.set(id);
  }

  next(): void {
    this.step(1);
  }

  previous(): void {
    this.step(-1);
  }

  private step(direction: 1 | -1): void {
    const list = this.slides();
    if (list.length === 0) {
      return;
    }
    const idx = this.currentIndexInAllSlides();
    if (idx < 0) {
      this.currentId.set(list[0]);
      return;
    }
    const target = idx + direction;
    if (target < 0 || target > list.length - 1) {
      return;
    }
    this.currentId.set(list[target]);
  }

  setMode(mode: SlideDeckMode): void {
    this.modeSignal.set(mode);
  }
}
