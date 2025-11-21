import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { SvgIconComponent } from '../svg-icon.component';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, SvgIconComponent],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent {
  @Input({ required: true }) subtitle!: string;
  readonly title = 'Contactez-nous';

  readonly contactMethods: ContactMethod[] = [
    {
      label: 'Email',
      value: 'hello@relume.io',
      href: 'mailto:hello@relume.io',
      icon: 'attach_email',
    },
    {
      label: 'Téléphone',
      value: '+33 6 12 34 56 78',
      href: 'tel:+33612345678',
      icon: 'phone',
    },
    {
      label: 'Bureau',
      value: '12 rue de la Technologie, Paris 75001, France',
      icon: 'location_on',
    },
  ];

  readonly map = {
    href: '#',
    imageSrc: './assets/images/bordeaux-placeholder.png',
    alt: 'Bordeaux placeholder map image',
  };
}
