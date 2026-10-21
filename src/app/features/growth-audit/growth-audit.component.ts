import { CommonModule } from '@angular/common';
import type { OnDestroy } from '@angular/core';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import type { NgForm } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import type { Subscription } from 'rxjs';
import { dureeMonotoneDepuis, instantMonotone } from '../../../cours/runtime/core/duree';
import { injecterLocaleDeLaPage } from '../../core/config/locale-de-la-page';
import type { ClientReport } from '../../core/models/audit-client-report.model';
import type {
  AvancementDAudit,
  MethodeDeContact as AuditContactMethod,
} from '../../../../contrat/types.gen';
import {
  type AuditRequestPayload,
  type AuditStreamEvent,
  type AuditSummaryResponse,
  type PillarKey,
  PILLAR_KEYS,
} from '../../core/models/audit-request.model';
import type { AuditRequestPort } from '../../core/ports/audit-request.port';
import { AUDIT_REQUEST_PORT } from '../../core/ports/audit-request.port';
import { handleFormSubmit } from '../../shared/utils/form-submit.utils';
import type { FaqItem } from '../../shared/components/faq-section/faq-section.component';
import { FaqSectionComponent } from '../../shared/components/faq-section/faq-section.component';
import { FieldErrorsComponent } from '../../shared/components/field-errors/field-errors.component';
import { HeroSectionComponent } from '../../shared/components/hero-section/hero-section.component';
import { BornesDeSaisieDirective } from '../../shared/directives/bornes-de-saisie.directive';
import { FormatDeContactDirective } from '../../shared/directives/format-de-contact.directive';
import { HoneypotDirective } from '../../shared/directives/honeypot.directive';
import { readCheckboxChecked } from '../../shared/utils/dom-event.utils';
import {
  BORNES_D_UN_CONTACT_D_AUDIT,
  BORNES_D_UN_NOM_DE_SITE,
} from '../../shared/utils/regles-de-saisie';
import { AuditClientReportSectionComponent } from './components/audit-client-report-section/audit-client-report-section.component';
import {
  type AuditSectionBadge,
  buildSectionBadges,
  formatPhaseLabel,
  formatProgressStep,
  formatSummaryText,
  formatSubTaskLabel,
  formatTaskLabel,
  sectionBadgeClass as sectionBadgeClassFn,
} from './growth-audit-format.utils';

interface AuditPillar {
  title: string;
  description: string;
}

function formulaireVierge(): AuditRequestPayload {
  return {
    website: '',
    websiteName: '',
    contactMethod: 'EMAIL',
    contactValue: '',
  };
}

@Component({
  selector: 'app-growth-audit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeroSectionComponent,
    FaqSectionComponent,
    AuditClientReportSectionComponent,
    FieldErrorsComponent,
    BornesDeSaisieDirective,
    FormatDeContactDirective,
    HoneypotDirective,
  ],
  templateUrl: './growth-audit.component.html',
  styleUrl: './growth-audit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GrowthAuditComponent implements OnDestroy {
  private readonly auditService: AuditRequestPort = inject(AUDIT_REQUEST_PORT);
  private readonly cdr = inject(ChangeDetectorRef);
  private debutDeSaisie = instantMonotone();
  private readonly langue = injecterLocaleDeLaPage();
  protected readonly iaTaskFallback = $localize`:@@auditIaTaskFallback:IA`;
  protected readonly bornesDuNomDeSite = BORNES_D_UN_NOM_DE_SITE;
  protected readonly bornesDuContact = BORNES_D_UN_CONTACT_D_AUDIT;

  private streamSub?: Subscription;
  private reconnectAttempts = 0;

  isSubmitting = false;
  isSubmitted = false;
  isAuditRunning = false;
  successMessage?: string;
  errorMessage?: string;
  auditId?: string;
  auditProgress = 0;
  auditStep = '';
  auditSummary?: AuditSummaryResponse;
  clientReport: ClientReport | null = null;
  auditPhaseLabel = '';
  auditCurrentUrl = '';
  auditIaTask = '';
  auditIaSubTask = '';
  auditRecentCompletedUrls: string[] = [];
  auditSectionBadges: AuditSectionBadge[] = [];

  readonly hero = {
    label: $localize`:audit.hero.label@@auditHeroLabel:Audit gratuit (IA + humain, 24h)`,
    title: $localize`:audit.hero.title@@auditHeroTitle:Audit Growth — scorecard 7 piliers`,
    description: $localize`:audit.hero.description@@auditHeroDescription:Vous laissez votre site → je lance un premier scan IA (analyse des pages, SEO, performance, conversion, visibilité IA). Ensuite, sous 24h, je repasse l'audit moi-même et je vous envoie une scorecard claire, un rapport PDF détaillé et des recommandations concrètes priorisées par impact/effort.`,
  };

  readonly steps = [
    {
      title: $localize`:audit.steps.one.title@@auditStepOneTitle:1. Vous laissez vos infos`,
      description: $localize`:audit.steps.one.desc@@auditStepOneDesc:Nom du site ou URL + contact (email ou téléphone).`,
    },
    {
      title: $localize`:audit.steps.two.title@@auditStepTwoTitle:2. Audit instantané (IA)`,
      description: $localize`:audit.steps.two.desc@@auditStepTwoDesc:Je scanne vos pages (SEO, performance, conversion, visibilité IA) et je sors un premier diagnostic rapide.`,
    },
    {
      title: $localize`:audit.steps.three.title@@auditStepThreeTitle:3. Audit humain sous 24h`,
      description: $localize`:audit.steps.three.desc@@auditStepThreeDesc:Je reprends l'analyse moi-même, je priorise, et je vous envoie la scorecard, le rapport PDF détaillé et un plan d'actions concret.`,
      highlights: [
        $localize`:audit.highlights.pdf@@auditHighlightsPdf:Rapport PDF détaillé`,
        $localize`:audit.highlights.score@@auditHighlightsScore:Scorecard claire`,
        $localize`:audit.highlights.wins@@auditHighlightsWins:Quick wins + priorités (impact/effort)`,
        $localize`:audit.highlights.noObligation@@auditHighlightsNoObligation:Aucun engagement`,
      ],
    },
  ];

  readonly faqTitle = $localize`:audit.faq.title@@auditFaqTitle:Questions fréquentes sur l'audit gratuit`;
  readonly faqDescription = $localize`:audit.faq.description@@auditFaqDescription:Ce que vous devez savoir avant de demander votre audit Growth — scorecard 7 piliers + recommandations priorisées.`;
  readonly faqItems: readonly FaqItem[] = [
    {
      question: $localize`:audit.faq.q1@@auditFaqQ1:Comment fonctionne l'audit gratuit en 24 heures ?`,
      answer: $localize`:audit.faq.a1@@auditFaqA1:Vous laissez l'URL de votre site et votre contact. Un premier scan IA analyse vos pages en moins de 5 minutes (SEO, performance, signaux de conversion, visibilité IA). Puis, sous 24h, je reprends l'analyse moi-même et vous envoie une scorecard claire, un rapport PDF détaillé et un plan d'actions priorisé par impact/effort.`,
    },
    {
      question: $localize`:audit.faq.q2@@auditFaqQ2:Que contient concrètement l'audit Growth ?`,
      answer: $localize`:audit.faq.a2@@auditFaqA2:L'audit couvre sept piliers : SEO fondations (titres, meta, indexation, SEO local), vitesse et performance (Core Web Vitals), tech et scalabilité, crédibilité et confiance, conversion et clarté, visibilité IA (ChatGPT / Perplexity / Gemini) et citabilité (llms.txt, FAQ, sources). Vous recevez une scorecard, des quick wins et des recommandations priorisées.`,
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
    {
      title: $localize`:audit.pillar.aiVisibility.title@@auditPillarAiVisibilityTitle:Visibilité IA`,
      description: $localize`:audit.pillar.aiVisibility.desc@@auditPillarAiVisibilityDesc:Compréhension par les assistants IA, données structurées, réponses génératives.`,
    },
    {
      title: $localize`:audit.pillar.citationWorthiness.title@@auditPillarCitationWorthinessTitle:Citabilité`,
      description: $localize`:audit.pillar.citationWorthiness.desc@@auditPillarCitationWorthinessDesc:Sources, preuves, FAQ et contenus que les moteurs peuvent citer.`,
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
    rgpdLabel: $localize`:audit.form.rgpdLabel@@auditFormRgpdLabel:J'accepte que mes coordonnées soient utilisées pour traiter ma demande d'audit (voir <a href="/fr/privacy" class="underline">politique de confidentialité</a>).`,
    rgpdError: $localize`:audit.form.rgpdError@@auditFormRgpdError:Votre consentement RGPD est obligatoire pour lancer l'audit.`,
  };

  auditFormState: AuditRequestPayload = formulaireVierge();

  private readonly etapeTerminee = $localize`:growthAudit.step.completed|Audit completed step@@auditStepCompleted:Audit terminé`;
  private readonly echecDeLAudit = $localize`:growthAudit.error.failed|Audit failed message@@auditErrorFailed:L'audit a échoué.`;

  private readonly connexionPerdue = $localize`:growthAudit.error.connectionLost|Connection lost during audit@@auditErrorConnectionLost:Connexion interrompue pendant l'audit. Rechargez la page pour vérifier le résultat.`;

  rgpdConsent = false;

  get contactInputType(): 'email' | 'tel' {
    return this.auditFormState.contactMethod === 'EMAIL' ? 'email' : 'tel';
  }

  get contactPlaceholder(): string {
    return this.auditFormState.contactMethod === 'EMAIL'
      ? this.formLabels.emailPlaceholder
      : this.formLabels.phonePlaceholder;
  }

  get scoreEntries(): Array<{ key: PillarKey; score: number }> {
    const scores = this.auditSummary?.pillarScores ?? {};
    return PILLAR_KEYS.flatMap((key) => {
      const score = scores[key];
      return score === undefined ? [] : [{ key, score }];
    });
  }

  get formattedSummaryText(): string {
    return formatSummaryText(this.auditSummary?.summaryText);
  }

  onContactMethodToggle(event: Event): void {
    const isPhone = readCheckboxChecked(event);
    const method: AuditContactMethod = isPhone ? 'PHONE' : 'EMAIL';
    this.handleMethodChange(method);
  }

  handleMethodChange(method: AuditContactMethod): void {
    const changed = this.auditFormState.contactMethod !== method;
    this.auditFormState.contactMethod = method;
    if (changed) {
      this.auditFormState.contactValue = '';
    }
  }

  submit(form: NgForm): void {
    this.isSubmitted = true;
    this.errorMessage = undefined;
    this.successMessage = undefined;
    this.auditSummary = undefined;
    this.clientReport = null;
    this.stopStream();

    if (!this.rgpdConsent) {
      this.errorMessage = this.formLabels.rgpdError;
      this.cdr.markForCheck();
      return;
    }

    if (!form.valid) {
      this.errorMessage = this.formLabels.error;
      this.cdr.markForCheck();
      return;
    }

    this.isSubmitting = true;
    const payload = {
      website: this.auditFormState.website,
      formFillDurationMs: dureeMonotoneDepuis(this.debutDeSaisie),
      locale: this.langue,
      websiteName: this.auditFormState.websiteName.trim(),
      contactMethod: this.auditFormState.contactMethod,
      contactValue: this.auditFormState.contactValue.trim(),
    };

    handleFormSubmit(this.auditService.submit(payload), this.cdr, {
      fallbackError: this.formLabels.error,
      refus: {
        400: $localize`:@@auditFormErreurRefus:La demande n’a pas été acceptée : vérifiez l’adresse du site et votre moyen de contact.`,
      },
      onSuccess: (response) => {
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
        this.isSubmitted = false;
        this.auditFormState = formulaireVierge();
        this.debutDeSaisie = instantMonotone();
        this.rgpdConsent = false;
        form.resetForm(this.auditFormState);
      },
      finalement: () => {
        this.isSubmitting = false;
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
    if (event.event === 'heartbeat') {
      return;
    }

    if (event.event === 'progress') {
      this.auditProgress = event.data.progress ?? 0;
      this.auditStep = formatProgressStep(event.data);
      this.applyProgressDetails(event.data.details);
      this.isAuditRunning = true;
      this.cdr.markForCheck();
      return;
    }

    if (event.event === 'completed') {
      this.terminerLAudit(event.data.progress ?? 100);
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

    const delaiDepasse = event.event === 'timeout';
    this.arreterLAudit(delaiDepasse ? this.connexionPerdue : this.echecDeLAudit);
  }

  private recoverFromSummary(auditId: string): void {
    this.auditService.getSummary(auditId).subscribe({
      next: (summary) => {
        if (summary.ready || summary.status === 'COMPLETED') {
          this.auditSummary = summary;
          this.terminerLAudit(summary.progress);
          this.errorMessage = undefined;
          this.cdr.markForCheck();
          return;
        }

        if (summary.status === 'FAILED') {
          this.arreterLAudit(this.echecDeLAudit);
          return;
        }

        if (this.reconnectAttempts < 3) {
          this.reconnectAttempts += 1;
          this.startStream(auditId);
          return;
        }

        this.arreterLAudit(this.connexionPerdue);
      },
      error: () => {
        this.arreterLAudit(
          $localize`:growthAudit.error.summaryFetch|Summary fetch error@@auditErrorSummaryFetch:Impossible de récupérer le résumé de l'audit pour le moment.`,
        );
      },
    });
  }

  private terminerLAudit(progression: number): void {
    this.auditProgress = progression;
    this.auditStep = this.etapeTerminee;
    this.resetAuditTimeline();
    this.isAuditRunning = false;
  }

  private arreterLAudit(message: string): void {
    this.isAuditRunning = false;
    this.resetAuditTimeline();
    this.errorMessage = message;
    this.cdr.markForCheck();
  }

  private stopStream(): void {
    this.streamSub?.unsubscribe();
    this.streamSub = undefined;
  }

  private applyProgressDetails(details?: AvancementDAudit): void {
    if (details === undefined) {
      this.resetAuditTimeline();
      return;
    }

    this.auditPhaseLabel = formatPhaseLabel(details.phase);
    this.auditIaTask = formatTaskLabel(details.iaTask);
    this.auditIaSubTask = formatSubTaskLabel(details.iaSubTask);
    this.auditCurrentUrl = 'currentUrl' in details ? details.currentUrl : '';
    this.auditRecentCompletedUrls =
      'recentCompletedUrls' in details ? details.recentCompletedUrls.slice(-5) : [];
    this.auditSectionBadges =
      'section' in details
        ? buildSectionBadges({
            ...details.sectionStatuses,
            [details.section]: details.sectionStatus,
          })
        : [];
  }

  sectionBadgeClass(status: string): string {
    return sectionBadgeClassFn(status);
  }

  private resetAuditTimeline(): void {
    this.auditPhaseLabel = '';
    this.auditCurrentUrl = '';
    this.auditIaTask = '';
    this.auditIaSubTask = '';
    this.auditRecentCompletedUrls = [];
    this.auditSectionBadges = [];
  }
}
