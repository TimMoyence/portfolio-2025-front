import type {
  AuditConfirmeResponseDto,
  AuditRequestRequestDto,
  AuditRequestResponseDto,
  AuditsControllerStreamResponse,
  AuditSummaryResponseDto,
  AuditTermineResponseDto,
  ProgressionDAuditResponseDto,
} from '../../../../contrat/types.gen';
import { zAuditSummaryResponseDto } from '../../../../contrat/zod.gen';

export const PILLAR_KEYS = zAuditSummaryResponseDto.shape.pillarScores.keyof().options;
export type PillarKey = (typeof PILLAR_KEYS)[number];

export type AuditRequestPayload = AuditRequestRequestDto;
export type AuditCreateResponse = AuditRequestResponseDto;
export type AuditConfirmeResponse = AuditConfirmeResponseDto;
export type AuditSummaryResponse = AuditSummaryResponseDto;
export type AuditProgressEvent = ProgressionDAuditResponseDto;
export type AuditCompletedEvent = AuditTermineResponseDto;
export type AuditStreamEvent = AuditsControllerStreamResponse;
