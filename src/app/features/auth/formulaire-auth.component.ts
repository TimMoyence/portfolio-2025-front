import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AuthErreurComponent } from './auth-erreur.component';

@Component({
  selector: 'form[authEnCours]',
  standalone: true,
  imports: [AuthErreurComponent],
  template: `
    <ng-content />
    <button
      type="submit"
      class="btn btn-teal auth-submit"
      [disabled]="authEnCours() || authBloque()"
      [attr.aria-busy]="authEnCours()"
    >
      @if (!authEnCours()) {
        <ng-content select="[libelleEnvoi]" />
        <span class="arrow" aria-hidden="true">→</span>
      } @else {
        <ng-content select="[libelleAttente]" />
      }
    </button>

    <app-auth-erreur [message]="authErreur()" />
  `,
  styles: `
    @use './auth-shared';
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormulaireAuthComponent {
  readonly authEnCours = input.required<boolean>();
  readonly authBloque = input(false);
  readonly authErreur = input<string>();
}
