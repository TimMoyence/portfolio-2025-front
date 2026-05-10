import { ChangeDetectionStrategy, Component, output } from "@angular/core";

/**
 * Composant affiche quand le budget est vide (aucune entree pour le mois).
 * Propose deux actions : importer un CSV ou creer une entree manuellement.
 */
@Component({
  selector: "app-budget-empty-state",
  standalone: true,
  templateUrl: "./budget-empty-state.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetEmptyStateComponent {
  /** Emis quand l'utilisateur clique sur "Importer un CSV". */
  readonly importClick = output<void>();

  /** Emis quand l'utilisateur clique sur "Creer une entree manuellement". */
  readonly createClick = output<void>();

  onImport(): void {
    this.importClick.emit();
  }

  onCreate(): void {
    this.createClick.emit();
  }
}
