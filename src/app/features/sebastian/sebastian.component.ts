import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { AuthStateService } from "../../core/services/auth-state.service";
import { SebastianAppComponent } from "./sebastian-app.component";
import { SebastianPresentationComponent } from "./sebastian-presentation.component";

/**
 * Conteneur de la fonctionnalite Sebastian.
 * Affiche le shell applicatif avec router-outlet si l'utilisateur
 * dispose du role "sebastian", sinon affiche la page de presentation.
 *
 * Le shell (SebastianAppComponent) encadre le router-outlet pour que
 * les routes enfant (dashboard, rapports, badges, etc.) s'y injectent.
 */
@Component({
  selector: "app-sebastian",
  standalone: true,
  imports: [
    SebastianPresentationComponent,
    SebastianAppComponent,
    RouterOutlet,
  ],
  template: `
    @if (hasAccess()) {
      <app-sebastian-app>
        <router-outlet />
      </app-sebastian-app>
    } @else {
      <app-sebastian-presentation />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SebastianComponent {
  private readonly authState = inject(AuthStateService);

  /** Verifie si l'utilisateur est connecte et possede le role "sebastian". */
  readonly hasAccess = computed(
    () => this.authState.isLoggedIn() && this.authState.hasRole("sebastian"),
  );
}
