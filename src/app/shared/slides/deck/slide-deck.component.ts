import { NgTemplateOutlet, isPlatformBrowser } from "@angular/common";
import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  PLATFORM_ID,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  output,
  viewChild,
} from "@angular/core";
import { FullscreenAdapter } from "./fullscreen.adapter";
import { SlideComponent } from "./slide.component";
import { SlideDeckService, type SlideDeckMode } from "./slide-deck.service";
import { SLIDE_DECK_CONFIG, SLIDE_DECK_HOST } from "./slide-deck.tokens";

/**
 * Wrapper principal du moteur de presentation. Gere le mode scroll/fullscreen,
 * la navigation clavier (F, fleches, espace, echap), et emet `slideChanged`.
 *
 * Mode scroll : CSS scroll-snap natif, slides rendues directement via
 * leur `TemplateRef`. Mode fullscreen : Swiper Element wrappe chaque slide
 * dans un `<swiper-slide>` direct (pre-requis swiper.js).
 *
 * Resync sur sortie native du fullscreen (Esc, F11) via
 * `document:fullscreenchange` — sinon le deck restait en mode `fullscreen`
 * affichant Swiper alors que l'utilisateur etait revenu en page normale.
 */
@Component({
  selector: "app-slide-deck",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./slide-deck.component.html",
  styleUrl: "./slide-deck.component.scss",
  imports: [NgTemplateOutlet],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [{ provide: SLIDE_DECK_HOST, useValue: true }],
})
export class SlideDeckComponent {
  readonly mode = input<SlideDeckMode>("scroll");
  readonly allowFullscreen = input<boolean>(true);
  readonly theme = input<string>("default");
  readonly slideChanged = output<{ id: string; index: number }>();

  readonly deckRef = viewChild.required<ElementRef<HTMLElement>>("deckRoot");
  readonly slides = contentChildren(SlideComponent);

  protected readonly service = inject(SlideDeckService);
  protected readonly fullscreen = inject(FullscreenAdapter);
  protected readonly config = inject(SLIDE_DECK_CONFIG);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly cssClasses = computed(
    () => `slide-deck mode-${this.service.mode()} theme-${this.theme()}`,
  );

  /**
   * Slides effectivement rendues selon le mode courant. Filtre via
   * l'input `visibility` de `SlideComponent` :
   * - `both` : toujours visible.
   * - `scroll-only` : masque en mode fullscreen.
   * - `present-only` : masque en mode scroll.
   */
  protected readonly visibleSlides = computed(() => {
    const m = this.service.mode();
    return this.slides().filter((slide) => {
      const v = slide.visibility();
      if (v === "both") return true;
      if (m === "scroll" && v === "scroll-only") return true;
      if (m === "fullscreen" && v === "present-only") return true;
      return false;
    });
  });

  constructor() {
    // Initialise le mode depuis l'input
    effect(() => {
      this.service.setMode(this.mode());
    });

    // Emet slideChanged des qu'une slide devient courante
    effect(() => {
      const id = this.service.current();
      const idx = this.service.currentIndex();
      if (id !== null && idx >= 0) {
        this.slideChanged.emit({ id, index: idx });
        // Sync hash url pour deeplink + navigation clavier (skip SSR)
        if (isPlatformBrowser(this.platformId)) {
          const url = new URL(window.location.href);
          if (url.hash !== `#${id}`) {
            history.replaceState(
              null,
              "",
              `${url.pathname}${url.search}#${id}`,
            );
          }
        }
      }
    });
  }

  async toggleFullscreen(): Promise<void> {
    if (!this.allowFullscreen() || !isPlatformBrowser(this.platformId)) {
      return;
    }
    if (this.service.mode() === "fullscreen") {
      await this.fullscreen.exit();
      this.service.setMode("scroll");
      return;
    }
    const enterPromise = this.fullscreen.enter(this.deckRef().nativeElement);
    await this.fullscreen.loadSwiperElement();
    await enterPromise;
    this.service.setMode("fullscreen");
  }

  /**
   * Resynchronise le mode quand le navigateur sort du fullscreen sans
   * passer par `toggleFullscreen()` — typiquement via la touche Esc ou
   * F11. Sans ca, on restait en `mode === "fullscreen"` avec Swiper
   * actif alors que la page etait revenue en mode normal.
   */
  @HostListener("document:fullscreenchange")
  @HostListener("document:webkitfullscreenchange")
  protected onFullscreenChange(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    if (
      document.fullscreenElement === null &&
      this.service.mode() === "fullscreen"
    ) {
      this.service.setMode("scroll");
    }
  }

  @HostListener("document:keydown", ["$event"])
  protected handleKeyboard(event: KeyboardEvent): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    switch (event.key) {
      case "f":
      case "F":
        event.preventDefault();
        void this.toggleFullscreen();
        break;
      case "ArrowDown":
      case "ArrowRight":
      case " ":
        event.preventDefault();
        this.service.next();
        break;
      case "ArrowUp":
      case "ArrowLeft":
        event.preventDefault();
        this.service.previous();
        break;
      case "Escape":
        if (this.service.mode() === "fullscreen") {
          event.preventDefault();
          void this.toggleFullscreen();
        }
        break;
    }
  }
}
