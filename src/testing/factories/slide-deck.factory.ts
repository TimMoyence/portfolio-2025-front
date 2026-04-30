import type { SlideDeckConfig } from "../../app/shared/slides/deck/slide-deck.tokens";

export function buildSlideDeckConfig(
  overrides?: Partial<SlideDeckConfig>,
): SlideDeckConfig {
  return {
    allowFullscreen: true,
    swiperInitDelayMs: 0,
    i18nPrefix: "slideDeck",
    ...overrides,
  };
}

export interface SlideDeckStateStub {
  current: string | null;
  total: number;
  mode: "scroll" | "fullscreen";
}

export function buildSlideDeckState(
  overrides?: Partial<SlideDeckStateStub>,
): SlideDeckStateStub {
  return {
    current: "hero",
    total: 5,
    mode: "scroll",
    ...overrides,
  };
}
