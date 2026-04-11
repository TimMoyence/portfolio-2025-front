import { computed, Injectable, signal, type Signal } from "@angular/core";

/**
 * Service de gestion des fragments d'une slide de presentation.
 * Permet de reveler progressivement les elements d'une slide un par un.
 *
 * Ce service n'est PAS providedIn: root — il doit etre fourni au niveau
 * du composant qui l'utilise, afin que chaque slide ait sa propre instance.
 */
@Injectable()
export class FragmentService {
  private readonly _total = signal(0);
  private readonly _visibleCount = signal(0);

  /** Nombre de fragments actuellement visibles. */
  readonly visibleCount: Signal<number> = this._visibleCount.asReadonly();

  /** True si tous les fragments sont reveles. */
  readonly isComplete: Signal<boolean> = computed(
    () => this._visibleCount() >= this._total(),
  );

  /**
   * Initialise le service pour une slide contenant `total` fragments.
   * Remet le compteur de visibilite a zero.
   */
  reset(total: number): void {
    this._total.set(total);
    this._visibleCount.set(0);
  }

  /**
   * Revele le fragment suivant.
   * @returns true s'il y avait un fragment a reveler, false sinon.
   */
  next(): boolean {
    if (this._visibleCount() >= this._total()) {
      return false;
    }
    this._visibleCount.update((count) => count + 1);
    return true;
  }

  /**
   * Masque le dernier fragment revele.
   * @returns true s'il y avait un fragment a masquer, false sinon.
   */
  prev(): boolean {
    if (this._visibleCount() <= 0) {
      return false;
    }
    this._visibleCount.update((count) => count - 1);
    return true;
  }

  /**
   * Revele tous les fragments d'un coup.
   */
  showAll(): void {
    this._visibleCount.set(this._total());
  }
}
