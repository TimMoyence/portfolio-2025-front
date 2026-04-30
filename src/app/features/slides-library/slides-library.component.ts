import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { Meta } from "@angular/platform-browser";
import {
  SlideComparisonComponent,
  SlideComponent,
  SlideCtaComponent,
  SlideDeckComponent,
  SlideGridComponent,
  SlideHeroComponent,
  SlideImageLeftComponent,
  SlideImageRightComponent,
  SlidePollComponent,
  SlideQuizComponent,
  SlideQuoteComponent,
  SlideReflectionComponent,
  SlideStatsComponent,
  SlideVideoComponent,
} from "../../shared/slides";

/**
 * Catalogue interne des layouts et interactions de la lib `shared/slides`.
 *
 * Cette page n'est pas destinee a etre indexee : elle ajoute la balise
 * `robots: noindex, nofollow` via le service `Meta` au moment de
 * l'instanciation du composant. Elle sert de reference visuelle et de
 * smoke test pour verifier qu'une instance de chaque layout / interaction
 * se rend correctement.
 */
@Component({
  selector: "app-slides-library",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SlideDeckComponent,
    SlideComponent,
    SlideHeroComponent,
    SlideImageLeftComponent,
    SlideImageRightComponent,
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
  templateUrl: "./slides-library.component.html",
  styleUrl: "./slides-library.component.scss",
})
export class SlidesLibraryComponent {
  constructor() {
    const meta = inject(Meta);
    meta.updateTag({ name: "robots", content: "noindex, nofollow" });
  }
}
