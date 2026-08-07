import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import {
  SlideComparisonComponent,
  SlideComponent,
  SlideCtaComponent,
  SlideDeckComponent,
  SlideGridComponent,
  SlideHeroComponent,
  SlideImageComponent,
  SlidePollComponent,
  SlideQuizComponent,
  SlideQuoteComponent,
  SlideReflectionComponent,
  SlideStatsComponent,
  SlideVideoComponent,
} from '../../shared/slides';

@Component({
  selector: 'app-slides-library',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SlideDeckComponent,
    SlideComponent,
    SlideHeroComponent,
    SlideImageComponent,
    SlideVideoComponent,
    SlideStatsComponent,
    SlideQuoteComponent,
    SlideComparisonComponent,
    SlideGridComponent,
    SlideCtaComponent,
    SlideQuizComponent,
    SlidePollComponent,
    SlideReflectionComponent,
  ],
  templateUrl: './slides-library.component.html',
  styleUrl: './slides-library.component.scss',
})
export class SlidesLibraryComponent {
  constructor() {
    const meta = inject(Meta);
    meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }
}
