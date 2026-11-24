import { pageMontee } from '../../../testing/page/montage-page';
import { ProjetsComponent } from './projets.component';
import { REALISATIONS } from './realisations.data';

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

  it('should illustrate every realisation, leaving no striped placeholder', () => {
    expect(REALISATIONS.filter(({ image }) => !image).map(({ titre }) => titre)).toEqual([]);
    expect(page.racine.querySelectorAll('app-asili-projects-grid .placeholder').length).toBe(0);
  });

  it('raconte le défi, ce qui a été construit et le résultat de chaque réalisation', () => {
    expect(
      REALISATIONS.filter(({ recit }) =>
        Object.values(recit).some((valeur) => valeur.trim().length === 0),
      ).map(({ titre }) => titre),
    ).toEqual([]);
  });

  it('VIT2-07 · toutes les cartes ont le même cadre', () => {
    const cartes = [...page.racine.querySelectorAll<HTMLElement>('.proj')];
    const cadres = new Set(
      cartes.map((carte) => {
        const capture = carte.querySelector<HTMLImageElement>('.proj-shot img');
        return [capture?.getAttribute('width'), capture?.getAttribute('height'), capture?.sizes]
          .map(String)
          .join(' | ');
      }),
    );

    expect(cartes.length).toBe(REALISATIONS.length);
    expect([...cadres].map((cadre) => cadre.split(' | ').slice(0, 2))).toEqual([['800', '600']]);
  });

  it('should render the four-step method banner (le fil rouge)', () => {
    const steps = page.racine.querySelectorAll('app-asili-method .method-steps .step');
    expect(steps.length).toBe(4);
    expect(page.composant['methodSteps'].length).toBe(4);
  });
});
