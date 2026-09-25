import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { ValidationErrors } from '@angular/forms';

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

  readonly longueur = input(false);
}
