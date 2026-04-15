import { CommonModule, isPlatformBrowser } from "@angular/common";
import type { OnDestroy } from "@angular/core";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  PLATFORM_ID,
  inject,
} from "@angular/core";
import type { NgForm } from "@angular/forms";
import { FormsModule } from "@angular/forms";
import type { Subscription } from "rxjs";
import type { ClientReport } from "../../core/models/audit-client-report.model";
import type {
  AuditContactMethod,
  AuditRequestPayload,
  AuditStreamEvent,
  AuditSummaryResponse,
} from "../../core/models/audit-request.model";
import type { AuditRequestPort } from "../../core/ports/audit-request.port";
import { AUDIT_REQUEST_PORT } from "../../core/ports/audit-request.port";
import { handleFormSubmit } from "../../shared/utils/form-submit.utils";
import type { FaqItem } from "../../shared/components/faq-section/faq-section.component";
import { FaqSectionComponent } from "../../shared/components/faq-section/faq-section.component";
import { HeroSectionComponent } from "../../shared/components/hero-section/hero-section.component";
import { AuditClientReportSectionComponent } from "./components/audit-client-report-section/audit-client-report-section.component";
import {
  type AuditSectionBadge,
  buildSectionBadges,
  extractRecord,
  extractString,
  extractStringArray,
  formatPhaseLabel,
  formatProgressStep,
  formatSummaryText,
  formatSubTaskLabel,
  formatTaskLabel,
  sectionBadgeClass as sectionBadgeClassFn,
} from "./growth-audit-format.utils";

interface AuditPillar {
  title: string;
  description: string;
}

@Component({
  selector: "app-growth-audit",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeroSectionComponent,
    FaqSectionComponent,
    AuditClientReportSectionComponent,
  ],
  templateUrl: "./growth-audit.component.html",
  styleUrl: "./growth-audit.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GrowthAuditComponent implements OnDestroy {
  private readonly auditService: AuditRequestPort = inject(AUDIT_REQUEST_PORT);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
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
  /** Rapport client structuré produit par l'étape LLM (Phase 7+ backend). */
  clientReport: ClientReport | null = null;
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

  readonly faqTitle = $localize`:audit.faq.title@@auditFaqTitle:Questions fréquentes sur l'audit gratuit`;
  readonly faqDescription = $localize`:audit.faq.description@@auditFaqDescription:Ce que vous devez savoir avant de demander votre audit de croissance en 15 points.`;
  readonly faqItems: readonly FaqItem[] = [
    {
      question: $localize`:audit.faq.q1@@auditFaqQ1:Comment fonctionne l'audit gratuit en 24 heures ?`,
      answer: $localize`:audit.faq.a1@@auditFaqA1:Vous laissez l'URL de votre site et votre contact. Un premier scan IA analyse vos pages en moins de 5 minutes (SEO, performance, signaux de conversion). Puis, sous 24h, je reprends l'analyse moi-même et vous envoie une vidéo personnalisée, une scorecard claire et un plan d'actions priorisé par impact/effort.`,
    },
    {
      question: $localize`:audit.faq.q2@@auditFaqQ2:Que contient concrètement l'audit en 15 points ?`,
      answer: $localize`:audit.faq.a2@@auditFaqA2:L'audit couvre cinq piliers : conversion et clarté, vitesse et performance (Core Web Vitals), SEO fondations (titres, meta, indexation, SEO local), crédibilité et confiance, tech et scalabilité. Vous recevez une scorecard, des quick wins et des recommandations priorisées.`,
    },
    {
      question: $localize`:audit.faq.q3@@auditFaqQ3:L'audit est-il vraiment gratuit ?`,
      answer: $localize`:audit.faq.a3@@auditFaqA3:Oui, totalement. Aucun engagement, aucune carte bancaire demandée. Je limite à 5 audits par semaine pour garantir un rendu humain sous 24h. L'objectif est de vous apporter de la valeur immédiatement, et de démarrer un échange pertinent si vous le souhaitez.`,
    },
    {
      question: $localize`:audit.faq.q4@@auditFaqQ4:Qui réalise l'audit : une IA ou un humain ?`,
      answer: $localize`:audit.faq.a4@@auditFaqA4:Les deux. Un premier scan automatisé tourne instantanément via un pipeline IA (Langchain + OpenAI). Ensuite, je réalise l'audit humain moi-même pour prioriser, contextualiser et formuler des recommandations concrètes adaptées à votre situation.`,
    },
    {
      question: $localize`:audit.faq.q5@@auditFaqQ5:Pour quels types de sites l'audit est-il pertinent ?`,
      answer: $localize`:audit.faq.a5@@auditFaqA5:L'audit est pertinent pour les sites vitrines, sites e-commerce, landing pages et applications métier web. Il est particulièrement adapté aux TPE, PME, indépendants et artisans qui veulent améliorer leur visibilité SEO et leur taux de conversion sans se perdre dans la technique.`,
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
    return formatSummaryText(this.auditSummary?.summaryText);
  }

  private getLocaleUrlPrefix(): "fr" | "en" {
    if (!this.isBrowser) {
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
    this.clientReport = null;
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

    handleFormSubmit(this.auditService.submit(payload), this.cdr, {
      fallbackError: this.formLabels.error,
      onSuccess: (response) => {
        if (response.httpCode !== 201 || !response.auditId) {
          this.errorMessage = response.message || this.formLabels.error;
          return;
        }

        this.successMessage = this.formLabels.success;
        this.auditId = response.auditId;
        this.auditProgress = 0;
        this.auditStep = $localize`:growthAudit.step.pending|Audit pending step@@auditStepPending:Audit en attente...`;
        this.resetAuditTimeline();
        this.isAuditRunning = true;
        this.reconnectAttempts = 0;
        this.startStream(response.auditId);
      },
      onError: (message) => {
        this.errorMessage = message;
      },
      onComplete: () => {
        this.isSubmitting = false;
        this.isSubmitted = false;
        this.auditFormState = {
          websiteName: "",
          contactMethod: "EMAIL",
          contactValue: "",
        };
        form.resetForm(this.auditFormState);
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
      this.auditStep = formatProgressStep(event.data);
      this.applyProgressDetails(event.data.details);
      this.isAuditRunning = true;
      this.cdr.markForCheck();
      return;
    }

    if (event.type === "completed") {
      this.auditProgress = event.data.progress ?? 100;
      this.auditStep = $localize`:growthAudit.step.completed|Audit completed step@@auditStepCompleted:Audit terminé`;
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
      this.clientReport = event.data.clientReport ?? null;
      this.cdr.markForCheck();
      return;
    }

    this.isAuditRunning = false;
    this.resetAuditTimeline();
    this.errorMessage =
      event.data.error ||
      $localize`:growthAudit.error.failed|Audit failed message@@auditErrorFailed:L'audit a échoué.`;
    this.cdr.markForCheck();
  }

  private recoverFromSummary(auditId: string): void {
    this.auditService.getSummary(auditId).subscribe({
      next: (summary) => {
        if (summary.ready || summary.status === "COMPLETED") {
          this.auditSummary = summary;
          this.auditProgress = summary.progress;
          this.auditStep = $localize`:growthAudit.step.completed|Audit completed step@@auditStepCompleted:Audit terminé`;
          this.resetAuditTimeline();
          this.isAuditRunning = false;
          this.errorMessage = undefined;
          this.cdr.markForCheck();
          return;
        }

        if (summary.status === "FAILED") {
          this.isAuditRunning = false;
          this.resetAuditTimeline();
          this.errorMessage = $localize`:growthAudit.error.failed|Audit failed message@@auditErrorFailed:L'audit a échoué.`;
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
        this.errorMessage = $localize`:growthAudit.error.connectionLost|Connection lost during audit@@auditErrorConnectionLost:Connexion interrompue pendant l'audit. Rechargez la page pour vérifier le résultat.`;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isAuditRunning = false;
        this.resetAuditTimeline();
        this.errorMessage = $localize`:growthAudit.error.summaryFetch|Summary fetch error@@auditErrorSummaryFetch:Impossible de récupérer le résumé de l'audit pour le moment.`;
        this.cdr.markForCheck();
      },
    });
  }

  private stopStream(): void {
    this.streamSub?.unsubscribe();
    this.streamSub = undefined;
  }

  private applyProgressDetails(details?: Record<string, unknown>): void {
    const payload = extractRecord(details);
    if (!payload) {
      this.resetAuditTimeline();
      return;
    }

    const phase = extractString(payload["phase"]);
    this.auditPhaseLabel = formatPhaseLabel(phase);
    this.auditCurrentUrl = extractString(payload["currentUrl"]);
    this.auditIaTask = formatTaskLabel(extractString(payload["iaTask"]));
    this.auditIaSubTask = formatSubTaskLabel(
      extractString(payload["iaSubTask"]),
    );
    this.auditRecentCompletedUrls = extractStringArray(
      payload["recentCompletedUrls"],
    ).slice(-5);

    const statuses = extractRecord(payload["sectionStatuses"]) ?? {};
    const section = extractString(payload["section"]);
    const sectionStatus = extractString(payload["sectionStatus"]);
    if (section && sectionStatus) {
      statuses[section] = sectionStatus;
    }
    this.auditSectionBadges = buildSectionBadges(statuses);
  }

  sectionBadgeClass(status: string): string {
    return sectionBadgeClassFn(status);
  }

  private resetAuditTimeline(): void {
    this.auditPhaseLabel = "";
    this.auditCurrentUrl = "";
    this.auditIaTask = "";
    this.auditIaSubTask = "";
    this.auditRecentCompletedUrls = [];
    this.auditSectionBadges = [];
  }
}
