import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CtaBlockComponent } from '../../shared/components/cta-block/cta-block.component';
import { HeroAction, HeroSectionComponent } from '../../shared/components/hero-section/hero-section.component';

interface HighlightLogo {
  src: string;
  alt: string;
}

interface PortfolioCard {
  title: string;
  description: string;
  image: string;
  alt: string;
  tags: string[];
}

@Component({
  selector: 'app-presentation',
  standalone: true,
  imports: [CommonModule, RouterModule, HeroSectionComponent, CtaBlockComponent],
  templateUrl: './presentation.component.html',
  styleUrl: './presentation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PresentationComponent {
  readonly hero = {
    label: $localize`:presentation.hero.label@@presentationHeroLabel:Développeur`,
    title: $localize`:presentation.hero.title@@presentationHeroTitle:Parcours de développement web`,
    description: $localize`:presentation.hero.description@@presentationHeroDescription:Passionné de technologies web avec trois ans d'expérience, je transforme des idées complexes en solutions numériques élégantes et fonctionnelles.`,
    actions: [
      {
        label: $localize`:presentation.hero.action.projects@@presentationHeroActionProjects:Projets`,
        href: '/client-project',
      },
      {
        label: $localize`:presentation.hero.action.contact@@presentationHeroActionContact:Contact`,
        variant: 'secondary' as HeroAction['variant'],
        href: '/contact',
      },
    ],
  };

  readonly technologySection = {
    label: $localize`:presentation.tech.label@@presentationTechLabel:Technologies`,
    title: $localize`:presentation.tech.title@@presentationTechTitle:Compétences techniques au service de vos projets web`,
    description: $localize`:presentation.tech.description@@presentationTechDescription:Mon expertise technique couvre un large spectre de technologies modernes. Je transforme des concepts complexes en solutions numériques élégantes et performantes.`,
    bullets: [
      $localize`:presentation.tech.bullet.frontend@@presentationTechBulletFrontend:Développement frontend avec HTML5, CSS3 et JavaScript`,
      $localize`:presentation.tech.bullet.frameworks@@presentationTechBulletFrameworks:Frameworks modernes comme Angular, React et Node.js`,
      $localize`:presentation.tech.bullet.performance@@presentationTechBulletPerformance:Intégration et optimisation des performances web`,
    ],
    image: 'https://d22po4pjz3o32e.cloudfront.net/placeholder-image.svg',
    imageAlt: $localize`:presentation.tech.image.alt@@presentationTechImageAlt:Illustration de compétences techniques`,
    actions: [
      {
        label: $localize`:presentation.tech.action.skills@@presentationTechActionSkills:Voir mes compétences`,
        variant: 'secondary' as HeroAction['variant'],
        href: '/offer',
      },
      {
        label: $localize`:presentation.tech.action.learnMore@@presentationTechActionLearnMore:En savoir plus`,
        variant: 'ghost' as HeroAction['variant'],
        href: '/presentation',
      },
    ],
  };

  readonly highlightSection = {
    label: $localize`:presentation.highlight.label@@presentationHighlightLabel:Projets`,
    title: $localize`:presentation.highlight.title@@presentationHighlightTitle:Une sélection de mes réalisations web`,
    description: $localize`:presentation.highlight.description@@presentationHighlightDescription:Chaque projet raconte une histoire unique de transformation numérique. Découvrez comment j'ai relevé différents défis techniques et créatifs.`,
    logos: [
      {
        src: 'https://d22po4pjz3o32e.cloudfront.net/webflow-logo.svg',
        alt: $localize`:presentation.highlight.logo.webflow1@@presentationHighlightLogoWebflow1:Logo Webflow`,
      },
      {
        src: 'https://d22po4pjz3o32e.cloudfront.net/relume-logo.svg',
        alt: $localize`:presentation.highlight.logo.relume1@@presentationHighlightLogoRelume1:Logo Relume`,
      },
      {
        src: 'https://d22po4pjz3o32e.cloudfront.net/webflow-logo.svg',
        alt: $localize`:presentation.highlight.logo.webflow2@@presentationHighlightLogoWebflow2:Logo Webflow alternatif`,
      },
      {
        src: 'https://d22po4pjz3o32e.cloudfront.net/relume-logo.svg',
        alt: $localize`:presentation.highlight.logo.relume2@@presentationHighlightLogoRelume2:Second logo Relume`,
      },
    ] as HighlightLogo[],
    actions: [
      {
        label: $localize`:presentation.highlight.action.projects@@presentationHighlightActionProjects:Voir mes projets`,
        variant: 'secondary' as HeroAction['variant'],
        href: '/client-project',
      },
      {
        label: $localize`:presentation.highlight.action.details@@presentationHighlightActionDetails:Détails`,
        variant: 'ghost' as HeroAction['variant'],
        href: '/client-project',
      },
    ],
  };

  readonly portfolioHeader = {
    label: $localize`:presentation.portfolio.label@@presentationPortfolioLabel:Réalisations`,
    title: $localize`:presentation.portfolio.title@@presentationPortfolioTitle:Projets innovants en entreprise`,
    description: $localize`:presentation.portfolio.description@@presentationPortfolioDescription:Chaque ligne de code raconte une histoire de transformation numérique.`,
    ctaLabel: $localize`:presentation.portfolio.cta@@presentationPortfolioCta:Tous les projets`,
  };

  readonly portfolioCards: PortfolioCard[] = [
    {
      title: $localize`:presentation.portfolio.card.assistant@@presentationPortfolioCardAssistant:Assistant IA Geev`,
      description: $localize`:presentation.portfolio.card.assistant.desc@@presentationPortfolioCardAssistantDesc:Développement d'un système intelligent de tri automatique des annonces par analyse d'images.`,
      image:
        'https://d22po4pjz3o32e.cloudfront.net/placeholder-image-landscape.svg',
      alt: $localize`:presentation.portfolio.card.assistant.alt@@presentationPortfolioCardAssistantAlt:Capture du projet Assistant IA Geev`,
      tags: [
        $localize`:presentation.portfolio.tag.ai@@presentationPortfolioTagAi:Intelligence artificielle`,
        $localize`:presentation.portfolio.tag.image@@presentationPortfolioTagImage:Traitement d'image`,
        $localize`:presentation.portfolio.tag.automation@@presentationPortfolioTagAutomation:Automatisation`,
      ],
    },
    {
      title: $localize`:presentation.portfolio.card.test@@presentationPortfolioCardTest:Test IA Geev`,
      description: $localize`:presentation.portfolio.card.test.desc@@presentationPortfolioCardTestDesc:Conception d'un système d'intelligence artificielle pour la planification automatisée des rendez-vous.`,
      image:
        'https://d22po4pjz3o32e.cloudfront.net/placeholder-image-landscape.svg',
      alt: $localize`:presentation.portfolio.card.test.alt@@presentationPortfolioCardTestAlt:Capture du projet Test IA Geev`,
      tags: [
        $localize`:presentation.portfolio.tag.optimisation@@presentationPortfolioTagOptimisation:Optimisation`,
        $localize`:presentation.portfolio.tag.planning@@presentationPortfolioTagPlanning:Planification`,
        $localize`:presentation.portfolio.tag.efficiency@@presentationPortfolioTagEfficiency:Efficacité`,
      ],
    },
    {
      title: $localize`:presentation.portfolio.card.beecoming@@presentationPortfolioCardBeecoming:App Beecoming`,
      description: $localize`:presentation.portfolio.card.beecoming.desc@@presentationPortfolioCardBeecomingDesc:Application de suivi de production pour la filière cognac, de la vigne à la bouteille.`,
      image: 'https://d22po4pjz3o32e.cloudfront.net/placeholder-image.svg',
      alt: $localize`:presentation.portfolio.card.beecoming.alt@@presentationPortfolioCardBeecomingAlt:Capture du projet App Beecoming`,
      tags: [
        $localize`:presentation.portfolio.tag.traceability@@presentationPortfolioTagTraceability:Traçabilité`,
        $localize`:presentation.portfolio.tag.agriculture@@presentationPortfolioTagAgriculture:Agriculture`,
        $localize`:presentation.portfolio.tag.innovation@@presentationPortfolioTagInnovation:Innovation`,
      ],
    },
    {
      title: $localize`:presentation.portfolio.card.louisons@@presentationPortfolioCardLouisons:Projet Louisons`,
      description: $localize`:presentation.portfolio.card.louisons.desc@@presentationPortfolioCardLouisonsDesc:Création d'un site web personnalisé avec des fonctionnalités sur mesure pour répondre aux besoins spécifiques.`,
      image:
        'https://d22po4pjz3o32e.cloudfront.net/placeholder-image-landscape.svg',
      alt: $localize`:presentation.portfolio.card.louisons.alt@@presentationPortfolioCardLouisonsAlt:Capture du projet Louisons`,
      tags: [
        $localize`:presentation.portfolio.tag.webdesign@@presentationPortfolioTagWebdesign:Web design`,
        $localize`:presentation.portfolio.tag.development@@presentationPortfolioTagDevelopment:Développement`,
        $localize`:presentation.portfolio.tag.custom@@presentationPortfolioTagCustom:Personnalisation`,
      ],
    },
    {
      title: $localize`:presentation.portfolio.card.vincent@@presentationPortfolioCardVincent:Projet Vincent`,
      description: $localize`:presentation.portfolio.card.vincent.desc@@presentationPortfolioCardVincentDesc:Développement d'une solution web adaptée aux exigences uniques du client.`,
      image:
        'https://d22po4pjz3o32e.cloudfront.net/placeholder-image-landscape.svg',
      alt: $localize`:presentation.portfolio.card.vincent.alt@@presentationPortfolioCardVincentAlt:Capture du projet Vincent`,
      tags: [
        $localize`:presentation.portfolio.tag.websolution@@presentationPortfolioTagWebsolution:Solution web`,
        $localize`:presentation.portfolio.tag.custom@@presentationPortfolioTagCustom:Personnalisation`,
        $localize`:presentation.portfolio.tag.creativity@@presentationPortfolioTagCreativity:Créativité`,
      ],
    },
    {
      title: $localize`:presentation.portfolio.card.others@@presentationPortfolioCardOthers:Autres projets`,
      description: $localize`:presentation.portfolio.card.others.desc@@presentationPortfolioCardOthersDesc:Exploration de solutions techniques innovantes qui repoussent les limites du possible.`,
      image:
        'https://d22po4pjz3o32e.cloudfront.net/placeholder-image-landscape.svg',
      alt: $localize`:presentation.portfolio.card.others.alt@@presentationPortfolioCardOthersAlt:Illustration d'autres projets`,
      tags: [
        $localize`:presentation.portfolio.tag.innovation@@presentationPortfolioTagInnovation:Innovation`,
        $localize`:presentation.portfolio.tag.creativity@@presentationPortfolioTagCreativity:Créativité`,
        $localize`:presentation.portfolio.tag.technical@@presentationPortfolioTagTechnical:Technique`,
      ],
    },
  ];

  readonly overlayCta = {
    title: $localize`:presentation.cta.title@@presentationCtaTitle:Prêt à démarrer votre projet web?`,
    description: $localize`:presentation.cta.description@@presentationCtaDescription:Ensemble, transformons vos idées en solutions numériques performantes et innovantes.`,
    background:
      'https://d22po4pjz3o32e.cloudfront.net/placeholder-image.svg',
    actions: [
      {
        label: $localize`:presentation.cta.action.talk@@presentationCtaActionTalk:Discutons`,
        href: '/contact',
      },
      {
        label: $localize`:presentation.cta.action.quote@@presentationCtaActionQuote:Devis`,
        variant: 'secondary' as HeroAction['variant'],
        href: '/offer',
      },
    ],
  };
}
