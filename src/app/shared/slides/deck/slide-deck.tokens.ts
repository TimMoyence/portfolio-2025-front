import { InjectionToken } from '@angular/core';

export interface SlideDeckConfig {
  allowFullscreen: boolean;
  swiperInitDelayMs: number;
  i18nPrefix: string;
}

export const SLIDE_DECK_CONFIG = new InjectionToken<SlideDeckConfig>('SLIDE_DECK_CONFIG', {
  providedIn: 'root',
  factory: () => ({
    allowFullscreen: true,
    swiperInitDelayMs: 50,
    i18nPrefix: 'slideDeck',
  }),
});

export const SLIDE_DECK_HOST = new InjectionToken<true>('SLIDE_DECK_HOST');
