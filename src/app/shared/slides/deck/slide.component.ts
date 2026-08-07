import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  TemplateRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { SlideDeckService } from './slide-deck.service';
import { SLIDE_DECK_HOST } from './slide-deck.tokens';

export type SlideVisibility = 'both' | 'scroll-only' | 'present-only';

/**
 * Le contenu passe par un `TemplateRef` pour que `SlideDeckComponent` puisse
 * le projeter dans un `<swiper-slide>` enfant direct en mode fullscreen —
 * pre-requis de Swiper Element.
 */
@Component({
  selector: 'app-slide',
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #slideContent>
      <section
        class="slide"
        [id]="id()"
        [class]="'theme-' + theme()"
        [class.is-presentation-only]="visibility() === 'present-only'"
        [class.is-scroll-only]="visibility() === 'scroll-only'"
        role="region"
        aria-roledescription="slide"
      >
        <ng-content />
      </section>
    </ng-template>

    @if (!hostedByDeck) {
      <ng-container *ngTemplateOutlet="contentTemplate()" />
    }
  `,
  styles: `
    :host {
      display: contents;
    }
    .slide {
      min-height: 100vh;
      scroll-snap-align: start;
      scroll-snap-stop: always;
      display: flex;
      flex-direction: column;
      width: 100%;
    }
  `,
})
export class SlideComponent implements OnInit {
  readonly id = input.required<string>();
  readonly theme = input<string>('default');
  readonly visibility = input<SlideVisibility>('both');

  readonly contentTemplate = viewChild.required<TemplateRef<unknown>>('slideContent');

  /**
   * Resolu une seule fois a la construction via DI : `true` si un
   * `SlideDeckComponent` ancetre fournit le token, `false` sinon.
   * Lecture stable (pas de change detection requise).
   */
  protected readonly hostedByDeck = inject(SLIDE_DECK_HOST, {
    optional: true,
    skipSelf: true,
  })
    ? true
    : false;

  private readonly deck = inject(SlideDeckService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.deck.register(this.id());
    this.destroyRef.onDestroy(() => this.deck.unregister(this.id()));
  }
}
