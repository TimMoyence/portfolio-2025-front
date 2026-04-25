import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  input,
} from "@angular/core";
import { SlideDeckService } from "./slide-deck.service";

/**
 * Composant wrapper d'une slide individuelle. S'enregistre auprès
 * de SlideDeckService au montage et se désinscrit au démontage.
 */
@Component({
  selector: "app-slide",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="slide"
      [id]="id()"
      [class]="'theme-' + theme()"
      role="region"
      aria-roledescription="slide"
    >
      <ng-content />
    </section>
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
  readonly theme = input<string>("default");

  private readonly deck = inject(SlideDeckService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.deck.register(this.id());
    this.destroyRef.onDestroy(() => this.deck.unregister(this.id()));
  }
}
