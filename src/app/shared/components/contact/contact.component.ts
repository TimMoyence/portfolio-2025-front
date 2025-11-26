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
      value: 'moyencet@gmail.com',
      href: 'mailto:moyencet@gmail.com',
      icon: 'attach_email',
    },
    {
      label: 'Téléphone',
      value: '+33 6 98 50 32 82',
      href: 'tel:+33698503282',
      icon: 'phone',
    },
    {
      label: 'Bureau',
      value: 'Allée Serr, 33100 Bordeaux, France',
      icon: 'location_on',
    },
  ];

  readonly map = {
    href: 'https://www.google.com/maps/place/Allée+Serr,+33100+Bordeaux,+France/@44.8353083,-0.5750133,17z/data=!3m1!4b1!4m6!3m5!1s0xd5527dace2f6b7f:0x8c6f3e3f8a4f4e2!8m2!3d44.8353042!4d-0.5728246!16s%2Fg%2F11c52_5y9r',
    imageSrc: './assets/images/bordeaux-placeholder.png',
    alt: 'Bordeaux placeholder map image',
  };
}
