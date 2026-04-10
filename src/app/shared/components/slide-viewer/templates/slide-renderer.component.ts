import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";
import type { PromptTemplate, Slide } from "../../../models/slide.model";
import { SlideComparisonComponent } from "./slide-comparison.component";
import { SlideCtaComponent } from "./slide-cta.component";
import { SlideDemoComponent } from "./slide-demo.component";
import { SlideGridComponent } from "./slide-grid.component";
import { SlideHeroComponent } from "./slide-hero.component";
import { SlideQuoteComponent } from "./slide-quote.component";
import { SlideSplitComponent } from "./slide-split.component";
import { SlideStatsComponent } from "./slide-stats.component";

/**
 * Composant de rendu DRY d'une slide selon son layout.
 * Encapsule le `@switch (slide.layout || "split")` qui delegue aux 8 sous-composants
 * de template (hero, split, stats, grid, comparison, quote, demo, cta).
 *
 * Utilise a la fois par le `SlideViewerComponent` (mode scroll et presentation)
 * et par le `PresentationEngineComponent`, afin d'eviter la duplication du switch.
 *
 * Note i18n : tous les libelles localisables sont portes par les sous-composants
 * de template. Ce composant ne contient que le switch de routage.
 */
@Component({
  selector: "app-slide-renderer",
  standalone: true,
  imports: [
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
  template: `
    @switch (slide().layout || "split") {
      @case ("hero") {
        <app-slide-hero
          [slide]="slide()"
          [headingLevel]="index() === 0 ? 'h1' : 'h2'"
          class="flex-1"
        />
      }
      @case ("split") {
        <app-slide-split
          [slide]="slide()"
          [index]="index()"
          [total]="total()"
          [expandedNotes]="expandedNotes()"
          [sectorInput]="sectorInput()"
          [generatedPrompt]="generatedPrompt()"
          [copied]="copied()"
          (toggleNotes)="toggleNotes.emit($event)"
          (sectorChange)="sectorChange.emit($event)"
          (generate)="generate.emit($event)"
          (copyPrompt)="copyPrompt.emit()"
          class="flex-1"
        />
      }
      @case ("stats") {
        <app-slide-stats
          [slide]="slide()"
          [index]="index()"
          [total]="total()"
          class="flex-1"
        />
      }
      @case ("grid") {
        <app-slide-grid
          [slide]="slide()"
          [index]="index()"
          [total]="total()"
          class="flex-1"
        />
      }
      @case ("comparison") {
        <app-slide-comparison
          [slide]="slide()"
          [index]="index()"
          [total]="total()"
          [expandedNotes]="expandedNotes()"
          (toggleNotes)="toggleNotes.emit($event)"
          class="flex-1"
        />
      }
      @case ("quote") {
        <app-slide-quote [slide]="slide()" class="flex-1" />
      }
      @case ("demo") {
        <app-slide-demo
          [slide]="slide()"
          [index]="index()"
          [total]="total()"
          [sectorInput]="sectorInput()"
          [generatedPrompt]="generatedPrompt()"
          [copied]="copied()"
          (sectorChange)="sectorChange.emit($event)"
          (generate)="generate.emit($event)"
          (copyPrompt)="copyPrompt.emit()"
          class="flex-1"
        />
      }
      @case ("cta") {
        <app-slide-cta [slide]="slide()" class="flex-1" />
      }
    }

    @if (slide().sources?.length) {
      <div class="mt-4 border-t border-gray-100 pt-3">
        <p
          class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2"
        >
          Sources
        </p>
        <ul class="space-y-1">
          @for (source of slide().sources; track source.url) {
            <li class="text-xs text-gray-500">
              @if (source.url) {
                <a
                  [href]="source.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-scheme-accent hover:underline"
                >
                  {{ source.label }}
                </a>
              } @else {
                {{ source.label }}
              }
            </li>
          }
        </ul>
      </div>
    }

    @if (slide().authorNote) {
      <div
        class="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3"
      >
        <p
          class="text-xs font-semibold uppercase tracking-wide text-amber-600 mb-1"
        >
          Note de l'auteur
        </p>
        <p class="text-sm text-amber-800 leading-relaxed">
          {{ slide().authorNote }}
        </p>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: contents;
      }
    `,
  ],
})
export class SlideRendererComponent {
  /** Slide a rendre. */
  readonly slide = input.required<Slide>();
  /** Index 0-based de la slide dans le deck. */
  readonly index = input.required<number>();
  /** Nombre total de slides dans le deck. */
  readonly total = input.required<number>();
  /** Ensemble des index de slides dont les notes sont deployees. */
  readonly expandedNotes = input<Set<number>>(new Set());
  /** Valeur saisie par l'utilisateur dans le champ secteur. */
  readonly sectorInput = input<string>("");
  /** Prompt genere a partir du template de la slide. */
  readonly generatedPrompt = input<string>("");
  /** True si le prompt vient d'etre copie dans le presse-papier. */
  readonly copied = input<boolean>(false);

  /** Emis lorsque l'utilisateur ouvre ou ferme les notes d'une slide. */
  readonly toggleNotes = output<number>();
  /** Emis lorsque l'utilisateur modifie la valeur du champ secteur. */
  readonly sectorChange = output<string>();
  /** Emis lorsque l'utilisateur demande la generation d'un prompt. */
  readonly generate = output<PromptTemplate>();
  /** Emis lorsque l'utilisateur demande la copie du prompt genere. */
  readonly copyPrompt = output<void>();
}
