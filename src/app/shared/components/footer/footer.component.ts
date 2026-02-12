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
      href: "https://www.google.com/maps/place/Allée+Serr,+33100+Bordeaux,+France/@44.8353083,-0.5750133,17z/data=!3m1!4b1!4m6!3m5!1s0xd5527dace2f6b7f:0x8c6f3e3f8a4f4e2!8m2!3d44.8353042!4d-0.5728246!16s%2Fg%2F11c52_5y9r",
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
