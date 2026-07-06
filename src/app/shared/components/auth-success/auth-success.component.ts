import { ChangeDetectionStrategy, Component, input } from "@angular/core";

/**
 * Bloc de confirmation partagé des écrans d'authentification (forgot / reset /
 * verify) : coche circulaire, titre projeté, message piloté et action(s).
 *
 * Emplacements de projection :
 * - slot nommé `[title]` : le `<h1 i18n="@@…">` propre à la page (i18n + `<em>`
 *   préservés, projetés verbatim).
 * - slot par défaut : l'action de sortie (lien `.auth-alt` ou
 *   `<a class="btn btn-teal">`) et, pour verify, le sous-titre de redirection.
 */
@Component({
  selector: "app-auth-success",
  standalone: true,
  templateUrl: "./auth-success.component.html",
  styleUrl: "./auth-success.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthSuccessComponent {
  /** Message de succès affiché sous le titre (successMessage de la page). */
  readonly message = input<string>();
}
