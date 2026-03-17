import { CommonModule, isPlatformBrowser } from "@angular/common";
import type { OnInit } from "@angular/core";
import { Component, HostListener, Inject, PLATFORM_ID } from "@angular/core";

type Project = {
  id: string;
  order: string;
  label: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
};

@Component({
  selector: "app-projects-accordion",
  standalone: true,
  imports: [CommonModule],
  template: `
    <section
      class="px-[5%] py-6 md:py-8 lg:py-12"
      aria-labelledby="projects-heading"
    >
      <div class="container">
        <div class="mb-2 w-full md:mb-4 lg:mb-6">
          <p
            class="mb-1 font-semibold md:mb-2"
            i18n="projects.kicker|Section label@@projectsKicker"
          >
            Projets
          </p>
          <h2
            id="projects-heading"
            class="font-heading heading-h3 text-h3 mb-1 md:mb-2"
            i18n="projects.title|Section heading@@projectsTitle"
          >
            Mes réalisations numériques
          </h2>
          <p
            class="text-small"
            i18n="projects.lead|Section description@@projectsLead"
          >
            Quelques projets représentatifs de mon approche et de ma manière de
            travailler
          </p>
        </div>
        <div
          class="flex w-full flex-col overflow-hidden border border-scheme-border lg:flex-row"
          role="tablist"
        >
          @for (project of projects; track $index) {
            <div
              class="flex flex-col lg:grid lg:grid-cols-7 justify-start overflow-hidden border-b border-scheme-border last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0"
              [ngStyle]="getColumnStyles($index)"
              (click)="setActiveIndex($index)"
              role="tab"
              [attr.aria-selected]="activeIndex === $index"
              [attr.tabindex]="activeIndex === $index ? 0 : -1"
              [attr.aria-controls]="'panel-' + $index"
              [id]="'tab-' + $index"
              (keydown)="onKeydown($event, $index)"
            >
              <div
                class="relative tab-header lg:col-span-1 flex h-16 w-full cursor-pointer items-center justify-center py-8 md:h-16 lg:h-full lg:w-16 lg:flex-col lg:justify-between"
                role="tab"
              >
                <p
                  class="heading-h5 absolute left-6 font-bold whitespace-nowrap md:left-10 lg:relative lg:left-0"
                >
                  {{ project.order }}
                </p>
                <h2
                  class="heading-h5 hidden [writing-mode:vertical-rl] lg:mx-auto lg:block lg:rotate-180 lg:font-bold"
                >
                  {{ project.label }}
                </h2>
              </div>
              <div
                class="flex flex-col lg:col-span-6 px-6 pt-4 pb-8 transition-all duration-300 ease-in-out md:px-10 md:pt-12 md:pb-12 lg:px-12 lg:pt-16 lg:pb-16 justify-end tab-panel"
                [ngStyle]="getContentStyles($index)"
                role="tabpanel"
                [id]="'panel-' + $index"
                [attr.aria-labelledby]="'tab-' + $index"
                [attr.hidden]="activeIndex !== $index"
              >
                <h4
                  class="font-heading heading-h3 text-h4 md:text-h3 mb-5 md:mb-6"
                >
                  {{ project.title }}
                </h4>
                <p class="text-small">
                  {{ project.description }}
                </p>
                <div
                  class="mt-4 h-12rem h-[15rem] md:h-[20rem] lg:h-[30rem] md:mt-6 lg:mt-8"
                >
                  <img
                    [src]="project.imageSrc"
                    [alt]="project.imageAlt"
                    class="size-full shadow-xl overflow-hidden rounded-image object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          }
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
export class ProjectsAccordionComponent implements OnInit {
  readonly projects: Project[] = [
    {
      id: "automation",
      order: "01",
      label: $localize`:projects.item.automation.label|Project label@@projectsItemAutomationLabel:Automatisation de validation de diplômes`,
      title: $localize`:projects.item.automation.title|Project title@@projectsItemAutomationTitle:Automatisation de validation de parcours de formation`,
      description: $localize`:projects.item.automation.desc|Project description@@projectsItemAutomationDesc:Mise en place d’un processus automatisé pour la génération et l’envoi de communications de validation de diplômes sur une plateforme e-learning.L’objectif était de fiabiliser les échanges, réduire les interventions manuelles et garantir une communication cohérente à grande échelle.`,
      imageAlt: $localize`:projects.item.automation.imageAlt|Project image alt@@projectsItemAutomationImageAlt:automation image presentation`,
      imageSrc: "./assets/images/projects/Automation-validation.webp",
    },
    {
      id: "mobile",
      order: "02",
      label: $localize`:projects.item.mobile.label|Project label@@projectsItemMobileLabel:Assistant de guide de musée (POC)`,
      title: $localize`:projects.item.mobile.title|Project title@@projectsItemMobileTitle:Prototype d’assistant numérique pour médiation culturelle`,
      description: $localize`:projects.item.mobile.desc|Project description@@projectsItemMobileDesc:Conception d’un prototype d’assistant destiné à accompagner les guides de musée dans leur médiation, en apportant un soutien contextuel et interactif. Le projet visait à explorer l’usage de l’intelligence artificielle comme outil d’aide, sans remplacer l’expertise humaine.`,
      imageAlt: $localize`:projects.item.mobile.imageAlt|Project image alt@@projectsItemMobileImageAlt:Image du prototype d’assistant numérique pour médiation culturelle`,
      imageSrc:
        "./assets/images/projects/Modélisation-prédictive-risques-sanitaires.webp",
    },
    {
      id: "web",
      order: "03",
      label: $localize`:projects.item.app.label|Project label@@projectsItemAppLabel:Plateforme de réservation de vélos (Atlantic Bike)`,
      title: $localize`:projects.item.app.title|Project title@@projectsItemAppTitle:Plateforme de réservation et de gestion pour location de vélos`,
      description: $localize`:projects.item.app.desc|Project description@@projectsItemAppDesc:Conception d’un site de réservation destiné à une activité de location de vélos, avec une attention particulière portée à la simplicité d’usage et à la gestion opérationnelle. L’objectif était de faciliter les réservations tout en structurant les flux internes de l’activité.`,
      imageAlt: $localize`:projects.item.app.imageAlt|Project image alt@@projectsItemAppImageAlt:Image du site Atlantic Bike présentant une bicyclette le long de la côte`,
      imageSrc: "/assets/images/projects/project-atlantic-bike.webp",
    },
  ];

  activeIndex: number | null = 0;
  isMobile = false;

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {}

  ngOnInit(): void {
    this.updateViewportFlags();
  }

  @HostListener("window:resize")
  onResize(): void {
    this.updateViewportFlags();
  }

  setActiveIndex(index: number): void {
    this.activeIndex = index;
    const el = document.getElementById("tab-" + index);
    el?.focus();
  }

  getColumnStyles(index: number): Record<string, string> {
    if (this.isMobile) {
      return { flex: "1 1 100%", maxWidth: "100%" };
    }

    const activeIndex = this.activeIndex ?? 0;
    return index === activeIndex
      ? { flex: "1 1 50%", minWidth: "16rem" }
      : { flex: "0 0 5rem", minWidth: "5rem" };
  }

  getContentStyles(index: number): Record<string, string> {
    const activeIndex = this.activeIndex ?? 0;
    const isActive = index === activeIndex;
    return {
      maxHeight: isActive ? "1000px" : "0px",
      opacity: isActive ? "1" : "0",
      paddingTop: isActive ? "" : "0",
      paddingBottom: isActive ? "" : "0",
      overflow: isActive ? "visible" : "hidden",
    };
  }

  private updateViewportFlags(): void {
    if (!this.canUseWindow) {
      this.isMobile = false;
      return;
    }

    const matches = window.matchMedia("(max-width: 991px)").matches;
    if (!matches && this.activeIndex === null) {
      this.activeIndex = 0;
    }
    this.isMobile = matches;
  }

  private get canUseWindow(): boolean {
    return isPlatformBrowser(this.platformId) && typeof window !== "undefined";
  }

  onKeydown(event: KeyboardEvent, index: number) {
    const isArrowRight = event.key === "ArrowRight";
    const isArrowLeft = event.key === "ArrowLeft";
    const isHome = event.key === "Home";
    const isEnd = event.key === "End";
    const isEnter = event.key === "Enter";
    const isSpace =
      event.key === " " || event.key === "Spacebar" || event.code === "Space";

    if (isArrowRight || isArrowLeft || isHome || isEnd || isEnter || isSpace) {
      event.preventDefault();
    }

    if (isArrowRight) {
      this.setActiveIndex((index + 1) % this.projects.length);
    } else if (isArrowLeft) {
      this.setActiveIndex(
        (index - 1 + this.projects.length) % this.projects.length,
      );
    } else if (isHome) {
      this.setActiveIndex(0);
    } else if (isEnd) {
      this.setActiveIndex(this.projects.length - 1);
    } else if (isEnter || isSpace) {
      // 👉 Ici, on devrait activer l’onglet courant, pas passer au suivant
      this.setActiveIndex(index);
    }
  }
}
