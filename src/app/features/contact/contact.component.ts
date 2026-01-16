import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HeroAction, HeroSectionComponent } from '../../shared/components/hero-section/hero-section.component';

interface ContactLocation {
  title: string;
  description: string;
  image: string;
  alt: string;
  actionLabel: string;
}

interface ContactMethod {
  title: string;
  description: string;
  value: string;
  link?: string;
  hasRouteAction?: boolean;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, RouterModule, HeroSectionComponent],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent {
  readonly hero = {
    label: $localize`:contact.hero.label@@contactHeroLabel:Connexion`,
    title: $localize`:contact.hero.title@@contactHeroTitle:Contactez Tim de Asili Design`,
    description: $localize`:contact.hero.description@@contactHeroDescription:Développeur web passionné et ancien manager, prêt à transformer vos idées numériques en réalité concrète.`,
    actions: [
      {
        label: $localize`:contact.hero.action.send@@contactHeroActionSend:Envoyer`,
        href: '/contact',
      },
      {
        label: $localize`:contact.hero.action.cancel@@contactHeroActionCancel:Annuler`,
        variant: 'secondary' as HeroAction['variant'],
        href: '/presentation',
      },
    ],
  };

  readonly contactInfo = {
    label: $localize`:contact.form.label@@contactFormLabel:Contact`,
    heading: $localize`:contact.form.heading@@contactFormHeading:Formulaire de contact`,
    description: $localize`:contact.form.description@@contactFormDescription:Partagez vos idées, je suis à l'écoute`,
    details: [
      {
        label: $localize`:contact.form.detail.email@@contactFormDetailEmail:hello@relume.io`,
        icon: '✉️',
      },
      {
        label: $localize`:contact.form.detail.phone@@contactFormDetailPhone:+33 6 12 34 56 78`,
        icon: '📞',
      },
      {
        label: $localize`:contact.form.detail.city@@contactFormDetailCity:Paris, France`,
        icon: '📍',
      },
    ],
    roles: [
      $localize`:contact.form.role.developer@@contactFormRoleDeveloper:Développeur web`,
      $localize`:contact.form.role.manager@@contactFormRoleManager:Manager`,
      $localize`:contact.form.role.entrepreneur@@contactFormRoleEntrepreneur:Entrepreneur`,
      $localize`:contact.form.role.student@@contactFormRoleStudent:Étudiant`,
      $localize`:contact.form.role.freelance@@contactFormRoleFreelance:Freelance`,
      $localize`:contact.form.role.other@@contactFormRoleOther:Autre`,
    ],
    subjects: [
      $localize`:contact.form.subject.first@@contactFormSubjectFirst:Premier choix`,
      $localize`:contact.form.subject.second@@contactFormSubjectSecond:Second choix`,
      $localize`:contact.form.subject.third@@contactFormSubjectThird:Troisième choix`,
    ],
  };

  readonly locations: ContactLocation[] = [
    {
      title: $localize`:contact.location.paris.title@@contactLocationParisTitle:Paris`,
      description: $localize`:contact.location.paris.desc@@contactLocationParisDesc:12 rue de la République, 75001 Paris`,
      image:
        'https://d22po4pjz3o32e.cloudfront.net/placeholder-image-landscape.svg',
      alt: $localize`:contact.location.paris.alt@@contactLocationParisAlt:Carte de Paris`,
      actionLabel: $localize`:contact.location.paris.cta@@contactLocationParisCta:Voir l'itinéraire`,
    },
    {
      title: $localize`:contact.location.remote.title@@contactLocationRemoteTitle:Travail à distance`,
      description: $localize`:contact.location.remote.desc@@contactLocationRemoteDesc:Disponible pour des projets internationaux`,
      image:
        'https://d22po4pjz3o32e.cloudfront.net/placeholder-image-landscape.svg',
      alt: $localize`:contact.location.remote.alt@@contactLocationRemoteAlt:Illustration de travail à distance`,
      actionLabel: $localize`:contact.location.remote.cta@@contactLocationRemoteCta:Voir mes options`,
    },
  ];

  readonly methods: ContactMethod[] = [
    {
      title: $localize`:contact.methods.email.title@@contactMethodsEmailTitle:Email`,
      description: $localize`:contact.methods.email.desc@@contactMethodsEmailDesc:Contactez-moi directement`,
      value: $localize`:contact.form.detail.email@@contactFormDetailEmail:hello@relume.io`,
      link: 'mailto:hello@relume.io',
    },
    {
      title: $localize`:contact.methods.phone.title@@contactMethodsPhoneTitle:Téléphone`,
      description: $localize`:contact.methods.phone.desc@@contactMethodsPhoneDesc:Disponible du lundi au vendredi`,
      value: $localize`:contact.form.detail.phone@@contactFormDetailPhone:+33 6 12 34 56 78`,
      link: 'tel:+33612345678',
    },
    {
      title: $localize`:contact.methods.office.title@@contactMethodsOfficeTitle:Bureau`,
      description: $localize`:contact.methods.office.desc@@contactMethodsOfficeDesc:Paris, France`,
      value: $localize`:contact.methods.office.action@@contactMethodsOfficeAction:Voir l'itinéraire`,
      hasRouteAction: true,
    },
  ];
}
