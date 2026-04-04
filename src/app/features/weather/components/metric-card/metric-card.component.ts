import { animate, style, transition, trigger } from "@angular/animations";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
} from "@angular/core";
import { BreakpointService } from "../../../../core/services/breakpoint.service";
import { LearningTooltipComponent } from "../learning-tooltip/learning-tooltip.component";

/**
 * Carte metrique generique (design system weather).
 * Encapsule le pattern glassmorphism, le header titre+tooltip,
 * le mode compact mobile-first et l'expand/collapse.
 */
@Component({
  selector: "app-metric-card",
  standalone: true,
  imports: [LearningTooltipComponent],
  animations: [
    trigger("expandCollapse", [
      transition(":enter", [
        style({ height: 0, opacity: 0, overflow: "hidden" }),
        animate(
          "200ms ease-out",
          style({ height: "*", opacity: 1, overflow: "hidden" }),
        ),
      ]),
      transition(":leave", [
        style({ overflow: "hidden" }),
        animate(
          "200ms ease-in",
          style({ height: 0, opacity: 0, overflow: "hidden" }),
        ),
      ]),
    ]),
  ],
  host: { class: "block" },
  template: `
    <div [class]="containerClasses()">
      <!-- Header -->
      <div class="mb-3 flex items-center justify-between">
        <h3 [class]="titleClasses()">
          <ng-content select="[cardTitle]" />
        </h3>
        <div class="flex items-center gap-1">
          <app-learning-tooltip
            [id]="tooltipId()"
            [title]="tooltipTitle()"
            [content]="tooltipContent()"
          />
          @if (expandable()) {
            <button
              type="button"
              class="flex h-6 w-6 items-center justify-center rounded-full text-white/50 transition-transform hover:text-white/80"
              [class.rotate-180]="expanded()"
              [attr.aria-expanded]="expanded()"
              [attr.aria-label]="
                expanded() ? 'Réduire les détails' : 'Afficher les détails'
              "
              (click)="toggleExpand($event)"
            >
              <svg
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          }
        </div>
      </div>

      <!-- Contenu principal -->
      @if (!unavailable()) {
        <ng-content />

        @if (expandable() && expanded()) {
          <div @expandCollapse class="mt-3 border-t border-white/10 pt-3">
            <ng-content select="[cardDetail]" />
          </div>
        }
      } @else {
        <p
          class="text-sm text-white/40"
          i18n="weather.card.unavailable|@@weatherCardUnavailable"
        >
          Données indisponibles
        </p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricCardComponent {
  /** Identifiant du tooltip pedagogique. */
  readonly tooltipId = input.required<string>();

  /** Titre du tooltip. */
  readonly tooltipTitle = input.required<string>();

  /** Contenu du tooltip. */
  readonly tooltipContent = input.required<string>();

  /** Affiche le fallback "Donnees indisponibles". */
  readonly unavailable = input(false);

  /** Active le comportement expand/collapse. */
  readonly expandable = input(false);

  /** Etat expanded (two-way binding). */
  readonly expanded = model(false);

  /** Variante de taille : compact (mobile), default, wide (full-width). */
  readonly variant = input<"default" | "compact" | "wide">("default");

  private readonly breakpointService = inject(BreakpointService);

  /** Variante effective tenant compte du mobile. */
  readonly effectiveVariant = computed(() => {
    if (this.breakpointService.isMobile() && this.variant() === "default")
      return "compact";
    return this.variant();
  });

  /** Classes CSS du conteneur selon la variante. */
  readonly containerClasses = computed(() => {
    const base =
      "rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md";
    switch (this.effectiveVariant()) {
      case "compact":
        return `${base} p-3`;
      case "wide":
        return `${base} p-6`;
      default:
        return `${base} p-4`;
    }
  });

  /** Classes CSS du titre selon la variante. */
  readonly titleClasses = computed(() => {
    const base = "font-medium text-white/70";
    return this.effectiveVariant() === "compact"
      ? `${base} text-xs`
      : `${base} text-sm`;
  });

  /** Bascule l'etat expanded. */
  toggleExpand(event: Event): void {
    event.stopPropagation();
    this.expanded.update((v) => !v);
  }
}
