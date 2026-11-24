import { Component } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { rendreLHoteNavigateur } from '../../../../../testing/page/montage-page';
import {
  decrireLiensDansLaLangueDeLaPage,
  decrireRenduServeur,
  decrireSectionAsili,
} from '../../../../../testing/page/section-asili';
import type { AsiliProject } from './asili-projects-grid.component';
import { AsiliProjectsGridComponent } from './asili-projects-grid.component';

const PROJECTS: readonly AsiliProject[] = [
  {
    title: 'Atelier de reliure',
    desc: 'Un site qui fait venir les commandes.',
    tags: [
      { label: 'Artisanat', prod: false },
      { label: 'En ligne', prod: true },
    ],
    image: '/assets/images/projects/reliure.webp',
    srcset: '/assets/images/projects/vignettes/reliure/360.webp 360w',
    imageAlt: 'Capture du site de reliure',
    href: '/projets/reliure',
    vignette: 'realisation-reliure',
    size: 'big',
  },
  {
    title: 'Cave du port',
    desc: 'Une boutique trouvée sur Google.',
    tags: [{ label: 'Commerce', prod: false }],
    image: '/assets/images/projects/cave.webp',
    srcset: '/assets/images/projects/vignettes/cave/360.webp 360w',
    imageAlt: 'Capture de la cave',
    href: '/projets/cave',
    vignette: 'realisation-cave',
    size: 'small',
  },
  {
    title: 'Suivi de chantier',
    desc: 'Un outil métier pour une équipe de terrain.',
    tags: [{ label: 'Bâtiment', prod: false }],
    image: '/assets/images/projects/chantier.webp',
    srcset: '/assets/images/projects/vignettes/chantier/360.webp 360w',
    imageAlt: 'Capture du suivi de chantier',
    href: '/projets/chantier',
    vignette: 'realisation-chantier',
    size: 'small',
  },
];

describe('AsiliProjectsGridComponent', () => {
  let fixture: ComponentFixture<AsiliProjectsGridComponent>;

  const monter = decrireSectionAsili(AsiliProjectsGridComponent, { projects: PROJECTS });

  decrireLiensDansLaLangueDeLaPage(monter, { projects: PROJECTS.slice(0, 2) }, '.proj-link', [
    '/en/projets/reliure',
    '/en/projets/cave',
  ]);

  function hote(): HTMLElement {
    fixture = monter('browser', { projects: PROJECTS });
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('rend une carte .proj par projet avec son titre en <h3>', () => {
    const titres = [...hote().querySelectorAll('.proj .proj-body h3')].map((titre) =>
      titre.textContent?.trim(),
    );

    expect(titres).toEqual(['Atelier de reliure', 'Cave du port', 'Suivi de chantier']);
  });

  it('applique la taille via .big / .small', () => {
    const racine = hote();

    expect(racine.querySelectorAll('.proj.big').length).toBe(1);
    expect(racine.querySelectorAll('.proj.small').length).toBe(2);
  });

  it('rend les etiquettes et marque les resultats via .tag-prod', () => {
    const racine = hote();

    expect(racine.querySelectorAll('.tag').length).toBe(4);
    expect(
      [...racine.querySelectorAll('.tag.tag-prod')].map((tag) => tag.textContent?.trim()),
    ).toEqual(['En ligne']);
  });

  it('enveloppe chaque capture d un lien vers sa fiche et la nomme pour la transition', () => {
    const liens = [...hote().querySelectorAll<HTMLAnchorElement>('.proj .proj-link')];

    expect(liens.map((lien) => lien.getAttribute('href'))).toEqual([
      '/projets/reliure',
      '/projets/cave',
      '/projets/chantier',
    ]);
    expect(
      liens.map((lien) => [
        lien.querySelector('img')?.getAttribute('alt'),
        lien.querySelector<HTMLImageElement>('img')?.style.getPropertyValue('view-transition-name'),
      ]),
    ).toEqual([
      ['Capture du site de reliure', 'realisation-reliure'],
      ['Capture de la cave', 'realisation-cave'],
      ['Capture du suivi de chantier', 'realisation-chantier'],
    ]);
  });

  it("affiche le kicker et le titre d'entete quand fournis en inputs", () => {
    fixture = monter('browser', { projects: PROJECTS });
    fixture.componentRef.setInput('kicker', 'Quand un site ne suffit plus');
    fixture.componentRef.setInput('heading', 'Sur-mesure');
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;

    expect(racine.querySelector('.kicker')?.textContent).toContain('Quand un site ne suffit plus');
    expect(racine.querySelector('h2.projects-head__title')?.textContent?.trim()).toBe('Sur-mesure');
  });

  it('charge les captures en differe, decodees en asynchrone, au ratio de leur boite', () => {
    const images = [...hote().querySelectorAll<HTMLImageElement>('.proj-shot img')];

    expect(
      images.map((image) => [
        image.getAttribute('loading'),
        image.getAttribute('decoding'),
        image.getAttribute('width'),
        image.getAttribute('height'),
      ]),
    ).toEqual([
      ['lazy', 'async', '1600', '1000'],
      ['lazy', 'async', '800', '600'],
      ['lazy', 'async', '800', '600'],
    ]);
  });

  it('sert chaque capture par ses variantes, à la largeur de sa carte dans la grille', () => {
    const images = [...hote().querySelectorAll<HTMLImageElement>('.proj-shot img')];
    const grille = 'min(100vw, 1280px) - 2 * clamp(20px, 5vw, 72px)';
    const tablette = `(max-width: 860px) calc(${grille})`;

    expect(images.map((image) => [image.getAttribute('srcset'), image.sizes])).toEqual([
      [
        '/assets/images/projects/vignettes/reliure/360.webp 360w',
        `${tablette}, calc((${grille} - 110px) * 2 / 3 + 66px)`,
      ],
      [
        '/assets/images/projects/vignettes/cave/360.webp 360w',
        `${tablette}, calc((${grille} - 110px) / 3 + 22px)`,
      ],
      [
        '/assets/images/projects/vignettes/chantier/360.webp 360w',
        `${tablette}, calc((${grille} - 110px) / 3 + 22px)`,
      ],
    ]);
  });

  decrireRenduServeur(monter, (racine) => {
    expect(racine.querySelectorAll('.proj').length).toBe(PROJECTS.length);
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
      const racine = rendreLHoteNavigateur(HostComponent);

      expect(racine.querySelector('.kicker')?.textContent).toContain('Slot kicker');
      expect(racine.querySelector('h2.h-xl em')?.textContent).toBe('projete');
      expect(racine.querySelector('.projects-head a[headLink]')?.getAttribute('href')).toBe(
        '/projets',
      );
    });
  });
});
