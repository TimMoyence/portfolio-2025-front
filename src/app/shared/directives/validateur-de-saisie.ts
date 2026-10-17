import type { OnChanges } from '@angular/core';
import { Directive } from '@angular/core';
import type { AbstractControl, ValidationErrors, Validator } from '@angular/forms';

@Directive()
export abstract class ValidateurDeSaisie implements Validator, OnChanges {
  private relancerLaValidation?: () => void;

  ngOnChanges(): void {
    this.relancerLaValidation?.();
  }

  registerOnValidatorChange(relancer: () => void): void {
    this.relancerLaValidation = relancer;
  }

  abstract validate(controle: AbstractControl): ValidationErrors | null;
}
