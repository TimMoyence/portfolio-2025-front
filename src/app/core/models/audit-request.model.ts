export type AuditContactMethod = "EMAIL" | "PHONE";
export type AuditProcessingStatus =
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED";

export interface AuditRequestPayload {
  websiteName: string;
  contactMethod: AuditContactMethod;
  contactValue: string;
}

export interface AuditCreateResponse {
  message: string;
  httpCode: number;
  auditId: string;
  status: AuditProcessingStatus;
}

export interface AuditSummaryResponse {
  auditId: string;
  ready: boolean;
  status: AuditProcessingStatus;
  progress: number;
  summaryText: string | null;
  keyChecks: Record<string, unknown>;
  quickWins: string[];
  pillarScores: Record<string, number>;
}

export interface AuditProgressEvent {
  auditId: string;
  status: AuditProcessingStatus;
  progress: number;
  step?: string | null;
  done: boolean;
  updatedAt: string;
}

export interface AuditCompletedEvent {
  auditId: string;
  status: "COMPLETED";
  progress: number;
  done: boolean;
  summaryText: string | null;
  keyChecks: Record<string, unknown>;
  quickWins: string[];
  pillarScores: Record<string, number>;
  updatedAt: string;
}

export interface AuditFailedEvent {
  auditId: string;
  status: "FAILED";
  progress: number;
  done: boolean;
  error: string | null;
  updatedAt: string;
}

export type AuditStreamEvent =
  | { type: "progress"; data: AuditProgressEvent }
  | {
      type: "instant_summary";
      data: {
        auditId: string;
        ready: false;
        status: AuditProcessingStatus;
        progress: number;
        summaryText: string | null;
        keyChecks: Record<string, unknown>;
        quickWins: string[];
        pillarScores: Record<string, number>;
        updatedAt: string;
      };
    }
  | { type: "completed"; data: AuditCompletedEvent }
  | { type: "failed"; data: AuditFailedEvent }
  | { type: "heartbeat"; data: { ts: string } };
