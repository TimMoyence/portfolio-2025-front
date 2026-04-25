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

  private observer: IntersectionObserver | null = null;

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
    queueMicrotask(() => this.setupIntersectionObserver());

    // Initial : si la liste a au moins une slide, marquer la première
    // comme courante pour que le compteur affiche `1 / N`.
    queueMicrotask(() => {
      const list = this.visibleSlides();
      if (list.length > 0 && this.service.current() === null) {
        this.service.goTo(list[0].id());
      }
    });
  }

  private setupIntersectionObserver(): void {
    const root = this.deckRef().nativeElement;
    const sections = root.querySelectorAll<HTMLElement>("section.slide");
    if (sections.length === 0) {
      return;
    }
    this.observer?.disconnect();
    this.observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible && visible.target.id) {
          this.service.goTo(visible.target.id);
        }
      },
      {
        root,
        threshold: [0.4, 0.6],
      },
    );
    sections.forEach((s) => this.observer?.observe(s));
    this.destroyRef.onDestroy(() => this.observer?.disconnect());
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
   * Fait defiler vers la slide suivante (`+1`) ou precedente (`-1`).
   * L'IntersectionObserver met ensuite a jour `currentId`.
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
    const target =
      sections[Math.max(0, Math.min(sections.length - 1, idx + direction))];
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
