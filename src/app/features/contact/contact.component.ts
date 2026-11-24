import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { NgForm } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import type { ParamMap } from '@angular/router';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { dureeMonotoneDepuis, instantMonotone } from '../../../cours/runtime/core/saisie/duree';
import { VERSIONS_DES_TEXTES_LEGAUX } from '../../core/config/textes-legaux';
import { injecterLocaleDeLaPage } from '../../core/config/locale-de-la-page';
import type { ContactRequestDto } from '../../../../contrat/types.gen';
import { zContactRequestDto } from '../../../../contrat/zod.gen';
import type { ContactPort } from '../../core/ports/contact.port';
import { CONTACT_PORT } from '../../core/ports/contact.port';
import { BESOINS, type BesoinDeContact } from '../../shared/offre/besoins';
import { confirmationIntacte, handleFormSubmit } from '../../shared/utils/form-submit.utils';
import type { Bornes } from '../../shared/utils/saisie/regles-de-saisie';
import { bornesDu } from '../../shared/utils/saisie/regles-de-saisie';
import { telephoneFacultatif } from '../../shared/utils/telephone.utils';
import { ContactCtaComponent } from '../../shared/components/sections/cta-contact/cta-contact.component';
import { FieldErrorsComponent } from '../../shared/components/field-errors/field-errors.component';
import { HeroSectionComponent } from '../../shared/components/sections/hero-section/hero-section.component';
import { BornesDeSaisieDirective } from '../../shared/directives/bornes-de-saisie.directive';
import type { FormatDeContact } from '../../shared/directives/format-de-contact.directive';
import { FormatDeContactDirective } from '../../shared/directives/format-de-contact.directive';
import { HoneypotDirective } from '../../shared/directives/honeypot.directive';

const SAISIE_DE_CONTACT = zContactRequestDto.shape;

const DEMANDE_D_ACCES = 'acces';

type ChoixDeBesoin = BesoinDeContact | typeof DEMANDE_D_ACCES | '';

interface OptionDeBesoin {
  readonly id: ChoixDeBesoin;
  readonly libelle: string;
}

type ContactFormState = Omit<ContactRequestDto, 'terms' | 'subject'> & {
  terms: boolean;
  besoin: ChoixDeBesoin;
};

const OPTION_DE_DEMANDE_D_ACCES: OptionDeBesoin = {
  id: DEMANDE_D_ACCES,
  libelle: $localize`:contact.form.subject.access@@contactFormSubjectAccess:Demande d'accès application`,
};

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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent {
  isContactLoading: boolean = false;
  isContactSubmitted: boolean = false;
  contactErrorMessage?: string;
  contactSuccessMessage?: string;
  private readonly langue = injecterLocaleDeLaPage();
  private readonly contactPort: ContactPort = inject(CONTACT_PORT);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly hote: ElementRef<HTMLElement> = inject(ElementRef);
  private debutDeSaisie = instantMonotone();

  readonly hero = {
    label: $localize`:contact.hero.label@@contactHeroLabel:Contact`,
    title: $localize`:contact.hero.title@@contactHeroTitle:Parlons de votre site`,
    description: $localize`:contact.hero.description@@contactHeroDescription:Dites-moi ce que vous faites et ce dont vous avez besoin. Je vous réponds sous 48 h ouvrées avec une proposition claire.`,
  };

  readonly activites = [
    $localize`:Activité du contact@@contactActiviteArtisan:Artisan`,
    $localize`:Activité du contact@@contactActiviteCommerce:Commerce`,
    $localize`:Activité du contact@@contactActiviteIndependant:Indépendant`,
    $localize`:Activité du contact@@contactActivitePme:PME`,
    $localize`:Activité du contact@@contactActiviteAssociation:Association`,
    $localize`:contact.form.role.other@@contactFormRoleOther:Autre`,
  ];

  besoins: readonly OptionDeBesoin[] = BESOINS;

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
    besoin: '',
    message: '',
    role: '',
    terms: false,
    termsVersion: VERSIONS_DES_TEXTES_LEGAUX.conditions,
    termsLocale: this.langue,
    termsMethod: 'contact_form_checkbox',
  };

  contactForm: ContactFormState = { ...this.defaultContactFormState };

  constructor() {
    inject(ActivatedRoute)
      .queryParamMap.pipe(takeUntilDestroyed())
      .subscribe((requete) => this.lireLaRequete(requete));
  }

  private lireLaRequete(requete: ParamMap): void {
    const app = requete.get('app');
    if (requete.get('reason') === 'access' && app) {
      this.besoins = [...BESOINS, OPTION_DE_DEMANDE_D_ACCES];
      this.contactForm = {
        ...this.contactForm,
        besoin: DEMANDE_D_ACCES,
        message: this.buildAccessRequestMessage(app),
      };
    } else {
      const demande = requete.get('besoin');
      this.besoins = BESOINS;
      this.contactForm = {
        ...this.contactForm,
        besoin: BESOINS.find(({ id }) => id === demande)?.id ?? '',
      };
    }
    this.cdr.markForCheck();
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
    autocomplete: 'given-name' | 'family-name' | 'email' | 'tel';
    required: boolean;
    bornes?: Bornes;
    format?: FormatDeContact;
  }[] = [
    {
      key: 'firstName',
      label: $localize`:contact.form.field.firstName@@contactFormFieldFirstName:Prénom`,
      type: 'text',
      autocomplete: 'given-name',
      required: true,
      bornes: bornesDu(SAISIE_DE_CONTACT.firstName),
    },
    {
      key: 'lastName',
      label: $localize`:contact.form.field.lastName@@contactFormFieldLastName:Nom`,
      type: 'text',
      autocomplete: 'family-name',
      required: true,
      bornes: bornesDu(SAISIE_DE_CONTACT.lastName),
    },
    {
      key: 'email',
      label: $localize`:contact.form.field.email@@contactFormFieldEmail:Email`,
      type: 'email',
      autocomplete: 'email',
      required: true,
      format: 'email',
    },
    {
      key: 'phone',
      label: $localize`:contact.form.field.phone@@contactFormFieldPhone:Téléphone`,
      type: 'tel',
      autocomplete: 'tel',
      required: false,
      format: 'telephone',
    },
  ];

  protected enErreur(
    controle: { invalid: boolean | null; touched: boolean | null } | undefined,
  ): boolean {
    return !!controle?.invalid && (!!controle.touched || this.isContactSubmitted);
  }

  handleContactSubmit(form: NgForm): void {
    if (this.isContactLoading || confirmationIntacte(this.contactSuccessMessage, form)) {
      return;
    }
    this.isContactSubmitted = true;
    this.contactErrorMessage = undefined;
    this.contactSuccessMessage = undefined;

    if (!form.valid || !this.contactForm.terms) {
      this.contactErrorMessage = $localize`:contact.form.error.invalid@@contactFormErrorInvalid:Merci de vérifier les champs en rouge.`;
      this.cdr.detectChanges();
      this.hote.nativeElement.querySelector<HTMLElement>('form [aria-invalid="true"]')?.focus();
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

  private normalizeContactPayload({ besoin, ...form }: ContactFormState): ContactRequestDto {
    const trimOrEmpty = (value: string): string => value.trim();
    return {
      ...form,
      terms: true,
      formFillDurationMs: dureeMonotoneDepuis(this.debutDeSaisie),
      email: trimOrEmpty(form.email),
      firstName: trimOrEmpty(form.firstName),
      lastName: trimOrEmpty(form.lastName),
      subject: this.besoins.find(({ id }) => id === besoin)?.libelle ?? '',
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
