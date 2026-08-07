import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CONTACT_METHODS } from '../../data/contact-methods';
import type { FooterColumn, FooterLink, SocialLink } from '../../models/footer.model';
import { SvgIconComponent } from '../svg-icon.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, SvgIconComponent],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  readonly contactMethods = CONTACT_METHODS;

  readonly siteLastUpdated = '2026-04-17';

  readonly brandBaseline = $localize`:footer.brand.baseline|Footer brand baseline@@footerBrandBaseline:« Asili » — la racine, l'essentiel. Le design est fonctionnel et réfléchi, jamais décoratif pour décorer.`;

  readonly freshLabel = $localize`:footer.fresh.label|Footer freshness chip label@@footerFreshLabel:Mis à jour le`;

  readonly copyright = $localize`:footer.copyright.asili|Footer copyright line@@footerCopyrightAsili:© 2026 Asili Design · Bordeaux`;

  readonly navColumns: FooterColumn[] = [
    {
      heading: $localize`:footer.column.work|Footer column heading@@footerColumnWork:Travailler`,
      links: [
        {
          label: $localize`:footer.nav.services|Footer nav link@@footerNavServices:Services`,
          href: '/offer',
        },
        {
          label: $localize`:footer.nav.formations|Footer nav link@@footerNavFormations:Formations`,
          href: '/formations',
        },
        {
          label: $localize`:footer.nav.projects|Footer nav link@@footerNavProjects:Projets`,
          href: '/projets',
        },
        {
          label: $localize`:footer.nav.contact|Footer nav link@@footerNavContact:Contact`,
          href: '/contact',
        },
      ],
    },
    {
      heading: $localize`:footer.column.atelier|Footer column heading@@footerColumnAtelier:L'Atelier`,
      links: [
        {
          label: $localize`:footer.nav.atelier|Footer nav link@@footerNavAtelier:L'Atelier`,
          href: '/atelier',
        },
        {
          label: $localize`:footer.nav.meteo|Footer nav link@@footerNavMeteo:Météo`,
          href: '/atelier/meteo',
        },
        {
          label: $localize`:footer.nav.sebastian|Footer nav link@@footerNavSebastian:Sebastian`,
          href: '/atelier/sebastian',
        },
        {
          label: $localize`:footer.nav.growthAudit|Footer nav link@@footerNavGrowthAudit:Growth Audit`,
          href: '/growth-audit',
        },
      ],
    },
    {
      heading: $localize`:footer.column.more|Footer column heading@@footerColumnMore:En savoir plus`,
      links: [
        {
          label: $localize`:footer.nav.presentation|Footer nav link@@footerNavPresentation:Présentation`,
          href: '/presentation',
        },
        {
          label: $localize`:footer.nav.legal|Footer nav link@@footerNavLegal:Mentions légales`,
          href: '/terms',
        },
        {
          label: $localize`:footer.nav.privacy|Footer nav link@@footerNavPrivacy:Confidentialité`,
          href: '/privacy',
        },
        {
          label: $localize`:footer.nav.cookies|Footer nav link@@footerNavCookies:Paramètres cookies`,
          href: '/cookie-settings',
        },
        {
          label: $localize`:footer.nav.linkedin|Footer nav link@@footerNavLinkedin:LinkedIn`,
          href: 'https://www.linkedin.com/in/tim-moyence',
          external: true,
        },
      ],
    },
  ];

  readonly socialLinks: SocialLink[] = [
    {
      label: $localize`:footer.social.facebook|Footer social link@@footerSocialFacebook:Facebook`,
      href: 'https://www.facebook.com/tim.moyence/',
      icon: 'network/facebook',
    },
    {
      label: $localize`:footer.social.linkedin|Footer social link@@footerSocialLinkedin:LinkedIn`,
      href: 'https://www.linkedin.com/in/tim-moyence',
      icon: 'network/linkedin',
    },
  ];

  readonly legalLinks: FooterLink[] = [
    {
      label: $localize`:footer.legal.terms|Footer legal link@@footerLegalTerms:Conditions d'utilisation`,
      href: '/terms',
    },
    {
      label: $localize`:footer.legal.privacy|Footer legal link@@footerLegalPrivacy:Politique de confidentialité`,
      href: '/privacy',
    },
    {
      label: $localize`:footer.legal.cookiesSettings|Footer legal link@@footerLegalCookies:Paramètres de cookies`,
      href: '/cookie-settings',
    },
  ];
}
