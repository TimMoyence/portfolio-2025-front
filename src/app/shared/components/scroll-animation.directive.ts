import { CommonModule, isPlatformBrowser } from "@angular/common";
import type { AfterViewInit } from "@angular/core";
import {
  Component,
  ElementRef,
  Inject,
  PLATFORM_ID,
  Renderer2,
} from "@angular/core";

@Component({
  selector: "app-scroll-animation",
  standalone: true,
  imports: [CommonModule],
  template: ` <ng-content></ng-content> `,
  styles: [],
})
export class ScrollAnimationComponent implements AfterViewInit {
  constructor(
    private renderer: Renderer2,
    private el: ElementRef,
    @Inject(PLATFORM_ID) private readonly platformId: object,
  ) {}

  ngAfterViewInit() {
    this.initScrollAnimation();
  }

  private initScrollAnimation() {
    // Guard SSR : les API window/document ne sont pas disponibles cote serveur
    if (!isPlatformBrowser(this.platformId)) return;

    // Add reveal class to all elements that should animate on scroll
    const revealElements = this.el.nativeElement.querySelectorAll(".reveal");

    const checkScroll = () => {
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

    // Initial check
    checkScroll();

    // Add scroll event listener
    window.addEventListener("scroll", checkScroll);
  }
}
