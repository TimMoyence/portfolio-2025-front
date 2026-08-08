import { computed, Injectable, signal, type Signal } from '@angular/core';

/**
 * `@Injectable()` sans `providedIn` : `@angular/core` instancie le service une
 * fois par injecteur qui le declare dans ses `providers`, donc un compteur par
 * hote. Un `providedIn: 'root'` partagerait un compteur unique entre toutes les
 * series de fragments de l'application.
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
