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
    <section class="px-[5%] py-16 md:py-24 lg:py-28">
      <div class="container">
        <div class="mb-12 w-full max-w-lg md:mb-18 lg:mb-20">
          <p class="mb-3 font-semibold md:mb-4">Projets</p>
          <h1 class="heading-h2 mb-5 font-bold md:mb-6">
            Mes réalisations numériques
          </h1>
          <p class="text-medium">
            Chaque projet raconte une histoire unique de transformation digitale.
            Découvrez comment j'ai relevé des défis techniques et créatifs avec
            passion et précision.
          </p>
        </div>
        <div
          class="flex w-full flex-col overflow-hidden border border-scheme-border lg:h-[90vh] lg:flex-row"
        >
          <div
            *ngFor="let project of projects; let i = index; trackBy: trackById"
            class="flex flex-col justify-start overflow-hidden border-b border-scheme-border last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0"
            [ngStyle]="getColumnStyles(i)"
            (click)="setActiveIndex(i)"
          >
            <div
              class="relative flex h-16 w-full cursor-pointer items-center justify-center py-8 md:h-20 lg:h-full lg:w-20 lg:flex-col lg:justify-between"
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
              class="flex flex-col px-6 pt-4 pb-8 transition-all duration-300 ease-in-out md:px-10 md:pt-12 md:pb-12 lg:px-12 lg:pt-16 lg:pb-16"
              [ngStyle]="getContentStyles(i)"
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
      label: 'Site web',
      title: 'Enquête interactive',
      description:
        "Un jeu narratif immersif qui combine storytelling et mécaniques de résolution d'énigmes pour une expérience unique.",
      imageAlt: 'Relume placeholder image 1',
      imageSrc:
        'https://d22po4pjz3o32e.cloudfront.net/placeholder-image-landscape.svg',
    },
    {
      id: 'mobile',
      order: '02',
      label: 'Application mobile',
      title: 'Expérience mobile complète',
      description:
        'Une plateforme appliquée qui accompagne les utilisateurs dans leur quotidien grâce à une interface intuitive et performante.',
      imageAlt: 'Relume placeholder image 2',
      imageSrc:
        'https://d22po4pjz3o32e.cloudfront.net/placeholder-image-landscape.svg',
    },
    {
      id: 'app',
      order: '03',
      label: 'Application web',
      title: 'Pilotage data',
      description:
        'Un tableau de bord conçu pour visualiser les données clés et faciliter la prise de décision en temps réel.',
      imageAlt: 'Relume placeholder image 3',
      imageSrc:
        'https://d22po4pjz3o32e.cloudfront.net/placeholder-image-landscape.svg',
    },
    {
      id: 'game',
      order: '04',
      label: 'Jeu narratif',
      title: 'Univers interactif',
      description:
        'Une expérience immersive qui marie narration, design sonore et interactions pour captiver vos audiences.',
      imageAlt: 'Relume placeholder image 4',
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
  }

  trackById(_: number, project: Project): string {
    return project.id;
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
}
