import type { ComponentFixture } from '@angular/core/testing';
import { montagePage } from '../../../testing/montage-page';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  const page = montagePage(HomeComponent);
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(() => {
    fixture = page();
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it("devrait composer les sections Asili dans l'ordre attendu", () => {
    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.querySelector('app-asili-hero')).not.toBeNull();
    expect(compiled.querySelector('app-asili-method')).not.toBeNull();
    expect(compiled.querySelector('app-asili-pillars')).not.toBeNull();
    expect(compiled.querySelector('app-asili-manifesto')).not.toBeNull();
    expect(compiled.querySelector('app-asili-projects-grid')).not.toBeNull();
    expect(compiled.querySelector('app-asili-cta-band')).not.toBeNull();
  });

  it('devrait rendre un unique h1 (titre du hero)', () => {
    const compiled: HTMLElement = fixture.nativeElement;
    const headings = compiled.querySelectorAll('h1');
    expect(headings.length).toBe(1);
    expect(headings[0].textContent).toContain('Clarifier');
  });

  it("ne devrait plus exposer l'ancien Atelier", () => {
    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.querySelector('section.atelier')).toBeNull();
    expect(compiled.textContent).not.toContain("L'Atelier");
  });

  it('devrait afficher la bande CTA finale', () => {
    const compiled: HTMLElement = fixture.nativeElement;
    const cta = compiled.querySelector('app-asili-cta-band');
    expect(cta?.textContent).toContain('clarifiait');
  });

  it('devrait exposer 4 etapes de methode et 2 piliers', () => {
    expect(component['methodSteps']).toHaveSize(4);
    expect(component['pillars']).toHaveSize(2);
    expect(component['pillars'][0].variant).toBe('services');
    expect(component['pillars'][1].variant).toBe('formations');
  });

  it('devrait exposer un teaser de projets non vide', () => {
    expect(component['projects'].length).toBeGreaterThan(0);
  });
});
