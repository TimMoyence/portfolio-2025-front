/**
 * Synthèse stratégique (rapport client) destinée à l'affichage public.
 *
 * Miroir du type backend `ClientReportSynthesis`
 * (cf. `portfolio-2025-back/src/modules/audit-requests/domain/AuditReportTiers.ts`).
 *
 * Orientée décideur non technique : impact business, matrice Google/IA,
 * scorecard des piliers, quick wins et CTA.
 */
export interface ClientReport {
  readonly executiveSummary: string;
  readonly topFindings: ReadonlyArray<ClientReportFinding>;
  readonly googleVsAiMatrix: ClientReportEngineMatrix;
  readonly pillarScorecard: ReadonlyArray<ClientReportPillar>;
  readonly quickWins: ReadonlyArray<ClientReportQuickWin>;
  readonly cta: ClientReportCta;
}

export interface ClientReportFinding {
  readonly title: string;
  readonly impact: string;
  readonly severity: "critical" | "high" | "medium";
}

export interface ClientReportEngineMatrix {
  readonly googleVisibility: ClientReportEngineScore;
  readonly aiVisibility: ClientReportEngineScore;
}

export interface ClientReportEngineScore {
  readonly score: number;
  readonly summary: string;
}

export interface ClientReportPillar {
  readonly pillar: string;
  readonly score: number;
  readonly target: number;
  readonly status: "critical" | "warning" | "ok";
}

export interface ClientReportQuickWin {
  readonly title: string;
  readonly businessImpact: string;
  readonly effort: "low" | "medium" | "high";
}

export interface ClientReportCta {
  readonly title: string;
  readonly description: string;
  readonly actionLabel: string;
}
