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
          class="absolute bottom-full left-1/2 z-20 mb-2 w-64 -translate-x-1/2 rounded-xl border border-white/20 bg-white/15 p-4 shadow-xl backdrop-blur-xl transition-opacity"
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

  private readonly levelService = inject(WeatherLevelService);
  private readonly elementRef = inject(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  ngOnInit(): void {
    if (!this.isBrowser) return;

    // Auto-affichage bref pour les tooltips jamais vus
    if (!this.levelService.isTooltipSeen(this.id())) {
      this.visible.set(true);
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

    if (!this.levelService.isTooltipSeen(this.id())) {
      this.levelService.markTooltipSeen(this.id());
    }
  }

  /** Ferme le popover lors d'un clic en dehors du composant. */
  @HostListener("document:click", ["$event"])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.visible.set(false);
    }
  }
}
