import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterModule } from "@angular/router";
import {
  HeroAction,
  HeroSectionComponent,
} from "../../shared/components/hero-section/hero-section.component";
import { CtaSectionComponent } from "../home/components/cta-section/cta-section.component";

type ProjectKey =
  | "Gestion de chais"
  | "AtlanticBike"
  | "Louison masseuse"
  | "IFS Academy";

type ProjectTheme = "scheme" | "default";

type ProjectBase = {
  key: ProjectKey;
  theme?: ProjectTheme;
  label: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  actions?: HeroAction[];
};

type SingleCardProject = ProjectBase & {
  kind: "singleCard";
  card: {
    kicker: string;
    heading: string;
    bullets: string[];
  };
};

type ModulesProject = ProjectBase & {
  kind: "modules";
  modules: Array<{
    key: "module1" | "module2" | "module3";
    moduleLabel: string;
    title: string;
    objective: string;
    features: string[];
    approach: string;
    imageSrc: string;
    imageAlt: string;
    reverse?: boolean;
  }>;
};

type Project = SingleCardProject | ModulesProject;

@Component({
  selector: "app-client-project",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeroSectionComponent,
    CtaSectionComponent,
  ],
  templateUrl: "./client-project.component.html",
  styleUrl: "./client-project.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientProjectComponent {
  readonly hero = {
    label: $localize`:clientProjects.hero.label@@clientProjects.hero.label:Créatif`,
    title: $localize`:clientProjects.hero.title@@clientProjects.hero.title:Mes projets web réalisés`,
    description: $localize`:clientProjects.hero.description@@clientProjects.hero.description:Cette page présente une sélection de sites et d’applications développés dans des contextes professionnels concrets.\nChaque projet répond à un besoin précis et s’inscrit dans une logique d’usage, de clarté et de durabilité.`,
    actions: [
      {
        label: $localize`:clientProjects.hero.actions.contact@@clientProjects.hero.actions.contact:Contact`,
        variant: "secondary" as HeroAction["variant"],
        href: "/contact",
      },
    ],
  };
  readonly labels = {
    objective: $localize`:clientProjects.shared.objective@@clientProjects.shared.objective:Objectif`,
    features: $localize`:clientProjects.shared.features@@clientProjects.shared.features:Fonctionnalités`,
    approach: $localize`:clientProjects.shared.approach@@clientProjects.shared.approach:Approche`,
  };
  readonly projectsOrdered: Project[] = [
    {
      key: "IFS Academy",
      theme: "default",
      kind: "singleCard",
      label: $localize`:clientProjects.projects.maria.label@@clientProjects.projects.maria.label:Startup`,
      title: $localize`:clientProjects.projects.maria.title@@clientProjects.projects.maria.title:IFS Academy — Bot Telegram, automatisations et pilotage opérationnel`,
      description: $localize`:clientProjects.projects.maria.description@@clientProjects.projects.maria.description:Mise en place d’une automatisation complète autour d’un bot Telegram, d’Excel/Google Sheets comme base de données, et de connecteurs pour piloter l’activité. Déploiement en production et industrialisation des flux.`,
      imageSrc: "./assets/images/projects/IFS-Academy.webp",
      imageAlt: $localize`:clientProjects.projects.maria.imageAlt@@clientProjects.projects.maria.imageAlt:Illustration projet bot Telegram et automatisations`,
      actions: [
        {
          label: $localize`:clientProjects.projects.maria.actions.details@@clientProjects.projects.maria.actions.details:Détails`,
          variant: "secondary" as HeroAction["variant"],
          href: "https://ifscourse.com/",
        },
      ],
      card: {
        kicker: $localize`:clientProjects.projects.maria.card.kicker@@clientProjects.projects.maria.card.kicker:Objectif et fonctionnalités principales`,
        heading: $localize`:clientProjects.projects.maria.card.heading@@clientProjects.projects.maria.card.heading:Automatiser l’onboarding, les suivis et la communication à l’échelle, avec une base de données simple et des flux robustes.`,
        bullets: [
          $localize`:clientProjects.projects.maria.card.bullets.1@@clientProjects.projects.maria.card.bullets.1:Bot Telegram multi-étapes (onboarding, formulaires, relances, parcours par session)`,
          $localize`:clientProjects.projects.maria.card.bullets.2@@clientProjects.projects.maria.card.bullets.2:Excel/Google Sheets utilisé comme base de données (états, historiques, mapping groupes/utilisateurs)`,
          $localize`:clientProjects.projects.maria.card.bullets.3@@clientProjects.projects.maria.card.bullets.3:Connecteurs & automatisations (mails, exports, synchronisation, alertes et reporting)`,
          $localize`:clientProjects.projects.maria.card.bullets.4@@clientProjects.projects.maria.card.bullets.4:Déploiement en production (VPS, systemd timers/services, observabilité et fiabilité)`,
          $localize`:clientProjects.projects.maria.card.bullets.5@@clientProjects.projects.maria.card.bullets.5:Extraction, segmentation et envoi de mailing en masse pour la validation des diplômes`,
        ],
      },
    },
    {
      key: "Gestion de chais",
      theme: "scheme",
      kind: "modules",
      label: $localize`:clientProjects.projects.cognac.label@@clientProjects.projects.cognac.label:Clients`,
      title: $localize`:clientProjects.projects.cognac.title@@clientProjects.projects.cognac.title:Application métier pour la filière cognac`,
      description: $localize`:clientProjects.projects.cognac.description@@clientProjects.projects.cognac.description:Projet de structuration et de suivi de la production viticole et de transformation, développé pour accompagner des processus complexes sur le long terme.\nL’application est organisée autour de trois modules complémentaires, chacun adapté aux usages terrain et aux contraintes métier.`,
      imageSrc: "./assets/images/projects/Gestion de chais.jpeg",
      imageAlt: $localize`:clientProjects.projects.cognac.imageAlt@@clientProjects.projects.cognac.imageAlt:Illustration application métier filière cognac`,
      modules: [
        {
          key: "module1",
          moduleLabel: $localize`:clientProjects.projects.cognac.modules.1.label@@clientProjects.projects.cognac.modules.1.label:Module 1`,
          title: $localize`:clientProjects.projects.cognac.modules.1.title@@clientProjects.projects.cognac.modules.1.title:Gestion de la vigne et des vendanges`,
          objective: $localize`:clientProjects.projects.cognac.modules.1.objective@@clientProjects.projects.cognac.modules.1.objective:Centraliser et structurer les données liées aux parcelles, à la vigne et aux vendanges.`,
          features: [
            $localize`:clientProjects.projects.cognac.modules.1.features.1@@clientProjects.projects.cognac.modules.1.features.1:Gestion des parcelles et des campagnes viticoles`,
            $localize`:clientProjects.projects.cognac.modules.1.features.2@@clientProjects.projects.cognac.modules.1.features.2:Suivi des intrants et interventions`,
            $localize`:clientProjects.projects.cognac.modules.1.features.3@@clientProjects.projects.cognac.modules.1.features.3:Visualisation des données via graphiques et tableaux de bord`,
            $localize`:clientProjects.projects.cognac.modules.1.features.4@@clientProjects.projects.cognac.modules.1.features.4:Application mobile dédiée à la saisie terrain des informations`,
          ],
          approach: $localize`:clientProjects.projects.cognac.modules.1.approach@@clientProjects.projects.cognac.modules.1.approach:Une application pensée pour faciliter la collecte des données sur le terrain tout en offrant une vision claire et synthétique côté bureau.`,
          imageSrc: "./assets/images/projects/GDC-vendanges.webp",
          imageAlt: $localize`:clientProjects.projects.cognac.modules.1.imageAlt@@clientProjects.projects.cognac.modules.1.imageAlt:Illustration module gestion de la vigne et des vendanges`,
        },
        {
          key: "module2",
          moduleLabel: $localize`:clientProjects.projects.cognac.modules.2.label@@clientProjects.projects.cognac.modules.2.label:Module 2`,
          title: $localize`:clientProjects.projects.cognac.modules.2.title@@clientProjects.projects.cognac.modules.2.title:Gestion de la vinification`,
          objective: $localize`:clientProjects.projects.cognac.modules.2.objective@@clientProjects.projects.cognac.modules.2.objective:Suivre et structurer l’ensemble du processus de vinification, pour les productions internes ou réalisées pour des tiers.`,
          features: [
            $localize`:clientProjects.projects.cognac.modules.2.features.1@@clientProjects.projects.cognac.modules.2.features.1:Gestion des cuves et des lots de vin`,
            $localize`:clientProjects.projects.cognac.modules.2.features.2@@clientProjects.projects.cognac.modules.2.features.2:Suivi des volumes, transformations et opérations`,
            $localize`:clientProjects.projects.cognac.modules.2.features.3@@clientProjects.projects.cognac.modules.2.features.3:Visualisation des données via graphiques`,
            $localize`:clientProjects.projects.cognac.modules.2.features.4@@clientProjects.projects.cognac.modules.2.features.4:Application mobile dédiée à la consultation en temps réel des cuves et à la saisie des ajouts`,
          ],
          approach: $localize`:clientProjects.projects.cognac.modules.2.approach@@clientProjects.projects.cognac.modules.2.approach:Une séparation claire entre la saisie terrain et la supervision, afin de garantir fiabilité et lisibilité des informations.`,
          reverse: true,
          imageSrc: "./assets/images/projects/GDC-vinification.webp",
          imageAlt: $localize`:clientProjects.projects.cognac.modules.2.imageAlt@@clientProjects.projects.cognac.modules.2.imageAlt:Illustration module gestion de la vinification`,
        },
        {
          key: "module3",
          moduleLabel: $localize`:clientProjects.projects.cognac.modules.3.label@@clientProjects.projects.cognac.modules.3.label:Module 3`,
          title: $localize`:clientProjects.projects.cognac.modules.3.title@@clientProjects.projects.cognac.modules.3.title:Gestion du chais et du vieillissement`,
          objective: $localize`:clientProjects.projects.cognac.modules.3.objective@@clientProjects.projects.cognac.modules.3.objective:Assurer la traçabilité complète du passage du vin au cognac et du vieillissement des lots.`,
          features: [
            $localize`:clientProjects.projects.cognac.modules.3.features.1@@clientProjects.projects.cognac.modules.3.features.1:Gestion des barriques et des intrants`,
            $localize`:clientProjects.projects.cognac.modules.3.features.2@@clientProjects.projects.cognac.modules.3.features.2:Suivi du vieillissement et des transformations`,
            $localize`:clientProjects.projects.cognac.modules.3.features.3@@clientProjects.projects.cognac.modules.3.features.3:Traçabilité des lots sur le long terme`,
            $localize`:clientProjects.projects.cognac.modules.3.features.4@@clientProjects.projects.cognac.modules.3.features.4:Application desktop dédiée à la supervision et à la gestion globale`,
          ],
          approach: $localize`:clientProjects.projects.cognac.modules.3.approach@@clientProjects.projects.cognac.modules.3.approach:Un outil métier conçu pour accompagner des processus longs et réglementés, avec une attention particulière portée à la traçabilité et à la cohérence des données.`,
          imageSrc: "./assets/images/projects/GDC-vieillissement.webp",
          imageAlt: $localize`:clientProjects.projects.cognac.modules.3.imageAlt@@clientProjects.projects.cognac.modules.3.imageAlt:Illustration module gestion du chais et du vieillissement`,
        },
      ],
    },
    {
      key: "AtlanticBike",
      theme: "default",
      kind: "singleCard",
      label: $localize`:clientProjects.projects.atlanticBike.label@@clientProjects.projects.atlanticBike.label:Projet`,
      title: $localize`:clientProjects.projects.atlanticBike.title@@clientProjects.projects.atlanticBike.title:AtlanticBike - Site de location et réparation de vélos`,
      description: $localize`:clientProjects.projects.atlanticBike.description@@clientProjects.projects.atlanticBike.description:Activité locale de location et de réparation de vélos nécessitant un site à la fois informatif et opérationnel.`,
      imageSrc: "./assets/images/projects/Atlanticbike.webp",
      imageAlt: $localize`:clientProjects.projects.atlanticBike.imageAlt@@clientProjects.projects.atlanticBike.imageAlt:Illustration projet AtlanticBike`,
      actions: [
        {
          label: $localize`:clientProjects.projects.atlanticBike.actions.website@@clientProjects.projects.atlanticBike.actions.website:Site web`,
          variant: "ghost" as HeroAction["variant"],
          href: "https://www.atlanticbike.fr/",
        },
      ],
      card: {
        kicker: $localize`:clientProjects.projects.atlanticBike.card.kicker@@clientProjects.projects.atlanticBike.card.kicker:Objectif et fonctionnalités principales`,
        heading: $localize`:clientProjects.projects.atlanticBike.card.heading@@clientProjects.projects.atlanticBike.card.heading:Présenter l’activité, structurer l’offre et permettre la réservation en ligne de vélos.`,
        bullets: [
          $localize`:clientProjects.projects.atlanticBike.card.bullets.1@@clientProjects.projects.atlanticBike.card.bullets.1:Présentation des services de location et de réparation`,
          $localize`:clientProjects.projects.atlanticBike.card.bullets.2@@clientProjects.projects.atlanticBike.card.bullets.2:Mise en avant des vélos disponibles`,
          $localize`:clientProjects.projects.atlanticBike.card.bullets.3@@clientProjects.projects.atlanticBike.card.bullets.3:Système de réservation en ligne`,
          $localize`:clientProjects.projects.atlanticBike.card.bullets.4@@clientProjects.projects.atlanticBike.card.bullets.4:Parcours simple pour les utilisateurs et les clients réguliers`,
        ],
      },
    },
    {
      key: "Louison masseuse",
      theme: "scheme",
      kind: "singleCard",

      label: $localize`:clientProjects.projects.louison.label@@clientProjects.projects.louison.label:Client`,
      title: $localize`:clientProjects.projects.louison.title@@clientProjects.projects.louison.title:Louison — Site de présentation et de réservation de services`,
      description: $localize`:clientProjects.projects.louison.description@@clientProjects.projects.louison.description:Louison-masseuse est une activité de massage et de bien-être nécessitant une présence en ligne claire, cohérente et alignée avec son univers.`,
      imageSrc: "./assets/images/projects/Louisson-masseuse.webp",
      imageAlt: $localize`:clientProjects.projects.louison.imageAlt@@clientProjects.projects.louison.imageAlt:Illustration projet Louison`,
      actions: [
        {
          label: $localize`:clientProjects.projects.louison.actions.website@@clientProjects.projects.louison.actions.website:Site web`,
          variant: "ghost" as HeroAction["variant"],
          href: "https://www.louison-masseuse.com/accueil",
        },
      ],
      card: {
        kicker: $localize`:clientProjects.projects.louison.card.kicker@@clientProjects.projects.louison.card.kicker:Objectif et fonctionnalités principales`,
        heading: $localize`:clientProjects.projects.louison.card.heading@@clientProjects.projects.louison.card.heading:Présenter l’activité, structurer l’offre de services et faciliter la prise de contact et la vente.`,
        bullets: [
          $localize`:clientProjects.projects.louison.card.bullets.1@@clientProjects.projects.louison.card.bullets.1:Présentation de la praticienne et de son univers`,
          $localize`:clientProjects.projects.louison.card.bullets.2@@clientProjects.projects.louison.card.bullets.2:Mise en avant des différents services de massage`,
          $localize`:clientProjects.projects.louison.card.bullets.3@@clientProjects.projects.louison.card.bullets.3:Vente de produits associés (bougies, bracelets, cartes cadeaux)`,
          $localize`:clientProjects.projects.louison.card.bullets.4@@clientProjects.projects.louison.card.bullets.4:Parcours clair pour la prise de rendez-vous et la demande d’informations`,
        ],
      },
    },
  ];
}
