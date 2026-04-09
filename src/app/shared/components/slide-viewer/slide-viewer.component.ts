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
      <div class="relative">
        <!-- Barre de progression sticky -->
        <div
          class="sticky top-20 lg:top-24 z-10 flex items-center gap-2 overflow-x-auto border-b border-scheme-border bg-scheme-background/95 px-4 py-2 backdrop-blur-sm"
        >
          <div class="flex flex-1 items-center gap-1 overflow-x-auto">
            @for (slide of slides(); track slide.id; let i = $index) {
              <button
                type="button"
                class="flex h-7 min-w-7 items-center justify-center rounded-button px-2 text-xs font-medium transition-colors"
                [class]="
                  currentSlideIndex() === i
                    ? 'bg-scheme-accent text-scheme-on-accent'
                    : 'text-scheme-text-muted hover:bg-scheme-surface-hover hover:text-scheme-text'
                "
                [attr.aria-label]="'Aller au slide ' + (i + 1)"
                (click)="scrollToSlide(i)"
              >
                {{ i + 1 }}
              </button>
            }
          </div>

          @if (fullscreenSupported) {
            <button
              type="button"
              class="ml-2 flex shrink-0 items-center gap-1.5 rounded-button bg-scheme-accent px-3 py-1.5 text-xs font-medium text-scheme-on-accent transition-colors hover:bg-scheme-accent-hover"
              (click)="enterPresentation()"
              aria-label="Passer en mode présentation"
            >
              <app-svg-icon name="chevron-right" [size]="0.875" />
              <span i18n>Mode présentation</span>
            </button>
          }
        </div>

        <!-- Liste des slides -->
        <div class="divide-y divide-scheme-border">
          @for (slide of slides(); track slide.id; let i = $index) {
            <section
              [attr.data-slide-id]="slide.id"
              [attr.id]="'slide-anchor-' + i"
              [attr.aria-labelledby]="'slide-title-' + i"
              class="scroll-mt-32 lg:scroll-mt-36 px-6 py-8 md:px-10"
            >
              <!-- Numéro + Titre -->
              <div class="mb-4 flex items-start gap-3">
                <span
                  class="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-button bg-scheme-accent/10 text-xs font-semibold text-scheme-accent"
                  aria-hidden="true"
                >
                  {{ i + 1 }}
                </span>
                <div>
                  <h2
                    [attr.id]="'slide-title-' + i"
                    data-slide-title
                    class="font-heading text-h4 text-scheme-text"
                  >
                    {{ slide.title }}
                  </h2>
                  @if (slide.subtitle) {
                    <p class="mt-0.5 text-medium text-scheme-text-muted">
                      {{ slide.subtitle }}
                    </p>
                  }
                </div>
              </div>

              <!-- Bullets -->
              @if (slide.bullets && slide.bullets.length > 0) {
                <ul class="mb-4 space-y-2 pl-10">
                  @for (bullet of slide.bullets; track bullet) {
                    <li
                      class="flex items-start gap-2 text-small text-scheme-text"
                    >
                      <span
                        class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-scheme-accent"
                        aria-hidden="true"
                      ></span>
                      {{ bullet }}
                    </li>
                  }
                </ul>
              }

              <!-- Table -->
              @if (slide.table) {
                <div class="mb-4 overflow-x-auto pl-10">
                  <table
                    class="w-full border-collapse rounded-card text-small shadow-xs"
                  >
                    <thead>
                      <tr class="bg-scheme-accent/10">
                        @for (header of slide.table.headers; track header) {
                          <th
                            class="border border-scheme-border px-3 py-2 text-left font-semibold text-scheme-text"
                          >
                            {{ header }}
                          </th>
                        }
                      </tr>
                    </thead>
                    <tbody>
                      @for (row of slide.table.rows; track $index) {
                        <tr class="hover:bg-scheme-surface-hover">
                          @for (cell of row; track $index) {
                            <td
                              class="border border-scheme-border px-3 py-2 text-scheme-text"
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
              @if (slide.promptTemplate) {
                <div
                  data-prompt-form
                  class="mb-4 ml-10 rounded-card border border-scheme-accent/30 bg-scheme-accent/5 p-4"
                >
                  <label
                    [attr.for]="'sector-input-' + i"
                    class="mb-1.5 block text-xs font-semibold text-scheme-text"
                  >
                    {{ slide.promptTemplate.label }}
                  </label>
                  <div class="flex gap-2">
                    <input
                      [attr.id]="'sector-input-' + i"
                      type="text"
                      [placeholder]="slide.promptTemplate.placeholder"
                      [value]="sectorInput()"
                      (input)="sectorInput.set($any($event.target).value)"
                      class="flex-1 rounded-form border border-scheme-border bg-scheme-background px-3 py-2 text-small text-scheme-text placeholder:text-scheme-text-muted focus:border-scheme-accent focus:outline-none focus:ring-2 focus:ring-scheme-accent-focus"
                    />
                    <button
                      type="button"
                      class="rounded-button bg-scheme-accent px-4 py-2 text-xs font-medium text-scheme-on-accent transition-colors hover:bg-scheme-accent-hover"
                      (click)="generatePrompt(slide.promptTemplate)"
                      i18n
                    >
                      Générer
                    </button>
                  </div>
                  @if (generatedPrompt()) {
                    <div class="mt-3">
                      <div
                        class="rounded-form border border-scheme-border bg-scheme-surface p-3 text-small text-scheme-text"
                      >
                        {{ generatedPrompt() }}
                      </div>
                      <button
                        type="button"
                        class="mt-2 text-xs text-scheme-accent hover:underline"
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

              <!-- Notes -->
              @if (slide.notes) {
                <div class="ml-10">
                  <button
                    type="button"
                    class="flex items-center gap-1 text-xs text-scheme-text-muted hover:text-scheme-text"
                    [attr.aria-expanded]="expandedNotes().has(i)"
                    [attr.aria-controls]="'notes-' + i"
                    (click)="toggleNotes(i)"
                  >
                    <app-svg-icon
                      name="chevron-down"
                      [size]="0.75"
                      class="transition-transform"
                      [class.rotate-180]="expandedNotes().has(i)"
                    />
                    <span i18n>Notes du formateur</span>
                  </button>
                  @if (expandedNotes().has(i)) {
                    <div
                      [attr.id]="'notes-' + i"
                      class="mt-2 rounded-card border border-scheme-border bg-scheme-surface-hover p-3 text-xs text-scheme-text-muted"
                    >
                      {{ slide.notes }}
                    </div>
                  }
                </div>
              }
            </section>
          }
        </div>

        <!-- CTA contact -->
        <div
          class="border-t border-scheme-border px-6 py-10 text-center md:px-10"
        >
          <p class="mb-4 text-medium text-scheme-text-muted" i18n>
            Vous voulez proposer cette formation à vos équipes ?
          </p>
          <a
            routerLink="/contact"
            class="inline-flex items-center gap-2 rounded-button bg-scheme-accent px-6 py-3 font-medium text-scheme-on-accent transition-colors hover:bg-scheme-accent-hover"
            i18n
          >
            Contactez-moi
          </a>
        </div>
      </div>
    } @else {
      <!-- ===== MODE PRÉSENTATION ===== -->
      <div
        class="fixed inset-0 z-[100] flex flex-col bg-scheme-background"
        role="region"
        aria-label="Mode présentation"
        (click)="handlePresentationClick($event)"
        (keydown.arrowRight)="nextSlide()"
        (keydown.arrowLeft)="prevSlide()"
      >
        <!-- Bouton fermer -->
        <button
          type="button"
          class="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-button border border-scheme-border bg-scheme-background text-scheme-text-muted shadow-xs transition-colors hover:bg-scheme-surface-hover hover:text-scheme-text"
          (click)="exitPresentation(); $event.stopPropagation()"
          aria-label="Quitter le mode présentation"
        >
          <app-svg-icon name="close" [size]="1.25" />
        </button>

        <!-- Contenu du slide courant -->
        <div
          class="flex flex-1 flex-col items-center justify-center overflow-y-auto px-8 py-16 md:px-16"
        >
          <div class="w-full max-w-3xl">
            <!-- Titre -->
            <h2
              class="font-heading text-h2 text-scheme-text"
              [attr.data-slide-title]="currentSlide().title"
            >
              {{ currentSlide().title }}
            </h2>

            @if (currentSlide().subtitle) {
              <p class="mt-2 text-large text-scheme-text-muted">
                {{ currentSlide().subtitle }}
              </p>
            }

            <!-- Bullets -->
            @if (currentSlide().bullets && currentSlide().bullets!.length > 0) {
              <ul class="mt-6 space-y-3">
                @for (bullet of currentSlide().bullets; track bullet) {
                  <li
                    class="flex items-start gap-3 text-medium text-scheme-text"
                  >
                    <span
                      class="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-scheme-accent"
                      aria-hidden="true"
                    ></span>
                    {{ bullet }}
                  </li>
                }
              </ul>
            }

            <!-- Table -->
            @if (currentSlide().table) {
              <div class="mt-6 overflow-x-auto">
                <table
                  class="w-full border-collapse rounded-card text-medium shadow-xs"
                >
                  <thead>
                    <tr class="bg-scheme-accent/10">
                      @for (
                        header of currentSlide().table!.headers;
                        track header
                      ) {
                        <th
                          class="border border-scheme-border px-4 py-3 text-left font-semibold text-scheme-text"
                        >
                          {{ header }}
                        </th>
                      }
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of currentSlide().table!.rows; track $index) {
                      <tr class="hover:bg-scheme-surface-hover">
                        @for (cell of row; track $index) {
                          <td
                            class="border border-scheme-border px-4 py-3 text-scheme-text"
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
                class="mt-6 rounded-card border border-scheme-accent/30 bg-scheme-accent/5 p-6"
                (click)="$event.stopPropagation()"
                (keydown)="$event.stopPropagation()"
                tabindex="-1"
              >
                <label
                  for="sector-input-presentation"
                  class="mb-2 block text-small font-semibold text-scheme-text"
                >
                  {{ currentSlide().promptTemplate!.label }}
                </label>
                <div class="flex gap-3">
                  <input
                    id="sector-input-presentation"
                    type="text"
                    [placeholder]="currentSlide().promptTemplate!.placeholder"
                    [value]="sectorInput()"
                    (input)="sectorInput.set($any($event.target).value)"
                    class="flex-1 rounded-form border border-scheme-border bg-scheme-background px-4 py-2 text-small text-scheme-text placeholder:text-scheme-text-muted focus:border-scheme-accent focus:outline-none focus:ring-2 focus:ring-scheme-accent-focus"
                  />
                  <button
                    type="button"
                    class="rounded-button bg-scheme-accent px-5 py-2 font-medium text-scheme-on-accent transition-colors hover:bg-scheme-accent-hover"
                    (click)="generatePrompt(currentSlide().promptTemplate!)"
                    i18n
                  >
                    Générer
                  </button>
                </div>
                @if (generatedPrompt()) {
                  <div class="mt-4">
                    <div
                      class="rounded-form border border-scheme-border bg-scheme-surface p-4 text-small text-scheme-text"
                    >
                      {{ generatedPrompt() }}
                    </div>
                    <button
                      type="button"
                      class="mt-2 text-xs text-scheme-accent hover:underline"
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
          </div>
        </div>

        <!-- Barre de navigation bas -->
        <div
          class="flex items-center justify-between border-t border-scheme-border px-6 py-3"
          (click)="$event.stopPropagation()"
          (keydown)="$event.stopPropagation()"
          tabindex="-1"
        >
          <button
            type="button"
            class="flex items-center gap-2 rounded-button border border-scheme-border px-4 py-2 text-small text-scheme-text-muted shadow-xs transition-colors hover:bg-scheme-surface-hover hover:text-scheme-text disabled:cursor-not-allowed disabled:opacity-40"
            [disabled]="currentSlideIndex() === 0"
            (click)="prevSlide()"
            aria-label="Slide précédent"
          >
            <app-svg-icon name="chevron-left" [size]="1" />
            <span i18n>Précédent</span>
          </button>

          <span
            aria-live="polite"
            aria-atomic="true"
            class="text-small text-scheme-text-muted"
          >
            {{ currentSlideIndex() + 1 }} / {{ slides().length }}
          </span>

          <button
            type="button"
            class="flex items-center gap-2 rounded-button border border-scheme-border px-4 py-2 text-small text-scheme-text-muted shadow-xs transition-colors hover:bg-scheme-surface-hover hover:text-scheme-text disabled:cursor-not-allowed disabled:opacity-40"
            [disabled]="currentSlideIndex() === slides().length - 1"
            (click)="nextSlide()"
            aria-label="Slide suivant"
          >
            <span i18n>Suivant</span>
            <app-svg-icon name="chevron-right" [size]="1" />
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
