import { isPlatformBrowser } from "@angular/common";
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  input,
  PLATFORM_ID,
  signal,
} from "@angular/core";
import { RouterModule } from "@angular/router";
import { SvgIconComponent } from "../svg-icon.component";
import type { PromptTemplate, Slide } from "../../models/slide.model";

/**
 * Composant de visualisation de slides en dual-mode :
 * - Mode scroll : tous les slides affichés verticalement avec navigation par ancres
 * - Mode présentation : vue plein écran focalisée sur le slide courant
 *
 * Supporte les contenus : bullets, tableau, prompt template interactif, notes.
 */
@Component({
  selector: "app-slide-viewer",
  standalone: true,
  imports: [SvgIconComponent, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!isPresenting()) {
      <!-- ===== MODE SCROLL ===== -->
      <div
        class="relative min-h-screen bg-gradient-to-b from-scheme-background via-scheme-background to-scheme-accent/5"
      >
        <!-- Barre de progression sticky -->
        <div
          class="sticky top-20 lg:top-24 z-10 border-b border-scheme-border/50 bg-scheme-background/80 backdrop-blur-md"
        >
          <div class="mx-auto max-w-6xl px-4 py-2.5">
            <div class="flex items-center gap-3">
              <!-- Progress bar -->
              <div class="hidden md:flex flex-1 items-center gap-0.5">
                @for (slide of slides(); track slide.id; let i = $index) {
                  <button
                    type="button"
                    class="group relative flex-1 h-1.5 rounded-full transition-all duration-300"
                    [class]="
                      currentSlideIndex() >= i
                        ? 'bg-scheme-accent'
                        : 'bg-scheme-border/40 hover:bg-scheme-border'
                    "
                    [attr.aria-label]="
                      'Aller au slide ' + (i + 1) + ': ' + slide.title
                    "
                    (click)="scrollToSlide(i)"
                  >
                    <span
                      class="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-scheme-text px-2 py-1 text-[10px] font-medium text-scheme-background opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      {{ i + 1 }}. {{ slide.title | slice: 0 : 30 }}
                    </span>
                  </button>
                }
              </div>
              <!-- Mobile: counter -->
              <span
                class="md:hidden text-xs font-medium text-scheme-text-muted tabular-nums"
              >
                {{ currentSlideIndex() + 1 }} / {{ slides().length }}
              </span>

              <div class="flex items-center gap-2">
                @if (fullscreenSupported) {
                  <button
                    type="button"
                    class="flex items-center gap-1.5 rounded-full bg-scheme-accent px-4 py-1.5 text-xs font-semibold text-scheme-on-accent shadow-sm transition-all hover:bg-scheme-accent-hover hover:shadow-md"
                    (click)="enterPresentation()"
                    aria-label="Passer en mode présentation"
                  >
                    <app-svg-icon name="chevron-right" [size]="0.8" />
                    <span class="hidden sm:inline" i18n>Présenter</span>
                  </button>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Liste des slides -->
        <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          @for (slide of slides(); track slide.id; let i = $index) {
            <section
              [attr.data-slide-id]="slide.id"
              [attr.id]="'slide-anchor-' + i"
              [attr.aria-labelledby]="'slide-title-' + i"
              class="scroll-mt-32 lg:scroll-mt-36 group/card"
            >
              <div
                class="relative overflow-hidden rounded-2xl border border-scheme-border/60 bg-scheme-surface shadow-sm transition-all duration-300 hover:shadow-md hover:border-scheme-border"
                [class]="
                  'bg-gradient-to-br ' +
                  (slide.accentClass || 'from-transparent to-transparent')
                "
              >
                <!-- Header du slide -->
                <div class="relative px-6 pt-6 pb-4 sm:px-8 sm:pt-8">
                  <div class="flex items-start gap-4">
                    <!-- Emoji + numéro -->
                    <div class="flex shrink-0 flex-col items-center gap-1">
                      @if (slide.emoji) {
                        <span
                          class="text-3xl sm:text-4xl leading-none"
                          aria-hidden="true"
                          >{{ slide.emoji }}</span
                        >
                      }
                      <span
                        class="flex h-6 w-6 items-center justify-center rounded-full bg-scheme-accent/15 text-[10px] font-bold text-scheme-accent"
                        aria-hidden="true"
                      >
                        {{ i + 1 }}
                      </span>
                    </div>

                    <!-- Titre + sous-titre -->
                    <div class="min-w-0 flex-1">
                      <h2
                        [attr.id]="'slide-title-' + i"
                        data-slide-title
                        class="font-heading text-h4 sm:text-h3 text-scheme-text leading-tight"
                      >
                        {{ slide.title }}
                      </h2>
                      @if (slide.subtitle) {
                        <p
                          class="mt-2 text-small sm:text-medium text-scheme-text-muted leading-relaxed"
                        >
                          {{ slide.subtitle }}
                        </p>
                      }
                    </div>
                  </div>
                </div>

                <!-- Corps du slide -->
                <div class="px-6 pb-6 sm:px-8 sm:pb-8 space-y-5">
                  <!-- Bullets -->
                  @if (slide.bullets && slide.bullets.length > 0) {
                    <ul class="space-y-3">
                      @for (bullet of slide.bullets; track $index) {
                        <li
                          class="flex items-start gap-3 text-small text-scheme-text"
                        >
                          <span
                            class="mt-[7px] h-2 w-2 shrink-0 rounded-full bg-scheme-accent shadow-sm shadow-scheme-accent/30"
                            aria-hidden="true"
                          ></span>
                          <span class="leading-relaxed">{{ bullet }}</span>
                        </li>
                      }
                    </ul>
                  }

                  <!-- Table -->
                  @if (slide.table) {
                    <div class="overflow-x-auto -mx-2">
                      <table class="w-full text-small">
                        <thead>
                          <tr>
                            @for (header of slide.table.headers; track $index) {
                              <th
                                class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-scheme-accent bg-scheme-accent/5 first:rounded-tl-xl last:rounded-tr-xl"
                              >
                                {{ header }}
                              </th>
                            }
                          </tr>
                        </thead>
                        <tbody>
                          @for (
                            row of slide.table.rows;
                            track $index;
                            let last = $last
                          ) {
                            <tr
                              class="border-t border-scheme-border/30 transition-colors hover:bg-scheme-surface-hover"
                            >
                              @for (
                                cell of row;
                                track $index;
                                let first = $first
                              ) {
                                <td
                                  class="px-4 py-3 text-scheme-text"
                                  [class.font-medium]="first"
                                  [class.rounded-bl-xl]="last && first"
                                  [class.rounded-br-xl]="last && !first"
                                >
                                  {{ cell }}
                                </td>
                              }
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  }

                  <!-- Prompt template (slide interactif) -->
                  @if (slide.promptTemplate) {
                    <div
                      data-prompt-form
                      class="relative overflow-hidden rounded-xl border-2 border-scheme-accent/30 bg-gradient-to-br from-scheme-accent/5 to-scheme-background p-5 sm:p-6"
                    >
                      <div
                        class="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-scheme-accent/10 blur-2xl"
                      ></div>
                      <label
                        [attr.for]="'sector-input-' + i"
                        class="mb-3 block text-sm font-semibold text-scheme-text"
                      >
                        {{ slide.promptTemplate.label }}
                      </label>
                      <div class="flex flex-col sm:flex-row gap-3">
                        <input
                          [attr.id]="'sector-input-' + i"
                          type="text"
                          [placeholder]="slide.promptTemplate.placeholder"
                          [value]="sectorInput()"
                          (input)="sectorInput.set($any($event.target).value)"
                          class="flex-1 rounded-xl border border-scheme-border bg-scheme-background px-4 py-3 text-small text-scheme-text shadow-xs placeholder:text-scheme-text-muted/60 focus:border-scheme-accent focus:outline-none focus:ring-2 focus:ring-scheme-accent/20"
                        />
                        <button
                          type="button"
                          class="rounded-xl bg-scheme-accent px-6 py-3 text-sm font-semibold text-scheme-on-accent shadow-sm transition-all hover:bg-scheme-accent-hover hover:shadow-md active:scale-[0.98]"
                          (click)="generatePrompt(slide.promptTemplate)"
                          i18n
                        >
                          Générer le prompt
                        </button>
                      </div>
                      @if (generatedPrompt()) {
                        <div class="mt-4 space-y-3">
                          <div
                            class="max-h-48 overflow-y-auto rounded-xl border border-scheme-border bg-scheme-background p-4 text-small leading-relaxed text-scheme-text shadow-inner whitespace-pre-wrap"
                          >
                            {{ generatedPrompt() }}
                          </div>
                          <button
                            type="button"
                            class="inline-flex items-center gap-1.5 rounded-full border border-scheme-accent/30 bg-scheme-accent/10 px-4 py-2 text-xs font-semibold text-scheme-accent transition-all hover:bg-scheme-accent/20"
                            (click)="copyPrompt()"
                          >
                            @if (copied()) {
                              <span i18n>Copié !</span>
                            } @else {
                              <span i18n>Copier le prompt</span>
                            }
                          </button>
                        </div>
                      }
                    </div>
                  }

                  <!-- Notes dépliables -->
                  @if (slide.notes) {
                    <div class="border-t border-scheme-border/30 pt-4">
                      <button
                        type="button"
                        class="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-scheme-text-muted transition-colors hover:bg-scheme-surface-hover hover:text-scheme-text"
                        [attr.aria-expanded]="expandedNotes().has(i)"
                        [attr.aria-controls]="'notes-' + i"
                        (click)="toggleNotes(i)"
                      >
                        <app-svg-icon
                          name="chevron-down"
                          [size]="0.7"
                          class="transition-transform duration-200"
                          [class.rotate-180]="expandedNotes().has(i)"
                        />
                        <span i18n>Notes du formateur</span>
                      </button>
                      @if (expandedNotes().has(i)) {
                        <div
                          [attr.id]="'notes-' + i"
                          class="mt-3 rounded-xl bg-scheme-text/[0.03] p-4 text-xs leading-relaxed text-scheme-text-muted"
                        >
                          {{ slide.notes }}
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            </section>
          }
        </div>

        <!-- CTA section -->
        <div class="relative overflow-hidden border-t border-scheme-border/30">
          <div
            class="pointer-events-none absolute inset-0 bg-gradient-to-r from-scheme-accent/5 via-transparent to-purple-500/5"
          ></div>
          <div class="relative mx-auto max-w-4xl px-6 py-16 text-center">
            <p
              class="mb-2 text-sm font-semibold uppercase tracking-wider text-scheme-accent"
              i18n
            >
              Prochaine étape
            </p>
            <h3 class="mb-4 font-heading text-h3 text-scheme-text" i18n>
              Envie d'aller plus loin ?
            </h3>
            <p
              class="mx-auto mb-8 max-w-xl text-medium text-scheme-text-muted"
              i18n
            >
              Audit gratuit, conseil personnalisé ou développement sur mesure —
              discutons de votre projet.
            </p>
            <a
              routerLink="/contact"
              class="inline-flex items-center gap-2 rounded-full bg-scheme-accent px-8 py-3.5 text-sm font-semibold text-scheme-on-accent shadow-md transition-all hover:bg-scheme-accent-hover hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
              i18n
            >
              Contactez-moi
            </a>
          </div>
        </div>
      </div>
    } @else {
      <!-- ===== MODE PRÉSENTATION ===== -->
      <div
        class="fixed inset-0 z-[100] flex flex-col bg-gradient-to-br from-scheme-background via-scheme-background to-scheme-accent/10"
        role="region"
        aria-label="Mode présentation"
        (click)="handlePresentationClick($event)"
        (keydown.arrowRight)="nextSlide()"
        (keydown.arrowLeft)="prevSlide()"
      >
        <!-- Décor gradient -->
        <div
          class="pointer-events-none absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-scheme-accent/5 blur-3xl"
        ></div>
        <div
          class="pointer-events-none absolute -left-40 bottom-0 h-[400px] w-[400px] rounded-full bg-purple-500/5 blur-3xl"
        ></div>

        <!-- Bouton fermer -->
        <button
          type="button"
          class="absolute right-6 top-6 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-scheme-border/50 bg-scheme-background/80 text-scheme-text-muted shadow-sm backdrop-blur-sm transition-all hover:bg-scheme-surface-hover hover:text-scheme-text hover:shadow-md"
          (click)="exitPresentation(); $event.stopPropagation()"
          aria-label="Quitter le mode présentation"
        >
          <app-svg-icon name="close" [size]="1.1" />
        </button>

        <!-- Contenu du slide courant -->
        <div
          class="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-12 sm:px-12 md:px-20"
        >
          <div class="w-full max-w-3xl">
            <!-- Emoji -->
            @if (currentSlide().emoji) {
              <span
                class="mb-4 block text-5xl sm:text-6xl"
                aria-hidden="true"
                >{{ currentSlide().emoji }}</span
              >
            }

            <!-- Titre -->
            <h2
              class="font-heading text-h2 sm:text-h1 text-scheme-text leading-tight"
              [attr.data-slide-title]="currentSlide().title"
            >
              {{ currentSlide().title }}
            </h2>

            @if (currentSlide().subtitle) {
              <p class="mt-4 text-large text-scheme-text-muted leading-relaxed">
                {{ currentSlide().subtitle }}
              </p>
            }

            <!-- Bullets -->
            @if (currentSlide().bullets && currentSlide().bullets!.length > 0) {
              <ul class="mt-8 space-y-4">
                @for (bullet of currentSlide().bullets; track $index) {
                  <li
                    class="flex items-start gap-4 text-medium sm:text-large text-scheme-text"
                  >
                    <span
                      class="mt-2.5 h-2.5 w-2.5 shrink-0 rounded-full bg-scheme-accent shadow-sm shadow-scheme-accent/40"
                      aria-hidden="true"
                    ></span>
                    <span class="leading-relaxed">{{ bullet }}</span>
                  </li>
                }
              </ul>
            }

            <!-- Table -->
            @if (currentSlide().table) {
              <div class="mt-8 overflow-x-auto">
                <table class="w-full text-medium">
                  <thead>
                    <tr>
                      @for (
                        header of currentSlide().table!.headers;
                        track $index
                      ) {
                        <th
                          class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-scheme-accent bg-scheme-accent/5 first:rounded-tl-xl last:rounded-tr-xl"
                        >
                          {{ header }}
                        </th>
                      }
                    </tr>
                  </thead>
                  <tbody>
                    @for (
                      row of currentSlide().table!.rows;
                      track $index;
                      let last = $last
                    ) {
                      <tr
                        class="border-t border-scheme-border/30 transition-colors hover:bg-scheme-surface-hover"
                      >
                        @for (cell of row; track $index; let first = $first) {
                          <td
                            class="px-5 py-4 text-scheme-text"
                            [class.font-medium]="first"
                          >
                            {{ cell }}
                          </td>
                        }
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }

            <!-- Prompt template -->
            @if (currentSlide().promptTemplate) {
              <div
                data-prompt-form
                class="mt-8 rounded-2xl border-2 border-scheme-accent/30 bg-gradient-to-br from-scheme-accent/5 to-scheme-background p-8"
                (click)="$event.stopPropagation()"
                (keydown)="$event.stopPropagation()"
                tabindex="-1"
              >
                <label
                  for="sector-input-presentation"
                  class="mb-3 block text-medium font-semibold text-scheme-text"
                >
                  {{ currentSlide().promptTemplate!.label }}
                </label>
                <div class="flex flex-col sm:flex-row gap-3">
                  <input
                    id="sector-input-presentation"
                    type="text"
                    [placeholder]="currentSlide().promptTemplate!.placeholder"
                    [value]="sectorInput()"
                    (input)="sectorInput.set($any($event.target).value)"
                    class="flex-1 rounded-xl border border-scheme-border bg-scheme-background px-5 py-3 text-medium text-scheme-text placeholder:text-scheme-text-muted/60 focus:border-scheme-accent focus:outline-none focus:ring-2 focus:ring-scheme-accent/20"
                  />
                  <button
                    type="button"
                    class="rounded-xl bg-scheme-accent px-8 py-3 font-semibold text-scheme-on-accent shadow-sm transition-all hover:bg-scheme-accent-hover hover:shadow-md"
                    (click)="generatePrompt(currentSlide().promptTemplate!)"
                    i18n
                  >
                    Générer
                  </button>
                </div>
                @if (generatedPrompt()) {
                  <div class="mt-4">
                    <div
                      class="max-h-56 overflow-y-auto rounded-xl border border-scheme-border bg-scheme-background p-5 text-small leading-relaxed text-scheme-text shadow-inner whitespace-pre-wrap"
                    >
                      {{ generatedPrompt() }}
                    </div>
                    <button
                      type="button"
                      class="mt-3 inline-flex items-center gap-1.5 rounded-full border border-scheme-accent/30 bg-scheme-accent/10 px-4 py-2 text-xs font-semibold text-scheme-accent transition-all hover:bg-scheme-accent/20"
                      (click)="copyPrompt()"
                    >
                      @if (copied()) {
                        <span i18n>Copié !</span>
                      } @else {
                        <span i18n>Copier</span>
                      }
                    </button>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Barre de navigation bas -->
        <div
          class="flex items-center justify-between border-t border-scheme-border/30 bg-scheme-background/80 px-6 py-4 backdrop-blur-sm"
          (click)="$event.stopPropagation()"
          (keydown)="$event.stopPropagation()"
          tabindex="-1"
        >
          <button
            type="button"
            class="flex items-center gap-2 rounded-full border border-scheme-border/50 px-5 py-2.5 text-sm text-scheme-text-muted transition-all hover:bg-scheme-surface-hover hover:text-scheme-text disabled:cursor-not-allowed disabled:opacity-30"
            [disabled]="currentSlideIndex() === 0"
            (click)="prevSlide()"
            aria-label="Slide précédent"
          >
            <app-svg-icon name="chevron-left" [size]="0.9" />
            <span class="hidden sm:inline" i18n>Précédent</span>
          </button>

          <!-- Progress dots -->
          <div class="flex items-center gap-3">
            <div class="hidden sm:flex items-center gap-1">
              @for (slide of slides(); track slide.id; let i = $index) {
                <button
                  type="button"
                  class="h-1.5 rounded-full transition-all duration-300"
                  [class]="
                    currentSlideIndex() === i
                      ? 'w-6 bg-scheme-accent'
                      : 'w-1.5 bg-scheme-border/60 hover:bg-scheme-border'
                  "
                  (click)="goToSlide(i)"
                  [attr.aria-label]="'Slide ' + (i + 1)"
                ></button>
              }
            </div>
            <span
              aria-live="polite"
              aria-atomic="true"
              class="text-sm font-medium tabular-nums text-scheme-text-muted"
            >
              {{ currentSlideIndex() + 1
              }}<span class="text-scheme-border mx-1">/</span
              >{{ slides().length }}
            </span>
          </div>

          <button
            type="button"
            class="flex items-center gap-2 rounded-full bg-scheme-accent px-5 py-2.5 text-sm font-medium text-scheme-on-accent shadow-sm transition-all hover:bg-scheme-accent-hover hover:shadow-md disabled:cursor-not-allowed disabled:opacity-30 disabled:bg-scheme-border disabled:shadow-none"
            [disabled]="currentSlideIndex() === slides().length - 1"
            (click)="nextSlide()"
            aria-label="Slide suivant"
          >
            <span class="hidden sm:inline" i18n>Suivant</span>
            <app-svg-icon name="chevron-right" [size]="0.9" />
          </button>
        </div>
      </div>
    }
  `,
})
export class SlideViewerComponent {
  /** Liste des slides à afficher. */
  readonly slides = input.required<Slide[]>();

  // ---- Signals d'état ----

  /** Index du slide courant (navigation). */
  readonly currentSlideIndex = signal(0);

  /** Indique si on est en mode présentation plein écran. */
  readonly isPresenting = signal(false);

  /** Ensemble des indices dont les notes sont dépliées. */
  readonly expandedNotes = signal<Set<number>>(new Set());

  /** Valeur du champ secteur pour le prompt template. */
  readonly sectorInput = signal("");

  /** Prompt généré après remplacement du template. */
  readonly generatedPrompt = signal("");

  /** Indique si le prompt vient d'être copié (feedback 2s). */
  readonly copied = signal(false);

  /** Indique si l'API Fullscreen est disponible (détectée côté browser). */
  fullscreenSupported = false;

  /** Slide courant calculé depuis l'index. */
  readonly currentSlide = computed(
    () => this.slides()[this.currentSlideIndex()],
  );

  private readonly platformId = inject(PLATFORM_ID);

  constructor() {
    afterNextRender(() => {
      this.fullscreenSupported =
        typeof document !== "undefined" &&
        !!document.documentElement.requestFullscreen;
    });
  }

  // ---- Navigation ----

  /** Avance au slide suivant, sans dépasser le dernier. */
  nextSlide(): void {
    const max = this.slides().length - 1;
    this.currentSlideIndex.update((i) => Math.min(i + 1, max));
  }

  /** Recule au slide précédent, sans descendre en-dessous de 0. */
  prevSlide(): void {
    this.currentSlideIndex.update((i) => Math.max(i - 1, 0));
  }

  /** Navigue vers un slide spécifique, en clampant aux bornes. */
  goToSlide(index: number): void {
    const max = this.slides().length - 1;
    this.currentSlideIndex.set(Math.max(0, Math.min(index, max)));
  }

  /**
   * Défile jusqu'à l'ancre du slide donné (SSR-safe).
   * Met aussi à jour l'index courant.
   */
  scrollToSlide(index: number): void {
    this.goToSlide(index);
    if (isPlatformBrowser(this.platformId)) {
      const el = document.getElementById(`slide-anchor-${index}`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // ---- Notes ----

  /** Bascule la visibilité des notes d'un slide. */
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

  // ---- Mode présentation ----

  /** Active le mode présentation et tente le plein écran (SSR-safe). */
  enterPresentation(): void {
    this.isPresenting.set(true);
    if (isPlatformBrowser(this.platformId)) {
      document.documentElement.requestFullscreen?.().catch(() => {
        // Plein écran refusé (ex: permission), on reste en mode présentation sans fullscreen
      });
    }
  }

  /** Quitte le mode présentation et sort du plein écran si actif (SSR-safe). */
  exitPresentation(): void {
    this.isPresenting.set(false);
    if (isPlatformBrowser(this.platformId) && document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {
        // Ignoré
      });
    }
  }

  /**
   * Gère les clics sur l'overlay de présentation :
   * clic gauche = précédent, clic droit = suivant.
   * Ignore les clics sur boutons, inputs et le formulaire prompt.
   */
  handlePresentationClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("input") ||
      target.closest("textarea") ||
      target.closest("[data-prompt-form]")
    ) {
      return;
    }
    const { clientX } = event;
    const half = window.innerWidth / 2;
    if (clientX < half) {
      this.prevSlide();
    } else {
      this.nextSlide();
    }
  }

  // ---- Prompt template ----

  /**
   * Génère le prompt en remplaçant {{sector}} par la valeur saisie.
   * Si le secteur est vide, le prompt reste vide.
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
   * Copie le prompt généré dans le presse-papier (SSR-safe).
   * Affiche un feedback "Copié !" pendant 2 secondes.
   */
  copyPrompt(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const text = this.generatedPrompt();
    if (!text) return;
    navigator.clipboard?.writeText(text).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  // ---- Clavier ----

  /**
   * Gère la navigation clavier en mode présentation.
   * ArrowRight/Space = suivant, ArrowLeft/Backspace = précédent.
   * Ignoré si le focus est sur un INPUT ou TEXTAREA.
   */
  @HostListener("document:keydown", ["$event"])
  onKeydown(event: KeyboardEvent): void {
    if (!this.isPresenting()) return;
    const tag = (event.target as HTMLElement).tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;

    switch (event.key) {
      case "ArrowRight":
      case " ":
        event.preventDefault();
        this.nextSlide();
        break;
      case "ArrowLeft":
      case "Backspace":
        event.preventDefault();
        this.prevSlide();
        break;
    }
  }
}
