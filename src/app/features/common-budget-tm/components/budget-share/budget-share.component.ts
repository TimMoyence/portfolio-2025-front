import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";

/**
 * Composant de partage du budget par email.
 * Affiche un champ email et un bouton d'invitation.
 */
@Component({
  selector: "app-budget-share",
  standalone: true,
  template: `
    <div class="mt-4 border-t border-white/40 pt-4">
      <p
        class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500"
        i18n="@@budgetShareTitle"
      >
        Partager le budget
      </p>
      <div class="mt-2 flex gap-2">
        <input
          class="flex-1 rounded-xl border border-[#d7cfbf] bg-[#fffdf8] px-3 py-2 text-sm text-slate-900"
          type="email"
          placeholder="email@exemple.com"
          [value]="shareEmail()"
          (input)="shareEmailChange.emit(readTextInput($event))"
          (keydown.enter)="shareBudget.emit()"
        />
        <button
          type="button"
          class="rounded-xl bg-[#0f7b65] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5"
          (click)="shareBudget.emit()"
        >
          <span i18n="@@budgetShareInviteBtn">Inviter</span>
        </button>
      </div>
      @if (shareMessage()) {
        <p class="mt-2 text-xs text-slate-600">{{ shareMessage() }}</p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetShareComponent {
  /** Email de partage courant. */
  readonly shareEmail = input.required<string>();

  /** Message de retour apres tentative de partage. */
  readonly shareMessage = input.required<string>();

  /** Emission lors du changement de l'email. */
  readonly shareEmailChange = output<string>();

  /** Emission lors de la demande de partage. */
  readonly shareBudget = output<void>();

  /** Lit la valeur d'un champ texte depuis un evenement DOM. */
  readTextInput(event: Event): string {
    return (event.target as HTMLInputElement | null)?.value ?? "";
  }
}
