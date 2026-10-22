import type { AvancementDAudit } from '../../../../contrat/types.gen';

export interface AuditSectionBadge {
  key: string;
  label: string;
  status: string;
}

export function formatPhaseLabel(phase: string): string {
  switch (phase) {
    case 'technical_pages':
      return $localize`:audit.phase.technicalPages|Phase label@@auditPhaseTechnicalPages:Scan technique des pages`;
    case 'page_ai_recaps':
      return $localize`:audit.phase.pageAiRecaps|Phase label@@auditPhasePageAiRecaps:Micro-audits IA page par page`;
    case 'synthesis':
      return $localize`:audit.phase.synthesis|Phase label@@auditPhaseSynthesis:Synthèse finale IA`;
    default:
      return formatSubTaskLabel(phase);
  }
}

export function formatTaskLabel(task: string): string {
  switch (task) {
    case 'technical_scan':
      return $localize`:audit.task.technicalScan|Task label@@auditTaskTechnicalScan:Scan technique`;
    case 'page_ai_recap':
      return $localize`:audit.task.pageAiRecap|Task label@@auditTaskPageAiRecap:Analyse IA de page`;
    case 'synthesis':
      return $localize`:audit.task.synthesis|Task label@@auditTaskSynthesis:Synthèse IA`;
    default:
      return formatSubTaskLabel(task);
  }
}

export function formatSubTaskLabel(subTask: string): string {
  if (!subTask) return '';
  return subTask.replaceAll('_', ' ');
}

export function formatSectionLabel(section: string): string {
  switch (section) {
    case 'summary':
      return $localize`:audit.section.summary|Section label@@auditSectionSummary:Résumé`;
    case 'executiveSection':
      return $localize`:audit.section.executive|Section label@@auditSectionExecutive:Executive`;
    case 'prioritySection':
      return $localize`:audit.section.priority|Section label@@auditSectionPriority:Priorités`;
    case 'executionSection':
      return $localize`:audit.section.execution|Section label@@auditSectionExecution:Exécution`;
    case 'clientCommsSection':
      return $localize`:audit.section.clientComms|Section label@@auditSectionClientComms:Message client`;
    default:
      return section;
  }
}

export function sectionBadgeClass(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'failed':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'fallback':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'started':
      return 'bg-sky-100 text-sky-800 border-sky-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

type StatutDeSection = Extract<AvancementDAudit, { section: string }>['sectionStatus'];

const SECTIONS = [
  'summary',
  'executiveSection',
  'prioritySection',
  'executionSection',
  'clientCommsSection',
] as const;

export function buildSectionBadges(
  statuses: Readonly<Record<string, StatutDeSection>>,
): AuditSectionBadge[] {
  return SECTIONS.flatMap((key) =>
    Object.hasOwn(statuses, key)
      ? [{ key, label: formatSectionLabel(key), status: statuses[key] }]
      : [],
  );
}

export function formatProgressStep(event: {
  step?: string | null;
  details?: AvancementDAudit;
}): string {
  const base = event.step ?? $localize`:@@auditProgressDefaultStep:Audit en cours...`;
  const details = event.details;
  if (/\(\d+\/\d+\)/.test(base) || details === undefined || details.total <= 0) {
    return base;
  }
  return `${base} (${Math.max(0, details.done)}/${details.total})`;
}

export function formatSummaryText(summaryText: string | null | undefined): string {
  if (!summaryText) return '';

  const sectionLabels =
    '(Contexte|Context|Blocages?|Blockers?|Impacts?\\s+business|Business\\s+impact|Priorit[eé]s?\\s+imm[eé]diates?|Immediate\\s+priorities)';
  const prioritiesLabel = '(Priorit[eé]s?\\s+imm[eé]diates?|Immediate\\s+priorities)';

  return summaryText
    .replace(/\r\n?/g, '\n')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .trim()
    .replace(new RegExp(`([^\\n])\\s+${sectionLabels}\\s*:`, 'gi'), '$1\n\n$2 :')
    .replace(new RegExp(`${prioritiesLabel}\\s*:\\s*(\\d+[).])`, 'gi'), '$1 :\n$2')
    .replace(/[ \n]{1,2}(\d+[).]) ?/g, '\n$1 ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
