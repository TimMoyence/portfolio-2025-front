import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from "@angular/core";
import type { PromptBuilderInteraction } from "../../models/slide.model";

/** Placeholder substitue dans le template de prompt. */
const SECTOR_PLACEHOLDER = "{{sector}}";

/** Duree d'affichage du retour visuel de copie, en millisecondes. */
const COPY_FEEDBACK_MS = 2000;

/**
 * Mini-exercice live : le lecteur saisit son secteur, le composant substitue
 * ce parametre dans un template de prompt et propose de copier le resultat.
 *
 * La substitution est purement locale : la valeur saisie ne transite jamais
 * sur le reseau. Un echec de copie est expose a l'utilisateur plutot que
 * silencieusement avale.
 */
@Component({
  selector: "app-prompt-builder-interaction",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="mx-auto w-full max-w-2xl rounded-2xl border border-gray-200 bg-gray-50/50 p-5 sm:p-6 transition-colors"
      [class.border-scheme-accent]="generatedPrompt() !== ''"
    >
      <p class="text-sm font-semibold text-gray-900 mb-4">
        <span class="mr-2 text-scheme-accent">&#9998;</span>
        {{ config().context }}
      </p>

      <input
        type="text"
        class="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-colors focus:border-scheme-accent focus:outline-none"
        [placeholder]="config().placeholder"
        [value]="sector()"
        (input)="onSectorInput($event)"
      />

      @if (generatedPrompt(); as prompt) {
        <pre
          data-testid="generated-prompt"
          class="mt-4 whitespace-pre-wrap rounded-xl bg-white p-4 text-left text-xs leading-relaxed text-gray-700 shadow-sm"
          >{{ prompt }}</pre
        >

        <button
          type="button"
          data-testid="copy-button"
          class="mt-3 w-full rounded-xl bg-scheme-accent px-4 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          (click)="copy(prompt)"
        >
          @if (config().ctaLabel; as label) {
            {{ label }}
          } @else {
            <span i18n="@@slidePromptBuilder.copy">Copier le prompt</span>
          }
        </button>
      } @else {
        <p class="mt-3 text-xs text-gray-400" i18n="@@slidePromptBuilder.hint">
          Renseignez votre secteur pour générer le prompt.
        </p>
      }

      @if (copied()) {
        <p
          data-testid="copy-feedback"
          class="mt-3 text-center text-xs text-scheme-accent/70"
          i18n="@@slidePromptBuilder.copied"
        >
          Prompt copié dans le presse-papier.
        </p>
      }

      @if (copyFailed()) {
        <p
          data-testid="copy-error"
          class="mt-3 text-center text-xs text-red-600"
          i18n="@@slidePromptBuilder.copyError"
        >
          La copie a échoué. Sélectionnez le texte ci-dessus pour le copier
          manuellement.
        </p>
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
export class PromptBuilderInteractionComponent {
  readonly config = input.required<PromptBuilderInteraction>();

  /** Secteur saisi par le lecteur, vide tant qu'il n'a rien renseigne. */
  readonly sector = signal("");

  readonly copied = signal(false);
  readonly copyFailed = signal(false);

  /**
   * Prompt final, placeholder substitue. Chaine vide tant que le secteur
   * saisi est vide ou ne contient que des espaces : le prompt et le bouton
   * de copie restent alors masques.
   */
  readonly generatedPrompt = computed(() => {
    const sector = this.sector().trim();
    if (sector === "") {
      return "";
    }
    return this.config().promptTemplate.split(SECTOR_PLACEHOLDER).join(sector);
  });

  onSectorInput(event: Event): void {
    this.sector.set((event.target as HTMLInputElement).value);
    this.copied.set(false);
    this.copyFailed.set(false);
  }

  /**
   * Copie le prompt dans le presse-papier. L'API Clipboard n'existe pas en
   * SSR ni sur les navigateurs anciens : son absence est traitee comme un
   * echec explicite, jamais ignoree.
   */
  copy(prompt: string): void {
    const clipboard =
      typeof navigator === "undefined" ? undefined : navigator.clipboard;

    if (!clipboard) {
      this.signalFailure(new Error("API Clipboard indisponible"));
      return;
    }

    clipboard
      .writeText(prompt)
      .then(() => {
        this.copyFailed.set(false);
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), COPY_FEEDBACK_MS);
      })
      .catch((error: unknown) => this.signalFailure(error));
  }

  /** Journalise l'echec et expose l'etat d'erreur au lecteur. */
  private signalFailure(error: unknown): void {
    console.error("[PromptBuilder] copie impossible", error);
    this.copied.set(false);
    this.copyFailed.set(true);
  }
}
