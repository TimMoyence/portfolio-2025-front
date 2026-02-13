export type AuditContactMethod = "EMAIL" | "PHONE";

export interface AuditRequestPayload {
  websiteName: string;
  contactMethod: AuditContactMethod;
  contactValue: string;
}
