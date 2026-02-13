import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { FormsModule, NgForm } from "@angular/forms";
import {
  AuditContactMethod,
  AuditRequestPayload,
} from "../../core/models/audit-request.model";
import { AuditRequestService } from "../../core/services/audit-request.service";
import { HeroSectionComponent } from "../../shared/components/hero-section/hero-section.component";

interface AuditPillar {
  title: string;
  description: string;
}

@Component({
  selector: "app-growth-audit",
  standalone: true,
  imports: [CommonModule, FormsModule, HeroSectionComponent],
  templateUrl: "./growth-audit.component.html",
  styleUrl: "./growth-audit.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GrowthAuditComponent {
  private readonly auditService = inject(AuditRequestService);

  isSubmitting = false;
  isSubmitted = false;
  successMessage?: string;
  errorMessage?: string;

  readonly hero = {
    label: $localize`:audit.hero.label@@auditHeroLabel:Audit gratuit (24h)`,
    title: $localize`:audit.hero.title@@auditHeroTitle:Audit de croissance en 15 points`,
    description: $localize`:audit.hero.description@@auditHeroDescription:Laissez votre site ou le nom de votre entreprise, et recevez une analyse personnalisée comprenant une video et un scorecard clair avec des recommandations concrètes pour booster votre croissance en ligne.`,
  };

  readonly steps = [
    {
      title: $localize`:audit.steps.one.title@@auditStepOneTitle:1. Vous laissez vos infos`,
      description: $localize`:audit.steps.one.desc@@auditStepOneDesc:Nom du site + contact email ou téléphone.`,
    },
    {
      title: $localize`:audit.steps.two.title@@auditStepTwoTitle:2. Analyse rapide de votre site`,
      description: $localize`:audit.steps.two.desc@@auditStepTwoDesc:Je scanne votre site, votre SEO et votre conversion.`,
    },
    {
      title: $localize`:audit.steps.three.title@@auditStepThreeTitle:3. Livraison en 24h`,
      description: $localize`:audit.steps.three.desc@@auditStepThreeDesc:Vidéo + scorecard envoyées par email.`,
      highlights: [
        $localize`:audit.highlights.video@@auditHighlightsVideo:Vidéo personnalisée (10 min)`,
        $localize`:audit.highlights.score@@auditHighlightsScore:Scorecard claire (15 points)`,
        $localize`:audit.highlights.wins@@auditHighlightsWins:3 quick wins + 1 opportunité forte`,
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
    description: $localize`:audit.form.description@@auditFormDescription:Je ne prends que 5 audits par semaine pour garantir une réponse rapide.`,
    websiteLabel: $localize`:audit.form.websiteLabel@@auditFormWebsiteLabel:Nom du site ou URL`,
    websitePlaceholder: $localize`:audit.form.websitePlaceholder@@auditFormWebsitePlaceholder:ex. https://votresite.fr`,
    contactMethodLabel: $localize`:audit.form.contactMethodLabel@@auditFormContactMethodLabel:Méthode de contact`,
    emailOption: $localize`:audit.form.contactEmail@@auditFormContactEmail:Email`,
    phoneOption: $localize`:audit.form.contactPhone@@auditFormContactPhone:Téléphone`,
    contactValueLabel: $localize`:audit.form.contactValueLabel@@auditFormContactValueLabel:Coordonnée`,
    emailPlaceholder: $localize`:audit.form.emailPlaceholder@@auditFormEmailPlaceholder:ex. hello@votresite.fr`,
    phonePlaceholder: $localize`:audit.form.phonePlaceholder@@auditFormPhonePlaceholder:ex. +33 6 98 50 32 82`,
    submit: $localize`:audit.form.submit@@auditFormSubmit:Demander mon audit`,
    success: $localize`:audit.form.success@@auditFormSuccess:Merci ! Je reviens vers vous sous 24h avec votre audit.`,
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

  onContactMethodToggle(event: Event): void {
    const isPhone = (event.target as HTMLInputElement).checked;
    const method: AuditContactMethod = isPhone ? "PHONE" : "EMAIL";
    this.handleMethodChange(method);
  }

  handleMethodChange(method: AuditContactMethod): void {
    // If it changes, reset the input (keeps form coherent)
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

    if (!form.valid) {
      this.errorMessage = this.formLabels.error;
      return;
    }

    this.isSubmitting = true;

    const payload = {
      websiteName: this.auditFormState.websiteName.trim(),
      contactMethod: this.auditFormState.contactMethod,
      contactValue: this.auditFormState.contactValue.trim(),
    };

    this.auditService.submit(payload).subscribe({
      next: (response) => {
        if (response.httpCode === 201) {
          this.successMessage = this.formLabels.success;
        } else {
          this.errorMessage = response.message || this.formLabels.error;
        }
      },
      error: (error: any) => {
        const serverMessage = Array.isArray(error?.error?.message)
          ? error.error.message.join(" ")
          : error?.error?.message;
        this.errorMessage = serverMessage || this.formLabels.error;
        this.isSubmitting = false;
      },
      complete: () => {
        this.auditFormState = {
          websiteName: "",
          contactMethod: "EMAIL",
          contactValue: "",
        };
        form.resetForm(this.auditFormState);
        this.isSubmitting = false;
        this.isSubmitted = false;
      },
    });
  }
}
