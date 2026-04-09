import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";
import { SvgIconComponent } from "../../svg-icon.component";
import type { Slide } from "../../../models/slide.model";

/**
 * Template comparison : tableau comparatif stylisé avec header sombre,
 * alternance de couleurs de lignes, et notes optionnelles dépliables.
 */
@Component({
  selector: "app-slide-comparison",
  standalone: true,
  imports: [SvgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex-1 flex flex-col justify-center p-6 sm:p-8 lg:p-10">
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

      @if (slide().imageUrl) {
        <div class="mt-4 flex justify-end">
          <img
            [src]="slide().imageUrl"
            [alt]="slide().imageAlt || slide().title"
            class="w-16 h-16 rounded-xl object-cover shadow-sm"
            loading="lazy"
          />
        </div>
      }

      @if (slide().table) {
        <div
          class="mt-5 overflow-x-auto rounded-2xl overflow-hidden border border-gray-100"
          data-aos="fade-up"
        >
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-900 text-white">
                @for (header of slide().table!.headers; track $index) {
                  <th
                    class="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider"
                  >
                    {{ header }}
                  </th>
                }
              </tr>
            </thead>
            <tbody>
              @for (
                row of slide().table!.rows;
                track $index;
                let even = $even
              ) {
                <tr [class]="even ? 'bg-white' : 'bg-gray-50'">
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
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class SlideComparisonComponent {
  readonly slide = input.required<Slide>();
  readonly index = input.required<number>();
  readonly total = input.required<number>();
  readonly expandedNotes = input.required<Set<number>>();
  readonly toggleNotes = output<number>();
}
