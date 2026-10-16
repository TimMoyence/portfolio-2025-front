import { Directive, input } from '@angular/core';
import type { AbstractControl, ValidationErrors } from '@angular/forms';
import { NG_VALIDATORS } from '@angular/forms';
import { estUneAdresseEmail } from '../../../cours/runtime/core/adresse-email';
import { estUnNumeroDeTelephone } from '../utils/telephone.utils';
import { ValidateurDeSaisie } from './validateur-de-saisie';

export type FormatDeContact = 'email' | 'telephone' | null;

@Directive({
  selector: '[appFormatDeContact][ngModel]',
  standalone: true,
  providers: [{ provide: NG_VALIDATORS, useExisting: FormatDeContactDirective, multi: true }],
})
export class FormatDeContactDirective extends ValidateurDeSaisie {
  readonly appFormatDeContact = input<FormatDeContact>(null);

  validate(controle: AbstractControl): ValidationErrors | null {
    const valeur: unknown = controle.value;
    const saisie = typeof valeur === 'string' ? valeur.trim() : '';
    if (saisie.length === 0) {
      return null;
    }
    switch (this.appFormatDeContact()) {
      case 'email':
        return estUneAdresseEmail(saisie) ? null : { email: true };
      case 'telephone':
        return estUnNumeroDeTelephone(saisie) ? null : { phone: true };
      default:
        return null;
    }
  }
}
