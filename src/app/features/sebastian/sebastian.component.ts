import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from "@angular/core";
import { AuthStateService } from "../../core/services/auth-state.service";
import { SebastianAppComponent } from "./sebastian-app.component";
import { SebastianPresentationComponent } from "./sebastian-presentation.component";

/**
 * Conteneur de la fonctionnalite Sebastian.
 * Affiche l'application si l'utilisateur dispose du role "sebastian",
 * sinon affiche la page de presentation.
 */
@Component({
  selector: "app-sebastian",
  standalone: true,
  imports: [SebastianPresentationComponent, SebastianAppComponent],
  template: `
    @if (hasAccess()) {
      <app-sebastian-app />
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
