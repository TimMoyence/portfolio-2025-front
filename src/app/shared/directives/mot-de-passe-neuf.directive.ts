import { booleanAttribute, Directive, input } from '@angular/core';
import type { AbstractControl, ValidationErrors } from '@angular/forms';
import { NG_VALIDATORS, Validators } from '@angular/forms';
import { MOT_DE_PASSE_NEUF } from '../utils/regles-de-saisie';
import { ValidateurDeSaisie } from './validateur-de-saisie';

const valider = Validators.compose([
  Validators.minLength(MOT_DE_PASSE_NEUF.longueurMin),
  Validators.maxLength(MOT_DE_PASSE_NEUF.longueurMax),
  Validators.pattern(MOT_DE_PASSE_NEUF.motif),
]);

@Directive({
  selector: '[appMotDePasseNeuf][ngModel]',
  standalone: true,
  providers: [{ provide: NG_VALIDATORS, useExisting: MotDePasseNeufDirective, multi: true }],
  host: {
    '[attr.minlength]': 'appMotDePasseNeuf() ? regle.longueurMin : null',
    '[attr.maxlength]': 'appMotDePasseNeuf() ? regle.longueurMax : null',
  },
})
export class MotDePasseNeufDirective extends ValidateurDeSaisie {
  readonly appMotDePasseNeuf = input(true, { transform: booleanAttribute });

  protected readonly regle = MOT_DE_PASSE_NEUF;

  validate(controle: AbstractControl): ValidationErrors | null {
    return this.appMotDePasseNeuf() ? (valider?.(controle) ?? null) : null;
  }
}
