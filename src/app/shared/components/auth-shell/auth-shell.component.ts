import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

/**
 * Le slot `[aside]` reçoit le wrapper `.auth-aside-mid` complet de la page.
 * Projeté verbatim — et non passé en inputs — afin de préserver les IDs i18n
 * `@@` littéraux et le balisage `<em>` propres à chaque page (l'extraction
 * `$localize` exige un ID littéral dans le template). La directive `appReveal`
 * reste donc portée par la page.
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
