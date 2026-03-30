import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { CONTACT_METHODS } from "../../data/contact-methods";
import { SvgIconComponent } from "../svg-icon.component";

@Component({
  selector: "app-cta-contact",
  standalone: true,
  imports: [CommonModule, SvgIconComponent],
  templateUrl: "./cta-contact.component.html",
  styleUrl: "./cta-contact.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactCtaComponent {
  @Input() leadParagraphs: string[] = [];
  readonly title = $localize`:contact.title|Section heading@@contactTitle:Parler de votre situation`;

  readonly contactMethods = CONTACT_METHODS;

  readonly map = {
    href: "https://www.google.com/maps/place/Allée+Serr,+33100+Bordeaux,+France/@44.8353083,-0.5750133,17z/data=!3m1!4b1!4m6!3m5!1s0xd5527dace2f6b7f:0x8c6f3e3f8a4f4e2!8m2!3d44.8353042!4d-0.5728246!16s%2Fg%2F11c52_5y9r",
    imageSrc: "./assets/images/bordeaux-placeholder.png",
    alt: $localize`:contact.map.alt|Map image alt text@@contactMapAlt:Bordeaux placeholder map image`,
  };
}
