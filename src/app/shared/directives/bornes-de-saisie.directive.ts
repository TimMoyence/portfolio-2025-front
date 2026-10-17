import { Directive, input } from '@angular/core';
import type { AbstractControl, ValidationErrors } from '@angular/forms';
import { NG_VALIDATORS } from '@angular/forms';
import type { Bornes } from '../utils/regles-de-saisie';
import { erreursDeLongueur } from '../utils/regles-de-saisie';
import { ValidateurDeSaisie } from './validateur-de-saisie';

@Directive({
  selector: '[appBornesDeSaisie][ngModel]',
  standalone: true,
  providers: [{ provide: NG_VALIDATORS, useExisting: BornesDeSaisieDirective, multi: true }],
})
export class BornesDeSaisieDirective extends ValidateurDeSaisie {
  readonly appBornesDeSaisie = input<Bornes | null>(null);

  validate(controle: AbstractControl): ValidationErrors | null {
    const bornes = this.appBornesDeSaisie();
    if (bornes === null) {
      return null;
    }
    const valeur: unknown = controle.value;
    return erreursDeLongueur(typeof valeur === 'string' ? valeur : '', bornes);
  }
}
