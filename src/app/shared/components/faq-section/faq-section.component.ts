import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, Input } from "@angular/core";

/**
 * Un element d'une FAQ, compose d'une question et d'une reponse.
 */
export interface FaqItem {
  /** Question visible et utilisee comme label de l'element details. */
  readonly question: string;
  /** Reponse en texte brut (ou HTML echappe cote serveur). */
  readonly answer: string;
}

/**
 * Composant FAQ reutilisable avec accordeons natifs `<details>`.
 *
 * Le rendu HTML visible est indispensable pour que le contenu declare dans
 * les schemas JSON-LD `FAQPage` soit indexe par Google et les moteurs IA :
 * depuis 2024, Google exige que les Q&R soient visibles sur la page pour
 * que le schema soit valide.
 *
 * Les `<details>` natifs offrent l'accessibilite clavier et un rendu
 * progressif sans JavaScript, ce qui est ideal pour le SEO et les crawlers.
 */
@Component({
  selector: "app-faq-section",
  standalone: true,
  imports: [CommonModule],
  template: `
    <section
      class="px-[5%] py-12 md:py-18 lg:py-22"
      [attr.aria-labelledby]="headingId"
      data-testid="faq-section"
    >
      <div class="container max-w-3xl">
        <header class="mb-8 md:mb-10 text-center">
          @if (kicker) {
            <p class="mb-2 font-semibold text-sm md:text-base">{{ kicker }}</p>
          }
          <h2
            [id]="headingId"
            class="font-heading heading-h3 text-h3 md:heading-h2 md:text-h2"
          >
            {{ title }}
          </h2>
          @if (description) {
            <p class="mt-4 text-sm md:text-base text-scheme-text-muted">
              {{ description }}
            </p>
          }
        </header>

        <div
          class="divide-y divide-scheme-border rounded-form border border-scheme-border bg-scheme-surface"
          itemscope
          itemtype="https://schema.org/FAQPage"
        >
          @for (item of items; track item.question) {
            <details
              class="group p-5 md:p-6"
              itemscope
              itemprop="mainEntity"
              itemtype="https://schema.org/Question"
            >
              <summary
                class="flex items-center justify-between gap-4 cursor-pointer list-none text-base md:text-md font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-scheme-accent-focus rounded"
              >
                <span itemprop="name">{{ item.question }}</span>
                <span
                  class="ml-4 shrink-0 text-xl transition-transform group-open:rotate-45"
                  aria-hidden="true"
                  >+</span
                >
              </summary>
              <div
                class="mt-3 text-sm md:text-base text-scheme-text"
                itemscope
                itemprop="acceptedAnswer"
                itemtype="https://schema.org/Answer"
              >
                <p itemprop="text">{{ item.answer }}</p>
              </div>
            </details>
          }
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqSectionComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) items: readonly FaqItem[] = [];
  @Input() kicker?: string;
  @Input() description?: string;
  /**
   * Identifiant HTML unique de l'en-tete FAQ, utilise pour `aria-labelledby`.
   * Par defaut `faq-heading`. A changer si plusieurs FAQ coexistent sur une page.
   */
  @Input() headingId = "faq-heading";
}
