import {
  SlideComparisonComponent,
  SlideComponent,
  SlideCtaComponent,
  SlideDeckComponent,
  SlideGridComponent,
  SlideHeroComponent,
  SlideImageComponent,
  SlidePollComponent,
  SlideQuoteComponent,
  SlideStatsComponent,
} from '../../../shared/slides';
import { ListePucesComponent } from './liste-puces.component';

export const DECK_FORMATION = [
  SlideDeckComponent,
  SlideComponent,
  SlideHeroComponent,
  SlideImageComponent,
  SlideStatsComponent,
  SlideGridComponent,
  SlideComparisonComponent,
  SlideQuoteComponent,
  SlidePollComponent,
  SlideCtaComponent,
  ListePucesComponent,
] as const;
