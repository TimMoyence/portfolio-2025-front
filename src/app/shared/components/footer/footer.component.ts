import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { ContactMethod } from "../../models/contact.model";
import {
  FooterColumn,
  FooterLink,
  SocialLink,
} from "../../models/footer.model";
import { SvgIconComponent } from "../svg-icon.component";

@Component({
  selector: "app-footer",
  standalone: true,
  imports: [CommonModule, SvgIconComponent],
  templateUrl: "./footer.component.html",
  styleUrls: ["./footer.component.scss"],
})
export class FooterComponent {
  readonly contactMethods: ContactMethod[] = [
    {
      label: $localize`:contact.method.email.label|Contact method label@@contactMethodEmailLabel:Email`,
      value: $localize`:contact.method.email.value|Contact method value@@contactMethodEmailValue:moyencet@gmail.com`,
      href: "mailto:moyencet@gmail.com",
      icon: "attach_email",
    },
    {
      label: $localize`:contact.method.phone.label|Contact method label@@contactMethodPhoneLabel:Téléphone`,
      value: $localize`:contact.method.phone.value|Contact method value@@contactMethodPhoneValue:+33 6 98 50 32 82`,
      href: "tel:+33698503282",
      icon: "phone",
    },
    {
      label: $localize`:contact.method.office.label|Contact method label@@contactMethodOfficeLabel:Bureau`,
      value: $localize`:contact.method.office.value|Contact method value@@contactMethodOfficeValue:Bordeaux, 33100, France`,
      icon: "location_on",
    },
  ];

  readonly navColumns: FooterColumn[] = [
    {
      links: [
        {
          label: $localize`:footer.nav.home|Footer nav link@@footerNavHome:Accueil`,
          href: "/home",
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
      ],
    },
  ];

  readonly socialLinks: SocialLink[] = [
    {
      label: $localize`:footer.social.facebook|Footer social link@@footerSocialFacebook:Facebook`,
      href: "https://www.facebook.com/tim.moyence/",
      icon: "facebook",
    },
    {
      label: $localize`:footer.social.instagram|Footer social link@@footerSocialInstagram:Instagram`,
      href: "https://www.instagram.com/tim-moyence",
      icon: "instagram",
    },
    {
      label: $localize`:footer.social.linkedin|Footer social link@@footerSocialLinkedin:LinkedIn`,
      href: "https://www.linkedin.com/in/tim-moyence",
      icon: "linkedin",
    },
  ];

  readonly legalLinks: FooterLink[] = [
    {
      label: $localize`:footer.legal.terms|Footer legal link@@footerLegalTerms:Conditions d'utilisation`,
      href: "/terms",
    },
    {
      label: $localize`:footer.legal.cookiesSettingsFr|Footer legal link@@footerLegalCookiesFr:Paramètres de cookies`,
      href: "/cookie-settings",
    },
    {
      label: $localize`:footer.legal.cookiesSettingsEn|Footer legal link@@footerLegalCookiesEn:Cookies Settings`,
      href: "/cookie-settings",
    },
  ];
}
