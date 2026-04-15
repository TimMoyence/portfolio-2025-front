import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import type { ClientReport } from "../../../../core/models/audit-client-report.model";
import { EngineCoverageMatrixComponent } from "../engine-coverage-matrix/engine-coverage-matrix.component";
import { PillarScorecardComponent } from "../pillar-scorecard/pillar-scorecard.component";

/**
 * Section composite du rapport client Growth Audit.
 * Agrège :
 * - résumé exécutif
 * - matrice Google vs IA
 * - scorecard des piliers
 * - quick wins (business impact + effort)
 * - CTA final
 *
 * Strictement présentationnel : aucune logique métier, tout via @Input.
 */
@Component({
  selector: "app-audit-client-report-section",
  standalone: true,
  imports: [
    CommonModule,
    EngineCoverageMatrixComponent,
    PillarScorecardComponent,
  ],
  templateUrl: "./audit-client-report-section.component.html",
  styleUrl: "./audit-client-report-section.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditClientReportSectionComponent {
  @Input({ required: true }) clientReport!: ClientReport;

  effortLabel(effort: "low" | "medium" | "high"): string {
    switch (effort) {
      case "low":
        return "Effort faible";
      case "medium":
        return "Effort moyen";
      case "high":
        return "Effort élevé";
    }
  }

  effortClass(effort: "low" | "medium" | "high"): string {
    return `quick-win-card__effort quick-win-card__effort--${effort}`;
  }
}
