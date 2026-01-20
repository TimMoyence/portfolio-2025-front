import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  HeroAction,
  HeroSectionComponent,
} from '../../shared/components/hero-section/hero-section.component';
import { ContactCtaComponent } from '../../shared/components/cta-contact/cta-contact.component';

interface CaseStudy {
  tag: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  actions: HeroAction[];
  reverse?: boolean;
}

interface LogoItem {
  src: string;
  alt: string;
}

@Component({
  selector: 'app-client-project',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeroSectionComponent,
    ContactCtaComponent,
  ],
  templateUrl: './client-project.component.html',
  styleUrl: './client-project.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientProjectComponent {
  readonly hero = {
    label: $localize`:clientProject.hero.label@@clientProjectHeroLabel:Clients`,
    title: $localize`:clientProject.hero.title@@clientProjectHeroTitle:Mes projets web réalisés`,
    description: $localize`:clientProject.hero.description@@clientProjectHeroDescription:Découvrez l'histoire derrière chaque site web, fruit d'une collaboration unique.`,
    actions: [
      {
        label: $localize`:clientProject.hero.action.view@@clientProjectHeroActionView:Voir les projets`,
        href: '/client-project',
      },
      {
        label: $localize`:clientProject.hero.action.contact@@clientProjectHeroActionContact:Contact`,
        variant: 'secondary' as HeroAction['variant'],
        href: '/contact',
      },
    ],
  };

  readonly caseStudies: CaseStudy[] = [
    {
      tag: $localize`:clientProject.caseStudies.tag@@clientProjectCaseStudiesTag:Projets`,
      title: $localize`:clientProject.caseStudies.title1@@clientProjectCaseStudiesTitle1:Sites web développés avec passion`,
      description: $localize`:clientProject.caseStudies.description1@@clientProjectCaseStudiesDescription1:Chaque projet raconte une histoire différente. Des solutions numériques sur mesure.`,
      image: 'https://d22po4pjz3o32e.cloudfront.net/placeholder-image.svg',
      imageAlt: $localize`:clientProject.caseStudies.image1.alt@@clientProjectCaseStudiesImage1Alt:Illustration de projet web`,
      actions: [
        {
          label: $localize`:clientProject.caseStudies.action.details@@clientProjectCaseStudiesActionDetails:Détails`,
          variant: 'secondary' as HeroAction['variant'],
          href: '/client-project',
        },
        {
          label: $localize`:clientProject.caseStudies.action.link@@clientProjectCaseStudiesActionLink:Lien`,
          variant: 'ghost' as HeroAction['variant'],
          href: '/presentation',
        },
      ],
    },
    {
      tag: $localize`:clientProject.caseStudies.tag@@clientProjectCaseStudiesTag:Projets`,
      title: $localize`:clientProject.caseStudies.title2@@clientProjectCaseStudiesTitle2:Créations numériques sur mesure`,
      description: $localize`:clientProject.caseStudies.description2@@clientProjectCaseStudiesDescription2:Des expériences fluides et intuitives pensées pour chaque utilisateur.`,
      image: 'https://d22po4pjz3o32e.cloudfront.net/placeholder-image.svg',
      imageAlt: $localize`:clientProject.caseStudies.image2.alt@@clientProjectCaseStudiesImage2Alt:Illustration de création numérique`,
      reverse: true,
      actions: [
        {
          label: $localize`:clientProject.caseStudies.action.details@@clientProjectCaseStudiesActionDetails:Détails`,
          variant: 'secondary' as HeroAction['variant'],
          href: '/client-project',
        },
        {
          label: $localize`:clientProject.caseStudies.action.link@@clientProjectCaseStudiesActionLink:Lien`,
          variant: 'ghost' as HeroAction['variant'],
          href: '/presentation',
        },
      ],
    },
  ];

  readonly featureBlock = {
    label: $localize`:clientProject.feature.label@@clientProjectFeatureLabel:Projet`,
    title: $localize`:clientProject.feature.title@@clientProjectFeatureTitle:Site Vincent`,
    description: $localize`:clientProject.feature.description@@clientProjectFeatureDescription:Solution web personnalisée développée pour répondre à l'identité unique de Vincent.`,
    image: 'https://d22po4pjz3o32e.cloudfront.net/placeholder-image.svg',
    imageAlt: $localize`:clientProject.feature.image.alt@@clientProjectFeatureImageAlt:Maquette du site Vincent`,
    actions: [
      {
        label: $localize`:clientProject.feature.action.discover@@clientProjectFeatureActionDiscover:Découvrir`,
        variant: 'secondary' as HeroAction['variant'],
        href: '/client-project',
      },
      {
        label: $localize`:clientProject.feature.action.explore@@clientProjectFeatureActionExplore:Explorer`,
        variant: 'ghost' as HeroAction['variant'],
        href: '/presentation',
      },
    ],
  };

  readonly clientHighlight = {
    label: $localize`:clientProject.clientHighlight.label@@clientProjectClientHighlightLabel:Client`,
    title: $localize`:clientProject.clientHighlight.title@@clientProjectClientHighlightTitle:Projet Louisons`,
    description: $localize`:clientProject.clientHighlight.description@@clientProjectClientHighlightDescription:Un site web sur mesure conçu pour répondre aux besoins spécifiques de Louisons.`,
    logos: [
      {
        src: 'https://d22po4pjz3o32e.cloudfront.net/webflow-logo.svg',
        alt: $localize`:clientProject.clientHighlight.logo.webflow1@@clientProjectClientHighlightLogoWebflow1:Logo Webflow`,
      },
      {
        src: 'https://d22po4pjz3o32e.cloudfront.net/relume-logo.svg',
        alt: $localize`:clientProject.clientHighlight.logo.relume1@@clientProjectClientHighlightLogoRelume1:Logo Relume`,
      },
      {
        src: 'https://d22po4pjz3o32e.cloudfront.net/webflow-logo.svg',
        alt: $localize`:clientProject.clientHighlight.logo.webflow2@@clientProjectClientHighlightLogoWebflow2:Deuxième logo Webflow`,
      },
      {
        src: 'https://d22po4pjz3o32e.cloudfront.net/relume-logo.svg',
        alt: $localize`:clientProject.clientHighlight.logo.relume2@@clientProjectClientHighlightLogoRelume2:Deuxième logo Relume`,
      },
    ] as LogoItem[],
    heroImage:
      'https://d22po4pjz3o32e.cloudfront.net/placeholder-image-landscape.svg',
    actions: [
      {
        label: $localize`:clientProject.clientHighlight.action.visit@@clientProjectClientHighlightActionVisit:Visiter`,
        variant: 'secondary' as HeroAction['variant'],
        href: '/client-project',
      },
      {
        label: $localize`:clientProject.clientHighlight.action.website@@clientProjectClientHighlightActionWebsite:Site web`,
        variant: 'ghost' as HeroAction['variant'],
        href: '/presentation',
      },
    ],
  };

  readonly contactSection = {
    leadParagraphs: [
      $localize`:home.contact.lead.1|Home contact lead paragraph@@homeContactLead1:Vous avez un besoin, une contrainte ou une idée à clarifier ?`,
      $localize`:home.contact.lead.2|Home contact lead paragraph@@homeContactLead2:Un premier échange permet de comprendre votre contexte et de définir la suite la plus pertinente.`,
    ],
  };
}
