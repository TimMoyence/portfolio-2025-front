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

/**
 * Composant de visualisation de slides en dual-mode :
 * - Mode scroll : tous les slides affichés verticalement avec snap scroll (100vh par slide)
 * - Mode présentation : vue plein écran focalisée sur le slide courant
 */
@Component({
  selector: "app-slide-viewer",
  standalone: true,
  imports: [SvgIconComponent, RouterModule, SlicePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(24px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .slide-card {
        animation: fadeInUp 0.5s ease-out both;
      }
    `,
  ],
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
        <div class="snap-y snap-mandatory overflow-y-auto h-screen">
          @for (slide of slides(); track slide.id; let i = $index) {
            <section
              [attr.data-slide-id]="slide.id"
              [attr.id]="'slide-anchor-' + i"
              [attr.aria-labelledby]="'slide-title-' + i"
              class="h-screen snap-start flex items-center justify-center px-4 sm:px-6 lg:px-8 scroll-mt-32 lg:scroll-mt-36 slide-card bg-white"
              [style.animation-delay]="i * 0.06 + 's'"
            >
              <div class="w-full max-w-6xl">
                @if (slide.table || slide.promptTemplate) {
                  <!-- Full-width layout for table/prompt slides -->
                  <div
                    class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md"
                  >
                    <div class="px-6 pt-6 pb-4 sm:px-8 sm:pt-8">
                      <div class="mb-1">
                        <span
                          class="text-[11px] font-bold uppercase tracking-widest text-scheme-accent"
                        >
                          {{ i + 1 }}/{{ slides().length }}
                        </span>
                      </div>
                      <h2
                        [attr.id]="'slide-title-' + i"
                        data-slide-title
                        class="font-heading text-h3 text-gray-900 leading-tight"
                      >
                        {{ slide.title }}
                      </h2>
                      @if (slide.subtitle) {
                        <p class="mt-2 text-base text-gray-500 leading-relaxed">
                          {{ slide.subtitle }}
                        </p>
                      }
                    </div>

                    <div class="px-6 pb-6 sm:px-8 sm:pb-8 space-y-5">
                      @if (slide.bullets && slide.bullets.length > 0) {
                        <ul class="space-y-3">
                          @for (bullet of slide.bullets; track $index) {
                            <li
                              class="flex items-start gap-3 text-[15px] text-gray-700 leading-relaxed"
                            >
                              <span
                                class="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-scheme-accent"
                                aria-hidden="true"
                              ></span>
                              <span>{{ bullet }}</span>
                            </li>
                          }
                        </ul>
                      }

                      @if (slide.table) {
                        <div
                          class="overflow-x-auto rounded-xl border border-gray-100"
                        >
                          <table class="w-full text-sm">
                            <thead>
                              <tr class="bg-gray-50">
                                @for (
                                  header of slide.table.headers;
                                  track $index
                                ) {
                                  <th
                                    class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                                  >
                                    {{ header }}
                                  </th>
                                }
                              </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-50">
                              @for (row of slide.table.rows; track $index) {
                                <tr
                                  class="transition-colors hover:bg-gray-50/50"
                                >
                                  @for (
                                    cell of row;
                                    track $index;
                                    let first = $first
                                  ) {
                                    <td
                                      class="px-4 py-3 text-gray-700"
                                      [class.font-medium]="first"
                                      [class.text-gray-900]="first"
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

                      @if (slide.promptTemplate) {
                        <div
                          data-prompt-form
                          class="rounded-xl border-2 border-scheme-accent/20 bg-scheme-accent/[0.03] p-5 sm:p-6"
                        >
                          <label
                            [attr.for]="'sector-input-' + i"
                            class="mb-3 block text-sm font-semibold text-gray-900"
                          >
                            {{ slide.promptTemplate.label }}
                          </label>
                          <div class="flex flex-col sm:flex-row gap-3">
                            <input
                              [attr.id]="'sector-input-' + i"
                              type="text"
                              [placeholder]="slide.promptTemplate.placeholder"
                              [value]="sectorInput()"
                              (input)="
                                sectorInput.set($any($event.target).value)
                              "
                              class="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-scheme-accent focus:outline-none focus:ring-2 focus:ring-scheme-accent/20"
                            />
                            <button
                              type="button"
                              class="rounded-xl bg-scheme-accent px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-scheme-accent-hover hover:shadow active:scale-[0.98]"
                              (click)="generatePrompt(slide.promptTemplate)"
                              i18n
                            >
                              Générer le prompt
                            </button>
                          </div>
                          @if (generatedPrompt()) {
                            <div class="mt-4 space-y-3">
                              <div
                                class="max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white p-4 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap"
                              >
                                {{ generatedPrompt() }}
                              </div>
                              <button
                                type="button"
                                class="inline-flex items-center gap-1.5 rounded-full border border-scheme-accent/30 bg-scheme-accent/10 px-4 py-2 text-xs font-semibold text-scheme-accent transition hover:bg-scheme-accent/20"
                                (click)="copyPrompt()"
                              >
                                {{ copied() ? "Copié !" : "Copier le prompt" }}
                              </button>
                            </div>
                          }
                        </div>
                      }

                      @if (slide.notes) {
                        <div class="border-t border-gray-100 pt-4">
                          <button
                            type="button"
                            class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
                            [attr.aria-expanded]="expandedNotes().has(i)"
                            [attr.aria-controls]="'notes-' + i"
                            (click)="toggleNotes(i)"
                          >
                            <app-svg-icon
                              name="chevron-down"
                              [size]="0.65"
                              class="transition-transform duration-200"
                              [class.rotate-180]="expandedNotes().has(i)"
                            />
                            <span i18n>Notes</span>
                          </button>
                          @if (expandedNotes().has(i)) {
                            <div
                              [attr.id]="'notes-' + i"
                              class="mt-2 rounded-xl bg-gray-50 p-4 text-xs leading-relaxed text-gray-500"
                            >
                              {{ slide.notes }}
                            </div>
                          }
                        </div>
                      }
                    </div>
                  </div>
                } @else {
                  <!-- Split layout: content LEFT, image RIGHT -->
                  <div
                    class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md"
                  >
                    <div class="flex flex-col md:flex-row md:min-h-[28rem]">
                      <!-- Image area — mobile: top -->
                      <div class="md:hidden h-48 sm:h-56 shrink-0">
                        @if (slide.imageUrl) {
                          <img
                            [src]="slide.imageUrl"
                            [alt]="slide.imageAlt || slide.title"
                            class="w-full h-full object-cover rounded-t-2xl"
                            loading="lazy"
                          />
                        } @else if (slide.image) {
                          <div
                            class="w-full h-full rounded-t-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center"
                          >
                            <img
                              [src]="'/' + slide.image"
                              alt=""
                              class="w-20 h-20 object-contain opacity-30"
                              loading="lazy"
                            />
                          </div>
                        } @else {
                          <div
                            class="w-full h-full rounded-t-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center"
                          >
                            <span class="text-sm text-gray-300 font-medium">
                              Image
                            </span>
                          </div>
                        }
                      </div>

                      <!-- Content area — LEFT on desktop -->
                      <div
                        class="flex flex-col justify-center w-full md:w-[55%] px-6 py-6 sm:px-8 sm:py-8"
                      >
                        <div class="mb-1">
                          <span
                            class="text-[11px] font-bold uppercase tracking-widest text-scheme-accent"
                          >
                            {{ i + 1 }}/{{ slides().length }}
                          </span>
                        </div>
                        <h2
                          [attr.id]="'slide-title-' + i"
                          data-slide-title
                          class="font-heading text-h3 text-gray-900 leading-tight"
                        >
                          {{ slide.title }}
                        </h2>
                        @if (slide.subtitle) {
                          <p
                            class="mt-2 text-base text-gray-500 leading-relaxed"
                          >
                            {{ slide.subtitle }}
                          </p>
                        }

                        @if (slide.bullets && slide.bullets.length > 0) {
                          <ul class="mt-5 space-y-3">
                            @for (bullet of slide.bullets; track $index) {
                              <li
                                class="flex items-start gap-3 text-[15px] text-gray-700 leading-relaxed"
                              >
                                <span
                                  class="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-scheme-accent"
                                  aria-hidden="true"
                                ></span>
                                <span>{{ bullet }}</span>
                              </li>
                            }
                          </ul>
                        }

                        @if (slide.notes) {
                          <div class="mt-5 border-t border-gray-100 pt-4">
                            <button
                              type="button"
                              class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
                              [attr.aria-expanded]="expandedNotes().has(i)"
                              [attr.aria-controls]="'notes-' + i"
                              (click)="toggleNotes(i)"
                            >
                              <app-svg-icon
                                name="chevron-down"
                                [size]="0.65"
                                class="transition-transform duration-200"
                                [class.rotate-180]="expandedNotes().has(i)"
                              />
                              <span i18n>Notes</span>
                            </button>
                            @if (expandedNotes().has(i)) {
                              <div
                                [attr.id]="'notes-' + i"
                                class="mt-2 rounded-xl bg-gray-50 p-4 text-xs leading-relaxed text-gray-500"
                              >
                                {{ slide.notes }}
                              </div>
                            }
                          </div>
                        }
                      </div>

                      <!-- Image area — RIGHT on desktop -->
                      <div class="hidden md:block md:w-[45%] p-4">
                        @if (slide.imageUrl) {
                          <img
                            [src]="slide.imageUrl"
                            [alt]="slide.imageAlt || slide.title"
                            class="w-full h-full object-cover rounded-2xl"
                            loading="lazy"
                          />
                        } @else if (slide.image) {
                          <div
                            class="w-full h-full rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center"
                          >
                            <img
                              [src]="'/' + slide.image"
                              alt=""
                              class="w-20 h-20 object-contain opacity-30"
                              loading="lazy"
                            />
                          </div>
                        } @else {
                          <div
                            class="w-full h-full rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center"
                          >
                            <span class="text-sm text-gray-300 font-medium">
                              Image
                            </span>
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>
            </section>
          }

          <!-- CTA — dernière section snap -->
          <section
            class="h-screen snap-start flex items-center justify-center bg-white"
          >
            <div class="px-6 py-16 text-center">
              <p
                class="mb-2 text-xs font-bold uppercase tracking-widest text-scheme-accent"
                i18n
              >
                Prochaine étape
              </p>
              <h3 class="mb-4 font-heading text-h3 text-gray-900" i18n>
                Envie d'aller plus loin ?
              </h3>
              <p class="mx-auto mb-8 max-w-lg text-base text-gray-500" i18n>
                Audit gratuit, conseil personnalisé ou développement sur mesure
                — discutons de votre projet.
              </p>
              <a
                routerLink="/contact"
                class="inline-flex items-center gap-2 rounded-full bg-scheme-accent px-8 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-scheme-accent-hover hover:shadow-lg active:scale-[0.98]"
                i18n
              >
                Contactez-moi
              </a>
            </div>
          </section>
        </div>
      </div>
    } @else {
      <!-- ===== MODE PRÉSENTATION ===== -->
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
          @if (currentSlide().table || currentSlide().promptTemplate) {
            <!-- Full-width layout for table/prompt in presentation mode -->
            <div
              class="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-16 md:px-24"
            >
              <div class="w-full max-w-4xl">
                <h2
                  class="font-heading text-h2 sm:text-h1 text-gray-900 leading-tight"
                  [attr.data-slide-title]="currentSlide().title"
                >
                  {{ currentSlide().title }}
                </h2>

                @if (currentSlide().subtitle) {
                  <p
                    class="mt-4 text-lg sm:text-xl text-gray-500 leading-relaxed"
                  >
                    {{ currentSlide().subtitle }}
                  </p>
                }

                @if (
                  currentSlide().bullets && currentSlide().bullets!.length > 0
                ) {
                  <ul class="mt-8 space-y-5">
                    @for (bullet of currentSlide().bullets; track $index) {
                      <li class="flex items-start gap-4 text-xl text-gray-700">
                        <span
                          class="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-scheme-accent"
                          aria-hidden="true"
                        ></span>
                        <span class="leading-relaxed">{{ bullet }}</span>
                      </li>
                    }
                  </ul>
                }

                @if (currentSlide().table) {
                  <div
                    class="mt-8 overflow-x-auto rounded-xl border border-gray-100"
                  >
                    <table class="w-full text-base">
                      <thead>
                        <tr class="bg-gray-50">
                          @for (
                            header of currentSlide().table!.headers;
                            track $index
                          ) {
                            <th
                              class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                            >
                              {{ header }}
                            </th>
                          }
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-50">
                        @for (row of currentSlide().table!.rows; track $index) {
                          <tr>
                            @for (
                              cell of row;
                              track $index;
                              let first = $first
                            ) {
                              <td
                                class="px-5 py-4 text-gray-700"
                                [class.font-medium]="first"
                                [class.text-gray-900]="first"
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

                @if (currentSlide().promptTemplate) {
                  <div
                    data-prompt-form
                    class="mt-8 rounded-2xl border-2 border-scheme-accent/20 bg-scheme-accent/[0.03] p-6 sm:p-8"
                    (click)="$event.stopPropagation()"
                    (keydown)="$event.stopPropagation()"
                    tabindex="-1"
                  >
                    <label
                      for="sector-input-presentation"
                      class="mb-3 block text-base font-semibold text-gray-900"
                    >
                      {{ currentSlide().promptTemplate!.label }}
                    </label>
                    <div class="flex flex-col sm:flex-row gap-3">
                      <input
                        id="sector-input-presentation"
                        type="text"
                        [placeholder]="
                          currentSlide().promptTemplate!.placeholder
                        "
                        [value]="sectorInput()"
                        (input)="sectorInput.set($any($event.target).value)"
                        class="flex-1 rounded-xl border border-gray-200 bg-white px-5 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-scheme-accent focus:outline-none focus:ring-2 focus:ring-scheme-accent/20"
                      />
                      <button
                        type="button"
                        class="rounded-xl bg-scheme-accent px-8 py-3 font-semibold text-white transition-all hover:bg-scheme-accent-hover"
                        (click)="generatePrompt(currentSlide().promptTemplate!)"
                        i18n
                      >
                        Générer
                      </button>
                    </div>
                    @if (generatedPrompt()) {
                      <div class="mt-4">
                        <div
                          class="max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white p-5 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap"
                        >
                          {{ generatedPrompt() }}
                        </div>
                        <button
                          type="button"
                          class="mt-3 inline-flex items-center gap-1.5 rounded-full border border-scheme-accent/30 bg-scheme-accent/10 px-4 py-2 text-xs font-semibold text-scheme-accent transition hover:bg-scheme-accent/20"
                          (click)="copyPrompt()"
                        >
                          {{ copied() ? "Copié !" : "Copier" }}
                        </button>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          } @else {
            <!-- Split layout in presentation mode -->
            <div class="flex flex-1 flex-col md:flex-row items-center">
              <!-- Image area — mobile: top -->
              <div class="md:hidden w-full h-48 sm:h-56 shrink-0">
                @if (currentSlide().imageUrl) {
                  <img
                    [src]="currentSlide().imageUrl"
                    [alt]="currentSlide().imageAlt || currentSlide().title"
                    class="w-full h-full object-cover"
                    loading="lazy"
                  />
                } @else if (currentSlide().image) {
                  <div
                    class="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center"
                  >
                    <img
                      [src]="'/' + currentSlide().image"
                      alt=""
                      class="w-24 h-24 object-contain opacity-30"
                    />
                  </div>
                } @else {
                  <div
                    class="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center"
                  >
                    <span class="text-sm text-gray-300 font-medium">
                      Image
                    </span>
                  </div>
                }
              </div>

              <!-- Content — LEFT 50% on desktop -->
              <div
                class="flex flex-col justify-center w-full md:w-1/2 px-8 py-10 sm:px-16 md:px-20"
              >
                <h2
                  class="font-heading text-h2 sm:text-h1 text-gray-900 leading-tight"
                  [attr.data-slide-title]="currentSlide().title"
                >
                  {{ currentSlide().title }}
                </h2>

                @if (currentSlide().subtitle) {
                  <p
                    class="mt-4 text-lg sm:text-xl text-gray-500 leading-relaxed"
                  >
                    {{ currentSlide().subtitle }}
                  </p>
                }

                @if (
                  currentSlide().bullets && currentSlide().bullets!.length > 0
                ) {
                  <ul class="mt-8 space-y-5">
                    @for (bullet of currentSlide().bullets; track $index) {
                      <li class="flex items-start gap-4 text-xl text-gray-700">
                        <span
                          class="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-scheme-accent"
                          aria-hidden="true"
                        ></span>
                        <span class="leading-relaxed">{{ bullet }}</span>
                      </li>
                    }
                  </ul>
                }
              </div>

              <!-- Image — RIGHT 50% on desktop -->
              <div
                class="hidden md:flex md:w-1/2 h-full items-center justify-center p-8"
              >
                @if (currentSlide().imageUrl) {
                  <img
                    [src]="currentSlide().imageUrl"
                    [alt]="currentSlide().imageAlt || currentSlide().title"
                    class="w-full h-full object-cover rounded-2xl"
                    loading="lazy"
                  />
                } @else if (currentSlide().image) {
                  <div
                    class="w-full h-full rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center"
                  >
                    <img
                      [src]="'/' + currentSlide().image"
                      alt=""
                      class="w-28 h-28 object-contain opacity-30"
                    />
                  </div>
                } @else {
                  <div
                    class="w-full h-full rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center"
                  >
                    <span class="text-sm text-gray-300 font-medium">
                      Image
                    </span>
                  </div>
                }
              </div>
            </div>
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
        { threshold: 0.5 },
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
