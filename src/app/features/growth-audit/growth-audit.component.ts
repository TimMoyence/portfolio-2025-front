import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  inject,
} from "@angular/core";
import { FormsModule, NgForm } from "@angular/forms";
import { Subscription } from "rxjs";
import {
  AuditContactMethod,
  AuditRequestPayload,
  AuditStreamEvent,
  AuditSummaryResponse,
} from "../../core/models/audit-request.model";
import { AuditRequestService } from "../../core/services/audit-request.service";
import { HeroSectionComponent } from "../../shared/components/hero-section/hero-section.component";

interface AuditPillar {
  title: string;
  description: string;
}

interface AuditSectionBadge {
  key: string;
  label: string;
  status: string;
}

@Component({
  selector: "app-growth-audit",
  standalone: true,
  imports: [CommonModule, FormsModule, HeroSectionComponent],
  templateUrl: "./growth-audit.component.html",
  styleUrl: "./growth-audit.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GrowthAuditComponent implements OnDestroy {
  private readonly auditService = inject(AuditRequestService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly localeUrlPrefix = this.getLocaleUrlPrefix();

  private streamSub?: Subscription;
  private reconnectAttempts = 0;

  isSubmitting = false;
  isSubmitted = false;
  isAuditRunning = false;
  successMessage?: string;
  errorMessage?: string;
  auditId?: string;
  auditProgress = 0;
  auditStep = "";
  auditSummary?: AuditSummaryResponse;
  auditPhaseLabel = "";
  auditCurrentUrl = "";
  auditIaTask = "";
  auditIaSubTask = "";
  auditRecentCompletedUrls: string[] = [];
  auditSectionBadges: AuditSectionBadge[] = [];

  readonly hero = {
    label: $localize`:audit.hero.label@@auditHeroLabel:Audit gratuit (IA + humain, 24h)`,
    title: $localize`:audit.hero.title@@auditHeroTitle:Audit de croissance en 15 points`,
    description: $localize`:audit.hero.description@@auditHeroDescription:Vous laissez votre site → je lance un premier scan IA (analyse des pages, SEO, performance, signaux de conversion). Ensuite, sous 24h, je réalise l’audit moi-même et je vous envoie une vidéo + une scorecard claire + des recommandations concrètes pour gagner en visibilité et en clients.`,
  };

  readonly steps = [
    {
      title: $localize`:audit.steps.one.title@@auditStepOneTitle:1. Vous laissez vos infos`,
      description: $localize`:audit.steps.one.desc@@auditStepOneDesc:Nom du site ou URL + contact (email ou téléphone).`,
    },
    {
      title: $localize`:audit.steps.two.title@@auditStepTwoTitle:2. Audit instantané (IA)`,
      description: $localize`:audit.steps.two.desc@@auditStepTwoDesc:Je scanne vos pages (SEO, performance, conversion) et je sors un premier diagnostic rapide.`,
    },
    {
      title: $localize`:audit.steps.three.title@@auditStepThreeTitle:3. Audit humain sous 24h`,
      description: $localize`:audit.steps.three.desc@@auditStepThreeDesc:Je reprends l’analyse moi-même, je priorise, et je vous envoie une vidéo + une scorecard + un plan d’actions.`,
      highlights: [
        $localize`:audit.highlights.video@@auditHighlightsVideo:Vidéo personnalisée`,
        $localize`:audit.highlights.score@@auditHighlightsScore:Scorecard claire`,
        $localize`:audit.highlights.wins@@auditHighlightsWins:Quick wins + priorités (impact/effort)`,
        $localize`:audit.highlights.noObligation@@auditHighlightsNoObligation:Aucun engagement`,
      ],
    },
  ];

  readonly pillars: AuditPillar[] = [
    {
      title: $localize`:audit.pillar.conversion.title@@auditPillarConversionTitle:Conversion & clarté`,
      description: $localize`:audit.pillar.conversion.desc@@auditPillarConversionDesc:Proposition de valeur, CTA, friction contact, mobile.`,
    },
    {
      title: $localize`:audit.pillar.performance.title@@auditPillarPerformanceTitle:Vitesse & performance`,
      description: $localize`:audit.pillar.performance.desc@@auditPillarPerformanceDesc:PageSpeed, poids images, Core Web Vitals.`,
    },
    {
      title: $localize`:audit.pillar.seo.title@@auditPillarSeoTitle:SEO fondations`,
      description: $localize`:audit.pillar.seo.desc@@auditPillarSeoDesc:Titres, H1, meta, indexation, SEO local.`,
    },
    {
      title: $localize`:audit.pillar.trust.title@@auditPillarTrustTitle:Crédibilité & confiance`,
      description: $localize`:audit.pillar.trust.desc@@auditPillarTrustDesc:Preuves sociales, portfolio, signaux de confiance.`,
    },
    {
      title: $localize`:audit.pillar.tech.title@@auditPillarTechTitle:Tech & scalabilité`,
      description: $localize`:audit.pillar.tech.desc@@auditPillarTechDesc:CMS, sécurité, erreurs, maintenabilité.`,
    },
  ];

  readonly formLabels = {
    title: $localize`:audit.form.title@@auditFormTitle:Demander un audit gratuit`,
    description: $localize`:audit.form.description@@auditFormDescription:Je limite à 5 audits par semaine pour garantir un rendu humain sous 24h.`,
    websiteLabel: $localize`:audit.form.websiteLabel@@auditFormWebsiteLabel:Nom du site ou URL`,
    websitePlaceholder: $localize`:audit.form.websitePlaceholder@@auditFormWebsitePlaceholder:ex. https://votresite.fr`,
    contactMethodLabel: $localize`:audit.form.contactMethodLabel@@auditFormContactMethodLabel:Méthode de contact`,
    emailOption: $localize`:audit.form.contactEmail@@auditFormContactEmail:Email`,
    phoneOption: $localize`:audit.form.contactPhone@@auditFormContactPhone:Téléphone`,
    contactValueLabel: $localize`:audit.form.contactValueLabel@@auditFormContactValueLabel:Coordonnée`,
    emailPlaceholder: $localize`:audit.form.emailPlaceholder@@auditFormEmailPlaceholder:ex. hello@votresite.fr`,
    phonePlaceholder: $localize`:audit.form.phonePlaceholder@@auditFormPhonePlaceholder:ex. +33 6 98 50 32 82`,
    submit: $localize`:audit.form.submit@@auditFormSubmit:Demander mon audit (scan IA immédiat + audit humain sous 24h)`,
    success: $localize`:audit.form.success@@auditFormSuccess:Merci ! Scan IA lancé — audit humain envoyé sous 24h.`,
    error: $localize`:audit.form.error@@auditFormError:Impossible d'envoyer la demande. Réessayez dans un instant.`,
  };

  auditFormState: AuditRequestPayload = {
    websiteName: "",
    contactMethod: "EMAIL" as AuditContactMethod,
    contactValue: "",
  };

  get contactInputType(): "email" | "tel" {
    return this.auditFormState.contactMethod === "EMAIL" ? "email" : "tel";
  }

  get contactPlaceholder(): string {
    return this.auditFormState.contactMethod === "EMAIL"
      ? this.formLabels.emailPlaceholder
      : this.formLabels.phonePlaceholder;
  }

  get scoreEntries(): Array<{ key: string; score: number }> {
    if (!this.auditSummary) return [];
    return Object.entries(this.auditSummary.pillarScores).map(
      ([key, score]) => ({
        key,
        score,
      }),
    );
  }

  get formattedSummaryText(): string {
    return this.formatSummaryText(this.auditSummary?.summaryText);
  }

  private getLocaleUrlPrefix(): "fr" | "en" {
    if (typeof window === "undefined") {
      return "fr";
    }

    const [, locale] =
      window.location.pathname.toLowerCase().match(/\/(fr|en)(?=\/|$)/) ?? [];

    if (locale === undefined) return "fr";

    return locale === "fr" ? "fr" : "en";
  }

  onContactMethodToggle(event: Event): void {
    const isPhone = (event.target as HTMLInputElement).checked;
    const method: AuditContactMethod = isPhone ? "PHONE" : "EMAIL";
    this.handleMethodChange(method);
  }

  handleMethodChange(method: AuditContactMethod): void {
    const changed = this.auditFormState.contactMethod !== method;
    this.auditFormState.contactMethod = method;
    if (changed) {
      this.auditFormState.contactValue = "";
    }
  }

  submit(form: NgForm): void {
    this.isSubmitted = true;
    this.errorMessage = undefined;
    this.successMessage = undefined;
    this.auditSummary = undefined;
    this.stopStream();

    if (!form.valid) {
      this.errorMessage = this.formLabels.error;
      this.cdr.markForCheck();
      return;
    }

    this.isSubmitting = true;
    const payload = {
      locale: this.localeUrlPrefix,
      websiteName: this.auditFormState.websiteName.trim(),
      contactMethod: this.auditFormState.contactMethod,
      contactValue: this.auditFormState.contactValue.trim(),
    };

    this.auditService.submit(payload).subscribe({
      next: (response) => {
        if (response.httpCode !== 201 || !response.auditId) {
          this.errorMessage = response.message || this.formLabels.error;
          return;
        }

        this.successMessage = this.formLabels.success;
        this.auditId = response.auditId;
        this.auditProgress = 0;
        this.auditStep = "Audit en attente...";
        this.resetAuditTimeline();
        this.isAuditRunning = true;
        this.reconnectAttempts = 0;
        this.startStream(response.auditId);
      },
      error: (error: any) => {
        const serverMessage = Array.isArray(error?.error?.message)
          ? error.error.message.join(" ")
          : error?.error?.message;
        this.errorMessage = serverMessage || this.formLabels.error;
      },
      complete: () => {
        this.isSubmitting = false;
        this.isSubmitted = false;
        this.auditFormState = {
          websiteName: "",
          contactMethod: "EMAIL",
          contactValue: "",
        };
        form.resetForm(this.auditFormState);
        this.cdr.markForCheck();
      },
    });
  }

  ngOnDestroy(): void {
    this.stopStream();
  }

  private startStream(auditId: string): void {
    this.stopStream();
    this.streamSub = this.auditService.stream(auditId).subscribe({
      next: (event) => this.handleStreamEvent(event),
      error: () => this.recoverFromSummary(auditId),
      complete: () => this.cdr.markForCheck(),
    });
  }

  private handleStreamEvent(event: AuditStreamEvent): void {
    if (event.type === "heartbeat") {
      return;
    }

    if (event.type === "progress") {
      this.auditProgress = event.data.progress ?? 0;
      this.auditStep = this.formatProgressStep(event.data);
      this.applyProgressDetails(event.data.details);
      this.isAuditRunning = true;
      this.cdr.markForCheck();
      return;
    }

    if (event.type === "completed") {
      this.auditProgress = event.data.progress ?? 100;
      this.auditStep = "Audit terminé";
      this.resetAuditTimeline();
      this.isAuditRunning = false;
      this.auditSummary = {
        auditId: event.data.auditId,
        ready: true,
        status: event.data.status,
        progress: event.data.progress,
        summaryText: event.data.summaryText,
        keyChecks: event.data.keyChecks,
        quickWins: event.data.quickWins,
        pillarScores: event.data.pillarScores,
      };
      this.cdr.markForCheck();
      return;
    }

    this.isAuditRunning = false;
    this.resetAuditTimeline();
    this.errorMessage = event.data.error || "L'audit a échoué.";
    this.cdr.markForCheck();
  }

  private recoverFromSummary(auditId: string): void {
    this.auditService.getSummary(auditId).subscribe({
      next: (summary) => {
        if (summary.ready || summary.status === "COMPLETED") {
          this.auditSummary = summary;
          this.auditProgress = summary.progress;
          this.auditStep = "Audit terminé";
          this.resetAuditTimeline();
          this.isAuditRunning = false;
          this.errorMessage = undefined;
          this.cdr.markForCheck();
          return;
        }

        if (summary.status === "FAILED") {
          this.isAuditRunning = false;
          this.resetAuditTimeline();
          this.errorMessage = "L'audit a échoué.";
          this.cdr.markForCheck();
          return;
        }

        if (this.reconnectAttempts < 3) {
          this.reconnectAttempts += 1;
          this.startStream(auditId);
          return;
        }

        this.isAuditRunning = false;
        this.resetAuditTimeline();
        this.errorMessage =
          "Connexion interrompue pendant l'audit. Rechargez la page pour vérifier le résultat.";
        this.cdr.markForCheck();
      },
      error: () => {
        this.isAuditRunning = false;
        this.resetAuditTimeline();
        this.errorMessage =
          "Impossible de récupérer le résumé de l'audit pour le moment.";
        this.cdr.markForCheck();
      },
    });
  }

  private stopStream(): void {
    this.streamSub?.unsubscribe();
    this.streamSub = undefined;
  }

  private formatProgressStep(event: {
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

  private applyProgressDetails(details?: Record<string, unknown>): void {
    const payload = this.extractRecord(details);
    if (!payload) {
      this.resetAuditTimeline();
      return;
    }

    const phase = this.extractString(payload["phase"]);
    this.auditPhaseLabel = this.formatPhaseLabel(phase);
    this.auditCurrentUrl = this.extractString(payload["currentUrl"]);
    this.auditIaTask = this.formatTaskLabel(
      this.extractString(payload["iaTask"]),
    );
    this.auditIaSubTask = this.formatSubTaskLabel(
      this.extractString(payload["iaSubTask"]),
    );
    this.auditRecentCompletedUrls = this.extractStringArray(
      payload["recentCompletedUrls"],
    ).slice(-5);

    const statuses = this.extractRecord(payload["sectionStatuses"]) ?? {};
    const section = this.extractString(payload["section"]);
    const sectionStatus = this.extractString(payload["sectionStatus"]);
    if (section && sectionStatus) {
      statuses[section] = sectionStatus;
    }
    this.auditSectionBadges = this.buildSectionBadges(statuses);
  }

  private buildSectionBadges(
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
        label: this.formatSectionLabel(key),
        status: this.extractString(statuses[key]) || "pending",
      }))
      .filter((entry) => entry.status !== "pending");
  }

  private formatPhaseLabel(phase: string): string {
    if (!phase) return "";
    switch (phase) {
      case "technical_pages":
        return "Scan technique des pages";
      case "page_ai_recaps":
        return "Micro-audits IA page par page";
      case "synthesis":
        return "Synthèse finale IA";
      default:
        return phase.replaceAll("_", " ");
    }
  }

  private formatTaskLabel(task: string): string {
    if (!task) return "";
    switch (task) {
      case "technical_scan":
        return "Scan technique";
      case "page_ai_recap":
        return "Analyse IA de page";
      case "synthesis":
        return "Synthèse IA";
      default:
        return task.replaceAll("_", " ");
    }
  }

  private formatSubTaskLabel(subTask: string): string {
    if (!subTask) return "";
    return subTask.replaceAll("_", " ");
  }

  private formatSectionLabel(section: string): string {
    switch (section) {
      case "summary":
        return "Résumé";
      case "executiveSection":
        return "Executive";
      case "prioritySection":
        return "Priorités";
      case "executionSection":
        return "Exécution";
      case "clientCommsSection":
        return "Message client";
      default:
        return section;
    }
  }

  sectionBadgeClass(status: string): string {
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

  private resetAuditTimeline(): void {
    this.auditPhaseLabel = "";
    this.auditCurrentUrl = "";
    this.auditIaTask = "";
    this.auditIaSubTask = "";
    this.auditRecentCompletedUrls = [];
    this.auditSectionBadges = [];
  }

  private extractRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return null;
    }
    return value as Record<string, unknown>;
  }

  private extractString(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
  }

  private extractStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
      .map((entry) => this.extractString(entry))
      .filter((entry) => entry.length > 0);
  }

  private formatSummaryText(summaryText: string | null | undefined): string {
    if (!summaryText) return "";

    const sectionLabels =
      "(Contexte|Context|Blocages?|Blockers?|Impacts?\\s+business|Business\\s+impact|Priorit[eé]s?\\s+imm[eé]diates?|Immediate\\s+priorities)";
    const prioritiesLabel =
      "(Priorit[eé]s?\\s+imm[eé]diates?|Immediate\\s+priorities)";

    return (
      summaryText
        // Normalize newlines
        .replace(/\r\n?/g, "\n")

        // Remove common markdown emphasis
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/__([^_]+)__/g, "$1")

        // IMPORTANT: keep \n, only normalize spaces/tabs
        .replace(/[ \t]+/g, " ")
        .replace(/ *\n */g, "\n")
        .trim()

        // Put each recognized section on its own paragraph (blank line before label)
        // " ... Contexte :" => "...\n\nContexte :"
        .replace(
          new RegExp(`([^\\n])\\s+${sectionLabels}\\s*:`, "gi"),
          "$1\n\n$2 :",
        )

        // If "Priorités immédiates : 1)" or "Priorités immédiates : 1." => newline after colon
        .replace(
          new RegExp(`${prioritiesLabel}\\s*:\\s*(\\d+[\\)\\.])`, "gi"),
          "$1 :\n$2",
        )

        // One item per line for BOTH "1)" and "1."
        .replace(/\s+(\d+[)\.])\s*/g, "\n$1 ")

        // Clean up too many blank lines
        .replace(/\n{3,}/g, "\n\n")
        .trim()
    );
  }
}
