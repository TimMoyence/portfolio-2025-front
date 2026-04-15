import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import type { ClientReport } from "../../../../core/models/audit-client-report.model";

/**
 * Affiche la matrice Google vs IA : deux cards côte à côte avec score + résumé.
 * Stack verticalement sur mobile.
 */
@Component({
  selector: "app-engine-coverage-matrix",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./engine-coverage-matrix.component.html",
  styleUrl: "./engine-coverage-matrix.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EngineCoverageMatrixComponent {
  @Input({ required: true }) matrix!: ClientReport["googleVsAiMatrix"];

  /**
   * Retourne une classe d'accent en fonction du score (0-100).
   * Permet de colorer la barre de progression.
   */
  scoreClass(score: number): string {
    if (score >= 75) return "engine-card__score--ok";
    if (score >= 50) return "engine-card__score--warning";
    return "engine-card__score--critical";
  }
}
