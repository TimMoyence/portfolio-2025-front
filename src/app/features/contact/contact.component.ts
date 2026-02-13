import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  LOCALE_ID,
} from "@angular/core";
import { FormsModule, NgForm } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { APP_CONFIG } from "../../core/config/app-config.token";
import { ContactFormState } from "../../core/models/contact.model";
import { ContactService } from "../../core/services/contact.service";
import { ContactCtaComponent } from "../../shared/components/cta-contact/cta-contact.component";
import { HeroSectionComponent } from "../../shared/components/hero-section/hero-section.component";

@Component({
  selector: "app-contact",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    HeroSectionComponent,
    ContactCtaComponent,
  ],
  templateUrl: "./contact.component.html",
  styleUrl: "./contact.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent {
  isContactLoading: boolean = false;
  isContactSubmitted: boolean = false;
  contactErrorMessage?: string;
  contactSuccessMessage?: string;
  private readonly appConfig = inject(APP_CONFIG);
  private readonly localeId = inject(LOCALE_ID);
  private readonly contactService = inject(ContactService);

  readonly hero = {
    label: $localize`:contact.hero.label@@contactHeroLabel:Connexion`,
    title: $localize`:contact.hero.title@@contactHeroTitle:Parler de votre situation`,
    description: $localize`:contact.hero.description@@contactHeroDescription:Un premier échange pour comprendre votre contexte,clarifier votre besoin et envisager la suite la plus pertinente.`,
  };

  readonly contactInfo = {
    label: $localize`:contact.form.label@@contactFormLabel:Contact`,
    description: $localize`:contact.form.description@@contactFormDescription:Vous avez un projet, une contrainte ou une idée à clarifier ? Partagez quelques éléments, je vous répondrai rapidement.`,
    roles: [
      $localize`:contact.form.role.developer@@contactFormRoleDeveloper:Développeur`,
      $localize`:contact.form.role.manager@@contactFormRoleManager:Manager`,
      $localize`:contact.form.role.entrepreneur@@contactFormRoleEntrepreneur:Entrepreneur`,
      $localize`:contact.form.role.cto@@contactFormRoleCTO:CTO`,
      $localize`:contact.form.role.freelance@@contactFormRoleFreelance:Freelance`,
      $localize`:contact.form.role.other@@contactFormRoleOther:Autre`,
    ],
    subjects: [
      $localize`:contact.form.subject.first@@contactFormSubjectFirst:Premier contact`,
      $localize`:contact.form.subject.second@@contactFormSubjectSecond:Demande de devis`,
      $localize`:contact.form.subject.third@@contactFormSubjectThird:Urgent - Besoin rapide`,
    ],
  };

  readonly contactSection = {
    leadParagraphs: [
      $localize`:home.contact.lead.1|Home contact lead paragraph@@homeContactLead1:Vous avez un besoin, une contrainte ou une idée à clarifier ?`,
      $localize`:home.contact.lead.2|Home contact lead paragraph@@homeContactLead2:Un premier échange permet de comprendre votre contexte et de définir la suite la plus pertinente.`,
    ],
  };

  private readonly defaultContactFormState: ContactFormState = {
    email: "",
    firstName: "",
    lastName: "",
    phone: null,
    subject: "",
    message: "",
    role: "",
    terms: false,
    termsVersion: this.appConfig.gdpr?.termsVersion ?? "2026-02-11",
    termsLocale: this.localeId,
    termsMethod: "contact_form_checkbox",
  };

  contactForm: ContactFormState = { ...this.defaultContactFormState };

  contactFields: {
    key: Extract<
      keyof ContactFormState,
      "firstName" | "lastName" | "email" | "phone"
    >;
    label: string;
    type: "text" | "email" | "tel";
    required: boolean;
  }[] = [
    {
      key: "firstName",
      label: $localize`:contact.form.field.firstName@@contactFormFieldFirstName:Prénom`,
      type: "text",
      required: true,
    },
    {
      key: "lastName",
      label: $localize`:contact.form.field.lastName@@contactFormFieldLastName:Nom`,
      type: "text",
      required: true,
    },
    {
      key: "email",
      label: $localize`:contact.form.field.email@@contactFormFieldEmail:Email`,
      type: "email",
      required: true,
    },
    {
      key: "phone",
      label: $localize`:contact.form.field.phone@@contactFormFieldPhone:Téléphone`,
      type: "tel",
      required: false,
    },
  ];

  handleContactSubmit(form: NgForm): void {
    this.isContactSubmitted = true;
    this.contactErrorMessage = undefined;
    this.contactSuccessMessage = undefined;

    if (!form.valid) {
      this.contactErrorMessage = $localize`:contact.form.error.invalid@@contactFormErrorInvalid:Merci de vérifier les champs en rouge.`;
      return;
    }

    this.isContactLoading = true;

    const payload = this.normalizeContactPayload(this.contactForm);

    this.contactService.contact(payload).subscribe({
      next: (response) => {
        if (response.httpCode !== 201)
          this.contactErrorMessage = response.message;
        else
          this.contactSuccessMessage = $localize`:contact.form.success@@contactFormSuccess:Message envoyé. Je reviens vers vous rapidement.`;
      },
      error: (error: any) => {
        const serverMessage = Array.isArray(error?.error?.message)
          ? error.error.message.join(" ")
          : error?.error?.message;

        this.contactErrorMessage =
          serverMessage ||
          error?.message ||
          $localize`:contact.form.error.generic@@contactFormErrorGeneric:Une erreur est survenue. Veuillez réessayer plus tard.`;
      },
      complete: () => {
        this.contactForm = { ...this.defaultContactFormState };
        form.resetForm(this.contactForm);
        this.isContactSubmitted = false;
      },
    });
  }

  private normalizeContactPayload(form: ContactFormState): ContactFormState {
    const trimOrEmpty = (value: string): string => value.trim();
    const trimmedPhone =
      form.phone === undefined || form.phone === null
        ? null
        : trimOrEmpty(form.phone);
    return {
      ...form,
      email: trimOrEmpty(form.email),
      firstName: trimOrEmpty(form.firstName),
      lastName: trimOrEmpty(form.lastName),
      subject: trimOrEmpty(form.subject),
      message: trimOrEmpty(form.message),
      role: trimOrEmpty(form.role),
      phone: trimmedPhone === "" ? null : trimmedPhone,
      termsAcceptedAt: form.terms ? new Date().toISOString() : undefined,
      termsLocale: this.localeId,
      termsVersion: this.appConfig.gdpr?.termsVersion ?? form.termsVersion,
      termsMethod: form.termsMethod ?? "contact_form_checkbox",
    };
  }
}
