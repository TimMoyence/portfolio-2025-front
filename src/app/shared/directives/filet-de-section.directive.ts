import { afterNextRender, DestroyRef, Directive, ElementRef, inject, signal } from '@angular/core';

@Directive({
  selector: '.section-pad',
  standalone: true,
  host: { '[class.filet-trace]': 'trace()' },
})
export class FiletDeSectionDirective {
  protected readonly trace = signal(false);

  constructor() {
    const section = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destruction = inject(DestroyRef);
    afterNextRender(() => {
      const observateur = new IntersectionObserver((entrees) => {
        if (entrees.some(({ isIntersecting }) => isIntersecting)) {
          this.trace.set(true);
          observateur.disconnect();
        }
      });
      observateur.observe(section);
      destruction.onDestroy(() => observateur.disconnect());
    });
  }
}
