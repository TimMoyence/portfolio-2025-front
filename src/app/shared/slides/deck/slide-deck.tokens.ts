import { InjectionToken } from "@angular/core";

export interface SlideDeckConfig {
  /** Active le toggle plein écran. Défaut: true. */
  allowFullscreen: boolean;
  /** Délai (ms) avant init Swiper après entrée fullscreen. Défaut: 50. */
  swiperInitDelayMs: number;
  /** Préfixe i18n pour les libellés UI (boutons précédent/suivant/fullscreen). */
  i18nPrefix: string;
}

export const SLIDE_DECK_CONFIG = new InjectionToken<SlideDeckConfig>(
  "SLIDE_DECK_CONFIG",
  {
    providedIn: "root",
    factory: () => ({
      allowFullscreen: true,
      swiperInitDelayMs: 50,
      i18nPrefix: "slideDeck",
    }),
  },
);
