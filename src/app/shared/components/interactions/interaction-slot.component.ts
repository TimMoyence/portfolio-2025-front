import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import type {
  PresentationMode,
  SlideInteractions,
} from "../../models/slide.model";
import { ChecklistInteractionComponent } from "./checklist-interaction.component";
import { CountdownInteractionComponent } from "./countdown-interaction.component";
import { PollInteractionComponent } from "./poll-interaction.component";
import { ReflectionInteractionComponent } from "./reflection-interaction.component";
import { SelfRatingInteractionComponent } from "./self-rating-interaction.component";

/**
 * Slot d'interactions contextuel pour une slide de présentation.
 *
 * Orchestre le rendu des interactions en fonction du mode courant :
 * - mode `present` / `overview` : affiche les PresentInteraction (poll, countdown)
 * - mode `scroll` : affiche les ScrollInteraction (reflection, checklist, self-rating)
 *
 * Ne rend rien si la slide n'a pas d'interactions pour le mode courant.
 */
@Component({
  selector: "app-interaction-slot",
  standalone: true,
  imports: [
    PollInteractionComponent,
    ReflectionInteractionComponent,
    ChecklistInteractionComponent,
    SelfRatingInteractionComponent,
    CountdownInteractionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (interactions(); as interactions) {
      @if (mode() === "scroll") {
        <!-- Mode Scroll : interactions lecteur -->
        @if (interactions.scroll && interactions.scroll.length > 0) {
          <div class="mt-6 space-y-4" data-aos="fade-up" data-aos-delay="200">
            @for (interaction of interactions.scroll; track $index) {
              @switch (interaction.type) {
                @case ("reflection") {
                  <app-reflection-interaction [config]="interaction" />
                }
                @case ("checklist") {
                  <app-checklist-interaction [config]="interaction" />
                }
                @case ("self-rating") {
                  <app-self-rating-interaction [config]="interaction" />
                }
              }
            }
          </div>
        }
      } @else if (mode() === "present") {
        <!-- Mode Present : interactions présentateur -->
        @if (interactions.present && interactions.present.length > 0) {
          <div class="mt-6 space-y-4">
            @for (interaction of interactions.present; track $index) {
              @switch (interaction.type) {
                @case ("poll") {
                  <app-poll-interaction [poll]="interaction" />
                }
                @case ("countdown") {
                  <app-countdown-interaction [config]="interaction" />
                }
              }
            }
          </div>
        }
      }
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class InteractionSlotComponent {
  /** Interactions de la slide courante */
  readonly interactions = input<SlideInteractions>();
  /** Mode d'affichage courant de la présentation */
  readonly mode = input.required<PresentationMode>();
}
