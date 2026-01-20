import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { SvgIconComponent } from "../svg-icon.component";
import { ContactMethod } from "../../models/contact.model";

@Component({
  selector: "app-cta-contact",
  standalone: true,
  imports: [CommonModule, SvgIconComponent],
  templateUrl: "./cta-contact.component.html",
  styleUrl: "./cta-contact.component.scss",
})
export class ContactCtaComponent {
  @Input() leadParagraphs: string[] = [];
  readonly title = $localize`:contact.title|Section heading@@contactTitle:Parler de votre situation`;

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

  readonly map = {
    href: "https://www.google.com/maps/place/Allée+Serr,+33100+Bordeaux,+France/@44.8353083,-0.5750133,17z/data=!3m1!4b1!4m6!3m5!1s0xd5527dace2f6b7f:0x8c6f3e3f8a4f4e2!8m2!3d44.8353042!4d-0.5728246!16s%2Fg%2F11c52_5y9r",
    imageSrc: "./assets/images/bordeaux-placeholder.png",
    alt: $localize`:contact.map.alt|Map image alt text@@contactMapAlt:Bordeaux placeholder map image`,
  };
}
