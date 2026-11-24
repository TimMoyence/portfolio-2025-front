import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NOM_DU_SITE } from '../../../../core/seo/pages/nom-du-site';
import { CONTACT_METHODS } from '../../../data/contact-methods';
import { COORDONNEES_DU_SITE, profilSur } from '../../../data/coordonnees';
import type { FooterColumn, FooterLink, SocialLink } from '../../../models/footer.model';
import { NewsletterFormComponent } from '../../sections/newsletter-form/newsletter-form.component';
import { SvgIconComponent } from '../../svg-icon.component';
import { nomCourtServi } from '../../../../core/seo/site-servi';

const lienDePage = (href: string): FooterLink => ({ label: nomCourtServi(href), href });

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, SvgIconComponent, NewsletterFormComponent],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  readonly contactMethods = CONTACT_METHODS;

  protected readonly nomDuSite = NOM_DU_SITE;

  protected readonly adresse = COORDONNEES_DU_SITE.adresse;

  readonly brandBaseline = $localize`:footer.brand.baseline|Footer brand baseline@@footerBrandBaseline:« Asili » — la racine, l'essentiel : des sites et des apps qui disent votre métier, et qu'on trouve.`;

  readonly copyright = $localize`:footer.copyright.asili|Footer copyright line@@footerCopyrightAsili:© 2026 ${NOM_DU_SITE}:marque: — Sites web & apps mobiles · Bordeaux`;

  readonly navColumns: FooterColumn[] = [
    {
      heading: $localize`:footer.column.work|Footer column heading@@footerColumnWork:Travailler`,
      links: [
        lienDePage('/offer'),
        lienDePage('/formations'),
        lienDePage('/projets'),
        lienDePage('/articles'),
        lienDePage('/growth-audit'),
        lienDePage('/contact'),
      ],
    },
    {
      heading: $localize`:footer.column.more|Footer column heading@@footerColumnMore:En savoir plus`,
      links: [
        lienDePage('/presentation'),
        {
          label: $localize`:footer.nav.linkedin|Footer nav link@@footerNavLinkedin:LinkedIn`,
          href: profilSur(COORDONNEES_DU_SITE, 'linkedin.com'),
          external: true,
        },
      ],
    },
  ];

  readonly socialLinks: SocialLink[] = [
    {
      label: $localize`:footer.social.facebook|Footer social link@@footerSocialFacebook:Facebook`,
      href: profilSur(COORDONNEES_DU_SITE, 'facebook.com'),
      icon: 'network/facebook',
    },
    {
      label: $localize`:footer.social.linkedin|Footer social link@@footerSocialLinkedin:LinkedIn`,
      href: profilSur(COORDONNEES_DU_SITE, 'linkedin.com'),
      icon: 'network/linkedin',
    },
  ];

  readonly legalLinks: FooterLink[] = [lienDePage('/terms'), lienDePage('/privacy')];
}
