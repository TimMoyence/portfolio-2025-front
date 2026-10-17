import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { ValidationErrors } from '@angular/forms';
import { REGLE_D_UN_MOT_DE_PASSE } from '../../utils/regles-de-saisie';

@Component({
  selector: 'p[appFieldErrors]',
  standalone: true,
  templateUrl: './field-errors.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldErrorsComponent {
  readonly errors = input.required<ValidationErrors | null>();

  readonly email = input(true);

  readonly phone = input(false);

  readonly motDePasse = input(false);

  protected readonly regleDUnMotDePasse = REGLE_D_UN_MOT_DE_PASSE;
}
