import { isPlatformBrowser, SlicePipe } from "@angular/common";
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
import { SlideHeroComponent } from "./templates/slide-hero.component";
import { SlideSplitComponent } from "./templates/slide-split.component";
import { SlideStatsComponent } from "./templates/slide-stats.component";
import { SlideGridComponent } from "./templates/slide-grid.component";
import { SlideComparisonComponent } from "./templates/slide-comparison.component";
import { SlideQuoteComponent } from "./templates/slide-quote.component";
import { SlideDemoComponent } from "./templates/slide-demo.component";
import { SlideCtaComponent } from "./templates/slide-cta.component";

/**
 * Composant de visualisation de slides en dual-mode :
 * - Mode scroll : tous les slides affichés verticalement avec snap scroll (100vh par slide)
 * - Mode présentation : vue plein écran focalisée sur le slide courant
 *
 * Délègue le rendu à 8 sous-composants template selon le layout de chaque slide.
 */
@Component({
  selector: "app-slide-viewer",
  standalone: true,
  imports: [
    SvgIconComponent,
    RouterModule,
    SlicePipe,
    SlideHeroComponent,
    SlideSplitComponent,
    SlideStatsComponent,
    SlideGridComponent,
    SlideComparisonComponent,
    SlideQuoteComponent,
    SlideDemoComponent,
    SlideCtaComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: "./slide-viewer.component.scss",
  template: `
    @if (!isPresenting()) {
      <!-- ===== MODE SCROLL ===== -->
      <div class="bg-white">
        <!-- Barre de progression sticky -->
        <div
          class="sticky top-20 lg:top-24 z-10 border-b border-gray-100 bg-white shadow-sm"
        >
          <div class="mx-auto max-w-5xl px-4 sm:px-6 py-2.5">
            <div class="flex items-center gap-3">
              <!-- Progress bar desktop -->
              <div class="hidden md:flex flex-1 items-center gap-0.5">
                @for (slide of slides(); track slide.id; let i = $index) {
                  <button
                    type="button"
                    class="group relative flex-1 h-1 rounded-full transition-all duration-300"
                    [class]="
                      currentSlideIndex() >= i
                        ? 'bg-scheme-accent'
                        : 'bg-gray-200 hover:bg-gray-300'
                    "
                    [attr.aria-label]="'Slide ' + (i + 1) + ': ' + slide.title"
                    (click)="scrollToSlide(i)"
                  >
                    <span
                      class="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                    >
                      {{ i + 1 }}. {{ slide.title | slice: 0 : 35 }}
                    </span>
                  </button>
                }
              </div>
              <!-- Mobile counter -->
              <span
                class="md:hidden text-sm font-medium text-gray-500 tabular-nums"
              >
                {{ currentSlideIndex() + 1 }} / {{ slides().length }}
              </span>
              <div class="ml-auto flex items-center gap-2">
                @if (fullscreenSupported) {
                  <button
                    type="button"
                    class="flex items-center gap-1.5 rounded-full bg-scheme-accent px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-scheme-accent-hover hover:shadow-md"
                    (click)="enterPresentation()"
                    aria-label="Mode présentation"
                  >
                    <app-svg-icon name="chevron-right" [size]="0.8" />
                    <span class="hidden sm:inline" i18n>Présenter</span>
                  </button>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Slides — snap scroll container -->
        <div class="scroll-container">
          @for (slide of slides(); track slide.id; let i = $index) {
            <section
              [attr.data-slide-id]="slide.id"
              [attr.id]="'slide-anchor-' + i"
              [attr.aria-labelledby]="'slide-title-' + i"
              class="min-h-[calc(100vh-8rem)] lg:min-h-[calc(100vh-9rem)] snap-start flex flex-col scroll-mt-32 lg:scroll-mt-36"
            >
              @switch (slide.layout || "split") {
                @case ("hero") {
                  <app-slide-hero [slide]="slide" class="flex-1" />
                }
                @case ("split") {
                  <app-slide-split
                    [slide]="slide"
                    [index]="i"
                    [total]="slides().length"
                    [expandedNotes]="expandedNotes()"
                    [sectorInput]="sectorInput()"
                    [generatedPrompt]="generatedPrompt()"
                    [copied]="copied()"
                    (toggleNotes)="toggleNotes($event)"
                    (sectorChange)="sectorInput.set($event)"
                    (generate)="generatePrompt($event)"
                    (copyPrompt)="copyPrompt()"
                    class="flex-1 px-4 sm:px-6 py-4"
                  />
                }
                @case ("stats") {
                  <app-slide-stats
                    [slide]="slide"
                    [index]="i"
                    [total]="slides().length"
                    class="flex-1"
                  />
                }
                @case ("grid") {
                  <app-slide-grid
                    [slide]="slide"
                    [index]="i"
                    [total]="slides().length"
                    class="flex-1"
                  />
                }
                @case ("comparison") {
                  <app-slide-comparison
                    [slide]="slide"
                    [index]="i"
                    [total]="slides().length"
                    [expandedNotes]="expandedNotes()"
                    (toggleNotes)="toggleNotes($event)"
                    class="flex-1 px-4 sm:px-6 py-4"
                  />
                }
                @case ("quote") {
                  <app-slide-quote [slide]="slide" class="flex-1" />
                }
                @case ("demo") {
                  <app-slide-demo
                    [slide]="slide"
                    [index]="i"
                    [total]="slides().length"
                    [sectorInput]="sectorInput()"
                    [generatedPrompt]="generatedPrompt()"
                    [copied]="copied()"
                    (sectorChange)="sectorInput.set($event)"
                    (generate)="generatePrompt($event)"
                    (copyPrompt)="copyPrompt()"
                    class="flex-1"
                  />
                }
                @case ("cta") {
                  <app-slide-cta [slide]="slide" class="flex-1" />
                }
              }
            </section>
          }
        </div>
      </div>
    } @else {
      <!-- ===== MODE PRESENTATION ===== -->
      <div
        class="fixed inset-0 z-[100] flex flex-col bg-white"
        role="region"
        aria-label="Mode présentation"
        (click)="handlePresentationClick($event)"
        (keydown.arrowRight)="nextSlide()"
        (keydown.arrowLeft)="prevSlide()"
      >
        <button
          type="button"
          class="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
          (click)="exitPresentation(); $event.stopPropagation()"
          aria-label="Quitter"
        >
          <app-svg-icon name="close" [size]="1.1" />
        </button>

        <div class="flex flex-1 overflow-y-auto">
          @switch (currentSlide().layout || "split") {
            @case ("hero") {
              <app-slide-hero [slide]="currentSlide()" class="flex-1" />
            }
            @case ("split") {
              <app-slide-split
                [slide]="currentSlide()"
                [index]="currentSlideIndex()"
                [total]="slides().length"
                [expandedNotes]="expandedNotes()"
                [sectorInput]="sectorInput()"
                [generatedPrompt]="generatedPrompt()"
                [copied]="copied()"
                (toggleNotes)="toggleNotes($event)"
                (sectorChange)="sectorInput.set($event)"
                (generate)="generatePrompt($event)"
                (copyPrompt)="copyPrompt()"
                class="flex-1"
              />
            }
            @case ("stats") {
              <app-slide-stats
                [slide]="currentSlide()"
                [index]="currentSlideIndex()"
                [total]="slides().length"
                class="flex-1"
              />
            }
            @case ("grid") {
              <app-slide-grid
                [slide]="currentSlide()"
                [index]="currentSlideIndex()"
                [total]="slides().length"
                class="flex-1"
              />
            }
            @case ("comparison") {
              <app-slide-comparison
                [slide]="currentSlide()"
                [index]="currentSlideIndex()"
                [total]="slides().length"
                [expandedNotes]="expandedNotes()"
                (toggleNotes)="toggleNotes($event)"
                class="flex-1"
              />
            }
            @case ("quote") {
              <app-slide-quote [slide]="currentSlide()" class="flex-1" />
            }
            @case ("demo") {
              <app-slide-demo
                [slide]="currentSlide()"
                [index]="currentSlideIndex()"
                [total]="slides().length"
                [sectorInput]="sectorInput()"
                [generatedPrompt]="generatedPrompt()"
                [copied]="copied()"
                (sectorChange)="sectorInput.set($event)"
                (generate)="generatePrompt($event)"
                (copyPrompt)="copyPrompt()"
                class="flex-1"
              />
            }
            @case ("cta") {
              <app-slide-cta [slide]="currentSlide()" class="flex-1" />
            }
          }
        </div>

        <!-- Nav bas -->
        <div
          class="flex items-center justify-between border-t border-gray-100 bg-white px-6 py-4"
          (click)="$event.stopPropagation()"
          (keydown)="$event.stopPropagation()"
          tabindex="-1"
        >
          <button
            type="button"
            class="flex items-center gap-2 rounded-full border border-gray-200 px-5 py-2.5 text-sm text-gray-500 transition hover:bg-gray-50 hover:text-gray-700 disabled:opacity-30"
            [disabled]="currentSlideIndex() === 0"
            (click)="prevSlide()"
            aria-label="Slide précédent"
          >
            <app-svg-icon name="chevron-left" [size]="0.9" />
            <span class="hidden sm:inline" i18n>Précédent</span>
          </button>

          <div class="flex items-center gap-3">
            <div class="hidden sm:flex items-center gap-1">
              @for (slide of slides(); track slide.id; let i = $index) {
                <button
                  type="button"
                  class="h-1.5 rounded-full transition-all duration-300"
                  [class]="
                    currentSlideIndex() === i
                      ? 'w-6 bg-scheme-accent'
                      : 'w-1.5 bg-gray-200 hover:bg-gray-300'
                  "
                  (click)="goToSlide(i)"
                  [attr.aria-label]="'Slide ' + (i + 1)"
                ></button>
              }
            </div>
            <span
              aria-live="polite"
              aria-atomic="true"
              class="text-sm font-medium tabular-nums text-gray-400"
            >
              {{ currentSlideIndex() + 1
              }}<span class="mx-1 text-gray-200">/</span>{{ slides().length }}
            </span>
          </div>

          <button
            type="button"
            class="flex items-center gap-2 rounded-full bg-scheme-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-scheme-accent-hover disabled:opacity-30 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
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
  readonly slides = input.required<Slide[]>();
  readonly currentSlideIndex = signal(0);
  readonly isPresenting = signal(false);
  readonly expandedNotes = signal<Set<number>>(new Set());
  readonly sectorInput = signal("");
  readonly generatedPrompt = signal("");
  readonly copied = signal(false);
  fullscreenSupported = false;
  readonly currentSlide = computed(
    () => this.slides()[this.currentSlideIndex()],
  );

  private readonly platformId = inject(PLATFORM_ID);

  constructor() {
    afterNextRender(() => {
      this.fullscreenSupported =
        typeof document !== "undefined" &&
        !!document.documentElement.requestFullscreen;

      // Initialisation AOS pour les animations au scroll
      if (isPlatformBrowser(this.platformId)) {
        import("aos").then((AOS) => {
          AOS.default.init({
            duration: 800,
            easing: "ease-out-cubic",
            once: true,
            offset: 50,
          });
          // Refresh après le rendu initial des slides
          setTimeout(() => AOS.default.refresh(), 100);
        });
      }

      // IntersectionObserver pour synchroniser la progress bar avec le scroll
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const id = entry.target.getAttribute("id");
              if (id?.startsWith("slide-anchor-")) {
                const index = parseInt(id.replace("slide-anchor-", ""), 10);
                if (!isNaN(index)) {
                  this.currentSlideIndex.set(index);
                }
              }
            }
          }
        },
        { threshold: 0.3, rootMargin: "-128px 0px 0px 0px" },
      );

      setTimeout(() => {
        const sections = document.querySelectorAll("[id^='slide-anchor-']");
        sections.forEach((el) => observer.observe(el));
      });
    });
  }

  nextSlide(): void {
    const max = this.slides().length - 1;
    this.currentSlideIndex.update((i) => Math.min(i + 1, max));
  }

  prevSlide(): void {
    this.currentSlideIndex.update((i) => Math.max(i - 1, 0));
  }

  goToSlide(index: number): void {
    const max = this.slides().length - 1;
    this.currentSlideIndex.set(Math.max(0, Math.min(index, max)));
  }

  scrollToSlide(index: number): void {
    this.goToSlide(index);
    if (isPlatformBrowser(this.platformId)) {
      const el = document.getElementById(`slide-anchor-${index}`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

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

  enterPresentation(): void {
    this.isPresenting.set(true);
    if (isPlatformBrowser(this.platformId)) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
  }

  exitPresentation(): void {
    this.isPresenting.set(false);
    if (isPlatformBrowser(this.platformId) && document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  }

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
    const half = window.innerWidth / 2;
    if (event.clientX < half) {
      this.prevSlide();
    } else {
      this.nextSlide();
    }
  }

  generatePrompt(template: PromptTemplate): void {
    const sector = this.sectorInput().trim();
    if (!sector) {
      this.generatedPrompt.set("");
      return;
    }
    this.generatedPrompt.set(template.template.replace("{{sector}}", sector));
  }

  copyPrompt(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const text = this.generatedPrompt();
    if (!text) return;
    navigator.clipboard?.writeText(text).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

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
