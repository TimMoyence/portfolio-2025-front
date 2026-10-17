import { booleanAttribute, Directive, input } from '@angular/core';
import type { AbstractControl, ValidationErrors } from '@angular/forms';
import { NG_VALIDATORS, Validators } from '@angular/forms';
import { erreursDeLongueur, MOT_DE_PASSE_NEUF } from '../utils/regles-de-saisie';
import { ValidateurDeSaisie } from './validateur-de-saisie';

const respecteLeMotif = Validators.pattern(MOT_DE_PASSE_NEUF.motif);

@Directive({
  selector: '[appMotDePasseNeuf][ngModel]',
  standalone: true,
  providers: [{ provide: NG_VALIDATORS, useExisting: MotDePasseNeufDirective, multi: true }],
  host: {
    '[attr.minlength]': 'appMotDePasseNeuf() ? regle.bornes.min : null',
  },
})
export class MotDePasseNeufDirective extends ValidateurDeSaisie {
  readonly appMotDePasseNeuf = input(true, { transform: booleanAttribute });

  protected readonly regle = MOT_DE_PASSE_NEUF;

  validate(controle: AbstractControl): ValidationErrors | null {
    const valeur: unknown = controle.value;
    if (!this.appMotDePasseNeuf() || typeof valeur !== 'string' || valeur.length === 0) {
      return null;
    }
    return erreursDeLongueur(valeur, MOT_DE_PASSE_NEUF.bornes) ?? respecteLeMotif(controle);
  }
}
