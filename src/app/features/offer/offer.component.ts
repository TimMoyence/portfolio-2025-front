import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterModule } from "@angular/router";
import { ContactCtaComponent } from "../../shared/components/cta-contact/cta-contact.component";
import {
  HeroAction,
  HeroSectionComponent,
} from "../../shared/components/hero-section/hero-section.component";
import {
  ServiceItem,
  ServicesSectionComponent,
} from "../../shared/components/services-section/services-section.component";
import { CtaSectionComponent } from "../home/components/cta-section/cta-section.component";

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

@Component({
  selector: "app-offer",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeroSectionComponent,
    CtaSectionComponent,
    ContactCtaComponent,
    ServicesSectionComponent,
  ],
  templateUrl: "./offer.component.html",
  styleUrl: "./offer.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferComponent {
  readonly hero = {
    title: $localize`:offer.hero.title@@offer.hero.title:Des solutions digitales claires, pensées pour votre réalité métier`,
    description: $localize`:offer.hero.description@@offer.hero.description:J’accompagne des entreprises et des indépendants dans la clarification, la structuration et l’évolution de leurs outils digitaux.\n\nWeb, automatisation et intelligence artificielle sont utilisés comme des leviers, jamais comme des finalités.`,
    actions: [
      {
        label: $localize`:offer.hero.actions.contact@@offer.hero.actions.contact:Contact`,
        variant: "secondary" as HeroAction["variant"],
        href: "/contact",
      },
      {
        label: $localize`:offer.hero.actions.presentation@@offer.hero.actions.presentation:Présentation`,
        variant: "primary" as HeroAction["variant"],
        href: "/presentation",
      },
    ],
  };

  /**
   * Section "Les offres (où le cadre se construit ensemble)"
   * (le visuel servicesSection.png)
   */
  readonly servicesSection = {
    kicker: $localize`:offer.packages.kicker@@offer.packages.kicker:Services`,
    title: $localize`:offer.packages.title@@offer.packages.title:Les offres (où le cadre se construit ensemble)`,
    leadParagraphs: [
      $localize`:offer.packages.lead.1@@offer.packages.lead.1:Chaque collaboration commence par une phase de compréhension.`,
      $localize`:offer.packages.lead.2@@offer.packages.lead.2:Le périmètre, le rythme et le budget sont définis à partir du besoin réel, pas d’un catalogue de prestations.`,
      $localize`:offer.packages.lead.3@@offer.packages.lead.3:Voici des ordres de grandeur, à titre indicatif.`,
    ],
    services: [
      {
        title: $localize`:offer.packages.items.targeted.title@@offer.packages.items.targeted.title:Interventions ciblées`,
        description: $localize`:offer.packages.items.targeted.desc@@offer.packages.items.targeted.desc:→ à partir de 50 €, délais courts`,
        iconSrc: "/assets/icons/strategy.svg",
        iconAlt: $localize`:offer.packages.items.targeted.iconAlt@@offer.packages.items.targeted.iconAlt:Icône interventions ciblées`,
      },
      {
        title: $localize`:offer.packages.items.structured.title@@offer.packages.items.structured.title:Projets structurants`,
        description: $localize`:offer.packages.items.structured.desc@@offer.packages.items.structured.desc:budgets généralement compris entre 2 000 € et 4 000 €`,
        iconSrc: "/assets/icons/web.svg",
        iconAlt: $localize`:offer.packages.items.structured.iconAlt@@offer.packages.items.structured.iconAlt:Icône projets structurants`,
      },
      {
        title: $localize`:offer.packages.items.retainer.title@@offer.packages.items.retainer.title:Accompagnement dans le temps`,
        description: $localize`:offer.packages.items.retainer.desc@@offer.packages.items.retainer.desc:engagements mensuels adaptés au rythme`,
        iconSrc: "/assets/icons/farsight_digital.svg",
        iconAlt: $localize`:offer.packages.items.retainer.iconAlt@@offer.packages.items.retainer.iconAlt:Icône accompagnement dans le temps`,
      },
      {
        title: $localize`:offer.packages.items.training.title@@offer.packages.items.training.title:Formation et coaching`,
        description: $localize`:offer.packages.items.training.desc@@offer.packages.items.training.desc:Développez votre connaissance d’internet, et des outils en ligne avec des services sur mesure conçus pour propulser vos collaborateurs`,
        iconSrc: "/assets/icons/linked_services.svg",
        iconAlt: $localize`:offer.packages.items.training.iconAlt@@offer.packages.items.training.iconAlt:Icône formation et coaching`,
      },
    ] satisfies ServiceItem[],
    cta: {
      label: $localize`:offer.packages.cta.label@@offer.packages.cta.label:Contactez-moi`,
      href: "/contact",
      iconName: "chevron-right",
      iconSize: 1.2,
    },
  };

  /**
   * Section "Approche" (4 blocs)
   * (le visuel services.jpeg)
   */
  readonly services: ServiceSection[] = [
    {
      id: "01",
      linkLabel: $localize`:offer.approach.items.automation.linkLabel@@offer.approach.items.automation.linkLabel:Automatisation`,
      category: $localize`:offer.approach.items.automation.kicker@@offer.approach.items.automation.kicker:fluidité, efficacité, allègement`,
      heading: $localize`:offer.approach.items.automation.title@@offer.approach.items.automation.title:Pour fluidifier l’existant`,
      description: $localize`:offer.approach.items.automation.body@@offer.approach.items.automation.body:L’objectif n’est pas d’ajouter des outils, mais de simplifier ce qui existe déjà.\n\nSimplifier ce qui ralentit votre quotidien.\n\nJ’automatise des tâches et des flux existants pour gagner en fluidité, fiabilité et clarté, sans transformer votre organisation.`,
      image: "./assets/images/offer/automation-illustration.webp",
      imageAlt: $localize`:offer.approach.items.automation.imageAlt@@offer.approach.items.automation.imageAlt:Illustration automatisation`,
      offsetTop: "6rem",
      actions: [
        {
          label: $localize`:offer.approach.items.automation.actions.primary@@offer.approach.items.automation.actions.primary:Découvrir`,
          variant: "secondary" as HeroAction["variant"],
          href: "/offer",
        },
      ],
    },
    {
      id: "02",
      linkLabel: $localize`:offer.approach.items.businessTool.linkLabel@@offer.approach.items.businessTool.linkLabel:Outil métier`,
      category: $localize`:offer.approach.items.businessTool.kicker@@offer.approach.items.businessTool.kicker:structure, clarté, pilotage`,
      heading: $localize`:offer.approach.items.businessTool.title@@offer.approach.items.businessTool.title:Pour structurer un usage clé`,
      description: $localize`:offer.approach.items.businessTool.body@@offer.approach.items.businessTool.body:Un bon outil est celui qui s’intègre naturellement dans vos pratiques, sans formation lourde ni dépendance excessive.\n\nUn outil pensé pour votre manière de travailler.\n\nJe conçois des applications web sobres et utiles, centrées sur un usage métier clé, avec juste ce qu’il faut d’intelligence intégrée.`,
      image: "./assets/images/offer/business-tool-illustration.webp",
      imageAlt: $localize`:offer.approach.items.businessTool.imageAlt@@offer.approach.items.businessTool.imageAlt:Illustration outil métier`,
      offsetTop: "10rem",
      actions: [
        {
          label: $localize`:offer.approach.items.businessTool.actions.primary@@offer.approach.items.businessTool.actions.primary:Explorer`,
          variant: "secondary" as HeroAction["variant"],
          href: "/offer",
        },
      ],
    },
    {
      id: "03",
      linkLabel: $localize`:offer.approach.items.evolution.linkLabel@@offer.approach.items.evolution.linkLabel:Évolutions & accompagnement`,
      category: $localize`:offer.approach.items.evolution.kicker@@offer.approach.items.evolution.kicker:continuité, stabilité, suivi`,
      heading: $localize`:offer.approach.items.evolution.title@@offer.approach.items.evolution.title:Faire vivre la solution dans le temps`,
      description: $localize`:offer.approach.items.evolution.body@@offer.approach.items.evolution.body:Une solution utile aujourd’hui doit rester pertinente demain, sans empiler des couches inutiles.\n\nFaire évoluer sans complexifier.\n\nJ’accompagne les solutions dans le temps pour qu’elles restent alignées avec vos usages, vos priorités et votre rythme.`,
      image: "./assets/images/offer/grow-up-plante.webp",
      imageAlt: $localize`:offer.approach.items.evolution.imageAlt@@offer.approach.items.evolution.imageAlt:Illustration évolutions et accompagnement`,
      offsetTop: "14rem",
      actions: [
        {
          label: $localize`:offer.approach.items.evolution.actions.primary@@offer.approach.items.evolution.actions.primary:Analyser`,
          variant: "secondary" as HeroAction["variant"],
          href: "/offer",
        },
      ],
    },
    {
      id: "04",
      linkLabel: $localize`:offer.approach.items.global.linkLabel@@offer.approach.items.global.linkLabel:Accompagnement global`,
      category: $localize`:offer.approach.items.global.kicker@@offer.approach.items.global.kicker:vision, cadrage, direction`,
      heading: $localize`:offer.approach.items.global.title@@offer.approach.items.global.title:Quand le besoin est large ou encore flou`,
      description: $localize`:offer.approach.items.global.body@@offer.approach.items.global.body:Décider trop vite coûte souvent plus cher que prendre le temps de clarifier.\n\nClarifier avant de construire.\n\nJ’interviens lorsque le besoin est large ou flou, pour structurer les priorités, définir les bons leviers et poser un cadre clair avant toute décision.`,
      image: "./assets/images/offer/global-approach-illustration.webp",
      imageAlt: $localize`:offer.approach.items.global.imageAlt@@offer.approach.items.global.imageAlt:Illustration accompagnement global`,
      offsetTop: "6rem",
      actions: [
        {
          label: $localize`:offer.approach.items.global.actions.primary@@offer.approach.items.global.actions.primary:Apprendre`,
          variant: "secondary" as HeroAction["variant"],
          href: "/offer",
        },
      ],
    },
  ];

  /**
   * Section "Qualités" (3 blocs)
   * (le visuel qualities.jpeg)
   */
  readonly qualities: ServiceSection[] = [
    {
      id: "01",
      linkLabel: $localize`:offer.principles.items.tech.linkLabel@@offer.principles.items.tech.linkLabel:Expertise technique`,
      category: $localize`:offer.principles.items.tech.kicker@@offer.principles.items.tech.kicker:Qualité`,
      heading: $localize`:offer.principles.items.tech.title@@offer.principles.items.tech.title:Des choix techniques clairs et maîtrisés`,
      description: $localize`:offer.principles.items.tech.body@@offer.principles.items.tech.body:Chaque solution est conçue avec une attention particulière portée à la clarté, la robustesse et la maintenabilité.\n\nLes choix techniques sont expliqués sans jargons, assumés et adaptés au contexte et à votre usage réel, afin de garantir des outils compréhensibles, fiables et durables.`,
      image:
        "./assets/images/offer/qualities-technical-expertise-illustration.webp",
      imageAlt: $localize`:offer.principles.items.tech.imageAlt@@offer.principles.items.tech.imageAlt:Illustration expertise technique`,
      offsetTop: "6rem",
      actions: [
        {
          label: $localize`:offer.principles.items.tech.actions.primary@@offer.principles.items.tech.actions.primary:Discuter`,
          variant: "secondary" as HeroAction["variant"],
          href: "/contact",
        },
      ],
    },
    {
      id: "02",
      linkLabel: $localize`:offer.principles.items.continuity.linkLabel@@offer.principles.items.continuity.linkLabel:Relation de continuité`,
      category: $localize`:offer.principles.items.continuity.kicker@@offer.principles.items.continuity.kicker:Accompagnement`,
      heading: $localize`:offer.principles.items.continuity.title@@offer.principles.items.continuity.title:Un accompagnement humain dans la durée`,
      description: $localize`:offer.principles.items.continuity.body@@offer.principles.items.continuity.body:Les solutions ne sont pas livrées puis abandonnées.\n\nUn accompagnement est proposé pour faire évoluer les outils dans le temps, en fonction des usages réels, des priorités et du rythme de l’activité.`,
      image: "./assets/images/offer/qualities-human-support-illustration.webp",
      imageAlt: $localize`:offer.principles.items.continuity.imageAlt@@offer.principles.items.continuity.imageAlt:Illustration accompagnement`,
      offsetTop: "10rem",
      actions: [
        {
          label: $localize`:offer.principles.items.continuity.actions.primary@@offer.principles.items.continuity.actions.primary:Discuter`,
          variant: "secondary" as HeroAction["variant"],
          href: "/contact",
        },
      ],
    },
    {
      id: "03",
      linkLabel: $localize`:offer.principles.items.strategy.linkLabel@@offer.principles.items.strategy.linkLabel:Stratégie digitale`,
      category: $localize`:offer.principles.items.strategy.kicker@@offer.principles.items.strategy.kicker:Performance`,
      heading: $localize`:offer.principles.items.strategy.title@@offer.principles.items.strategy.title:Décider avec méthode avant d’agir`,
      description: $localize`:offer.principles.items.strategy.body@@offer.principles.items.strategy.body:Les décisions digitales sont prises à partir d’une analyse du contexte, des contraintes et des objectifs réels.\n\nL’objectif n’est pas d’ajouter des fonctionnalités, mais de choisir les leviers les plus pertinents pour produire un impact mesurable.`,
      image: "./assets/images/offer/strategy-illustration.webp",
      imageAlt: $localize`:offer.principles.items.strategy.imageAlt@@offer.principles.items.strategy.imageAlt:Illustration stratégie digitale`,
      offsetTop: "6rem",
      actions: [
        {
          label: $localize`:offer.principles.items.strategy.actions.primary@@offer.principles.items.strategy.actions.primary:Discuter`,
          variant: "secondary" as HeroAction["variant"],
          href: "/contact",
        },
      ],
    },
  ];

  readonly callToAction = {
    title: $localize`:offer.cta.title@@offer.cta.title:Prêt à clarifier et faire évoluer vos outils digitaux ?`,
    description: $localize`:offer.cta.description@@offer.cta.description:Un premier échange permet de comprendre votre contexte et de définir la suite la plus pertinente.`,
    actions: [
      {
        label: $localize`:offer.cta.actions.primary@@offer.cta.actions.primary:Me contacter`,
        href: "/contact",
      },
      {
        label: $localize`:offer.cta.actions.secondary@@offer.cta.actions.secondary:Voir la présentation`,
        variant: "secondary" as HeroAction["variant"],
        href: "/presentation",
      },
    ],
  };

  readonly contactSection = {
    leadParagraphs: [
      $localize`:offer.contact.lead.1@@offer.contact.lead.1:Vous avez un besoin, une contrainte ou une idée à clarifier ?`,
      $localize`:offer.contact.lead.2@@offer.contact.lead.2:Un premier échange permet de comprendre votre contexte et de définir la suite la plus pertinente.`,
    ],
  };
}
