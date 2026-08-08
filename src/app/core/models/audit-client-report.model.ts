/**
 * Miroir du type backend `ClientReportSynthesis`
 * (cf. `portfolio-2025-back/src/modules/audit-requests/domain/AuditReportTiers.ts`).
 */
export interface ClientReport {
  readonly executiveSummary: string;
  readonly topFindings: ReadonlyArray<ClientReportFinding>;
  readonly googleVsAiMatrix: ClientReportEngineMatrix;
  readonly pillarScorecard: ReadonlyArray<ClientReportPillar>;
  readonly quickWins: ReadonlyArray<ClientReportQuickWin>;
  readonly cta: ClientReportCta;
}

interface ClientReportFinding {
  readonly title: string;
  readonly impact: string;
  readonly severity: 'high' | 'medium' | 'low';
}

interface ClientReportEngineMatrix {
  readonly googleVisibility: ClientReportEngineScore;
  readonly aiVisibility: ClientReportEngineScore;
}

interface ClientReportEngineScore {
  readonly score: number;
  readonly summary: string;
}

interface ClientReportPillar {
  readonly pillar: string;
  readonly score: number;
  readonly target: number;
  readonly status: 'critical' | 'warning' | 'ok';
}

interface ClientReportQuickWin {
  readonly title: string;
  readonly businessImpact: string;
  readonly effort: 'low' | 'medium' | 'high';
}

interface ClientReportCta {
  readonly title: string;
  readonly description: string;
  readonly actionLabel: string;
}
