import { CommonModule, isPlatformBrowser } from "@angular/common";
import type { AfterViewInit, OnDestroy } from "@angular/core";
import {
  Component,
  ElementRef,
  Inject,
  PLATFORM_ID,
  Renderer2,
} from "@angular/core";

/**
 * Composant d'animation au scroll.
 * Ajoute la classe `active` aux elements `.reveal` quand ils entrent dans le viewport.
 */
@Component({
  selector: "app-scroll-animation",
  standalone: true,
  imports: [CommonModule],
  template: ` <ng-content></ng-content> `,
  styles: [],
})
export class ScrollAnimationComponent implements AfterViewInit, OnDestroy {
  private scrollHandler: (() => void) | null = null;

  constructor(
    private renderer: Renderer2,
    private el: ElementRef,
    @Inject(PLATFORM_ID) private readonly platformId: object,
  ) {}

  ngAfterViewInit() {
    this.initScrollAnimation();
  }

  ngOnDestroy() {
    if (this.scrollHandler) {
      window.removeEventListener("scroll", this.scrollHandler);
      this.scrollHandler = null;
    }
  }

  private initScrollAnimation() {
    if (!isPlatformBrowser(this.platformId)) return;

    const revealElements = this.el.nativeElement.querySelectorAll(".reveal");

    this.scrollHandler = () => {
      for (let i = 0; i < revealElements.length; i++) {
        const elementTop = revealElements[i].getBoundingClientRect().top;
        const elementVisible = 150;

        if (elementTop < window.innerHeight - elementVisible) {
          this.renderer.addClass(revealElements[i], "active");
        } else {
          this.renderer.removeClass(revealElements[i], "active");
        }
      }
    };

    this.scrollHandler();
    window.addEventListener("scroll", this.scrollHandler);
  }
}
