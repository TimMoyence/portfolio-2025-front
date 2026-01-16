import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SvgIconComponent } from '../svg-icon.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, SvgIconComponent],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {
  readonly address = {
    city: $localize`:footer.address.city|Footer address city@@footerAddressCity:Paris, France`,
    phone: $localize`:footer.address.phone|Footer address phone@@footerAddressPhone:+33 6 12 34 56 78`,
    email: $localize`:footer.address.email|Footer address email@@footerAddressEmail:info@relume.io`,
    phoneHref: 'tel:+33612345678',
    emailHref: 'mailto:info@relume.io',
  };

  readonly navColumns: FooterColumn[] = [
    {
      links: [
        { label: $localize`:footer.nav.home|Footer nav link@@footerNavHome:Accueil`, href: '/presentation' },
        { label: $localize`:footer.nav.courses|Footer nav link@@footerNavCourses:Les cours`, href: '/presentation' },
        { label: $localize`:footer.nav.training|Footer nav link@@footerNavTraining:Ma formation`, href: '/presentation' },
        { label: $localize`:footer.nav.projects|Footer nav link@@footerNavProjects:Projets`, href: '/client-project' },
        { label: $localize`:footer.nav.services|Footer nav link@@footerNavServices:Services`, href: '/offer' },
      ],
    },
    {
      links: [
        { label: $localize`:footer.nav.presq|Footer nav link@@footerNavPresq:PresQ`, href: '/client-project' },
        { label: $localize`:footer.nav.sebastian|Footer nav link@@footerNavSebastian:Sebastian`, href: '/client-project' },
        { label: $localize`:footer.nav.contact|Footer nav link@@footerNavContact:Contact`, href: '/contact' },
        { label: $localize`:footer.nav.offers|Footer nav link@@footerNavOffers:Offres`, href: '/offer' },
      ],
    },
  ];

  readonly socialLinks: SocialLink[] = [
    {
      label: $localize`:footer.social.facebook|Footer social link@@footerSocialFacebook:Facebook`,
      href: 'https://www.facebook.com/tim.moyence/',
      icon: 'facebook',
    },
    {
      label: $localize`:footer.social.instagram|Footer social link@@footerSocialInstagram:Instagram`,
      href: 'https://www.instagram.com/tim-moyence',
      icon: 'instagram',
    },
    {
      label: $localize`:footer.social.linkedin|Footer social link@@footerSocialLinkedin:LinkedIn`,
      href: 'https://www.linkedin.com/in/tim-moyence',
      icon: 'linkedin',
    },
  ];

  readonly legalLinks: FooterLink[] = [
    { label: $localize`:footer.legal.terms|Footer legal link@@footerLegalTerms:Conditions d'utilisation`, href: '/terms' },
    { label: $localize`:footer.legal.cookiesSettingsFr|Footer legal link@@footerLegalCookiesFr:Paramètres de cookies`, href: '/cookie-settings' },
    { label: $localize`:footer.legal.cookiesSettingsEn|Footer legal link@@footerLegalCookiesEn:Cookies Settings`, href: '/cookie-settings' },
  ];
}
