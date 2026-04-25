// shared/slides/index.ts
export { SlideDeckComponent } from "./deck/slide-deck.component";
export { SlideComponent } from "./deck/slide.component";
export { SlideDeckService } from "./deck/slide-deck.service";
export { FullscreenAdapter } from "./deck/fullscreen.adapter";
export { SLIDE_DECK_CONFIG } from "./deck/slide-deck.tokens";
export type { SlideDeckConfig } from "./deck/slide-deck.tokens";
export type { SlideDeckMode } from "./deck/slide-deck.service";

// Layouts
export { SlideHeroComponent } from "./layouts/slide-hero/slide-hero.component";
export { SlideImageLeftComponent } from "./layouts/slide-image-left/slide-image-left.component";
export { SlideImageRightComponent } from "./layouts/slide-image-right/slide-image-right.component";
export { SlideVideoComponent } from "./layouts/slide-video/slide-video.component";
export {
  SlideStatsComponent,
  type SlideStat,
} from "./layouts/slide-stats/slide-stats.component";
export { SlideQuoteComponent } from "./layouts/slide-quote/slide-quote.component";
export {
  SlideComparisonComponent,
  type ComparisonColumn,
  type ComparisonTone,
} from "./layouts/slide-comparison/slide-comparison.component";
export {
  SlideGridComponent,
  type SlideGridItem,
} from "./layouts/slide-grid/slide-grid.component";
export { SlideCtaComponent } from "./layouts/slide-cta/slide-cta.component";

// Interactions
export { SlideQuizComponent } from "./interactions/slide-quiz/slide-quiz.component";
export { SlidePollComponent } from "./interactions/slide-poll/slide-poll.component";
export { SlideReflectionComponent } from "./interactions/slide-reflection/slide-reflection.component";
