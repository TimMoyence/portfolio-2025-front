import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from "@angular/core";
import type { ReflectionInteraction } from "../../models/slide.model";

/**
 * Question introspective ouverte pour le mode scroll.
 *
 * Affiche une question avec un textarea. La réponse est éphémère
 * (stockée uniquement dans un signal local, pas de persistence).
 * Feedback visuel discret quand le lecteur a répondu.
 */
@Component({
  selector: "app-reflection-interaction",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="mx-auto w-full max-w-2xl rounded-2xl border border-gray-200 bg-gray-50/50 p-5 sm:p-6 transition-colors"
      [class.border-scheme-accent]="hasResponse()"
    >
      <p class="text-sm font-semibold text-gray-900 mb-3">
        <span class="mr-2 text-scheme-accent">?</span>
        {{ config().question }}
      </p>
      <textarea
        class="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm placeholder:text-gray-400 focus:border-scheme-accent focus:outline-none focus:ring-2 focus:ring-scheme-accent/20 transition-shadow"
        [placeholder]="config().placeholder"
        [rows]="config().rows ?? 3"
        [value]="response()"
        (input)="onInput($event)"
      ></textarea>
      @if (hasResponse()) {
        <p class="mt-2 text-xs text-scheme-accent/70">
          Merci pour votre réflexion
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
export class ReflectionInteractionComponent {
  readonly config = input.required<ReflectionInteraction>();

  readonly response = signal("");

  readonly hasResponse = () => this.response().trim().length > 0;

  onInput(event: Event): void {
    this.response.set((event.target as HTMLTextAreaElement).value);
  }
}
