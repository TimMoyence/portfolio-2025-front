import { decrirePage } from '../../../testing/page-decrite';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  const { rendu: compiled, composant: component } = decrirePage(HomeComponent);

  it("devrait composer les sections Asili dans l'ordre attendu", () => {
    expect(compiled().querySelector('app-asili-hero')).not.toBeNull();
    expect(compiled().querySelector('app-asili-method')).not.toBeNull();
    expect(compiled().querySelector('app-asili-pillars')).not.toBeNull();
    expect(compiled().querySelector('app-asili-manifesto')).not.toBeNull();
    expect(compiled().querySelector('app-asili-projects-grid')).not.toBeNull();
    expect(compiled().querySelector('app-asili-cta-band')).not.toBeNull();
  });

  it('devrait rendre un unique h1 (titre du hero)', () => {
    const headings = compiled().querySelectorAll('h1');
    expect(headings.length).toBe(1);
    expect(headings[0].textContent).toContain('Clarifier');
  });

  it("ne devrait plus exposer l'ancien Atelier", () => {
    expect(compiled().querySelector('section.atelier')).toBeNull();
    expect(compiled().textContent).not.toContain("L'Atelier");
  });

  it('devrait afficher la bande CTA finale', () => {
    const cta = compiled().querySelector('app-asili-cta-band');
    expect(cta?.textContent).toContain('clarifiait');
  });

  it('devrait exposer 4 etapes de methode et 2 piliers', () => {
    expect(component()['methodSteps']).toHaveSize(4);
    expect(component()['pillars']).toHaveSize(2);
    expect(component()['pillars'][0].variant).toBe('services');
    expect(component()['pillars'][1].variant).toBe('formations');
  });

  it('devrait exposer un teaser de projets non vide', () => {
    expect(component()['projects'].length).toBeGreaterThan(0);
  });
});
