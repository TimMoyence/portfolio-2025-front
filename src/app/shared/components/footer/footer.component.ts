import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SvgIconComponent } from '../svg-icon.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, SvgIconComponent],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {
  readonly address = {
    city: 'Bordeaux, France',
    phone: '+33 6 98 50 32 82',
    email: 'moyencet@gmail.com',
    phoneHref: 'tel:+33698503282',
    emailHref: 'mailto:moyencet@gmail.com',
  };

  readonly navColumns: FooterColumn[] = [
    {
      links: [
        { label: 'Accueil', href: '/' },
        { label: 'Les cours', href: '/courses' },
        { label: 'Ma formation', href: '/my-training' },
        { label: 'Projets', href: '/projects' },
        { label: 'Services', href: '/services' },
      ],
    },
    {
      links: [
        { label: 'PresQ', href: '/presq' },
        { label: 'Sebastian', href: '/sebastian' },
        { label: 'Contact', href: '/contact' },
        { label: 'Offres', href: '/offers' },
      ],
    },
  ];

  readonly socialLinks: SocialLink[] = [
    {
      label: 'Facebook',
      href: 'https://www.facebook.com/tim.moyence/',
      icon: 'facebook',
    },
    {
      label: 'Instagram',
      href: 'https://www.instagram.com/tim-moyence',
      icon: 'instagram',
    },
    {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/tim-moyence',
      icon: 'linkedin',
    },
  ];

  readonly legalLinks: FooterLink[] = [
    { label: "Conditions d'utilisation", href: '/terms' },
    { label: 'Paramètres de cookies', href: '/cookie-settings' },
    { label: 'Cookies Settings', href: '/cookie-settings' },
  ];
}
