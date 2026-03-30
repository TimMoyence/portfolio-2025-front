/**
 * Fonctions utilitaires de formatage pour le composant GrowthAudit.
 *
 * Extraites du composant pour ameliorer la lisibilite, la testabilite
 * et reduire la taille du fichier principal.
 */

/** Badge de section affiche dans la timeline de l'audit. */
export interface AuditSectionBadge {
  key: string;
  label: string;
  status: string;
}

// ---------------------------------------------------------------------------
// Formatage des labels
// ---------------------------------------------------------------------------

/** Traduit un identifiant de phase en libelle lisible. */
export function formatPhaseLabel(phase: string): string {
  if (!phase) return "";
  switch (phase) {
    case "technical_pages":
      return $localize`:audit.phase.technicalPages|Phase label@@auditPhaseTechnicalPages:Scan technique des pages`;
    case "page_ai_recaps":
      return $localize`:audit.phase.pageAiRecaps|Phase label@@auditPhasePageAiRecaps:Micro-audits IA page par page`;
    case "synthesis":
      return $localize`:audit.phase.synthesis|Phase label@@auditPhaseSynthesis:Synthèse finale IA`;
    default:
      return phase.replaceAll("_", " ");
  }
}

/** Traduit un identifiant de tache IA en libelle lisible. */
export function formatTaskLabel(task: string): string {
  if (!task) return "";
  switch (task) {
    case "technical_scan":
      return $localize`:audit.task.technicalScan|Task label@@auditTaskTechnicalScan:Scan technique`;
    case "page_ai_recap":
      return $localize`:audit.task.pageAiRecap|Task label@@auditTaskPageAiRecap:Analyse IA de page`;
    case "synthesis":
      return $localize`:audit.task.synthesis|Task label@@auditTaskSynthesis:Synthèse IA`;
    default:
      return task.replaceAll("_", " ");
  }
}

/** Traduit un identifiant de sous-tache en libelle lisible. */
export function formatSubTaskLabel(subTask: string): string {
  if (!subTask) return "";
  return subTask.replaceAll("_", " ");
}

/** Traduit un identifiant de section en libelle lisible. */
export function formatSectionLabel(section: string): string {
  switch (section) {
    case "summary":
      return $localize`:audit.section.summary|Section label@@auditSectionSummary:Résumé`;
    case "executiveSection":
      return $localize`:audit.section.executive|Section label@@auditSectionExecutive:Executive`;
    case "prioritySection":
      return $localize`:audit.section.priority|Section label@@auditSectionPriority:Priorités`;
    case "executionSection":
      return $localize`:audit.section.execution|Section label@@auditSectionExecution:Exécution`;
    case "clientCommsSection":
      return $localize`:audit.section.clientComms|Section label@@auditSectionClientComms:Message client`;
    default:
      return section;
  }
}

/** Retourne les classes CSS Tailwind pour un badge de section selon son statut. */
export function sectionBadgeClass(status: string): string {
  switch (status) {
    case "completed":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "failed":
      return "bg-red-100 text-red-700 border-red-200";
    case "fallback":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "started":
      return "bg-sky-100 text-sky-800 border-sky-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

// ---------------------------------------------------------------------------
// Extraction safe de valeurs
// ---------------------------------------------------------------------------

/** Extrait un Record depuis une valeur inconnue, ou retourne null. */
export function extractRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

/** Extrait une chaine depuis une valeur inconnue, ou retourne "". */
export function extractString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Extrait un tableau de chaines depuis une valeur inconnue. */
export function extractStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => extractString(entry))
    .filter((entry) => entry.length > 0);
}

// ---------------------------------------------------------------------------
// Construction des badges de section
// ---------------------------------------------------------------------------

/** Construit la liste des badges de section a afficher. */
export function buildSectionBadges(
  statuses: Record<string, unknown>,
): AuditSectionBadge[] {
  const sections = [
    "summary",
    "executiveSection",
    "prioritySection",
    "executionSection",
    "clientCommsSection",
  ];

  return sections
    .map((key) => ({
      key,
      label: formatSectionLabel(key),
      status: extractString(statuses[key]) || "pending",
    }))
    .filter((entry) => entry.status !== "pending");
}

// ---------------------------------------------------------------------------
// Formatage de l'etape de progression
// ---------------------------------------------------------------------------

/** Formate le libelle de l'etape de progression avec un compteur optionnel. */
export function formatProgressStep(event: {
  step?: string | null;
  details?: Record<string, unknown>;
}): string {
  const base = event.step ?? "Audit en cours...";
  if (/\(\d+\/\d+\)/.test(base)) {
    return base;
  }
  const details = event.details;
  if (!details) return base;

  const done = Number(details["done"]);
  const total = Number(details["total"]);
  if (!Number.isFinite(done) || !Number.isFinite(total) || total <= 0) {
    return base;
  }

  return `${base} (${Math.max(0, done)}/${Math.max(1, total)})`;
}

// ---------------------------------------------------------------------------
// Formatage du texte de resume
// ---------------------------------------------------------------------------

/** Formate le texte brut du resume d'audit en supprimant le markdown et en structurant les sections. */
export function formatSummaryText(
  summaryText: string | null | undefined,
): string {
  if (!summaryText) return "";

  const sectionLabels =
    "(Contexte|Context|Blocages?|Blockers?|Impacts?\\s+business|Business\\s+impact|Priorit[eé]s?\\s+imm[eé]diates?|Immediate\\s+priorities)";
  const prioritiesLabel =
    "(Priorit[eé]s?\\s+imm[eé]diates?|Immediate\\s+priorities)";

  return summaryText
    .replace(/\r\n?/g, "\n")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .trim()
    .replace(
      new RegExp(`([^\\n])\\s+${sectionLabels}\\s*:`, "gi"),
      "$1\n\n$2 :",
    )
    .replace(
      new RegExp(`${prioritiesLabel}\\s*:\\s*(\\d+[).])`, "gi"),
      "$1 :\n$2",
    )
    .replace(/\s+(\d+[).])\s*/g, "\n$1 ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
