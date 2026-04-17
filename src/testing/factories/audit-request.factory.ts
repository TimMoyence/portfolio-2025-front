import type { ClientReport } from "../../app/core/models/audit-client-report.model";
import type {
  AuditCompletedEvent,
  AuditCreateResponse,
  AuditRequestPayload,
  AuditStreamEvent,
  AuditSummaryResponse,
} from "../../app/core/models/audit-request.model";
import type { AuditRequestPort } from "../../app/core/ports/audit-request.port";

/** Construit un payload AuditRequestPayload avec des valeurs par defaut. */
export function buildAuditRequestPayload(
  overrides?: Partial<AuditRequestPayload>,
): AuditRequestPayload {
  return {
    websiteName: "example.com",
    contactMethod: "EMAIL",
    contactValue: "test@example.com",
    locale: "fr",
    ...overrides,
  };
}

/** Construit une reponse AuditCreateResponse avec des valeurs par defaut. */
export function buildAuditCreateResponse(
  overrides?: Partial<AuditCreateResponse>,
): AuditCreateResponse {
  return {
    message: "Audit cree avec succes.",
    httpCode: 201,
    auditId: "audit-1",
    status: "PENDING",
    ...overrides,
  };
}

/** Construit une reponse AuditSummaryResponse avec des valeurs par defaut. */
export function buildAuditSummaryResponse(
  overrides?: Partial<AuditSummaryResponse>,
): AuditSummaryResponse {
  return {
    auditId: "audit-1",
    ready: false,
    status: "RUNNING",
    progress: 10,
    summaryText: null,
    keyChecks: {},
    quickWins: [],
    pillarScores: {},
    ...overrides,
  };
}

/** Construit un evenement AuditStreamEvent de type heartbeat par defaut. */
export function buildAuditStreamHeartbeat(): AuditStreamEvent {
  return { type: "heartbeat", data: { ts: "now" } };
}

/**
 * Construit un ClientReport complet avec 7 piliers, 3 quickWins, CTA renseigné.
 * Utilisé par les specs des composants du rapport client (Phase 8).
 */
export function buildClientReport(
  overrides?: Partial<ClientReport>,
): ClientReport {
  return {
    executiveSummary:
      "Votre site présente une bonne couverture Google mais une faible visibilité IA.",
    topFindings: [
      {
        title: "Meta-descriptions manquantes",
        impact: "Baisse du CTR sur les SERP",
        severity: "high",
      },
      {
        title: "Pas de données structurées",
        impact: "Invisible pour les moteurs IA",
        severity: "high",
      },
      {
        title: "Temps de chargement élevé",
        impact: "Taux de rebond accru",
        severity: "medium",
      },
    ],
    googleVsAiMatrix: {
      googleVisibility: {
        score: 72,
        summary:
          "Bonne indexation, quelques optimisations on-page à effectuer.",
      },
      aiVisibility: {
        score: 34,
        summary:
          "Contenu peu structuré pour les LLM, absence de schema.org ciblé.",
      },
    },
    pillarScorecard: [
      { pillar: "seo", score: 72, target: 85, status: "warning" },
      { pillar: "performance", score: 88, target: 85, status: "ok" },
      { pillar: "technical", score: 82, target: 80, status: "ok" },
      { pillar: "trust", score: 78, target: 80, status: "warning" },
      { pillar: "conversion", score: 65, target: 80, status: "warning" },
      { pillar: "aiVisibility", score: 34, target: 70, status: "critical" },
      {
        pillar: "citationWorthiness",
        score: 55,
        target: 75,
        status: "critical",
      },
    ],
    quickWins: [
      {
        title: "Ajouter des meta-descriptions",
        businessImpact: "+15% de CTR estimé sur 3 mois",
        effort: "low",
      },
      {
        title: "Implémenter JSON-LD Organization",
        businessImpact: "Meilleure reprise par ChatGPT / Perplexity",
        effort: "medium",
      },
      {
        title: "Optimiser les images webp",
        businessImpact: "LCP divisé par 2",
        effort: "low",
      },
    ],
    cta: {
      title: "Prêt à passer à l'action ?",
      description:
        "Discutons de la mise en œuvre des recommandations sur votre site.",
      actionLabel: "Réserver un appel de 30 min",
    },
    ...overrides,
  };
}

/**
 * Construit un AuditCompletedEvent avec valeurs par défaut + clientReport optionnel.
 */
export function buildAuditCompletedEvent(
  overrides?: Partial<AuditCompletedEvent>,
): AuditCompletedEvent {
  return {
    auditId: "audit-1",
    status: "COMPLETED",
    progress: 100,
    done: true,
    summaryText: "Résumé de l'audit",
    keyChecks: {},
    quickWins: [],
    pillarScores: {},
    clientReport: null,
    updatedAt: "2026-04-15T09:00:00.000Z",
    ...overrides,
  };
}

/** Cree un stub complet du port audit-request avec des spies Jasmine. */
export function createAuditRequestPortStub(): jasmine.SpyObj<AuditRequestPort> {
  return jasmine.createSpyObj<AuditRequestPort>("AuditRequestPort", [
    "submit",
    "getSummary",
    "stream",
  ]);
}
