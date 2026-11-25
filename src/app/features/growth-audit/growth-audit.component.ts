import { CommonModule, isPlatformBrowser } from '@angular/common';
import type { OnDestroy, OnInit } from '@angular/core';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import type { NgForm } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import type { Subscription } from 'rxjs';
import { jetonDuLien } from '../auth/reinitialisation/jeton-du-lien';
import { dureeMonotoneDepuis, instantMonotone } from '../../../cours/runtime/core/saisie/duree';
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
import { FieldErrorsComponent } from '../../shared/components/field-errors/field-errors.component';
import type { QuestionDeFaq } from '../../shared/offre/prix-et-delai';
import { AsiliFaqComponent, AsiliHeroComponent, type MorceauDeTitre } from '../../shared/sections';
import { BornesDeSaisieDirective } from '../../shared/directives/bornes-de-saisie.directive';
import { FormatDeContactDirective } from '../../shared/directives/format-de-contact.directive';
import { HoneypotDirective } from '../../shared/directives/honeypot.directive';
import { nomCourtServi } from '../../core/seo/site-servi';
import { COORDONNEES_DU_SITE } from '../../shared/data/coordonnees';
import { readCheckboxChecked } from '../../shared/utils/dom-event.utils';
import { zAuditRequestRequestDto } from '../../../../contrat/zod.gen';
import { bornesDu } from '../../shared/utils/saisie/regles-de-saisie';
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
import { PILIERS } from './piliers';

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
    AsiliHeroComponent,
    AsiliFaqComponent,
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
export class GrowthAuditComponent implements OnInit, OnDestroy {
  private readonly auditService: AuditRequestPort = inject(AUDIT_REQUEST_PORT);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dansLeNavigateur = isPlatformBrowser(inject(PLATFORM_ID));
  private debutDeSaisie = instantMonotone();
  private readonly langue = injecterLocaleDeLaPage();
  protected readonly iaTaskFallback = $localize`:@@auditIaTaskFallback:IA`;
  protected readonly bornesDuNomDeSite = bornesDu(zAuditRequestRequestDto.shape.websiteName);
  protected readonly bornesDuContact = bornesDu(zAuditRequestRequestDto.shape.contactValue);

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

  protected readonly heroKicker = $localize`:Kicker du diagnostic@@diagnosticKicker:${nomCourtServi('/growth-audit')}:nom: · IA et relecture humaine, sous 24 h`;

  protected readonly heroTitre: readonly MorceauDeTitre[] = [
    {
      texte: $localize`:audit.hero.title@@auditHeroTitle:Diagnostic gratuit : ce qui freine votre site, et quoi corriger d’abord`,
    },
  ];

  protected readonly heroLead = $localize`:audit.hero.description@@auditHeroDescription:Vous laissez l’adresse de votre site. Une première analyse automatique passe vos pages en revue : visibilité sur Google et dans les IA, vitesse, clarté, appels à l’action. Sous 24 h, je relis tout moi-même et je vous envoie une note claire, un rapport détaillé et les corrections à faire en premier.`;

  readonly steps = [
    {
      title: $localize`:audit.steps.one.title@@auditStepOneTitle:1. Vous laissez vos infos`,
    },
    {
      title: $localize`:audit.steps.two.title@@auditStepTwoTitle:2. Première analyse automatique`,
    },
    {
      title: $localize`:audit.steps.three.title@@auditStepThreeTitle:3. Diagnostic relu par moi sous 24 h`,
      highlights: [
        $localize`:audit.highlights.pdf@@auditHighlightsPdf:Rapport PDF détaillé`,
        $localize`:audit.highlights.score@@auditHighlightsScore:Une note claire, point par point`,
        $localize`:audit.highlights.wins@@auditHighlightsWins:Les corrections rapides d’abord, puis les priorités`,
        $localize`:audit.highlights.noObligation@@auditHighlightsNoObligation:Aucun engagement`,
      ],
    },
  ];

  readonly faqTitle = $localize`:audit.faq.title@@auditFaqTitle:Questions fréquentes sur le diagnostic gratuit`;
  readonly faqKicker = $localize`:@@auditFaqKicker:Questions fréquentes`;
  readonly faqItems: readonly QuestionDeFaq[] = [
    {
      question: $localize`:audit.faq.q1@@auditFaqQ1:Comment se déroule le diagnostic gratuit en 24 heures ?`,
      reponse: $localize`:audit.faq.a1@@auditFaqA1:Vous laissez l’adresse de votre site et votre contact. Une première analyse automatique passe vos pages en revue en quelques minutes. Puis, sous 24 h, je relis tout moi-même et vous envoie une note claire, un rapport détaillé et les corrections classées par priorité.`,
    },
    {
      question: $localize`:audit.faq.q2@@auditFaqQ2:Que contient le diagnostic ?`,
      reponse: $localize`:audit.faq.a2@@auditFaqA2:Le diagnostic passe en revue sept points : clarté et appels, vitesse, être trouvé sur Google, confiance, solidité du site, visibilité dans les IA et matière à citer. Vous recevez une note point par point, les corrections rapides d’abord, puis les priorités.`,
    },
    {
      question: $localize`:audit.faq.q3@@auditFaqQ3:Le diagnostic est-il vraiment gratuit ?`,
      reponse: $localize`:audit.faq.a3@@auditFaqA3:Oui, totalement. Aucun engagement, aucune carte bancaire. Je limite à 5 diagnostics par semaine pour relire chacun moi-même sous 24 h. Le but : vous être utile tout de suite, et ouvrir un échange si vous le souhaitez.`,
    },
    {
      question: $localize`:audit.faq.q4@@auditFaqQ4:Qui réalise le diagnostic : une IA ou un humain ?`,
      reponse: $localize`:audit.faq.a4@@auditFaqA4:Les deux. Une première analyse automatique tourne tout de suite. Ensuite, je relis le diagnostic moi-même pour classer les priorités et formuler des recommandations adaptées à votre situation.`,
    },
    {
      question: $localize`:audit.faq.q5@@auditFaqQ5:Pour quels sites le diagnostic est-il utile ?`,
      reponse: $localize`:audit.faq.a5@@auditFaqA5:Le diagnostic sert aux sites vitrines, aux boutiques en ligne, aux pages de présentation et aux outils en ligne. Il est fait pour les artisans, commerces, indépendants et petites entreprises qui veulent être mieux trouvés et recevoir plus d’appels, sans se perdre dans la technique.`,
    },
  ];

  readonly pillars = Object.values(PILIERS);

  readonly formLabels = {
    title: $localize`:audit.form.title@@auditFormTitle:Demander un diagnostic gratuit`,
    description: $localize`:audit.form.description@@auditFormDescription:Je limite à 5 diagnostics par semaine pour relire chacun moi-même sous 24 h.`,
    websiteLabel: $localize`:audit.form.websiteLabel@@auditFormWebsiteLabel:Nom du site ou URL`,
    websitePlaceholder: $localize`:audit.form.websitePlaceholder@@auditFormWebsitePlaceholder:ex. https://votresite.fr`,
    contactMethodLabel: $localize`:audit.form.contactMethodLabel@@auditFormContactMethodLabel:Méthode de contact`,
    emailOption: $localize`:audit.form.contactEmail@@auditFormContactEmail:Email`,
    phoneOption: $localize`:audit.form.contactPhone@@auditFormContactPhone:Téléphone`,
    contactValueLabel: $localize`:audit.form.contactValueLabel@@auditFormContactValueLabel:Coordonnée`,
    emailPlaceholder: $localize`:audit.form.emailPlaceholder@@auditFormEmailPlaceholder:ex. hello@votresite.fr`,
    phonePlaceholder: $localize`:audit.form.phonePlaceholder@@auditFormPhonePlaceholder:ex. ${COORDONNEES_DU_SITE.telephone}:telephone:`,
    submit: $localize`:audit.form.submit@@auditFormSubmit:Demander mon diagnostic (analyse immédiate, relue par moi sous 24 h)`,
    success: $localize`:audit.form.success@@auditFormSuccess:Merci ! L’analyse est lancée, votre diagnostic relu arrive sous 24 h.`,
    confirmationEnvoyee: (heures: number) =>
      $localize`:@@auditFormConfirmationEnvoyee:Vérifiez votre boîte e-mail : le diagnostic démarre dès que vous ouvrez le lien de confirmation reçu, valable ${heures}:heures: heures.`,
    confirmee: $localize`:@@auditFormConfirmee:Adresse confirmée ! L’analyse est lancée, votre diagnostic relu arrive sous 24 h.`,
    lienDeConfirmationRefuse: $localize`:@@auditFormLienDeConfirmationRefuse:Ce lien de confirmation est invalide ou a expiré : refaites la demande de diagnostic.`,
    error: $localize`:audit.form.error@@auditFormError:Impossible d'envoyer la demande. Réessayez dans un instant.`,
    rgpdLabel: $localize`:audit.form.rgpdLabel@@auditFormRgpdLabel:J'accepte que mes coordonnées soient utilisées pour traiter ma demande de diagnostic (voir <a href="/fr/privacy" class="underline">politique de confidentialité</a>).`,
    rgpdError: $localize`:audit.form.rgpdError@@auditFormRgpdError:Votre consentement est obligatoire pour lancer le diagnostic.`,
  };

  auditFormState: AuditRequestPayload = formulaireVierge();

  private readonly etapeTerminee = $localize`:growthAudit.step.completed|Audit completed step@@auditStepCompleted:Diagnostic terminé`;
  private readonly echecDeLAudit = $localize`:growthAudit.error.failed|Audit failed message@@auditErrorFailed:Le diagnostic a échoué.`;

  private readonly connexionPerdue = $localize`:growthAudit.error.connectionLost|Connection lost during audit@@auditErrorConnectionLost:Connexion interrompue pendant le diagnostic. Rechargez la page pour vérifier le résultat.`;

  rgpdConsent = false;

  get contactInputType(): 'email' | 'tel' {
    return this.auditFormState.contactMethod === 'EMAIL' ? 'email' : 'tel';
  }

  get contactPlaceholder(): string {
    return this.auditFormState.contactMethod === 'EMAIL'
      ? this.formLabels.emailPlaceholder
      : this.formLabels.phonePlaceholder;
  }

  get scoreEntries(): Array<{ key: PillarKey; nom: string; score: number }> {
    const scores = this.auditSummary?.pillarScores ?? {};
    return PILLAR_KEYS.flatMap((key) => {
      const score = scores[key];
      return score === undefined ? [] : [{ key, nom: PILIERS[key].nom, score }];
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
        if (response.heuresDeValiditeDeLaConfirmation !== null) {
          this.successMessage = this.formLabels.confirmationEnvoyee(
            response.heuresDeValiditeDeLaConfirmation,
          );
          return;
        }
        this.successMessage = this.formLabels.success;
        this.suivreLAudit(response.auditId);
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

  ngOnInit(): void {
    const jeton = jetonDuLien(this.route);
    if (jeton === null || !this.dansLeNavigateur) {
      return;
    }
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { token: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    handleFormSubmit(this.auditService.confirmer(jeton), this.cdr, {
      fallbackError: this.formLabels.error,
      refus: { 404: this.formLabels.lienDeConfirmationRefuse },
      onSuccess: ({ auditId }) => {
        this.successMessage = this.formLabels.confirmee;
        this.suivreLAudit(auditId);
      },
      onError: (message) => {
        this.errorMessage = message;
      },
    });
  }

  ngOnDestroy(): void {
    this.stopStream();
  }

  private suivreLAudit(auditId: string): void {
    this.auditId = auditId;
    this.auditProgress = 0;
    this.auditStep = $localize`:growthAudit.step.pending|Audit pending step@@auditStepPending:Diagnostic en attente...`;
    this.resetAuditTimeline();
    this.isAuditRunning = true;
    this.reconnectAttempts = 0;
    this.startStream(auditId);
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
          $localize`:growthAudit.error.summaryFetch|Summary fetch error@@auditErrorSummaryFetch:Impossible de récupérer le résumé du diagnostic pour le moment.`,
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
