import { ChangeDetectorRef, Directive, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { AuthPort } from '../../core/ports/auth.port';
import { AUTH_PORT } from '../../core/ports/auth.port';
import { handleFormSubmit } from '../../shared/utils/form-submit.utils';

@Directive()
export abstract class FormulaireDeMotDePasse {
  submitted = false;
  isLoading = false;
  successMessage?: string;
  errorMessage?: string;

  protected readonly authService: AuthPort = inject(AUTH_PORT);
  private readonly cdr = inject(ChangeDetectorRef);

  protected envoyer<Resultat extends { readonly message: string }>(
    requete: Observable<Resultat>,
    fallbackError: string,
    viderLeFormulaire: () => void,
  ): void {
    this.isLoading = true;
    handleFormSubmit(requete, this.cdr, {
      fallbackError,
      onSuccess: (result) => {
        this.successMessage = result.message;
        viderLeFormulaire();
        this.submitted = false;
      },
      onError: (message) => {
        this.errorMessage = message;
        this.isLoading = false;
      },
      onComplete: () => {
        this.isLoading = false;
      },
    });
  }
}
