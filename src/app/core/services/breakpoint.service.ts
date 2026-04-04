import { isPlatformBrowser } from "@angular/common";
import {
  computed,
  inject,
  Injectable,
  PLATFORM_ID,
  signal,
} from "@angular/core";

/**
 * Service centralise de detection des breakpoints responsive.
 * Utilise `matchMedia` avec un guard `isPlatformBrowser` pour la compatibilite SSR.
 * Expose deux signaux reactifs : `isMobile` (< 768px) et `isTabletOrBelow` (< 1024px).
 */
@Injectable({
  providedIn: "root",
})
export class BreakpointService {
  private readonly platformId = inject(PLATFORM_ID);

  /** Signal brut pour le breakpoint mobile (max-width: 768px). */
  private readonly _isMobile = signal(false);

  /** Signal brut pour le breakpoint tablette (max-width: 1024px). */
  private readonly _isTabletOrBelow = signal(false);

  /** Vrai si la largeur du viewport est <= 768px. Retourne false en SSR. */
  readonly isMobile = computed(() => {
    if (!isPlatformBrowser(this.platformId)) return false;
    return this._isMobile();
  });

  /** Vrai si la largeur du viewport est <= 1024px. Retourne false en SSR. */
  readonly isTabletOrBelow = computed(() => {
    if (!isPlatformBrowser(this.platformId)) return false;
    return this._isTabletOrBelow();
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const mobileMq = window.matchMedia("(max-width: 768px)");
      this._isMobile.set(mobileMq.matches);
      mobileMq.addEventListener("change", (e) => this._isMobile.set(e.matches));

      const tabletMq = window.matchMedia("(max-width: 1024px)");
      this._isTabletOrBelow.set(tabletMq.matches);
      tabletMq.addEventListener("change", (e) =>
        this._isTabletOrBelow.set(e.matches),
      );
    }
  }
}
