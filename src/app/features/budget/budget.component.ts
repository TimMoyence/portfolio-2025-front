import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from "@angular/core";
import { AuthStateService } from "../../core/services/auth-state.service";
import { CommonBudgetTmComponent } from "../common-budget-tm/common-budget-tm.component";
import { BudgetPresentationComponent } from "./budget-presentation.component";

/**
 * Conteneur de la fonctionnalite budget.
 * Affiche le dashboard CommonBudgetTM si l'utilisateur dispose du role "budget",
 * sinon affiche la page de presentation.
 */
@Component({
  selector: "app-budget",
  standalone: true,
  imports: [BudgetPresentationComponent, CommonBudgetTmComponent],
  template: `
    @if (hasAccess()) {
      <app-common-budget-tm />
    } @else {
      <app-budget-presentation />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetComponent {
  private readonly authState = inject(AuthStateService);

  /** Verifie si l'utilisateur est connecte et possede le role "budget". */
  readonly hasAccess = computed(
    () => this.authState.isLoggedIn() && this.authState.hasRole("budget"),
  );
}
