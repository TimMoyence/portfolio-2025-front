import { isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class BreakpointService {
  private readonly platformId = inject(PLATFORM_ID);

  private readonly _isMobile = signal(false);

  private readonly _isTabletOrBelow = signal(false);

  readonly isMobile = computed(() => {
    if (!isPlatformBrowser(this.platformId)) return false;
    return this._isMobile();
  });

  readonly isTabletOrBelow = computed(() => {
    if (!isPlatformBrowser(this.platformId)) return false;
    return this._isTabletOrBelow();
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const mobileMq = window.matchMedia('(max-width: 768px)');
      this._isMobile.set(mobileMq.matches);
      mobileMq.addEventListener('change', (e) => this._isMobile.set(e.matches));

      const tabletMq = window.matchMedia('(max-width: 1024px)');
      this._isTabletOrBelow.set(tabletMq.matches);
      tabletMq.addEventListener('change', (e) => this._isTabletOrBelow.set(e.matches));
    }
  }
}
