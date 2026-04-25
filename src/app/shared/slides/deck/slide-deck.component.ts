import { NgTemplateOutlet, isPlatformBrowser } from "@angular/common";
import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  input,
  output,
  viewChild,
} from "@angular/core";
import { FullscreenAdapter } from "./fullscreen.adapter";
import { SlideDeckService, type SlideDeckMode } from "./slide-deck.service";
import { SLIDE_DECK_CONFIG } from "./slide-deck.tokens";

/**
 * Wrapper principal du moteur de présentation. Gère le mode scroll/fullscreen,
 * la navigation clavier (F, flèches, espace, échap), et émet slideChanged.
 * Mode scroll : CSS scroll-snap natif. Mode fullscreen : Swiper Element lazy.
 */
@Component({
  selector: "app-slide-deck",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./slide-deck.component.html",
  styleUrl: "./slide-deck.component.scss",
  imports: [NgTemplateOutlet],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SlideDeckComponent {
  readonly mode = input<SlideDeckMode>("scroll");
  readonly allowFullscreen = input<boolean>(true);
  readonly theme = input<string>("default");
  readonly slideChanged = output<{ id: string; index: number }>();

  readonly deckRef = viewChild.required<ElementRef<HTMLElement>>("deckRoot");

  protected readonly service = inject(SlideDeckService);
  protected readonly fullscreen = inject(FullscreenAdapter);
  protected readonly config = inject(SLIDE_DECK_CONFIG);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly cssClasses = computed(
    () => `slide-deck mode-${this.service.mode()} theme-${this.theme()}`,
  );

  constructor() {
    // Initialise le mode depuis l'input
    effect(() => {
      this.service.setMode(this.mode());
    });

    // Émet slideChanged dès qu'une slide devient courante
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
