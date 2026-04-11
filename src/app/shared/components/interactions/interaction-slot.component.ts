import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from "@angular/core";
import type {
  ChecklistInteraction,
  PresentationMode,
  SelfRatingInteraction,
  SlideInteractions,
} from "../../models/slide.model";
import { InteractionCollectorService } from "../../services/interaction-collector.service";
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
                  <app-checklist-interaction
                    [config]="interaction"
                    (selectionChanged)="onChecklist(interaction, $event)"
                  />
                }
                @case ("self-rating") {
                  <app-self-rating-interaction
                    [config]="interaction"
                    (valueSelected)="onSelfRating(interaction, $event)"
                  />
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

  /** Collecteur optionnel — present uniquement si un parent le fournit. */
  private readonly collector = inject(InteractionCollectorService, {
    optional: true,
  });

  /**
   * Mappe la valeur d'un self-rating vers le champ du profil concerne.
   * - `aiLevel` : 1-2 → debutant, 3 → intermediaire, 4-5 → avance
   * - `budgetTier` : 1-2 → '0', 3 → '60', 4-5 → '120'
   */
  onSelfRating(interaction: SelfRatingInteraction, value: number): void {
    if (!this.collector || !interaction.profileField) return;

    if (interaction.profileField === "aiLevel") {
      const level =
        value <= 2 ? "debutant" : value <= 3 ? "intermediaire" : "avance";
      this.collector.setAiLevel(level);
    } else if (interaction.profileField === "budgetTier") {
      const tier = value <= 2 ? "0" : value <= 3 ? "60" : "120";
      this.collector.setBudgetTier(tier);
    }
  }

  /**
   * Mappe les index coches d'une checklist vers les identifiants d'outils.
   * Utilise les items de la checklist pour resoudre les noms.
   */
  onChecklist(interaction: ChecklistInteraction, checked: Set<number>): void {
    if (!this.collector || !interaction.profileField) return;

    if (interaction.profileField === "toolsAlreadyUsed") {
      const tools = [...checked].map((i) => interaction.items[i]);
      this.collector.setToolsUsed(tools);
    }
  }
}
