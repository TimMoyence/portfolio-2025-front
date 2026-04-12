import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";
import type { Slide, PromptTemplate } from "../../../models/slide.model";

/**
 * Template demo : formulaire interactif de prompt avec input,
 * bouton de generation et zone de resultat copiable.
 */
@Component({
  selector: "app-slide-demo",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex-1 flex flex-col justify-center p-6 sm:p-8 lg:p-10">
      <span
        class="text-[11px] font-bold uppercase tracking-widest text-scheme-accent mb-2 text-center"
      >
        {{ index() + 1 }}/{{ total() }}
      </span>
      <h2
        data-slide-title
        class="font-heading text-h4 sm:text-h3 text-gray-900 leading-tight text-center"
      >
        {{ slide().title }}
      </h2>
      @if (slide().subtitle) {
        <p class="mt-2 text-base text-gray-500 leading-relaxed text-center">
          {{ slide().subtitle }}
        </p>
      }

      @if (slide().promptTemplate) {
        <div
          data-prompt-form
          class="mt-6 max-w-2xl mx-auto w-full rounded-xl border-2 border-scheme-accent/20 bg-scheme-accent/[0.03] p-5 sm:p-6"
          data-aos="fade-up"
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
export class SlideDemoComponent {
  readonly slide = input.required<Slide>();
  readonly index = input.required<number>();
  readonly total = input.required<number>();
  readonly sectorInput = input.required<string>();
  readonly generatedPrompt = input.required<string>();
  readonly copied = input.required<boolean>();
  readonly sectorChange = output<string>();
  readonly generate = output<PromptTemplate>();
  readonly copyPrompt = output<void>();
}
