import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from "@angular/core";
import type { Act, PresentationSlide } from "../../models/slide.model";
import { SvgIconComponent } from "../svg-icon.component";

/**
 * Groupe d'acte precalcule par le parent : un acte et ses slides contigues.
 * Utilise pour alimenter la barre horizontale des actes sans recalcul.
 */
export interface PresenterBarActGroup {
  act: Act;
  slides: PresentationSlide[];
}

/**
 * Barre de navigation 2D pour le mode presentation du moteur de presentation.
 *
 * Fournit une navigation inspiree de reveal.js :
 * - Axe horizontal : liste des actes (click = premiere slide de l'acte)
 * - Axe vertical : liste des slides de l'acte courant (dots)
 * - Compteur + boutons precedent/suivant
 *
 * Le composant est purement presentationnel : il n'embarque aucun etat,
 * toute la logique de navigation remonte au parent via des outputs.
 */
@Component({
  selector: "app-presenter-bar",
  standalone: true,
  imports: [SvgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav
      class="flex items-center justify-between border-t border-gray-100 bg-white px-6 py-3"
      role="navigation"
      i18n-aria-label="@@presenterBarLabel"
      aria-label="Navigation de présentation"
    >
      <!-- Gauche : compteur + boutons -->
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-full border border-gray-200 px-4 py-2 text-xs text-gray-500 transition hover:bg-gray-50 hover:text-gray-700 disabled:opacity-30"
          [disabled]="isFirst()"
          (click)="prev.emit()"
          i18n-aria-label="@@presenterBarPrev"
          aria-label="Slide précédente"
        >
          <app-svg-icon name="chevron-left" [size]="0.8" />
        </button>
        <span
          class="text-xs font-medium text-gray-500 tabular-nums"
          aria-live="polite"
          aria-atomic="true"
        >
          <ng-container i18n="@@presenterBarCounter">
            Slide {{ positionInAct() }}/{{ currentActSlides().length }}
          </ng-container>
        </span>
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-full bg-scheme-accent px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-scheme-accent-hover disabled:bg-gray-200 disabled:text-gray-400 disabled:opacity-30"
          [disabled]="isLast()"
          (click)="next.emit()"
          i18n-aria-label="@@presenterBarNext"
          aria-label="Slide suivante"
        >
          <app-svg-icon name="chevron-right" [size]="0.8" />
        </button>
      </div>

      <!-- Centre : barre horizontale des actes -->
      <ul class="hidden items-center gap-1 md:flex" role="list">
        @for (group of acts(); track group.act.id) {
          <li>
            <button
              type="button"
              class="rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all"
              [class]="
                currentAct()?.id === group.act.id
                  ? 'bg-scheme-accent text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
              "
              [attr.aria-current]="
                currentAct()?.id === group.act.id ? 'location' : null
              "
              (click)="goToAct.emit(group.act.id)"
            >
              {{ group.act.label }}
            </button>
          </li>
        }
      </ul>

      <!-- Droite : dots verticaux des slides de l'acte courant -->
      <ul class="flex items-center gap-1" role="list">
        @for (slide of currentActSlides(); track slide.id) {
          <li>
            <button
              type="button"
              class="rounded-full transition-all"
              [class]="
                slides()[currentIndex()]?.id === slide.id
                  ? 'h-2 w-6 bg-scheme-accent'
                  : 'h-1.5 w-1.5 bg-gray-300 hover:bg-gray-500'
              "
              [attr.aria-label]="slide.title"
              [attr.aria-current]="
                slides()[currentIndex()]?.id === slide.id ? 'location' : null
              "
              (click)="goToSlide.emit(indexOfSlide(slide))"
            ></button>
          </li>
        }
      </ul>
    </nav>
  `,
})
export class PresenterBarComponent {
  /** Liste complete des slides (pour calculer les index globaux). */
  readonly slides = input.required<PresentationSlide[]>();
  /** Groupes d'actes precalcules par le parent (slides contigues par acte). */
  readonly acts = input.required<PresenterBarActGroup[]>();
  /** Index global 0-based de la slide courante. */
  readonly currentIndex = input.required<number>();

  /** Emis au click sur un dot : demande d'aller a la slide d'index global donne. */
  readonly goToSlide = output<number>();
  /** Emis au click sur un segment d'acte : demande d'aller a la premiere slide de l'acte. */
  readonly goToAct = output<string>();
  /** Emis au click sur le bouton suivant. */
  readonly next = output<void>();
  /** Emis au click sur le bouton precedent. */
  readonly prev = output<void>();

  /** Acte de la slide courante (undefined si deck vide ou index hors limites). */
  readonly currentAct = computed<Act | undefined>(() => {
    const slide = this.slides()[this.currentIndex()];
    return slide?.act;
  });

  /** Slides appartenant a l'acte courant, dans leur ordre global. */
  readonly currentActSlides = computed<PresentationSlide[]>(() => {
    const act = this.currentAct();
    if (!act) {
      return [];
    }
    const group = this.acts().find((g) => g.act.id === act.id);
    return group?.slides ?? [];
  });

  /**
   * Position 1-based de la slide courante a l'interieur de l'acte courant.
   * Retourne 0 si le deck est vide.
   */
  readonly positionInAct = computed<number>(() => {
    const current = this.slides()[this.currentIndex()];
    if (!current) {
      return 0;
    }
    return this.currentActSlides().findIndex((s) => s.id === current.id) + 1;
  });

  /** True si on est sur la premiere slide du deck. */
  readonly isFirst = computed<boolean>(() => this.currentIndex() === 0);

  /** True si on est sur la derniere slide du deck (ou si le deck est vide). */
  readonly isLast = computed<boolean>(() => {
    const total = this.slides().length;
    return total === 0 || this.currentIndex() === total - 1;
  });

  /**
   * Retourne l'index global de la premiere slide d'un acte donne.
   * Retourne 0 si l'acte est introuvable ou vide.
   */
  firstSlideIndexOfAct(actId: string): number {
    const group = this.acts().find((g) => g.act.id === actId);
    if (!group || group.slides.length === 0) {
      return 0;
    }
    return this.slides().indexOf(group.slides[0]);
  }

  /** Retourne l'index global d'une slide dans le deck. */
  indexOfSlide(slide: PresentationSlide): number {
    return this.slides().indexOf(slide);
  }
}
