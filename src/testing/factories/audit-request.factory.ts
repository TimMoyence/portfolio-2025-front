import type {
  AuditCreateResponse,
  AuditRequestPayload,
  AuditStreamEvent,
  AuditSummaryResponse,
} from "../../app/core/models/audit-request.model";
import type { AuditRequestPort } from "../../app/core/ports/audit-request.port";
import type { AuditRequestService } from "../../app/core/services/audit-request.service";

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

/** Cree un stub complet du port audit-request avec des spies Jasmine. */
export function createAuditRequestPortStub(): jasmine.SpyObj<AuditRequestPort> {
  return jasmine.createSpyObj<AuditRequestPort>("AuditRequestPort", [
    "submit",
    "getSummary",
    "stream",
  ]);
}

/** Cree un stub complet d'AuditRequestService avec des spies Jasmine. */
export function createAuditRequestServiceStub(): jasmine.SpyObj<AuditRequestService> {
  return jasmine.createSpyObj<AuditRequestService>("AuditRequestService", [
    "submit",
    "getSummary",
    "stream",
  ]);
}
