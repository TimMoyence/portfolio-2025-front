import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

/**
 * Le slot `[aside]` est projeté et non reçu en inputs : l'extraction
 * `@angular/localize` exige des IDs `@@` littéraux dans le template de la page.
 */
@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './auth-shell.component.html',
  styleUrl: './auth-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthShellComponent {}
