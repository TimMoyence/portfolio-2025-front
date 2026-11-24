import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CONTACT_METHODS } from '../../../data/contact-methods';
import { COORDONNEES_DU_SITE } from '../../../data/coordonnees';
import { SvgIconComponent } from '../../svg-icon.component';

@Component({
  selector: 'app-cta-contact',
  standalone: true,
  imports: [CommonModule, SvgIconComponent],
  templateUrl: './cta-contact.component.html',
  styleUrl: './cta-contact.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactCtaComponent {
  @Input() leadParagraphs: string[] = [];
  readonly title = $localize`:contact.title|Section heading@@contactTitle:Parler de votre situation`;

  readonly contactMethods = CONTACT_METHODS;

  readonly map = {
    href: COORDONNEES_DU_SITE.carte,
    imageSrc: './assets/images/bordeaux-placeholder.webp',
    alt: $localize`:contact.map.alt|Map image alt text@@contactMapAlt:Bordeaux placeholder map image`,
  };
}
