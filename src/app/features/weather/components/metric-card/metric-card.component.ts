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
    <!--
      Carte instrument — wrapper glass Asili (levier central partagé).
      Re-skin AsiliNewDesign/asili-app.css : .gp (bg-white/5 border-white/10
      r-lg 20px backdrop-blur) + .wx-card + en-tête .gp-h (.t : font-mono 11px
      letterspacing .14em uppercase, teal subtil). Restyle visuel uniquement —
      containerClasses()/titleClasses() retournent des classes Tailwind, la
      logique (variant/expand/unavailable/a11y) est inchangée.
    -->
    <div [class]="containerClasses()">
      <!-- Header (.gp-h) -->
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
              class="flex h-6 w-6 items-center justify-center rounded-full text-white/40 transition-transform hover:text-teal"
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
          <div @expandCollapse class="mt-3 border-t border-teal/15 pt-3">
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

  /**
   * Classes CSS du conteneur selon la variante.
   * Glass Asili .gp/.wx-card : rayon --r-lg (20px), border teal subtile,
   * fond translucide, backdrop-blur. Restyle visuel uniquement.
   */
  readonly containerClasses = computed(() => {
    const base =
      "rounded-[20px] border border-teal/15 bg-white/5 backdrop-blur-xl transition-colors hover:border-teal/30";
    switch (this.effectiveVariant()) {
      case "compact":
        return `${base} p-3`;
      case "wide":
        return `${base} p-6`;
      default:
        return `${base} p-4`;
    }
  });

  /**
   * Classes CSS du titre selon la variante.
   * En-tête .gp-h .t : font-mono, uppercase, letterspacing — kicker Asili.
   */
  readonly titleClasses = computed(() => {
    const base =
      "font-mono uppercase tracking-[0.14em] font-medium text-white/55";
    return this.effectiveVariant() === "compact"
      ? `${base} text-[10px]`
      : `${base} text-[11px]`;
  });

  /** Bascule l'etat expanded. */
  toggleExpand(event: Event): void {
    event.stopPropagation();
    this.expanded.update((v) => !v);
  }
}
