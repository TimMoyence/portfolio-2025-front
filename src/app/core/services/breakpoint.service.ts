import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class BreakpointService {
  private readonly tabletteOuMoins = signal(false);

  readonly isTabletOrBelow = this.tabletteOuMoins.asReadonly();

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      const requete = window.matchMedia('(max-width: 1024px)');
      this.tabletteOuMoins.set(requete.matches);
      requete.addEventListener('change', ({ matches }) => this.tabletteOuMoins.set(matches));
    }
  }
}
