import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

/**
 * Chrome partagé des écrans d'authentification (login / register / forgot /
 * reset / verify) — split-screen Asili. Rend l'ossature statique commune :
 * le panneau immersif gauche (logo + citation de pied) et la zone carte droite.
 *
 * Deux emplacements de projection :
 * - slot nommé `[aside]` : reçoit le wrapper `.auth-aside-mid` complet de la
 *   page (kicker / titre / sous-titre). Projeté verbatim — et non passé en
 *   inputs — afin de préserver les IDs i18n `@@` littéraux et le balisage
 *   `<em>` propres à chaque page (l'extraction `$localize` exige un ID littéral
 *   dans le template). La directive `appReveal` reste donc portée par la page.
 * - slot par défaut : le corps de la carte (formulaire ou bloc succès).
 *
 * Aucun input : le chrome est 100 % statique.
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
