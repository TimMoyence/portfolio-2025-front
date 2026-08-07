import { Component } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import type { AsiliProject } from './asili-projects-grid.component';
import { AsiliProjectsGridComponent } from './asili-projects-grid.component';

const PROJECTS: readonly AsiliProject[] = [
  {
    title: 'Plateforme metier refondue',
    desc: 'Du cadrage des usages a un produit qui tient la charge.',
    tags: [{ label: 'Angular' }, { label: 'NestJS' }, { label: 'IA' }],
    href: '/projets',
    size: 'big',
  },
  {
    title: 'Meteo',
    desc: 'Data-viz vivante : vent, UV, arc solaire.',
    tags: [{ label: 'Atelier' }],
    image: '/assets/meteo.jpg',
    imageAlt: "Capture de l'app Meteo",
    href: '/atelier/meteo',
    size: 'small',
  },
  {
    title: 'Morning-Brief',
    desc: 'Newsletter IA livree chaque matin par Telegram.',
    tags: [{ label: 'En production', prod: true }, { label: 'Raspberry Pi' }],
    size: 'small',
  },
];

const IMAGE_PROJECTS: readonly AsiliProject[] = [
  {
    title: 'Carte 1',
    desc: 'Premiere carte, au-dessus de la ligne de flottaison.',
    tags: [],
    image: '/assets/images/projects/un.webp',
    imageAlt: 'capture 1',
    size: 'small',
  },
  {
    title: 'Carte 2',
    desc: 'Deuxieme carte, encore visible au chargement.',
    tags: [],
    image: '/assets/images/projects/deux.webp',
    imageAlt: 'capture 2',
    size: 'big',
  },
  {
    title: 'Carte 3',
    desc: 'Troisieme carte, sous la ligne de flottaison.',
    tags: [],
    image: '/assets/images/projects/trois.webp',
    imageAlt: 'capture 3',
    size: 'small',
  },
  {
    title: 'Carte 4',
    desc: 'Quatrieme carte, sous la ligne de flottaison.',
    tags: [],
    image: '/assets/images/projects/quatre.webp',
    imageAlt: 'capture 4',
    size: 'big',
  },
];

describe('AsiliProjectsGridComponent', () => {
  let fixture: ComponentFixture<AsiliProjectsGridComponent>;

  function setup(
    projects: readonly AsiliProject[] = PROJECTS,
    platformId: 'browser' | 'server' = 'browser',
  ): void {
    TestBed.configureTestingModule({
      imports: [AsiliProjectsGridComponent],
      providers: [{ provide: PLATFORM_ID, useValue: platformId }],
    });
    fixture = TestBed.createComponent(AsiliProjectsGridComponent);
    fixture.componentRef.setInput('projects', projects);
  }

  // Isolation : la classe `anim-ready` vit sur <html> (singleton partagé entre
  // tous les specs Karma). On la retire avant ET après chaque test pour
  // immuniser l'assertion SSR « pas d'anim-ready » contre une fuite d'état
  // laissée par un spec précédent (ex. home/presentation/offer) qui aurait
  // rendu un `appReveal` en plateforme browser sans nettoyer, quel que soit
  // l'ordre d'exécution randomisé.
  beforeEach(() => {
    document.documentElement.classList.remove('anim-ready');
  });

  afterEach(() => {
    document.documentElement.classList.remove('anim-ready');
  });

  it('se cree', () => {
    setup();
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('rend une carte .proj par projet avec son titre en <h3>', () => {
    setup();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const cards = host.querySelectorAll<HTMLElement>('.proj');
    expect(cards.length).toBe(PROJECTS.length);
    const titles = host.querySelectorAll<HTMLElement>('.proj .proj-body h3');
    expect(titles.length).toBe(PROJECTS.length);
    expect(titles[0].textContent?.trim()).toBe(PROJECTS[0].title);
  });

  it('applique la taille via .big / .small', () => {
    setup();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.proj.big').length).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('.proj.small').length).toBe(2);
  });

  it('rend les etiquettes et marque celles en production via .tag-prod', () => {
    setup();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const tags = host.querySelectorAll<HTMLElement>('.tag');
    expect(tags.length).toBe(6);
    const prod = host.querySelectorAll<HTMLElement>('.tag.tag-prod');
    expect(prod.length).toBe(1);
    expect(prod[0].textContent?.trim()).toBe('En production');
  });

  it('rend une image avec alt quand fournie', () => {
    setup();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const img = host.querySelector<HTMLImageElement>('.proj-shot img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe('/assets/meteo.jpg');
    expect(img?.getAttribute('alt')).toBe("Capture de l'app Meteo");
  });

  it('rend un placeholder raye legende pour chaque carte sans image', () => {
    setup();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const placeholders = host.querySelectorAll<HTMLElement>('.placeholder');
    expect(placeholders.length).toBe(2);
    const legends = Array.from(placeholders).map((p) => p.textContent?.trim());
    expect(legends).toContain('Plateforme metier refondue');
    expect(legends).toContain('Morning-Brief');
    expect(placeholders[0].getAttribute('aria-hidden')).toBe('true');
  });

  it('utilise imageAlt comme legende du placeholder quand fourni', () => {
    setup([
      {
        title: 'Projet interne',
        desc: 'Sans capture publique.',
        tags: [],
        imageAlt: 'Apercu confidentiel',
        size: 'small',
      },
    ]);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const placeholder = host.querySelector<HTMLElement>('.placeholder span');
    expect(placeholder?.textContent?.trim()).toBe('Apercu confidentiel');
  });

  it('rend un lien sur le visuel quand href est fourni', () => {
    setup();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const links = host.querySelectorAll<HTMLAnchorElement>('.proj .proj-link');
    expect(links.length).toBe(2);
    expect(links[0].getAttribute('href')).toBe('/projets');
  });

  it("n'enveloppe pas le visuel d'un lien quand href est absent", () => {
    setup([
      {
        title: 'Sans lien',
        desc: 'Projet sans page dediee.',
        tags: [],
        size: 'small',
      },
    ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.proj-link')).toBeNull();
    expect(fixture.nativeElement.querySelector('.proj-shot')).not.toBeNull();
  });

  it("affiche le kicker et le titre d'entete quand fournis en inputs", () => {
    setup();
    fixture.componentRef.setInput('kicker', 'Preuve de savoir-faire');
    fixture.componentRef.setInput('heading', 'Des realisations.');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.kicker')?.textContent).toContain('Preuve de savoir-faire');
    const h2 = host.querySelector<HTMLElement>('h2.projects-head__title');
    expect(h2?.textContent?.trim()).toBe('Des realisations.');
  });

  describe('chargement des images', () => {
    function images(): readonly HTMLImageElement[] {
      const host = fixture.nativeElement as HTMLElement;
      return Array.from(host.querySelectorAll<HTMLImageElement>('.proj-shot img'));
    }

    it('charge toutes les captures en lazy par defaut', () => {
      setup(IMAGE_PROJECTS);
      fixture.detectChanges();
      expect(images().map((img) => img.getAttribute('loading'))).toEqual([
        'lazy',
        'lazy',
        'lazy',
        'lazy',
      ]);
      expect(images().every((img) => img.getAttribute('fetchpriority') === null)).toBeTrue();
    });

    it('bascule les premieres cartes en eager quand la page le demande', () => {
      setup(IMAGE_PROJECTS);
      fixture.componentRef.setInput('eagerImages', 2);
      fixture.detectChanges();
      expect(images().map((img) => img.getAttribute('loading'))).toEqual([
        'eager',
        'eager',
        'lazy',
        'lazy',
      ]);
    });

    it('priorise la premiere image via fetchpriority=high uniquement en mode eager', () => {
      setup(IMAGE_PROJECTS);
      fixture.componentRef.setInput('eagerImages', 2);
      fixture.detectChanges();
      const [first, ...rest] = images();
      expect(first.getAttribute('fetchpriority')).toBe('high');
      expect(rest.map((img) => img.getAttribute('fetchpriority'))).toEqual([null, null, null]);
    });

    it('decode toutes les images en asynchrone', () => {
      setup(IMAGE_PROJECTS);
      fixture.detectChanges();
      expect(images().every((img) => img.getAttribute('decoding') === 'async')).toBeTrue();
    });

    it('declare des dimensions intrinseques au ratio de la boite de rendu', () => {
      setup(IMAGE_PROJECTS);
      fixture.detectChanges();
      const declared = images().map((img) => [
        img.getAttribute('width'),
        img.getAttribute('height'),
      ]);
      expect(declared).toEqual([
        ['800', '600'],
        ['1600', '1000'],
        ['800', '600'],
        ['1600', '1000'],
      ]);
    });
  });

  it("reste rendu cote serveur (SSR fail-open : pas d'anim-ready)", () => {
    setup(PROJECTS, 'server');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.proj').length).toBe(PROJECTS.length);
    expect(document.documentElement.classList).not.toContain('anim-ready');
  });

  describe('avec projection (page hote)', () => {
    @Component({
      standalone: true,
      imports: [AsiliProjectsGridComponent],
      template: `
        <app-asili-projects-grid [projects]="projects">
          <span kicker class="kicker">Slot kicker</span>
          <h2 heading class="h-xl">Titre <em>projete</em></h2>
          <a headLink class="link-arrow" href="/projets">Voir tous les projets</a>
        </app-asili-projects-grid>
      `,
    })
    class HostComponent {
      readonly projects = PROJECTS;
    }

    it("projette le kicker, le titre riche et le lien d'entete", () => {
      const hostFixture = TestBed.configureTestingModule({
        imports: [HostComponent],
        providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
      }).createComponent(HostComponent);
      hostFixture.detectChanges();

      const host = hostFixture.nativeElement as HTMLElement;
      expect(host.querySelector('.kicker')?.textContent).toContain('Slot kicker');
      expect(host.querySelector('h2.h-xl em')?.textContent).toBe('projete');
      const headLink = host.querySelector<HTMLAnchorElement>('.projects-head a[headLink]');
      expect(headLink?.getAttribute('href')).toBe('/projets');
    });
  });
});
