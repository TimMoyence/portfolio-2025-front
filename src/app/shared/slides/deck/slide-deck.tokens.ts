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

/**
 * Marqueur DI fourni par `SlideDeckComponent`. Une `SlideComponent`
 * imbriquée détecte la présence d'un deck parent via `inject(SLIDE_DECK_HOST,
 * { optional: true })` — si non-null, le rendu est délégué au deck via
 * `TemplateRef`, sinon la slide se rend en standalone.
 */
export const SLIDE_DECK_HOST = new InjectionToken<true>("SLIDE_DECK_HOST");
