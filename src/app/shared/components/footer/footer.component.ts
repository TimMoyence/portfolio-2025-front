import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterModule } from "@angular/router";
import { CONTACT_METHODS } from "../../data/contact-methods";
import type {
  FooterColumn,
  FooterLink,
  SocialLink,
} from "../../models/footer.model";
import { SvgIconComponent } from "../svg-icon.component";

@Component({
  selector: "app-footer",
  standalone: true,
  imports: [CommonModule, RouterModule, SvgIconComponent],
  templateUrl: "./footer.component.html",
  styleUrls: ["./footer.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  readonly contactMethods = CONTACT_METHODS;

  /**
   * Derniere date de mise a jour du site, rendue en `<time datetime>` dans
   * le footer (P2.10 — signal de fraicheur pour ranking IA). Alimente aussi
   * le `dateModified` JSON-LD serveur via `enrichJsonLdBlock`.
   */
  readonly siteLastUpdated = "2026-04-17";

  /**
   * P2.12 : maillage interne enrichi pour topical authority. 8 liens au
   * lieu de 4, couvrant les piliers metiers (Présentation, Projets,
   * Services, Formations, Audit gratuit, Contact) + liens ateliers
   * (Meteo, Budget) + lien Sebastian protege (filtre par le guard role).
   */
  readonly navColumns: FooterColumn[] = [
    {
      links: [
        {
          label: $localize`:footer.nav.home|Footer nav link@@footerNavHome:Accueil`,
          href: "/",
        },
        {
          label: $localize`:footer.nav.presentation|Footer nav link@@footerNavPresentation:Présentation`,
          href: "/presentation",
        },
        {
          label: $localize`:footer.nav.projects|Footer nav link@@footerNavProjects:Projets`,
          href: "/client-project",
        },
        {
          label: $localize`:footer.nav.services|Footer nav link@@footerNavServices:Services`,
          href: "/offer",
        },
        {
          label: $localize`:footer.nav.formations|Footer nav link@@footerNavFormations:Formations`,
          href: "/formations",
        },
        {
          label: $localize`:footer.nav.growthAudit|Footer nav link@@footerNavGrowthAudit:Audit gratuit`,
          href: "/growth-audit",
        },
        {
          label: $localize`:footer.nav.contact|Footer nav link@@footerNavContact:Contact`,
          href: "/contact",
        },
      ],
    },
  ];

  readonly socialLinks: SocialLink[] = [
    {
      label: $localize`:footer.social.facebook|Footer social link@@footerSocialFacebook:Facebook`,
      href: "https://www.facebook.com/tim.moyence/",
      icon: "network/facebook",
    },
    // {
    //   label: $localize`:footer.social.instagram|Footer social link@@footerSocialInstagram:Instagram`,
    //   href: "https://www.instagram.com/tim-moyence",
    //   icon: "instagram",
    // },
    {
      label: $localize`:footer.social.linkedin|Footer social link@@footerSocialLinkedin:LinkedIn`,
      href: "https://www.linkedin.com/in/tim-moyence",
      icon: "network/linkedin",
    },
  ];

  readonly legalLinks: FooterLink[] = [
    {
      label: $localize`:footer.legal.terms|Footer legal link@@footerLegalTerms:Conditions d'utilisation`,
      href: "/terms",
    },
    {
      label: $localize`:footer.legal.privacy|Footer legal link@@footerLegalPrivacy:Politique de confidentialité`,
      href: "/privacy",
    },
    {
      label: $localize`:footer.legal.cookiesSettings|Footer legal link@@footerLegalCookies:Paramètres de cookies`,
      href: "/cookie-settings",
    },
  ];
}
