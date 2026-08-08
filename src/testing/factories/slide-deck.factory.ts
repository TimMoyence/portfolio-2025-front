import type { SlideDeckConfig } from '../../app/shared/slides/deck/slide-deck.tokens';

export function buildSlideDeckConfig(overrides?: Partial<SlideDeckConfig>): SlideDeckConfig {
  return {
    allowFullscreen: true,
    swiperInitDelayMs: 0,
    i18nPrefix: 'slideDeck',
    ...overrides,
  };
}
