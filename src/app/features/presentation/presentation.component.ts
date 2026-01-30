import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterModule } from "@angular/router";
import {
  HeroAction,
  HeroSectionComponent,
} from "../../shared/components/hero-section/hero-section.component";
import { CtaSectionComponent } from "../home/components/cta-section/cta-section.component";

interface HighlightLogo {
  src: string;
  alt: string;
}

interface PortfolioCard {
  title: string;
  descriptionPragraphs: string[];
  descriptionNote?: string;
  image: string;
  alt: string;
  tags: string[];
}

@Component({
  selector: "app-presentation",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeroSectionComponent,
    CtaSectionComponent,
  ],
  templateUrl: "./presentation.component.html",
  styleUrl: "./presentation.component.scss",
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
        variant: "secondary" as HeroAction["variant"],
        href: "/client-project",
      },
      {
        label: $localize`:presentation.hero.action.contact@@presentationHeroActionContact:Contact`,
        variant: "primary" as HeroAction["variant"],
        href: "/contact",
      },
    ],
  };

  readonly technologySection = {
    label: $localize`:presentation.tech.label@@presentationTechLabel:Technologies`,
    title: $localize`:presentation.tech.title@@presentationTechTitle:Des compétences techniques au service de projets concrets`,
    leadParagraphs: [
      $localize`:leadParagraphs.description1@@leadParagraphsDescription1:Mon approche du développement web repose sur la compréhension du contexte avant le choix des outils.`,
      $localize`:leadParagraphs.description2@@leadParagraphsDescription2:Les technologies sont sélectionnées pour leur pertinence, leur fiabilité et leur capacité à s’inscrire dans la durée, afin de construire des solutions compréhensibles, maintenables et adaptées aux usages réels.`,
    ],
    image: "/assets/images/technology-skills-illustration.webp",
    imageAlt: $localize`:presentation.tech.image.alt@@presentationTechImageAlt:Illustration de compétences techniques`,
    actions: [
      {
        label: $localize`:presentation.tech.action.skills@@presentationTechActionSkills:Voir mes compétences`,
        variant: "primary" as HeroAction["variant"],
        href: "/offer",
      },
      {
        label: $localize`:presentation.tech.action.learnMore@@presentationTechActionLearnMore:En savoir plus`,
        variant: "ghost" as HeroAction["variant"],
        href: "/presentation",
      },
    ],
  };

  readonly portfolioHeader = {
    label: $localize`:presentation.portfolio.label@@presentationPortfolioLabel:Réalisations`,
    title: $localize`:presentation.portfolio.title@@presentationPortfolioTitle:séléction de projets`,
    description: $localize`:presentation.portfolio.description@@presentationPortfolioDescription:Une sélection de projets représentatifs de mon approche, mêlant réflexion, développement et adaptation aux usages réels.`,
    ctaLabel: $localize`:presentation.portfolio.cta@@presentationPortfolioCta:Tous les projets`,
  };

  readonly portfolioCards: PortfolioCard[] = [
    {
      title: $localize`:presentation.portfolio.card.assistant@@presentationPortfolioCardAssistant:Assistant IA Geev`,
      descriptionPragraphs: [
        $localize`:presentation.portfolio.card.assistant.desc@@presentationPortfolioCardAssistantDesc1:Conception d’un prototype d’assistant intelligent destiné à faciliter le tri et l’analyse d’annonces à partir de contenus visuels.
`,
        $localize`:presentation.portfolio.card.assistant.desc@@presentationPortfolioCardAssistantDesc2:Le projet explore l’usage de l’intelligence artificielle comme outil d’aide à la décision, dans un cadre maîtrisé.`,
      ],
      image: "./assets/images/projects/Assistant-IA-Geev.webp",
      alt: $localize`:presentation.portfolio.card.assistant.alt@@presentationPortfolioCardAssistantAlt:Capture du projet Assistant IA Geev`,
      tags: [
        $localize`:presentation.portfolio.tag.ai@@presentationPortfolioTagAi:Intelligence artificielle`,
        $localize`:presentation.portfolio.tag.image@@presentationPortfolioTagImage:Analyse de contenu`,
        $localize`:presentation.portfolio.tag.automation.Geev@@presentationPortfolioTagAutomationGeev:Automatisation`,
      ],
    },
    {
      title: $localize`:presentation.portfolio.card.test@@presentationPortfolioCardTest:Prototype de planification assistée`,
      descriptionPragraphs: [
        $localize`:presentation.portfolio.card.test.desc@@presentationPortfolioCardTestDesc1:Exploration d’un système d’aide à la planification reposant sur l’intelligence artificielle, visant à automatiser et fluidifier la prise de rendez-vous.`,
        $localize`:presentation.portfolio.card.test.desc@@presentationPortfolioCardTestDesc2:Le projet s’inscrit dans une démarche d’optimisation des processus, sans remplacer l’intervention humaine.`,
      ],
      image: "./assets/images/projects/prototype-planification-assistée.webp",
      alt: $localize`:presentation.portfolio.card.test.alt@@presentationPortfolioCardTestAlt:Capture du projet Test IA Geev`,
      tags: [
        $localize`:presentation.portfolio.tag.optimisation@@presentationPortfolioTagOptimisation:Optimisation`,
        $localize`:presentation.portfolio.tag.planning@@presentationPortfolioTagPlanning:Planification`,
        $localize`:presentation.portfolio.tag.efficiency@@presentationPortfolioTagEfficiency:IA appliquée`,
      ],
    },
    {
      title: $localize`:presentation.portfolio.card.beecoming@@presentationPortfolioCardBeecoming:Gestion de chais de cognac`,
      descriptionPragraphs: [
        $localize`:presentation.portfolio.card.beecoming.desc@@presentationPortfolioCardBeecomingDesc1:Application de suivi et de structuration de la production pour la filière cognac, de la vigne à la mise en bouteille.`,
        $localize`:presentation.portfolio.card.beecoming.desc@@presentationPortfolioCardBeecomingDesc2:L’objectif est de centraliser les informations, améliorer la traçabilité et accompagner les usages métier au quotidien.`,
      ],
      image: "./assets/images/projects/GDC-presentation.webp",
      alt: $localize`:presentation.portfolio.card.beecoming.alt@@presentationPortfolioCardBeecomingAlt:Capture du projet App Beecoming`,
      tags: [
        $localize`:presentation.portfolio.tag.traceability@@presentationPortfolioTagTraceability:Traçabilité`,
        $localize`:presentation.portfolio.tag.metier@@presentationPortfolioTagMetier:Métier`,
        $localize`:presentation.portfolio.tag.production@@presentationPortfolioTagProduction:Production`,
      ],
    },
    {
      title: $localize`:presentation.portfolio.card.louisons@@presentationPortfolioCardLouisons:Louisson Masseuse`,
      descriptionPragraphs: [
        $localize`:presentation.portfolio.card.louisons.desc@@presentationPortfolioCardLouisonsDesc1:Création d’un site web personnalisé intégrant des fonctionnalités sur mesure pour répondre à des besoins spécifiques.`,
        $localize`:presentation.portfolio.card.louisons.desc@@presentationPortfolioCardLouisonsDesc2:Le projet met l’accent sur la simplicité d’usage, la cohérence visuelle et l’adaptation au contexte client.`,
      ],
      image: "./assets/images/projects/Louisson-masseuse.webp",
      alt: $localize`:presentation.portfolio.card.louisons.alt@@presentationPortfolioCardLouisonsAlt:Capture du projet Louisons`,
      tags: [
        $localize`:presentation.portfolio.tag.web@@presentationPortfolioTagWeb:Web`,
        $localize`:presentation.portfolio.tag.development@@presentationPortfolioTagDevelopment:Développement`,
        $localize`:@@presentationPortfolioTagLouisonCustom:Sur mesure`,
      ],
    },
    {
      title: $localize`:presentation.portfolio.card.vincent@@presentationPortfolioCardVincent:AtlanticBike`,
      descriptionPragraphs: [
        $localize`:presentation.portfolio.card.vincent.desc@@presentationPortfolioCardVincentDesc1:Développement d’une solution web adaptée à des besoins spécifiques, avec une attention particulière portée à la clarté, à l’usage et à la personnalisation.`,
        $localize`:presentation.portfolio.card.vincent.desc@@presentationPortfolioCardVincentDesc2:Le projet illustre une approche sur mesure, pensée pour s’intégrer naturellement dans l’activité du client.`,
      ],
      image: "./assets/images/projects/Atlanticbike.webp",
      alt: $localize`:presentation.portfolio.card.vincent.alt@@presentationPortfolioCardVincentAlt:Capture du projet Vincent`,
      tags: [
        $localize`:presentation.portfolio.tag.websolution@@presentationPortfolioTagWebsolution:Solution web`,
        $localize`:presentation.portfolio.tag.customAB@@presentationPortfolioTagCustom:Personnalisation`,
        $localize`:presentation.portfolio.tag.creativity@@presentationPortfolioTagCreativity:Usage`,
      ],
    },
    {
      title: $localize`:presentation.portfolio.card.Automation@@presentationPortfolioCardAutomation:Automatisation de validation de diplômes`,
      descriptionPragraphs: [
        $localize`:presentation.portfolio.card.Automation.desc@@presentationPortfolioCardAutomationDesc1:Mise en place d’un processus automatisé pour la génération et l’envoi de communications de validation sur une plateforme e-learning.`,
        $localize`:presentation.portfolio.card.Automation.desc@@presentationPortfolioCardAutomationDesc2:L’objectif est de fiabiliser les échanges, réduire les tâches manuelles et faciliter le passage à l’échelle.`,
      ],
      image: "./assets/images/projects/Automation-validation.webp",
      alt: $localize`:presentation.portfolio.card.Automation.alt@@presentationPortfolioCardAutomationAlt:Capture du projet Automation`,
      tags: [
        $localize`:presentation.portfolio.tag.automation@@presentationPortfolioTagAutomation:Automation`,
        $localize`:presentation.portfolio.tag.process@@presentationPortfolioTagProcess:Process`,
        $localize`:presentation.portfolio.tag.fiabilité@@presentationPortfolioTagFiabilité:Fiabilité`,
      ],
    },
    {
      title: $localize`:presentation.portfolio.card.others@@presentationPortfolioCardOthers:Modélisation prédictive de risques sanitaires`,
      descriptionPragraphs: [
        $localize`:presentation.portfolio.card.others.desc@@presentationPortfolioCardOthersDesc1:Projet de modélisation et d’analyse de données visant à anticiper l’apparition de risques sanitaires à partir de données épidémiologiques.`,
        $localize`:presentation.portfolio.card.others.desc@@presentationPortfolioCardOthersDesc:L’objectif était d’explorer l’usage de modèles d’intelligence artificielle comme outil d’aide à la prévision et à la décision, dans un cadre analytique structuré.`,
      ],
      image:
        "./assets/images/projects/Modélisation-prédictive-risques-sanitaires.webp",
      alt: $localize`:presentation.portfolio.card.others.alt@@presentationPortfolioCardOthersAlt:Illustration d'autres projets`,
      tags: [
        $localize`:presentation.portfolio.tag.analyse@@presentationPortfolioTagAnalyse:Analyse de données`,
        $localize`:presentation.portfolio.tag.modélisation@@presentationPortfolioTagModélisation:Modélisation prédictive`,
        $localize`:presentation.portfolio.tag.technicalIA@@presentationPortfolioTagTechnicalIA:IA Applicative`,
      ],
      descriptionNote: $localize`:presentation.portfolio.card.others.note@@presentationPortfolioCardOthersNote:Projet académique réalisé dans le cadre d’un cursus en développement et analyse de données.`,
    },
    {
      title: $localize`:presentation.portfolio.card.Assistante@@presentationPortfolioCardAssistante:Assistant pour médiation culturelle`,
      descriptionPragraphs: [
        $localize`:presentation.portfolio.card.Assistante.desc@@presentationPortfolioCardAssistanteDesc1:Conception d’un prototype d’assistant numérique destiné à accompagner les guides de musée dans leur médiation.`,
        $localize`:presentation.portfolio.card.Assistante.desc@@presentationPortfolioCardAssistanteDesc2:Le projet explore une utilisation mesurée de l’IA comme soutien à l’expertise humaine, sans s’y substituer.`,
      ],
      image: "./assets/images/projects/Assistant-mediation-culturelle.webp",
      alt: $localize`:presentation.portfolio.card.Assistante.alt@@presentationPortfolioCardAssistanteAlt:Illustration d'un assistant pour médiation culturelle`,
      tags: [
        $localize`:presentation.portfolio.tag.Mediation@@presentationPortfolioTagMediation:Médiation`,
        $localize`:presentation.portfolio.tag.culture@@presentationPortfolioTagCulture:Culture`,
        $localize`:presentation.portfolio.tag.Appliquée@@presentationPortfolioTagAppliquée:IA Appliquée`,
      ],
    },
  ];
}
