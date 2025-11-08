import { Component, AfterViewInit, Renderer2, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-scroll-animation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-content></ng-content>
  `,
  styles: []
})
export class ScrollAnimationDirective implements AfterViewInit {
  constructor(private renderer: Renderer2, private el: ElementRef) {}

  ngAfterViewInit() {
    this.initScrollAnimation();
  }

  private initScrollAnimation() {
    // Add reveal class to all elements that should animate on scroll
    const revealElements = this.el.nativeElement.querySelectorAll('.reveal');
    
    const checkScroll = () => {
      for (let i = 0; i < revealElements.length; i++) {
        const elementTop = revealElements[i].getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < window.innerHeight - elementVisible) {
          this.renderer.addClass(revealElements[i], 'active');
        } else {
          this.renderer.removeClass(revealElements[i], 'active');
        }
      }
    };

    // Initial check
    checkScroll();
    
    // Add scroll event listener
    window.addEventListener('scroll', checkScroll);
  }
}
