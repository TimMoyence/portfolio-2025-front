import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  HostListener,
  Inject,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';

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
  selector: 'app-projects-accordion',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section
      class="px-[5%] py-16 md:py-24 lg:py-28"
      aria-labelledby="projects-heading"
        >
          <div class="container">
            <div class="mb-12 w-full max-w-lg md:mb-18 lg:mb-20">
              <p
                class="mb-3 font-semibold md:mb-4"
                i18n="projects.kicker|Section label@@projectsKicker"
              >
                Projets
              </p>
              <h2
                id="projects-heading"
                class="heading-h2 mb-5 font-bold md:mb-6"
                i18n="projects.title|Section heading@@projectsTitle"
              >
                Mes réalisations numériques
              </h2>
              <p
                class="text-medium"
                i18n="projects.lead|Section description@@projectsLead"
              >
                Chaque projet raconte une histoire unique de transformation
                digitale. Découvrez comment j'ai relevé des défis techniques et
                créatifs avec passion et précision.
              </p>
            </div>
        <div
          class="flex w-full flex-col overflow-hidden border border-scheme-border lg:h-[90vh] lg:flex-row"
          role="tablist"
        >
          @for(project of projects; track $index){
          <div
            class="flex flex-col lg:grid lg:grid-cols-6 justify-start overflow-hidden border-b border-scheme-border last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0"
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
              <p class="heading-h5 font-bold lg:hidden">{{ project.label }}</p>
            </div>
            <div
              class="flex flex-col lg:col-span-5 px-6 pt-4 pb-8 transition-all duration-300 ease-in-out md:px-10 md:pt-12 md:pb-12 lg:px-12 lg:pt-16 lg:pb-16 justify-center tab-panel"
              [ngStyle]="getContentStyles($index)"
              role="tabpanel"
              [id]="'panel-' + $index"
              [attr.aria-labelledby]="'tab-' + $index"
              [attr.hidden]="activeIndex !== $index"
            >
              <h3 class="heading-h3 mb-5 font-bold md:mb-6">
                {{ project.title }}
              </h3>
              <p class="text-medium">
                {{ project.description }}
              </p>
              <div class="mt-8 h-80 md:mt-10 md:h-[25rem] lg:mt-12">
                <img
                  [src]="project.imageSrc"
                  [alt]="project.imageAlt"
                  class="size-full rounded-image object-cover"
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
      id: 'web',
      order: '01',
      label: $localize`:projects.item.web.label|Project label@@projectsItemWebLabel:Site web`,
      title: $localize`:projects.item.web.title|Project title@@projectsItemWebTitle:Enquête interactive`,
      description: $localize`:projects.item.web.desc|Project description@@projectsItemWebDesc:Un jeu narratif immersif qui combine storytelling et mécaniques de résolution d'énigmes pour une expérience unique.`,
      imageAlt: $localize`:projects.item.web.imageAlt|Project image alt@@projectsItemWebImageAlt:Relume placeholder image 1`,
      imageSrc:
        'https://d22po4pjz3o32e.cloudfront.net/placeholder-image-landscape.svg',
    },
    {
      id: 'mobile',
      order: '02',
      label: $localize`:projects.item.mobile.label|Project label@@projectsItemMobileLabel:Application mobile`,
      title: $localize`:projects.item.mobile.title|Project title@@projectsItemMobileTitle:Expérience mobile complète`,
      description: $localize`:projects.item.mobile.desc|Project description@@projectsItemMobileDesc:Une plateforme appliquée qui accompagne les utilisateurs dans leur quotidien grâce à une interface intuitive et performante.`,
      imageAlt: $localize`:projects.item.mobile.imageAlt|Project image alt@@projectsItemMobileImageAlt:Relume placeholder image 2`,
      imageSrc:
        'https://d22po4pjz3o32e.cloudfront.net/placeholder-image-landscape.svg',
    },
    {
      id: 'app',
      order: '03',
      label: $localize`:projects.item.app.label|Project label@@projectsItemAppLabel:Application web`,
      title: $localize`:projects.item.app.title|Project title@@projectsItemAppTitle:Pilotage data`,
      description: $localize`:projects.item.app.desc|Project description@@projectsItemAppDesc:Un tableau de bord conçu pour visualiser les données clés et faciliter la prise de décision en temps réel.`,
      imageAlt: $localize`:projects.item.app.imageAlt|Project image alt@@projectsItemAppImageAlt:Relume placeholder image 3`,
      imageSrc:
        'https://d22po4pjz3o32e.cloudfront.net/placeholder-image-landscape.svg',
    },
    {
      id: 'game',
      order: '04',
      label: $localize`:projects.item.game.label|Project label@@projectsItemGameLabel:Jeu narratif`,
      title: $localize`:projects.item.game.title|Project title@@projectsItemGameTitle:Univers interactif`,
      description: $localize`:projects.item.game.desc|Project description@@projectsItemGameDesc:Une expérience immersive qui marie narration, design sonore et interactions pour captiver vos audiences.`,
      imageAlt: $localize`:projects.item.game.imageAlt|Project image alt@@projectsItemGameImageAlt:Relume placeholder image 4`,
      imageSrc:
        'https://d22po4pjz3o32e.cloudfront.net/placeholder-image-landscape.svg',
    },
  ];

  activeIndex: number | null = 0;
  isMobile = false;

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {}

  ngOnInit(): void {
    this.updateViewportFlags();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateViewportFlags();
  }

  setActiveIndex(index: number): void {
    this.activeIndex = index;
    const el = document.getElementById('tab-' + index);
    el?.focus();
  }

  getColumnStyles(index: number): Record<string, string> {
    if (this.isMobile) {
      return { flex: '1 1 100%', maxWidth: '100%' };
    }

    const activeIndex = this.activeIndex ?? 0;
    return index === activeIndex
      ? { flex: '1 1 50%', minWidth: '16rem' }
      : { flex: '0 0 5rem', minWidth: '5rem' };
  }

  getContentStyles(index: number): Record<string, string> {
    const activeIndex = this.activeIndex ?? 0;
    const isActive = index === activeIndex;
    return {
      maxHeight: isActive ? '1000px' : '0px',
      opacity: isActive ? '1' : '0',
      paddingTop: isActive ? '' : '0',
      paddingBottom: isActive ? '' : '0',
      overflow: isActive ? 'visible' : 'hidden',
    };
  }

  private updateViewportFlags(): void {
    if (!this.canUseWindow) {
      this.isMobile = false;
      return;
    }

    const matches = window.matchMedia('(max-width: 991px)').matches;
    if (!matches && this.activeIndex === null) {
      this.activeIndex = 0;
    }
    this.isMobile = matches;
  }

  private get canUseWindow(): boolean {
    return isPlatformBrowser(this.platformId) && typeof window !== 'undefined';
  }

  onKeydown(event: KeyboardEvent, index: number) {
    const isArrowRight = event.key === 'ArrowRight';
    const isArrowLeft = event.key === 'ArrowLeft';
    const isHome = event.key === 'Home';
    const isEnd = event.key === 'End';
    const isEnter = event.key === 'Enter';
    const isSpace =
      event.key === ' ' || event.key === 'Spacebar' || event.code === 'Space';

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
