import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import type { NgForm } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { dureeMonotoneDepuis, instantMonotone } from '../../../cours/runtime/core/duree';
import { VERSIONS_DES_TEXTES_LEGAUX } from '../../core/config/textes-legaux';
import { injecterLocaleDeLaPage } from '../../core/config/locale-de-la-page';
import type { ContactRequestDto } from '../../../../contrat/types.gen';
import { zContactRequestDto } from '../../../../contrat/zod.gen';
import type { ContactPort } from '../../core/ports/contact.port';
import { CONTACT_PORT } from '../../core/ports/contact.port';
import { handleFormSubmit } from '../../shared/utils/form-submit.utils';
import type { Bornes } from '../../shared/utils/regles-de-saisie';
import { bornesDu } from '../../shared/utils/regles-de-saisie';
import { telephoneFacultatif } from '../../shared/utils/telephone.utils';
import { ContactCtaComponent } from '../../shared/components/cta-contact/cta-contact.component';
import { FieldErrorsComponent } from '../../shared/components/field-errors/field-errors.component';
import { HeroSectionComponent } from '../../shared/components/hero-section/hero-section.component';
import { BornesDeSaisieDirective } from '../../shared/directives/bornes-de-saisie.directive';
import type { FormatDeContact } from '../../shared/directives/format-de-contact.directive';
import { FormatDeContactDirective } from '../../shared/directives/format-de-contact.directive';
import { HoneypotDirective } from '../../shared/directives/honeypot.directive';

const SAISIE_DE_CONTACT = zContactRequestDto.shape;

type ContactFormState = Omit<ContactRequestDto, 'terms'> & { terms: boolean };

const SUJET_DE_DEMANDE_D_ACCES = $localize`:contact.form.subject.access@@contactFormSubjectAccess:Demande d'accès application`;

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    HeroSectionComponent,
    ContactCtaComponent,
    FieldErrorsComponent,
    BornesDeSaisieDirective,
    FormatDeContactDirective,
    HoneypotDirective,
  ],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent implements OnInit {
  isContactLoading: boolean = false;
  isContactSubmitted: boolean = false;
  contactErrorMessage?: string;
  contactSuccessMessage?: string;
  private readonly langue = injecterLocaleDeLaPage();
  private readonly contactPort: ContactPort = inject(CONTACT_PORT);
  private readonly cdr = inject(ChangeDetectorRef);
  private debutDeSaisie = instantMonotone();
  private readonly route = inject(ActivatedRoute);

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
      SUJET_DE_DEMANDE_D_ACCES,
    ],
  };

  readonly contactSection = {
    leadParagraphs: [
      $localize`:home.contact.lead.1|Home contact lead paragraph@@homeContactLead1:Vous avez un besoin, une contrainte ou une idée à clarifier ?`,
      $localize`:home.contact.lead.2|Home contact lead paragraph@@homeContactLead2:Un premier échange permet de comprendre votre contexte et de définir la suite la plus pertinente.`,
    ],
  };

  private readonly defaultContactFormState: ContactFormState = {
    website: '',
    email: '',
    firstName: '',
    lastName: '',
    phone: null,
    subject: '',
    message: '',
    role: '',
    terms: false,
    termsVersion: VERSIONS_DES_TEXTES_LEGAUX.conditions,
    termsLocale: this.langue,
    termsMethod: 'contact_form_checkbox',
  };

  contactForm: ContactFormState = { ...this.defaultContactFormState };

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const reason = params.get('reason');
    const app = params.get('app');
    if (reason === 'access' && app) {
      this.contactForm = {
        ...this.contactForm,
        subject: SUJET_DE_DEMANDE_D_ACCES,
        message: this.buildAccessRequestMessage(app),
      };
    }
  }

  private appLabel(normalizedApp: string): string {
    if (normalizedApp === 'teacher') {
      return $localize`:contact.access.app.teacher@@contactAccessAppTeacher:l'espace formateur`;
    }
    return $localize`:contact.access.app.generic@@contactAccessAppGeneric:l'application ${normalizedApp}:app:`;
  }

  private buildAccessRequestMessage(app: string): string {
    const appLabel = this.appLabel(app.trim().toLowerCase());
    return $localize`:contact.access.message@@contactAccessMessage:Bonjour Tim, je souhaite un accès à ${appLabel}:appLabel: . Pouvez-vous m'expliquer les modalités ? Merci.`;
  }

  protected readonly bornesDuMessage = bornesDu(SAISIE_DE_CONTACT.message);

  contactFields: {
    key: Extract<keyof ContactFormState, 'firstName' | 'lastName' | 'email' | 'phone'>;
    label: string;
    type: 'text' | 'email' | 'tel';
    required: boolean;
    bornes?: Bornes;
    format?: FormatDeContact;
  }[] = [
    {
      key: 'firstName',
      label: $localize`:contact.form.field.firstName@@contactFormFieldFirstName:Prénom`,
      type: 'text',
      required: true,
      bornes: bornesDu(SAISIE_DE_CONTACT.firstName),
    },
    {
      key: 'lastName',
      label: $localize`:contact.form.field.lastName@@contactFormFieldLastName:Nom`,
      type: 'text',
      required: true,
      bornes: bornesDu(SAISIE_DE_CONTACT.lastName),
    },
    {
      key: 'email',
      label: $localize`:contact.form.field.email@@contactFormFieldEmail:Email`,
      type: 'email',
      required: true,
      format: 'email',
    },
    {
      key: 'phone',
      label: $localize`:contact.form.field.phone@@contactFormFieldPhone:Téléphone`,
      type: 'tel',
      required: false,
      format: 'telephone',
    },
  ];

  handleContactSubmit(form: NgForm): void {
    this.isContactSubmitted = true;
    this.contactErrorMessage = undefined;
    this.contactSuccessMessage = undefined;

    if (!form.valid || !this.contactForm.terms) {
      this.contactErrorMessage = $localize`:contact.form.error.invalid@@contactFormErrorInvalid:Merci de vérifier les champs en rouge.`;
      return;
    }

    this.isContactLoading = true;

    const payload = this.normalizeContactPayload(this.contactForm);

    handleFormSubmit(this.contactPort.contact(payload), this.cdr, {
      fallbackError: $localize`:contact.form.error.generic@@contactFormErrorGeneric:Une erreur est survenue. Veuillez réessayer plus tard.`,
      refus: {
        400: $localize`:@@contactFormErreurRefus:Votre message n’a pas été accepté : vérifiez les champs et réessayez.`,
      },
      onSuccess: () => {
        this.contactSuccessMessage = $localize`:contact.form.success@@contactFormSuccess:Message envoyé. Je reviens vers vous rapidement.`;
      },
      onError: (message) => {
        this.contactErrorMessage = message;
      },
      onComplete: () => {
        this.contactForm = { ...this.defaultContactFormState };
        this.debutDeSaisie = instantMonotone();
        form.resetForm(this.contactForm);
        this.isContactSubmitted = false;
      },
      finalement: () => {
        this.isContactLoading = false;
      },
    });
  }

  private normalizeContactPayload(form: ContactFormState): ContactRequestDto {
    const trimOrEmpty = (value: string): string => value.trim();
    return {
      ...form,
      terms: true,
      formFillDurationMs: dureeMonotoneDepuis(this.debutDeSaisie),
      email: trimOrEmpty(form.email),
      firstName: trimOrEmpty(form.firstName),
      lastName: trimOrEmpty(form.lastName),
      subject: trimOrEmpty(form.subject),
      message: trimOrEmpty(form.message),
      role: trimOrEmpty(form.role),
      phone: telephoneFacultatif(form.phone),
      termsAcceptedAt: new Date().toISOString(),
      termsLocale: this.langue,
      termsVersion: VERSIONS_DES_TEXTES_LEGAUX.conditions,
      termsMethod: form.termsMethod ?? 'contact_form_checkbox',
    };
  }
}
