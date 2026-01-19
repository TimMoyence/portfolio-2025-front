import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { ContactCtaComponent } from "../../shared/components/cta-contact/cta-contact.component";
import {
  ServiceItem,
  ServicesSectionComponent,
} from "../../shared/components/services-section/services-section.component";
import { CtaSectionComponent } from "./components/cta-section/cta-section.component";
import { HeroSectionComponent } from "./components/hero-section-home/hero-section-home.component";
import { MissionSectionComponent } from "./components/mission-section/mission-section.component";
import { ProjectsAccordionComponent } from "./components/projects-accordion/projects-accordion.component";

@Component({
  selector: "app-home",
  standalone: true,
  imports: [
    CommonModule,
    HeroSectionComponent,
    ServicesSectionComponent,
    ProjectsAccordionComponent,
    MissionSectionComponent,
    ContactCtaComponent,
    CtaSectionComponent,
  ],
  templateUrl: "./home.component.html",
  styleUrl: "./home.component.scss",
})
export class HomeComponent {
  readonly servicesSection = {
    kicker: $localize`:services.kicker|Section label@@servicesKicker:Approche`,
    title: $localize`:services.title|Section heading@@servicesTitle:Une approche simple, progressive et adaptée`,
    leadParagraphs: [
      $localize`:services.lead.1|Section description@@servicesLead1:Chaque projet commence par une phase de compréhension.`,
      $localize`:services.lead.2|Section description@@servicesLead2:L’objectif est de faire les bons choix, au bon moment, sans complexifier inutilement.`,
    ],
    services: [
      {
        title: $localize`:services.item.web.title|Service title@@servicesItemWebTitle:Clarifier`,
        description: $localize`:services.item.web.desc|Service description@@servicesItemWebDesc:Comprendre le contexte, identifier les priorités et poser un cadre avant toute décision technique.`,
        iconSrc: "/assets/icons/strategy.svg",
        iconAlt: $localize`:services.item.web.iconAlt|Service icon alt@@servicesItemWebIconAlt:Icon for clarification`,
      },
      {
        title: $localize`:services.item.construction.title|Service title@@servicesItemConstructionTitle:Construire`,
        description: $localize`:services.item.construction.desc|Service description@@servicesItemConstructionDesc:Mettre en place des solutions sobres et utiles, pensées pour s’intégrer naturellement dans l’existant.`,
        iconSrc: "/assets/icons/web.svg",
        iconAlt: $localize`:services.item.construction.iconAlt|Service icon alt@@servicesItemConstructionIconAlt:Icon for building`,
      },
      {
        title: $localize`:services.item.evolution.maintenance.title|Service title@@servicesItemEvolutionAndMaintenanceTitle:Faire évoluer`,
        description: $localize`:services.item.evolution.maintenance.desc|Service description@@servicesItemEvolutionAndMaintenanceDesc:Accompagner les outils dans le temps pour qu’ils restent pertinents, sans complexité inutile.`,
        iconSrc: "/assets/icons/farsight_digital.svg",
        iconAlt: $localize`:services.item.evolution.maintenance.iconAlt|Service icon alt@@servicesItemEvolutionAndMaintenanceIconAlt:Evolution logo icon`,
      },
    ] satisfies ServiceItem[],
    cta: {
      label: $localize`:services.cta.contact|Contact link@@servicesCtaContact:Contactez-moi`,
      href: "/contact",
      iconName: "chevron-right",
      iconSize: 1.2,
    },
  };

  readonly contactSection = {
    leadParagraphs: [
      $localize`:home.contact.lead.1|Home contact lead paragraph@@homeContactLead1:Vous avez un besoin, une contrainte ou une idée à clarifier ?`,
      $localize`:home.contact.lead.2|Home contact lead paragraph@@homeContactLead2:Un premier échange permet de comprendre votre contexte et de définir la suite la plus pertinente.`,
    ],
  };
}
