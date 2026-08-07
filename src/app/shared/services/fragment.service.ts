import { computed, Injectable, signal, type Signal } from '@angular/core';

/**
 * Volontairement pas `providedIn: 'root'` : chaque slide doit fournir le
 * service pour disposer de son propre compteur.
 */
@Injectable()
export class FragmentService {
  private readonly _total = signal(0);
  private readonly _visibleCount = signal(0);

  readonly visibleCount: Signal<number> = this._visibleCount.asReadonly();

  readonly isComplete: Signal<boolean> = computed(() => this._visibleCount() >= this._total());

  reset(total: number): void {
    this._total.set(total);
    this._visibleCount.set(0);
  }

  next(): boolean {
    if (this._visibleCount() >= this._total()) {
      return false;
    }
    this._visibleCount.update((count) => count + 1);
    return true;
  }

  prev(): boolean {
    if (this._visibleCount() <= 0) {
      return false;
    }
    this._visibleCount.update((count) => count - 1);
    return true;
  }

  showAll(): void {
    this._visibleCount.set(this._total());
  }
}
