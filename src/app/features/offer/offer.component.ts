import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CtaBlockComponent } from '../../shared/components/cta-block/cta-block.component';
import {
  HeroAction,
  HeroSectionComponent,
} from '../../shared/components/hero-section/hero-section.component';

interface ServiceSection {
  id: string;
  linkLabel: string;
  category: string;
  heading: string;
  description: string;
  image: string;
  imageAlt: string;
  offsetTop: string;
  actions: HeroAction[];
}

interface PricingPlan {
  name: string;
  price: string;
  note: string;
  features: string[];
  cta: string;
}

@Component({
  selector: 'app-offer',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeroSectionComponent,
    CtaBlockComponent,
  ],
  templateUrl: './offer.component.html',
  styleUrl: './offer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferComponent {
  readonly hero = {
    title: $localize`:offer.hero.title@@offerHeroTitle:Services professionnels web`,
    description: $localize`:offer.hero.description@@offerHeroDescription:Solutions numériques sur mesure pour transformer votre présence en ligne et propulser votre entreprise vers de nouveaux horizons stratégiques.`,
    actions: [
      {
        label: $localize`:offer.hero.action.contact@@offerHeroActionContact:Contact`,
        href: '/contact',
      },
      {
        label: $localize`:offer.hero.action.presentation@@offerHeroActionPresentation:Présentation`,
        variant: 'secondary' as HeroAction['variant'],
        href: '/presentation',
      },
    ],
  };

  readonly services: ServiceSection[] = [
    {
      id: '01',
      linkLabel: $localize`:offer.service.site@@offerServiceSite:Création de site web`,
      category: $localize`:offer.service.category.design@@offerServiceCategoryDesign:Design`,
      heading: $localize`:offer.service.heading.custom@@offerServiceHeadingCustom:Conception de sites web sur mesure`,
      description: $localize`:offer.service.description@@offerServiceDescription:Développement de sites web professionnels adaptés à vos besoins spécifiques. Chaque projet est unique et conçu pour maximiser votre présence en ligne.`,
      image: 'https://d22po4pjz3o32e.cloudfront.net/placeholder-image-1.svg',
      imageAlt: $localize`:offer.service.image.site.alt@@offerServiceImageSiteAlt:Illustration de création de site`,
      offsetTop: '0',
      actions: [
        {
          label: $localize`:offer.service.action.discover@@offerServiceActionDiscover:Découvrir`,
          variant: 'secondary' as HeroAction['variant'],
          href: '/offer',
        },
        {
          label: $localize`:offer.service.action.details@@offerServiceActionDetails:Détails`,
          variant: 'ghost' as HeroAction['variant'],
          href: '/client-project',
        },
      ],
    },
    {
      id: '02',
      linkLabel: $localize`:offer.service.maintenance@@offerServiceMaintenance:Maintenance de site`,
      category: $localize`:offer.service.category.design@@offerServiceCategoryDesign:Design`,
      heading: $localize`:offer.service.heading.custom@@offerServiceHeadingCustom:Conception de sites web sur mesure`,
      description: $localize`:offer.service.description@@offerServiceDescription:Développement de sites web professionnels adaptés à vos besoins spécifiques. Chaque projet est unique et conçu pour maximiser votre présence en ligne.`,
      image: 'https://d22po4pjz3o32e.cloudfront.net/placeholder-image-2.svg',
      imageAlt: $localize`:offer.service.image.maintenance.alt@@offerServiceImageMaintenanceAlt:Illustration de maintenance`,
      offsetTop: '4rem',
      actions: [
        {
          label: $localize`:offer.service.action.discover@@offerServiceActionDiscover:Découvrir`,
          variant: 'secondary' as HeroAction['variant'],
          href: '/offer',
        },
        {
          label: $localize`:offer.service.action.details@@offerServiceActionDetails:Détails`,
          variant: 'ghost' as HeroAction['variant'],
          href: '/client-project',
        },
      ],
    },
    {
      id: '03',
      linkLabel: $localize`:offer.service.seo@@offerServiceSeo:Référencement SEO`,
      category: $localize`:offer.service.category.design@@offerServiceCategoryDesign:Design`,
      heading: $localize`:offer.service.heading.custom@@offerServiceHeadingCustom:Conception de sites web sur mesure`,
      description: $localize`:offer.service.description@@offerServiceDescription:Développement de sites web professionnels adaptés à vos besoins spécifiques. Chaque projet est unique et conçu pour maximiser votre présence en ligne.`,
      image: 'https://d22po4pjz3o32e.cloudfront.net/placeholder-image-3.svg',
      imageAlt: $localize`:offer.service.image.seo.alt@@offerServiceImageSeoAlt:Illustration SEO`,
      offsetTop: '8rem',
      actions: [
        {
          label: $localize`:offer.service.action.discover@@offerServiceActionDiscover:Découvrir`,
          variant: 'secondary' as HeroAction['variant'],
          href: '/offer',
        },
        {
          label: $localize`:offer.service.action.details@@offerServiceActionDetails:Détails`,
          variant: 'ghost' as HeroAction['variant'],
          href: '/client-project',
        },
      ],
    },
    {
      id: '04',
      linkLabel: $localize`:offer.service.training@@offerServiceTraining:Formation et coaching`,
      category: $localize`:offer.service.category.design@@offerServiceCategoryDesign:Design`,
      heading: $localize`:offer.service.heading.custom@@offerServiceHeadingCustom:Conception de sites web sur mesure`,
      description: $localize`:offer.service.description@@offerServiceDescription:Développement de sites web professionnels adaptés à vos besoins spécifiques. Chaque projet est unique et conçu pour maximiser votre présence en ligne.`,
      image: 'https://d22po4pjz3o32e.cloudfront.net/placeholder-image-4.svg',
      imageAlt: $localize`:offer.service.image.training.alt@@offerServiceImageTrainingAlt:Illustration formation`,
      offsetTop: '0',
      actions: [
        {
          label: $localize`:offer.service.action.discover@@offerServiceActionDiscover:Découvrir`,
          variant: 'secondary' as HeroAction['variant'],
          href: '/offer',
        },
        {
          label: $localize`:offer.service.action.details@@offerServiceActionDetails:Détails`,
          variant: 'ghost' as HeroAction['variant'],
          href: '/client-project',
        },
      ],
    },
  ];

  readonly qualities: ServiceSection[] = [
    {
      id: '01',
      linkLabel: $localize`:offer.quality.expertise@@offerQualityExpertise:Expertise technique`,
      category: $localize`:offer.quality.category.quality@@offerQualityCategory:Qualité`,
      heading: $localize`:offer.quality.heading.performance@@offerQualityHeadingPerformance:Solutions web hautement performantes`,
      description: $localize`:offer.quality.description@@offerQualityDescription:Conception de sites web modernes utilisant les dernières technologies. Chaque projet bénéficie d'une approche sur mesure et innovante.`,
      image: 'https://d22po4pjz3o32e.cloudfront.net/placeholder-image-1.svg',
      imageAlt: $localize`:offer.quality.image.expertise.alt@@offerQualityImageExpertiseAlt:Illustration expertise`,
      offsetTop: '0',
      actions: [
        {
          label: $localize`:offer.quality.action.learn@@offerQualityActionLearn:En savoir plus`,
          variant: 'secondary' as HeroAction['variant'],
          href: '/presentation',
        },
        {
          label: $localize`:offer.quality.action.details@@offerQualityActionDetails:Détails`,
          variant: 'ghost' as HeroAction['variant'],
          href: '/client-project',
        },
      ],
    },
    {
      id: '02',
      linkLabel: $localize`:offer.quality.support@@offerQualitySupport:Support client`,
      category: $localize`:offer.quality.category.quality@@offerQualityCategory:Qualité`,
      heading: $localize`:offer.quality.heading.performance@@offerQualityHeadingPerformance:Solutions web hautement performantes`,
      description: $localize`:offer.quality.description@@offerQualityDescription:Conception de sites web modernes utilisant les dernières technologies. Chaque projet bénéficie d'une approche sur mesure et innovante.`,
      image: 'https://d22po4pjz3o32e.cloudfront.net/placeholder-image-2.svg',
      imageAlt: $localize`:offer.quality.image.support.alt@@offerQualityImageSupportAlt:Illustration support`,
      offsetTop: '4rem',
      actions: [
        {
          label: $localize`:offer.quality.action.learn@@offerQualityActionLearn:En savoir plus`,
          variant: 'secondary' as HeroAction['variant'],
          href: '/presentation',
        },
        {
          label: $localize`:offer.quality.action.details@@offerQualityActionDetails:Détails`,
          variant: 'ghost' as HeroAction['variant'],
          href: '/client-project',
        },
      ],
    },
    {
      id: '03',
      linkLabel: $localize`:offer.quality.strategy@@offerQualityStrategy:Stratégie digitale`,
      category: $localize`:offer.quality.category.quality@@offerQualityCategory:Qualité`,
      heading: $localize`:offer.quality.heading.performance@@offerQualityHeadingPerformance:Solutions web hautement performantes`,
      description: $localize`:offer.quality.description@@offerQualityDescription:Conception de sites web modernes utilisant les dernières technologies. Chaque projet bénéficie d'une approche sur mesure et innovante.`,
      image: 'https://d22po4pjz3o32e.cloudfront.net/placeholder-image-3.svg',
      imageAlt: $localize`:offer.quality.image.strategy.alt@@offerQualityImageStrategyAlt:Illustration stratégie`,
      offsetTop: '8rem',
      actions: [
        {
          label: $localize`:offer.quality.action.learn@@offerQualityActionLearn:En savoir plus`,
          variant: 'secondary' as HeroAction['variant'],
          href: '/presentation',
        },
        {
          label: $localize`:offer.quality.action.details@@offerQualityActionDetails:Détails`,
          variant: 'ghost' as HeroAction['variant'],
          href: '/client-project',
        },
      ],
    },
  ];

  readonly callToAction = {
    title: $localize`:offer.cta.title@@offerCtaTitle:Prêt à transformer votre présence web ?`,
    description: $localize`:offer.cta.description@@offerCtaDescription:Contactez Asili Design pour un devis personnalisé et une consultation gratuite sur vos projets numériques.`,
    actions: [
      {
        label: $localize`:offer.cta.action.quote@@offerCtaActionQuote:Demander un devis`,
        href: '/offer',
      },
      {
        label: $localize`:offer.cta.action.contact@@offerCtaActionContact:Contactez-nous`,
        variant: 'secondary' as HeroAction['variant'],
        href: '/contact',
      },
    ],
  };
}
