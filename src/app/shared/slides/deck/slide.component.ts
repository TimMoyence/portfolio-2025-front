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
 * Swiper Element (swiper 12.1.3, https://swiperjs.com/element) n'anime que les
 * `<swiper-slide>` enfants directs de `<swiper-container>` : le contenu passe
 * donc par un `TemplateRef` que `SlideDeckComponent` projette dans un
 * `<swiper-slide>` en mode plein écran.
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
      min-height: var(--slide-min-height, 100cqh);
      scroll-snap-align: start;
      scroll-snap-stop: always;
      scroll-margin-top: 6rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      box-sizing: border-box;
    }
  `,
})
export class SlideComponent implements OnInit {
  readonly id = input.required<string>();
  readonly theme = input<string>('default');
  readonly visibility = input<SlideVisibility>('both');

  readonly contentTemplate = viewChild.required<TemplateRef<unknown>>('slideContent');

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
