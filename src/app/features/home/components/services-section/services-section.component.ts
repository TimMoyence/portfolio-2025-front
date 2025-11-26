import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

type Service = {
  title: string;
  description: string;
  iconSrc: string;
  iconAlt: string;
};

@Component({
  selector: 'app-services-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="px-[5%] py-16 md:py-24 lg:py-28">
      <div class="container">
        <div
          class="mb-12 grid grid-cols-1 gap-5 md:mb-18 md:grid-cols-2 md:gap-x-12 md:gap-y-8 lg:mb-20 lg:gap-x-20"
        >
          <div>
            <h2 class="mb-3 font-semibold md:mb-4">Services</h2>
            <p class="heading-h2 font-bold">Solutions numériques sur mesure</p>
          </div>
          <div>
            <p class="text-medium">
              Je propose des services complets adaptés à vos besoins
              spécifiques, avec une approche personnalisée et professionnelle.
            </p>
          </div>
        </div>
        <div
          class="grid grid-cols-1 gap-y-12 md:grid-cols-2 md:gap-x-8 md:gap-y-16 lg:grid-cols-4"
        >
          <article *ngFor="let service of services">
            <div class="mb-5 md:mb-6">
              <img
                [src]="service.iconSrc"
                class="size-12"
                [alt]="service.iconAlt"
                loading="lazy"
                aria-hidden="true"
              />
            </div>
            <h3 class="heading-h5 mb-3 font-bold md:mb-4">
              {{ service.title }}
            </h3>
            <p>{{ service.description }}</p>
          </article>
        </div>
        <div class="mt-12 flex flex-wrap items-center gap-4 md:mt-18 lg:mt-20">
          <a
            href="/tarif"
            class="inline-flex items-center justify-center rounded-button border border-scheme-border px-5 py-2 font-semibold"
          >
            Tarifs
          </a>
          <a
            href="/contact"
            class="inline-flex items-center justify-center gap-2 px-5 py-2 font-semibold underline"
          >
            Contactez-moi
          </a>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class ServicesSectionComponent {
  readonly services: Service[] = [
    {
      title: 'Création de site web',
      description:
        'Stratégies avancées pour améliorer la visibilité de votre site et attirer plus de clients potentiels.',
      iconSrc: 'https://d22po4pjz3o32e.cloudfront.net/relume-icon.svg',
      iconAlt: 'Relume logo 1',
    },
    {
      title: 'Maintenance de site web',
      description:
        'Accompagnement personnalisé pour développer vos compétences numériques et atteindre vos objectifs professionnels.',
      iconSrc: 'https://d22po4pjz3o32e.cloudfront.net/relume-icon.svg',
      iconAlt: 'Relume logo 1',
    },
    {
      title: 'Référencement SEO',
      description:
        'Solutions expertes pour votre transformation digitale et votre visibilité en ligne.',
      iconSrc: 'https://d22po4pjz3o32e.cloudfront.net/relume-icon.svg',
      iconAlt: 'Relume logo 1',
    },
    {
      title: 'Formation et coaching',
      description:
        'Programmes conçus pour propulser votre entreprise vers de nouveaux horizons numériques.',
      iconSrc: 'https://d22po4pjz3o32e.cloudfront.net/relume-icon.svg',
      iconAlt: 'Relume logo 1',
    },
  ];
}
