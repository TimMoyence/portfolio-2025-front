import { ChangeDetectorRef, Directive, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { AuthPort } from '../../core/ports/auth.port';
import { AUTH_PORT } from '../../core/ports/auth.port';
import type { MessagesDeRefus } from '../../shared/utils/form-submit.utils';
import { handleFormSubmit } from '../../shared/utils/form-submit.utils';

interface Envoi {
  readonly succes: string;
  readonly refus: MessagesDeRefus;
  readonly repli: string;
}

@Directive()
export abstract class FormulaireDeMotDePasse {
  submitted = false;
  isLoading = false;
  successMessage?: string;
  errorMessage?: string;

  protected readonly authService: AuthPort = inject(AUTH_PORT);
  private readonly cdr = inject(ChangeDetectorRef);

  protected envoyer(
    requete: Observable<unknown>,
    envoi: Envoi,
    viderLeFormulaire: () => void,
  ): void {
    this.isLoading = true;
    handleFormSubmit(requete, this.cdr, {
      fallbackError: envoi.repli,
      refus: envoi.refus,
      onSuccess: () => {
        this.successMessage = envoi.succes;
        viderLeFormulaire();
        this.submitted = false;
      },
      onError: (message) => {
        this.errorMessage = message;
      },
      finalement: () => {
        this.isLoading = false;
      },
    });
  }
}
