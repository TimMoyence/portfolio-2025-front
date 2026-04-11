import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  output,
  viewChild,
} from "@angular/core";
import type { Act, PresentationSlide } from "../../models/slide.model";
import { SvgIconComponent } from "../svg-icon.component";

/** Groupe d'acte avec ses slides pour l'overview. */
export interface OverviewActGroup {
  act: Act;
  slides: PresentationSlide[];
}

/**
 * Overlay plein ecran affichant une grille 2D de navigation dans le deck.
 *
 * Chaque colonne correspond a un acte et chaque cellule a une miniature de
 * slide cliquable. La slide courante est mise en surbrillance. L'utilisateur
 * peut cliquer pour naviguer ou fermer la vue sans selection (Escape / bouton).
 *
 * Le composant est purement presentationnel : il n'embarque aucun etat,
 * toute la logique de navigation remonte au parent via des outputs.
 */
@Component({
  selector: "app-overview",
  standalone: true,
  imports: [SvgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="fixed inset-0 z-[110] flex flex-col bg-gray-900/95 backdrop-blur-sm"
      role="dialog"
      i18n-aria-label="@@overviewLabel"
      aria-label="Vue d'ensemble de la presentation"
      tabindex="-1"
      (keydown.escape)="closeOverview.emit()"
      #overviewContainer
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4">
        <h2
          class="text-sm font-semibold uppercase tracking-widest text-white/70"
          i18n="@@overviewTitle"
        >
          Vue d'ensemble
        </h2>
        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          (click)="closeOverview.emit()"
          i18n-aria-label="@@overviewClose"
          aria-label="Fermer la vue d'ensemble"
          data-testid="overview-close"
        >
          <app-svg-icon name="close" [size]="1.1" />
        </button>
      </div>

      <!-- Grille 2D : colonnes = actes, cellules = slides -->
      <div class="flex-1 overflow-auto px-6 py-4">
        <div class="flex min-w-min gap-6">
          @for (group of acts(); track group.act.id) {
            <div
              class="flex min-w-[200px] flex-col gap-3"
              data-testid="overview-act-column"
            >
              <!-- Label de l'acte en haut de la colonne -->
              <h3
                class="text-[11px] font-bold uppercase tracking-widest text-scheme-accent"
                data-testid="overview-act-label"
              >
                {{ group.act.label }}
              </h3>
              <!-- Miniatures des slides -->
              @for (slide of group.slides; track slide.id) {
                <button
                  type="button"
                  class="group relative rounded-lg border-2 p-3 text-left transition-all"
                  [class]="
                    slideIndexMap().get(slide.id) === currentIndex()
                      ? 'border-scheme-accent bg-white/15 shadow-lg shadow-scheme-accent/20'
                      : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                  "
                  [attr.aria-label]="slide.title"
                  [attr.aria-current]="
                    slideIndexMap().get(slide.id) === currentIndex()
                      ? 'true'
                      : null
                  "
                  (click)="selectSlide.emit(slideIndexMap().get(slide.id) ?? 0)"
                  data-testid="overview-slide-button"
                >
                  <span
                    class="mb-1 block text-[10px] font-medium uppercase tracking-wider"
                    [class]="
                      slideIndexMap().get(slide.id) === currentIndex()
                        ? 'text-scheme-accent'
                        : 'text-white/40'
                    "
                    data-testid="overview-slide-number"
                  >
                    {{ (slideIndexMap().get(slide.id) ?? 0) + 1 }}
                  </span>
                  <span
                    class="block text-sm font-medium leading-tight"
                    [class]="
                      slideIndexMap().get(slide.id) === currentIndex()
                        ? 'text-white'
                        : 'text-white/70 group-hover:text-white'
                    "
                    data-testid="overview-slide-title"
                  >
                    {{ slide.title }}
                  </span>
                  @if (slide.layout) {
                    <span
                      class="mt-1.5 inline-block rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/50"
                      data-testid="overview-slide-layout"
                    >
                      {{ slide.layout }}
                    </span>
                  }
                </button>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class OverviewComponent {
  /** Groupes d'actes avec leurs slides. */
  readonly acts = input.required<OverviewActGroup[]>();
  /** Liste complete des slides (pour les index globaux). */
  readonly slides = input.required<PresentationSlide[]>();
  /** Index de la slide courante (pour la surbrillance). */
  readonly currentIndex = input.required<number>();

  /** Emet l'index global de la slide selectionnee. */
  readonly selectSlide = output<number>();
  /** Emet quand l'utilisateur ferme l'overview sans selection. */
  readonly closeOverview = output<void>();

  /**
   * Map d'index pour retrouver en O(1) la position globale d'une slide
   * dans le deck. Evite l'appel repete a `indexOf` en O(n) dans le template.
   */
  readonly slideIndexMap = computed((): Map<string, number> => {
    const map = new Map<string, number>();
    this.slides().forEach((slide, index) => map.set(slide.id, index));
    return map;
  });

  /** Reference au conteneur pour la gestion du focus. */
  private readonly containerRef =
    viewChild<ElementRef<HTMLElement>>("overviewContainer");

  constructor() {
    afterNextRender(() => {
      this.containerRef()?.nativeElement.focus();
    });
  }
}
