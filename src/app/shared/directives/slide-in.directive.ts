import { isPlatformBrowser } from "@angular/common";
import {
  Directive,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  Renderer2,
} from "@angular/core";

/**
 * Directive d'animation d'entree au scroll.
 * Utilise IntersectionObserver pour ajouter la classe `slide-in-visible`
 * quand l'element entre dans le viewport (SSR-safe).
 */
@Directive({
  selector: "[appSlideIn]",
  standalone: true,
})
export class SlideInDirective implements OnInit, OnDestroy {
  private observer: IntersectionObserver | null = null;

  constructor(
    private readonly el: ElementRef<HTMLElement>,
    private readonly renderer: Renderer2,
    @Inject(PLATFORM_ID) private readonly platformId: object,
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.renderer.addClass(this.el.nativeElement, "slide-in-hidden");

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.renderer.removeClass(entry.target, "slide-in-hidden");
            this.renderer.addClass(entry.target, "slide-in-visible");
            this.observer?.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1 },
    );

    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
