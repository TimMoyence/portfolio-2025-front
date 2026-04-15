import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import type { ClientReport } from "../../../../core/models/audit-client-report.model";

/**
 * Affiche une scorecard de piliers sous forme de grille responsive.
 * Chaque pilier affiche son score actuel vs cible et un badge de statut.
 *
 * Composant purement présentationnel : reçoit sa donnée via `@Input` scorecard.
 */
@Component({
  selector: "app-pillar-scorecard",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./pillar-scorecard.component.html",
  styleUrl: "./pillar-scorecard.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PillarScorecardComponent {
  @Input({ required: true }) scorecard!: ClientReport["pillarScorecard"];

  /**
   * Mapping des identifiants techniques (émis par le backend `ScoringService`)
   * vers libellés français lisibles. Les 7 piliers attendus sont :
   * `seo, performance, technical, trust, conversion, aiVisibility,
   * citationWorthiness`. En fallback, la chaîne brute est renvoyée.
   */
  private static readonly PILLAR_LABELS: Readonly<Record<string, string>> = {
    seo: "SEO",
    performance: "Performance",
    technical: "Tech & scalabilité",
    trust: "Crédibilité",
    conversion: "Conversion",
    aiVisibility: "Visibilité IA",
    citationWorthiness: "Citabilité IA",
  };

  formatPillarName(pillar: string): string {
    return PillarScorecardComponent.PILLAR_LABELS[pillar] ?? pillar;
  }

  statusClass(status: "critical" | "warning" | "ok"): string {
    return `pillar-card__status pillar-card__status--${status}`;
  }

  statusLabel(status: "critical" | "warning" | "ok"): string {
    switch (status) {
      case "critical":
        return "Critique";
      case "warning":
        return "À améliorer";
      case "ok":
        return "Objectif atteint";
    }
  }
}
