import { isPlatformBrowser } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  OnInit,
  PLATFORM_ID,
  signal,
  ViewChild,
} from "@angular/core";
import { WeatherLevelService } from "../../services/weather-level.service";

/**
 * Tooltip pedagogique reutilisable.
 * Affiche une icone "?" qui ouvre un popover glassmorphism.
 * La premiere fois, le tooltip s'affiche brievement puis se masque.
 * Les vues sont memorisees via le WeatherLevelService.
 * Compatible SSR : le timer n'est declenche que cote navigateur.
 */
@Component({
  selector: "app-learning-tooltip",
  standalone: true,
  template: `
    <span class="relative inline-block">
      <button
        type="button"
        class="flex h-5 w-5 items-center justify-center rounded-full border border-white/30 bg-white/10 text-xs text-white/70 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white"
        [attr.aria-label]="title()"
        [attr.aria-expanded]="visible()"
        (click)="toggle($event)"
      >
        ?
      </button>

      @if (visible()) {
        <div
          #tooltipPanel
          class="fixed z-50 rounded-xl border border-white/20 bg-white/15 p-4 shadow-xl backdrop-blur-xl transition-opacity"
          [style.width]="'16rem'"
          [style.max-width]="'min(16rem, calc(100vw - 2rem))'"
          [class.opacity-100]="visible()"
          role="tooltip"
        >
          <p class="mb-1 text-sm font-semibold text-white">{{ title() }}</p>
          <p class="text-xs leading-relaxed text-white/80">{{ content() }}</p>
        </div>
      }
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LearningTooltipComponent implements OnInit {
  /** Identifiant unique du tooltip pour le suivi de visibilite. */
  readonly id = input.required<string>();

  /** Titre affiche dans le popover. */
  readonly title = input.required<string>();

  /** Contenu explicatif affiche dans le popover. */
  readonly content = input.required<string>();

  /** Etat de visibilite du popover. */
  readonly visible = signal(false);

  @ViewChild("tooltipPanel") tooltipPanel?: ElementRef<HTMLElement>;

  private readonly levelService = inject(WeatherLevelService);
  private readonly elementRef = inject(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  ngOnInit(): void {
    if (!this.isBrowser) return;

    if (!this.levelService.isTooltipSeen(this.id())) {
      this.visible.set(true);
      requestAnimationFrame(() => this.positionTooltip());
      setTimeout(() => {
        this.visible.set(false);
        this.levelService.markTooltipSeen(this.id());
      }, 3000);
    }
  }

  /** Bascule la visibilite du popover au clic. */
  toggle(event: Event): void {
    event.stopPropagation();
    this.visible.update((v) => !v);

    if (this.visible()) {
      requestAnimationFrame(() => this.positionTooltip());
    }

    if (!this.levelService.isTooltipSeen(this.id())) {
      this.levelService.markTooltipSeen(this.id());
    }
  }

  /** Positionne le tooltip par rapport au bouton, clamp dans le viewport. */
  private positionTooltip(): void {
    if (!this.isBrowser || !this.tooltipPanel) return;

    const button = this.elementRef.nativeElement.querySelector("button");
    if (!button) return;

    const btnRect = button.getBoundingClientRect();
    const panel = this.tooltipPanel.nativeElement;
    const panelWidth = panel.offsetWidth;
    const panelHeight = panel.offsetHeight;
    const viewportWidth = window.innerWidth;
    const margin = 8;

    // Position centree au-dessus du bouton
    let left = btnRect.left + btnRect.width / 2 - panelWidth / 2;
    let top = btnRect.top - panelHeight - 8;

    // Clamp horizontal pour rester dans le viewport
    if (left < margin) left = margin;
    if (left + panelWidth > viewportWidth - margin) {
      left = viewportWidth - margin - panelWidth;
    }

    // Si pas de place au-dessus, flip en dessous
    if (top < margin) {
      top = btnRect.bottom + 8;
    }

    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  }

  /** Ferme le popover lors d'un clic en dehors du composant. */
  @HostListener("document:click", ["$event"])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.visible.set(false);
    }
  }
}
