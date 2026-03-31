import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from "@angular/core";
import { AuthStateService } from "../../core/services/auth-state.service";
import { WeatherAppComponent } from "./weather-app.component";
import { WeatherPresentationComponent } from "./weather-presentation.component";

/**
 * Conteneur de la fonctionnalite meteo.
 * Affiche l'application si l'utilisateur dispose du role "weather",
 * sinon affiche la page de presentation.
 */
@Component({
  selector: "app-weather",
  standalone: true,
  imports: [WeatherPresentationComponent, WeatherAppComponent],
  template: `
    @if (hasAccess()) {
      <app-weather-app />
    } @else {
      <app-weather-presentation />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeatherComponent {
  private readonly authState = inject(AuthStateService);

  /** Verifie si l'utilisateur est connecte et possede le role "weather". */
  readonly hasAccess = computed(
    () => this.authState.isLoggedIn() && this.authState.hasRole("weather"),
  );
}
