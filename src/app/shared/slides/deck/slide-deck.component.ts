import { NgTemplateOutlet, isPlatformBrowser } from "@angular/common";
import {
  AfterViewInit,
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
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
 * Mode scroll : CSS scroll-snap natif + IntersectionObserver pour synchroniser
 * `currentId` quand l'utilisateur scroll. Les slides sont rendues directement
 * via leur `TemplateRef`.
 *
 * Mode fullscreen : Swiper Element wrappe chaque slide dans un `<swiper-slide>`
 * direct (pre-requis swiper.js).
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
export class SlideDeckComponent implements AfterViewInit {
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
  private readonly destroyRef = inject(DestroyRef);

  protected readonly cssClasses = computed(
    () => `slide-deck mode-${this.service.mode()} theme-${this.theme()}`,
  );

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

  private scrollListener: (() => void) | null = null;
  private rafId: number | null = null;

  constructor() {
    effect(() => {
      this.service.setMode(this.mode());
    });

    effect(() => {
      const id = this.service.current();
      const idx = this.service.currentIndex();
      if (id !== null && idx >= 0) {
        this.slideChanged.emit({ id, index: idx });
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

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    // Laisse le temps aux templates outlet'd de materialiser dans le DOM
    // avant d'enregistrer la premiere slide + binder le scroll listener.
    setTimeout(() => {
      this.bootstrapInitialSlide();
      this.attachScrollListener();
    }, 0);
  }

  private bootstrapInitialSlide(): void {
    const list = this.visibleSlides();
    if (list.length > 0 && this.service.current() === null) {
      this.service.goTo(list[0].id());
    }
  }

  private attachScrollListener(): void {
    const root = this.deckRef().nativeElement;
    const onScroll = () => {
      if (this.rafId !== null) {
        return;
      }
      this.rafId = requestAnimationFrame(() => {
        this.rafId = null;
        this.syncCurrentFromScroll();
      });
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    this.scrollListener = () => root.removeEventListener("scroll", onScroll);
    this.destroyRef.onDestroy(() => {
      this.scrollListener?.();
      if (this.rafId !== null) {
        cancelAnimationFrame(this.rafId);
      }
    });
  }

  /**
   * Synchronise `currentId` selon la slide qui occupe la moitie du
   * viewport. Plus fiable qu'un IntersectionObserver avec scroll-snap :
   * on travaille sur `scrollTop` + `clientHeight` mesures, sans flicker.
   */
  private syncCurrentFromScroll(): void {
    const root = this.deckRef().nativeElement;
    const sections = Array.from(
      root.querySelectorAll<HTMLElement>("section.slide"),
    );
    if (sections.length === 0) {
      return;
    }
    const mid = root.scrollTop + root.clientHeight / 2;
    const current = sections.find(
      (s) => s.offsetTop <= mid && s.offsetTop + s.clientHeight > mid,
    );
    if (current && current.id && current.id !== this.service.current()) {
      this.service.goTo(current.id);
    }
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
    // En fullscreen, Swiper gere sa propre navigation.
    const inFullscreen = this.service.mode() === "fullscreen";

    switch (event.key) {
      case "f":
      case "F":
        event.preventDefault();
        void this.toggleFullscreen();
        break;
      case "ArrowDown":
      case "ArrowRight":
      case " ":
        if (!inFullscreen) {
          event.preventDefault();
          this.scrollToSibling(1);
        }
        break;
      case "ArrowUp":
      case "ArrowLeft":
        if (!inFullscreen) {
          event.preventDefault();
          this.scrollToSibling(-1);
        }
        break;
      case "Escape":
        if (inFullscreen) {
          event.preventDefault();
          void this.toggleFullscreen();
        }
        break;
    }
  }

  /**
   * Fait defiler le deck vers la slide voisine (`+1` ou `-1`).
   * Utilise `scrollTo` direct sur le container — plus fiable que
   * `scrollIntoView` qui scroll le mauvais ancestor avec scroll-snap.
   */
  private scrollToSibling(direction: 1 | -1): void {
    const root = this.deckRef().nativeElement;
    const sections = Array.from(
      root.querySelectorAll<HTMLElement>("section.slide"),
    );
    if (sections.length === 0) {
      return;
    }
    const currentId = this.service.current();
    const idx = currentId ? sections.findIndex((s) => s.id === currentId) : 0;
    const targetIdx = Math.max(
      0,
      Math.min(sections.length - 1, idx + direction),
    );
    const target = sections[targetIdx];
    if (target) {
      root.scrollTo({ top: target.offsetTop, behavior: "smooth" });
    }
  }
}
