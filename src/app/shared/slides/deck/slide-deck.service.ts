import { Injectable, computed, signal } from "@angular/core";

export type SlideDeckMode = "scroll" | "fullscreen";

/**
 * Détient l'état réactif d'un slide deck : slides enregistrées (ordre stable),
 * slide courante, mode (scroll/fullscreen). Exposé via signaux pour
 * consommation OnPush par les composants enfants.
 */
@Injectable({ providedIn: "any" })
export class SlideDeckService {
  private readonly slides = signal<string[]>([]);
  private readonly currentId = signal<string | null>(null);
  private readonly modeSignal = signal<SlideDeckMode>("scroll");

  readonly current = this.currentId.asReadonly();
  readonly mode = this.modeSignal.asReadonly();
  readonly total = computed(() => this.slides().length);
  readonly currentIndex = computed(() => {
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
    const idx = this.currentIndex();
    if (idx < 0 || idx >= this.slides().length - 1) {
      return;
    }
    this.currentId.set(this.slides()[idx + 1]);
  }

  previous(): void {
    const idx = this.currentIndex();
    if (idx <= 0) {
      return;
    }
    this.currentId.set(this.slides()[idx - 1]);
  }

  setMode(mode: SlideDeckMode): void {
    this.modeSignal.set(mode);
  }
}
