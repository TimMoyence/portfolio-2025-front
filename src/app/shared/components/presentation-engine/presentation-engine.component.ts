import { isPlatformBrowser } from "@angular/common";
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  PLATFORM_ID,
  signal,
  viewChild,
} from "@angular/core";
import gsap from "gsap";
import type {
  Act,
  PresentationSlide,
  PromptTemplate,
} from "../../models/slide.model";
import { FragmentService } from "../../services/fragment.service";
import { SlideRendererComponent } from "../slide-viewer/templates/slide-renderer.component";
import { SvgIconComponent } from "../svg-icon.component";
import { OverviewComponent } from "./overview.component";
import { PresenterBarComponent } from "./presenter-bar.component";

/** Mode d'affichage du moteur de presentation. */
export type PresentationMode = "scroll" | "present" | "overview";

/** Acte groupe avec ses slides pour la vue scroll. */
interface ActGroup {
  act: Act;
  slides: PresentationSlide[];
}

/**
 * Moteur de presentation avance multi-modes (scroll / present / overview).
 *
 * Responsabilites :
 * - Gere l'etat courant (index de slide, mode, regroupement par acte)
 * - Delegue le rendu a `SlideRendererComponent` pour chaque layout
 * - Integre le `FragmentService` scope au composant pour reveler progressivement
 *   les fragments d'une slide avant de passer a la suivante
 * - Gere l'etat interactif des slides (notes deployees, generation de prompt)
 * - Fournit une navigation clavier (ArrowRight/ArrowLeft/PageDown/PageUp/Escape)
 *
 * Navigation 2D avec transitions GSAP :
 * - Intra-acte (ArrowRight/ArrowLeft/ArrowDown/ArrowUp/Space/Backspace) : fondu + glissement vertical
 * - Inter-acte (PageDown/PageUp) : glissement horizontal
 * - `prefers-reduced-motion: reduce` desactive les transitions (swap instantane)
 */
@Component({
  selector: "app-presentation-engine",
  standalone: true,
  imports: [
    SlideRendererComponent,
    SvgIconComponent,
    PresenterBarComponent,
    OverviewComponent,
  ],
  providers: [FragmentService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: "./presentation-engine.component.scss",
  template: `
    @if (mode() === "scroll") {
      <!-- ===== MODE SCROLL ===== -->
      <div class="bg-white">
        <!-- Liste verticale regroupee par acte -->
        <div class="snap-y snap-mandatory scroll-smooth overflow-y-auto">
          @for (group of acts(); track group.act.id; let i = $index) {
            <header
              class="border-b border-gray-200 bg-gray-50 px-4 sm:px-6 py-4"
              [class.mt-8]="i > 0"
              [class.border-t-4]="i > 0"
              [class.border-t-scheme-accent]="i > 0"
              data-aos="fade-up"
            >
              <h2
                class="text-[11px] font-bold uppercase tracking-widest text-scheme-accent"
              >
                {{ group.act.label }}
              </h2>
            </header>
            @for (slide of group.slides; track slide.id) {
              <section
                [attr.data-slide-id]="slide.id"
                class="min-h-[calc(100vh-8rem)] flex flex-col snap-start scroll-mt-32"
                data-aos="fade-up"
              >
                <app-slide-renderer
                  [slide]="slide"
                  [index]="slideIndexMap().get(slide.id) ?? 0"
                  [total]="activeSlides().length"
                  [expandedNotes]="expandedNotes()"
                  [sectorInput]="sectorInput()"
                  [generatedPrompt]="generatedPrompt()"
                  [copied]="copied()"
                  (toggleNotes)="toggleNotes($event)"
                  (sectorChange)="sectorInput.set($event)"
                  (generate)="generatePrompt($event)"
                  (copyPrompt)="copyPrompt()"
                  class="flex-1 flex flex-col"
                />
              </section>
            }
          }
        </div>

        <!-- Barre sticky en bas, cachee sur mobile -->
        <div
          class="hidden md:flex sticky bottom-0 z-10 items-center justify-between border-t border-gray-100 bg-white px-4 sm:px-6 py-2.5 shadow-[0_-2px_4px_rgba(0,0,0,0.05)]"
        >
          <span
            class="text-sm font-medium text-gray-500 tabular-nums"
            i18n="@@presentationEngineSlidesCount"
          >
            {{ activeSlides().length }} slides — {{ acts().length }} actes
          </span>
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-full bg-scheme-accent px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-scheme-accent-hover"
            (click)="toggleMode('present')"
            i18n-aria-label="@@presentationEngineEnter"
            aria-label="Mode présentation"
          >
            <app-svg-icon name="chevron-right" [size]="0.8" />
            <span class="hidden sm:inline" i18n="@@presentationEnginePresent"
              >Présenter</span
            >
          </button>
        </div>
      </div>
    } @else if (mode() === "present") {
      <!-- ===== MODE PRESENTATION ===== -->
      <div
        #presentContainer
        class="fixed inset-0 z-[100] flex flex-col bg-white outline-none"
        role="region"
        i18n-aria-label="@@presentationEngineRegion"
        aria-label="Mode présentation"
        tabindex="-1"
        (touchstart)="onTouchStart($event)"
        (touchend)="onTouchEnd($event)"
      >
        <!-- Header acte + exit -->
        <div
          class="flex items-center justify-between border-b border-gray-100 px-6 py-3"
        >
          <div class="flex flex-col">
            <span
              class="text-[11px] font-bold uppercase tracking-widest text-scheme-accent"
            >
              {{ currentAct()?.label }}
            </span>
            <span class="text-xs text-gray-400 tabular-nums">
              {{ currentIndex() + 1 }} / {{ activeSlides().length }}
            </span>
          </div>
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
            (click)="toggleMode('scroll')"
            i18n-aria-label="@@presentationEngineExit"
            aria-label="Quitter"
          >
            <app-svg-icon name="close" [size]="1.1" />
          </button>
        </div>

        <!-- Slide courante -->
        @if (currentSlide(); as slide) {
          <div #slideContainer class="flex flex-1 overflow-y-auto">
            <app-slide-renderer
              [slide]="slide"
              [index]="currentIndex()"
              [total]="activeSlides().length"
              [expandedNotes]="expandedNotes()"
              [sectorInput]="sectorInput()"
              [generatedPrompt]="generatedPrompt()"
              [copied]="copied()"
              (toggleNotes)="toggleNotes($event)"
              (sectorChange)="sectorInput.set($event)"
              (generate)="generatePrompt($event)"
              (copyPrompt)="copyPrompt()"
              class="flex-1 flex"
            />
          </div>
        }

        <!-- PresenterBar : navigation 2D (actes + dots) + compteur + boutons -->
        <app-presenter-bar
          [slides]="activeSlides()"
          [acts]="acts()"
          [currentIndex]="currentIndex()"
          (goToSlide)="goToSlide($event)"
          (goToAct)="goToActByid($event)"
          (next)="navigateNext()"
          (prev)="navigatePrev()"
        />
      </div>
    } @else if (mode() === "overview") {
      <!-- ===== MODE OVERVIEW ===== -->
      <app-overview
        [acts]="acts()"
        [slides]="activeSlides()"
        [currentIndex]="currentIndex()"
        (selectSlide)="goToSlide($event); toggleMode('present')"
        (closeOverview)="toggleMode('present')"
      />
    }
  `,
})
export class PresentationEngineComponent {
  /** Deck de slides a afficher. */
  readonly slides = input.required<PresentationSlide[]>();

  /**
   * Slides filtrees selon le mode courant.
   *
   * - En mode `scroll` : exclut les slides `presentOnly`
   * - En mode `present` / `overview` : exclut les slides `scrollOnly`
   * - Les slides sans `visibility` ou avec `visibility: 'both'` sont toujours incluses
   */
  readonly activeSlides = computed((): PresentationSlide[] => {
    const mode = this.mode();
    return this.slides().filter((slide) => {
      const v = slide.visibility ?? "both";
      if (mode === "scroll") return v !== "presentOnly";
      return v !== "scrollOnly"; // present + overview
    });
  });

  /** Index 0-based de la slide courante. */
  readonly currentIndex = signal(0);

  /** Mode d'affichage courant. */
  readonly mode = signal<PresentationMode>("scroll");

  /** Etat interactif : index des slides dont les notes sont deployees. */
  readonly expandedNotes = signal<Set<number>>(new Set());
  /** Etat interactif : valeur saisie dans le champ secteur. */
  readonly sectorInput = signal("");
  /** Etat interactif : prompt genere a partir du template. */
  readonly generatedPrompt = signal("");
  /** Etat interactif : true si le prompt vient d'etre copie. */
  readonly copied = signal(false);

  /** Slide courante calculee depuis l'index. */
  readonly currentSlide = computed(
    (): PresentationSlide | undefined =>
      this.activeSlides()[this.currentIndex()],
  );

  /** Acte de la slide courante. */
  readonly currentAct = computed(
    (): Act | undefined => this.currentSlide()?.act,
  );

  /**
   * Map d'index pour retrouver en O(1) la position globale d'une slide
   * dans le deck. Remplace l'ancien `indexOf(slide)` en O(n).
   */
  readonly slideIndexMap = computed((): Map<string, number> => {
    const map = new Map<string, number>();
    this.activeSlides().forEach((slide, index) => map.set(slide.id, index));
    return map;
  });

  /**
   * Map actId → premier index global de l'acte dans le deck.
   * Utilise par `goToActByid` pour naviguer depuis la PresenterBar.
   */
  private readonly actStartIndexMap = computed<Map<string, number>>(() => {
    const map = new Map<string, number>();
    this.activeSlides().forEach((slide, index) => {
      if (!map.has(slide.act.id)) {
        map.set(slide.act.id, index);
      }
    });
    return map;
  });

  /**
   * Slides regroupees par acte tout en preservant l'ordre.
   *
   * Valide egalement que les slides d'un meme acte sont contigues : si deux
   * slides du meme acte sont separees par une slide d'un autre acte, un warning
   * est loggue en console — ce scenario casserait le regroupement visuel.
   */
  readonly acts = computed((): ActGroup[] => {
    const grouped = new Map<string, PresentationSlide[]>();
    const seenActs = new Set<string>();
    let previousActId: string | null = null;

    for (const slide of this.activeSlides()) {
      const actId = slide.act.id;
      if (actId !== previousActId && seenActs.has(actId)) {
        console.warn(
          `[PresentationEngine] Slides de l'acte "${actId}" ne sont pas contigues — le regroupement peut masquer un bug.`,
        );
      }
      if (!grouped.has(actId)) {
        grouped.set(actId, []);
      }
      grouped.get(actId)!.push(slide);
      seenActs.add(actId);
      previousActId = actId;
    }
    return Array.from(grouped.entries()).map(([, groupSlides]) => ({
      act: groupSlides[0].act,
      slides: groupSlides,
    }));
  });

  private readonly fragmentService = inject(FragmentService);
  private readonly platformId = inject(PLATFORM_ID);

  /** Identifiant de la derniere slide pour laquelle on a reinitialise les fragments. */
  private lastResetId: string | null = null;

  /** True si l'utilisateur prefere les mouvements reduits — desactive les transitions GSAP. */
  private prefersReducedMotion = false;

  /** Verrou d'animation : true pendant une transition GSAP pour eviter les navigations concurrentes. */
  private isAnimating = false;

  /** Coordonnee X du debut du geste tactile pour la detection de swipe. */
  private touchStartX = 0;
  /** Coordonnee Y du debut du geste tactile pour la detection de swipe. */
  private touchStartY = 0;

  /** Distance minimale en pixels pour qu'un geste tactile soit considere comme un swipe. */
  private static readonly SWIPE_MIN_DISTANCE = 50;

  /** Reference au conteneur du mode presentation pour la gestion du focus. */
  private readonly presentContainer =
    viewChild<ElementRef<HTMLElement>>("presentContainer");

  /** Reference au conteneur de la slide courante pour les transitions GSAP. */
  private readonly slideContainer =
    viewChild<ElementRef<HTMLElement>>("slideContainer");

  constructor() {
    /**
     * Safety net pour les changements externes de deck ou l'initialisation :
     * si la slide courante change d'identifiant (nouveau deck, reset en test,
     * changement d'index via goToSlide), on reinitialise les fragments.
     * L'effect est idempotent grace a `lastResetId`, donc `goToSlide` peut
     * faire le reset synchrone sans conflit avec l'effect async.
     */
    effect(() => {
      const slide = this.currentSlide();
      if (slide && this.lastResetId !== slide.id) {
        this.fragmentService.reset(slide.fragmentCount);
        this.lastResetId = slide.id;
      }
    });

    /**
     * Focus le conteneur du mode presentation lors de l'entree dans ce mode
     * pour activer la navigation clavier et les lecteurs d'ecran.
     * `afterNextRender` garantit que le conteneur est bien dans le DOM.
     */
    effect(() => {
      if (this.mode() === "present" && isPlatformBrowser(this.platformId)) {
        queueMicrotask(() => {
          this.presentContainer()?.nativeElement.focus();
        });
      }
    });

    // Force la lecture initiale des signals necessaires au premier rendu
    // cote SSR/CSR — garantit que l'effect ci-dessus s'execute avant toute
    // navigation programmatique.
    afterNextRender(() => {
      this.presentContainer();
    });

    // Detecte prefers-reduced-motion une seule fois au premier rendu.
    afterNextRender(() => {
      if (isPlatformBrowser(this.platformId)) {
        this.prefersReducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
      }
    });

    // Initialisation AOS pour les animations au scroll (mode scroll uniquement).
    afterNextRender(() => {
      if (isPlatformBrowser(this.platformId)) {
        import("aos").then((AOS) => {
          AOS.default.init({
            duration: 800,
            easing: "ease-out-cubic",
            once: true,
            offset: 50,
          });
          setTimeout(() => AOS.default.refresh(), 100);
        });
      }
    });
  }

  /**
   * Avance d'un fragment ou d'une slide.
   * Si la slide courante a encore des fragments a reveler, revele le suivant.
   * Sinon, passe a la slide suivante (reinitialise ses fragments).
   */
  navigateNext(): void {
    // En mode scroll, pas de gestion des fragments
    if (this.mode() === "present" && !this.fragmentService.isComplete()) {
      this.fragmentService.next();
      return;
    }
    const next = this.currentIndex() + 1;
    const max = this.activeSlides().length - 1;
    if (next > max) {
      return;
    }
    this.goToSlide(next);
  }

  /**
   * Recule d'un fragment ou d'une slide.
   * Si la slide courante a deja revele des fragments, masque le dernier.
   * Sinon, recule d'une slide et revele tous ses fragments (pour permettre
   * a l'utilisateur de reprendre la navigation la ou il s'etait arrete).
   */
  navigatePrev(): void {
    // En mode scroll, pas de gestion des fragments
    if (this.mode() === "present" && this.fragmentService.visibleCount() > 0) {
      this.fragmentService.prev();
      return;
    }
    const previous = this.currentIndex() - 1;
    if (previous < 0) {
      return;
    }
    this.goToSlide(previous);
    if (this.mode() === "present") {
      this.fragmentService.showAll();
    }
  }

  /**
   * Saute directement a une slide precise.
   * Reinitialise les fragments de la slide cible de maniere synchrone
   * afin que les methodes de navigation successives lisent l'etat a jour.
   * L'effect d'initialisation est idempotent grace a `lastResetId`.
   */
  goToSlide(index: number): void {
    const max = this.activeSlides().length - 1;
    const clamped = Math.max(0, Math.min(index, max));
    this.currentIndex.set(clamped);
    const target = this.activeSlides()[clamped];
    if (target && this.lastResetId !== target.id) {
      this.fragmentService.reset(target.fragmentCount);
      this.lastResetId = target.id;
    }
  }

  /**
   * Bascule le mode d'affichage en preservant la slide courante.
   *
   * Apres le changement de mode, `activeSlides` est recalcule et la slide
   * courante peut avoir change d'index ou etre devenue invisible.
   * - Si la slide courante est toujours visible dans le nouveau mode, on
   *   repositionne l'index pour qu'elle reste affichee.
   * - Sinon, on clampe l'index au maximum du nouveau deck filtre.
   */
  toggleMode(mode: PresentationMode): void {
    const currentId = this.currentSlide()?.id;
    this.mode.set(mode);
    if (currentId) {
      const newIndex = this.activeSlides().findIndex((s) => s.id === currentId);
      if (newIndex >= 0) {
        this.currentIndex.set(newIndex);
      } else {
        const max = this.activeSlides().length - 1;
        this.currentIndex.set(Math.min(this.currentIndex(), max));
      }
    }
  }

  /**
   * Navigue vers la premiere slide d'un acte donne.
   * Appele par la PresenterBar quand l'utilisateur clique sur un segment
   * d'acte dans la barre horizontale.
   */
  goToActByid(actId: string): void {
    const start = this.actStartIndexMap().get(actId);
    if (start !== undefined) {
      this.goToSlide(start);
    }
  }

  /**
   * Navigue vers la premiere slide de l'acte suivant (navigation horizontale).
   * Ne fait rien si on est deja sur le dernier acte du deck.
   */
  navigateNextAct(): void {
    const currentAct = this.currentSlide()?.act;
    if (!currentAct) {
      return;
    }
    const actIds = [...new Set(this.activeSlides().map((s) => s.act.id))];
    const currentActIndex = actIds.indexOf(currentAct.id);
    if (currentActIndex < actIds.length - 1) {
      this.goToActByid(actIds[currentActIndex + 1]);
    }
  }

  /**
   * Navigue vers la premiere slide de l'acte precedent (navigation horizontale).
   * Ne fait rien si on est deja sur le premier acte du deck.
   */
  navigatePrevAct(): void {
    const currentAct = this.currentSlide()?.act;
    if (!currentAct) {
      return;
    }
    const actIds = [...new Set(this.activeSlides().map((s) => s.act.id))];
    const currentActIndex = actIds.indexOf(currentAct.id);
    if (currentActIndex > 0) {
      this.goToActByid(actIds[currentActIndex - 1]);
    }
  }

  /**
   * Anime la transition entre deux slides avec GSAP.
   * La direction determine le type d'animation :
   * - up/down : fondu + glissement vertical (400ms, intra-acte)
   * - left/right : glissement horizontal (600ms, inter-acte)
   *
   * SSR-safe : pas d'animation si on n'est pas dans le navigateur.
   * Respecte `prefers-reduced-motion` : swap instantane si active.
   *
   * @param direction - Direction de la transition (up, down, left, right)
   * @param changeSlideFn - Callback executee entre la sortie et l'entree pour changer la slide
   */
  private async animateTransition(
    direction: "up" | "down" | "left" | "right",
    changeSlideFn: () => void,
  ): Promise<void> {
    const container = this.slideContainer()?.nativeElement;
    if (
      !container ||
      this.prefersReducedMotion ||
      !isPlatformBrowser(this.platformId)
    ) {
      changeSlideFn();
      return;
    }

    this.isAnimating = true;

    const isHorizontal = direction === "left" || direction === "right";
    const duration = isHorizontal ? 0.6 : 0.4;
    const axis = isHorizontal ? "x" : "y";
    const distance = isHorizontal ? "100%" : "40px";
    const sign = direction === "down" || direction === "right" ? "-" : "";

    // Sortie de la slide courante
    await gsap.to(container, {
      opacity: 0,
      [axis]: `${sign}${distance}`,
      duration: duration * 0.4,
      ease: "power2.in",
    });

    changeSlideFn();

    // Entree de la nouvelle slide
    await gsap.fromTo(
      container,
      { opacity: 0, [axis]: `${sign === "-" ? "" : "-"}${distance}` },
      { opacity: 1, [axis]: 0, duration: duration * 0.6, ease: "power2.out" },
    );

    this.isAnimating = false;
  }

  /**
   * Ouvre ou ferme les notes d'une slide dans l'ensemble `expandedNotes`.
   * Signature compatible avec l'output `toggleNotes` du SlideRendererComponent.
   */
  toggleNotes(index: number): void {
    this.expandedNotes.update((set) => {
      const next = new Set(set);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  /**
   * Genere un prompt a partir du template d'une slide et de la valeur saisie
   * dans le champ secteur. Stocke le resultat dans `generatedPrompt`.
   */
  generatePrompt(template: PromptTemplate): void {
    const sector = this.sectorInput().trim();
    if (!sector) {
      this.generatedPrompt.set("");
      return;
    }
    this.generatedPrompt.set(template.template.replace("{{sector}}", sector));
  }

  /**
   * Copie le prompt genere dans le presse-papier et affiche un feedback
   * temporaire de 2 secondes via le signal `copied`.
   */
  copyPrompt(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const text = this.generatedPrompt();
    if (!text) {
      return;
    }
    navigator.clipboard?.writeText(text).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  /**
   * Enregistre les coordonnees de depart d'un geste tactile.
   * Utilise conjointement avec `onTouchEnd` pour detecter les swipes
   * en mode presentation.
   */
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
  }

  /**
   * Detecte un swipe tactile en mode presentation et declenche la navigation.
   *
   * Regles :
   * - Distance minimum de 50px pour eviter les faux positifs
   * - Swipe horizontal (|dx| > |dy|) : gauche → navigateNext, droite → navigatePrev
   * - Swipe vertical (|dy| > |dx|) : haut → navigateNextAct, bas → navigatePrevAct
   * - Ignore les gestes si le mode n'est pas `present` ou si une animation est en cours
   */
  onTouchEnd(event: TouchEvent): void {
    if (this.mode() !== "present" || this.isAnimating) {
      return;
    }

    const dx = event.changedTouches[0].clientX - this.touchStartX;
    const dy = event.changedTouches[0].clientY - this.touchStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (
      Math.max(absDx, absDy) < PresentationEngineComponent.SWIPE_MIN_DISTANCE
    ) {
      return;
    }

    if (absDx > absDy) {
      // Swipe horizontal
      if (dx < 0) {
        void this.animateTransition("right", () => this.navigateNext());
      } else {
        void this.animateTransition("left", () => this.navigatePrev());
      }
    } else {
      // Swipe vertical
      if (dy < 0) {
        void this.animateTransition("down", () => this.navigateNextAct());
      } else {
        void this.animateTransition("up", () => this.navigatePrevAct());
      }
    }
  }

  /**
   * Raccourcis clavier actifs en mode presentation et overview.
   *
   * Mapping en mode presentation :
   * - ArrowRight / ArrowDown / Space : navigateNext (slide suivante, transition verticale)
   * - ArrowLeft / ArrowUp / Backspace : navigatePrev (slide precedente, transition verticale)
   * - PageDown : navigateNextAct (inter-acte, transition horizontale)
   * - PageUp : navigatePrevAct (inter-acte, transition horizontale)
   * - Escape : retour au mode scroll
   * - O : ouverture de l'overview
   */
  @HostListener("document:keydown", ["$event"])
  onKeydown(event: KeyboardEvent): void {
    const currentMode = this.mode();
    if (currentMode !== "present" && currentMode !== "overview") {
      return;
    }
    const tag = (event.target as HTMLElement | null)?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") {
      return;
    }
    if (this.isAnimating) {
      event.preventDefault();
      return;
    }
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
      case " ":
        if (currentMode === "present") {
          event.preventDefault();
          void this.animateTransition("down", () => this.navigateNext());
        }
        break;
      case "ArrowLeft":
      case "ArrowUp":
      case "Backspace":
        if (currentMode === "present") {
          event.preventDefault();
          void this.animateTransition("up", () => this.navigatePrev());
        }
        break;
      case "PageDown":
        if (currentMode === "present") {
          event.preventDefault();
          void this.animateTransition("right", () => this.navigateNextAct());
        }
        break;
      case "PageUp":
        if (currentMode === "present") {
          event.preventDefault();
          void this.animateTransition("left", () => this.navigatePrevAct());
        }
        break;
      case "Escape":
        event.preventDefault();
        if (currentMode === "overview") {
          this.toggleMode("present");
        } else {
          this.toggleMode("scroll");
        }
        break;
      case "o":
      case "O":
        if (currentMode === "present") {
          event.preventDefault();
          this.toggleMode("overview");
        }
        break;
    }
  }
}
