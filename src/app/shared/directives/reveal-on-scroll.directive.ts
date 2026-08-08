import { isPlatformBrowser } from '@angular/common';
import {
  Directive,
  DestroyRef,
  ElementRef,
  OnInit,
  PLATFORM_ID,
  inject,
  input,
} from '@angular/core';

@Directive({
  selector: '[appReveal]',
  standalone: true,
})
export class RevealOnScrollDirective implements OnInit {
  readonly appRevealDelay = input<1 | 2 | 3 | 4 | null>(null);

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const host = this.el.nativeElement;
    document.documentElement.classList.add('anim-ready');
    host.classList.add('reveal');
    const delay = this.appRevealDelay();
    if (delay) {
      host.setAttribute('data-delay', String(delay));
    }

    if (typeof IntersectionObserver === 'undefined') {
      host.classList.add('in');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            host.classList.add('in');
            observer.disconnect();
          }
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(host);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }
}
