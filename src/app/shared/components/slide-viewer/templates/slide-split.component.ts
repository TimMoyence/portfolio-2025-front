import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";
import { SvgIconComponent } from "../../svg-icon.component";
import type { PromptTemplate, Slide } from "../../../models/slide.model";

/**
 * Template split : contenu à gauche (55%), image à droite (45%).
 * Disposition inversée sur mobile (image en haut, contenu en bas).
 */
@Component({
  selector: "app-slide-split",
  standalone: true,
  imports: [SvgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex-1 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden flex flex-col md:flex-row"
    >
      <!-- Left: content 55% -->
      <div
        class="flex-1 md:w-[55%] md:flex-none flex flex-col justify-center p-6 sm:p-8 lg:p-10"
        data-aos="fade-right"
      >
        <span
          class="text-[11px] font-bold uppercase tracking-widest text-scheme-accent mb-2"
        >
          {{ index() + 1 }}/{{ total() }}
        </span>
        <h2
          data-slide-title
          class="font-heading text-h4 sm:text-h3 text-gray-900 leading-tight"
        >
          {{ slide().title }}
        </h2>
        @if (slide().subtitle) {
          <p class="mt-2 text-base text-gray-500 leading-relaxed">
            {{ slide().subtitle }}
          </p>
        }

        @if (slide().bullets && slide().bullets!.length > 0) {
          <ul class="mt-5 space-y-3">
            @for (bullet of slide().bullets; track $index) {
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

        @if (slide().table) {
          <div class="mt-5 overflow-x-auto rounded-xl border border-gray-100">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-gray-50">
                  @for (header of slide().table!.headers; track $index) {
                    <th
                      class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                    >
                      {{ header }}
                    </th>
                  }
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                @for (row of slide().table!.rows; track $index) {
                  <tr class="transition-colors hover:bg-gray-50/50">
                    @for (cell of row; track $index; let first = $first) {
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

        @if (slide().promptTemplate) {
          <div
            data-prompt-form
            class="mt-5 rounded-xl border-2 border-scheme-accent/20 bg-scheme-accent/[0.03] p-5 sm:p-6"
          >
            <label
              [attr.for]="'sector-input-' + index()"
              class="mb-3 block text-sm font-semibold text-gray-900"
            >
              {{ slide().promptTemplate!.label }}
            </label>
            <div class="flex flex-col sm:flex-row gap-3">
              <input
                [attr.id]="'sector-input-' + index()"
                type="text"
                [placeholder]="slide().promptTemplate!.placeholder"
                [value]="sectorInput()"
                (input)="sectorChange.emit($any($event.target).value)"
                class="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-scheme-accent focus:outline-none focus:ring-2 focus:ring-scheme-accent/20"
              />
              <button
                type="button"
                class="rounded-xl bg-scheme-accent px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-scheme-accent-hover hover:shadow active:scale-[0.98]"
                (click)="generate.emit(slide().promptTemplate!)"
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
                  (click)="copyPrompt.emit()"
                >
                  {{ copied() ? "Copié !" : "Copier le prompt" }}
                </button>
              </div>
            }
          </div>
        }

        @if (slide().notes) {
          <div class="mt-5 border-t border-gray-100 pt-4">
            <button
              type="button"
              class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
              [attr.aria-expanded]="expandedNotes().has(index())"
              [attr.aria-controls]="'notes-' + index()"
              (click)="toggleNotes.emit(index())"
            >
              <app-svg-icon
                name="chevron-down"
                [size]="0.65"
                class="transition-transform duration-200"
                [class.rotate-180]="expandedNotes().has(index())"
              />
              <span i18n>Notes</span>
            </button>
            @if (expandedNotes().has(index())) {
              <div
                [attr.id]="'notes-' + index()"
                class="mt-2 rounded-xl bg-gray-50 p-4 text-xs leading-relaxed text-gray-500"
              >
                {{ slide().notes }}
              </div>
            }
          </div>
        }
      </div>

      <!-- Right: image area 45% -->
      <div
        class="md:w-[45%] md:flex-none order-first md:order-last"
        data-aos="fade-left"
      >
        <!-- Mobile: horizontal strip -->
        <div
          class="md:hidden h-56 bg-gray-900 flex items-center justify-center"
        >
          @if (slide().imageUrl) {
            <img
              [src]="slide().imageUrl"
              [alt]="slide().imageAlt || slide().title"
              class="w-full h-full object-cover"
              loading="lazy"
            />
          } @else if (slide().image) {
            <img
              [src]="'/' + slide().image"
              alt=""
              class="w-24 h-24 sm:w-32 sm:h-32 object-contain drop-shadow-lg"
              loading="lazy"
            />
          } @else {
            <span class="text-sm text-gray-600 font-medium">Image</span>
          }
        </div>
        <!-- Desktop: full height -->
        <div
          class="hidden md:flex h-full bg-gray-900 items-center justify-center p-8"
        >
          @if (slide().imageUrl) {
            <img
              [src]="slide().imageUrl"
              [alt]="slide().imageAlt || slide().title"
              class="w-full h-full object-cover rounded-xl"
              loading="lazy"
            />
          } @else if (slide().image) {
            <img
              [src]="'/' + slide().image"
              alt=""
              class="w-24 h-24 sm:w-32 sm:h-32 object-contain drop-shadow-lg"
              loading="lazy"
            />
          } @else {
            <span class="text-sm text-gray-600 font-medium">Image</span>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex: 1;
        flex-direction: column;
      }
    `,
  ],
})
export class SlideSplitComponent {
  readonly slide = input.required<Slide>();
  readonly index = input.required<number>();
  readonly total = input.required<number>();
  readonly expandedNotes = input.required<Set<number>>();
  readonly sectorInput = input<string>("");
  readonly generatedPrompt = input<string>("");
  readonly copied = input<boolean>(false);
  readonly toggleNotes = output<number>();
  readonly sectorChange = output<string>();
  readonly generate = output<PromptTemplate>();
  readonly copyPrompt = output<void>();
}
