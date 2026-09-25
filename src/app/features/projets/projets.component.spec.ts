import { pageMontee } from '../../../testing/montage-page';
import { ProjetsComponent } from './projets.component';

describe('ProjetsComponent', () => {
  const page = pageMontee(ProjetsComponent);

  it('should create', () => {
    expect(page.composant).toBeTruthy();
  });

  it('should render a single hero title (preuves, pas promesses)', () => {
    const headings = page.racine.querySelectorAll('h1');
    expect(headings.length).toBe(1);
    expect(headings[0]?.textContent).toContain('Des preuves');
    expect(headings[0]?.textContent).toContain('promesses');
  });

  it('should compose the Asili sections (hero, projects-grid, méthode, bande CTA)', () => {
    for (const section of [
      'app-asili-hero',
      'app-asili-projects-grid',
      'app-asili-method',
      'app-asili-cta-band',
    ]) {
      expect(page.racine.querySelector(section)).withContext(section).not.toBeNull();
    }
  });

  it('should render the ten realisations that support the commercial focus', () => {
    const cards = page.racine.querySelectorAll('app-asili-projects-grid .proj-grid .proj');
    expect(cards.length).toBe(10);
    expect(page.composant['projects'].length).toBe(10);
  });

  it('should keep the named project inventory visible in the public portfolio', () => {
    const titles = page.composant['projects'].map((project) => project.title);

    for (const expected of [
      'Fourmizzz Suite',
      'Morning-Brief',
      'Slide-Shot',
      'InnovMind',
      'AtlanticBike',
      'Schema-Atlas',
      'ZenFirst Renta',
      'Portail-EG',
      'Gestion de chais',
      'IFS Academy',
    ]) {
      expect(titles).toContain(expected);
    }
  });

  it('should illustrate every realisation, leaving no striped placeholder', () => {
    const withoutImage = page.composant['projects'].filter((p) => !p.image);
    expect(withoutImage).toEqual([]);

    expect(page.racine.querySelectorAll('app-asili-projects-grid .placeholder').length).toBe(0);
  });

  it('décrit l illustration de Fourmizzz Suite sous le nom actuel du projet (H5)', () => {
    const fourmizzz = page.composant['projects'].find((p) => p.title === 'Fourmizzz Suite');

    expect(fourmizzz?.imageAlt).toBe('illustration — Fourmizzz Suite');
    expect(page.racine.querySelector('img[alt="illustration — Fourmizzz Suite"]')).not.toBeNull();
    expect(page.racine.innerHTML).not.toContain('Le Jeu des Fourmis');
  });

  it('should no longer expose the ZenFirst Vision realisation', () => {
    const zenfirst = page.composant['projects'].find((p) => p.title.includes('ZenFirst Vision'));
    expect(zenfirst).toBeUndefined();
  });

  it('should not link any realisation to the removed case study page', () => {
    const stale = page.composant['projects'].filter((p) => p.href === '/client-project');
    expect(stale).toEqual([]);
  });

  it('documente le contexte, la solution, le rôle et le résultat de chaque projet', () => {
    const projects = page.composant['projects'];
    expect(
      projects.every((project) => {
        const study = project.caseStudy;
        return study && Object.values(study).every((value) => value.trim().length > 0);
      }),
    ).toBeTrue();
  });

  it('should render the four-step method banner (le fil rouge)', () => {
    const steps = page.racine.querySelectorAll('app-asili-method .method-steps .step');
    expect(steps.length).toBe(4);
    expect(page.composant['methodSteps'].length).toBe(4);
  });
});
