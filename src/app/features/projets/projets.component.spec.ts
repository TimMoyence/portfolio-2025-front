import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProjetsComponent } from './projets.component';

describe('ProjetsComponent', () => {
  let component: ProjetsComponent;
  let fixture: ComponentFixture<ProjetsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjetsComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    document.documentElement.classList.remove('anim-ready');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render a single hero title (preuves, pas promesses)', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const headings = compiled.querySelectorAll('h1');
    expect(headings.length).toBe(1);
    expect(headings[0]?.textContent).toContain('Des preuves');
    expect(headings[0]?.textContent).toContain('promesses');
  });

  it('should compose the Asili sections (hero, projects-grid, méthode, bande CTA)', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-asili-hero')).not.toBeNull();
    expect(compiled.querySelector('app-asili-projects-grid')).not.toBeNull();
    expect(compiled.querySelector('app-asili-method')).not.toBeNull();
    expect(compiled.querySelector('app-asili-cta-band')).not.toBeNull();
  });

  it('should render the fourteen realisations from the mockup', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('app-asili-projects-grid .proj-grid .proj');
    expect(cards.length).toBe(14);
    expect(component['projects'].length).toBe(14);
  });

  it('should illustrate every realisation, leaving no striped placeholder', () => {
    const withoutImage = component['projects'].filter((p) => !p.image);
    expect(withoutImage).toEqual([]);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('app-asili-projects-grid .placeholder').length).toBe(0);
  });

  it('should no longer expose the ZenFirst Vision realisation', () => {
    const zenfirst = component['projects'].find((p) => p.title.includes('ZenFirst Vision'));
    expect(zenfirst).toBeUndefined();
  });

  it('should not link any realisation to the removed case study page', () => {
    const stale = component['projects'].filter((p) => p.href === '/client-project');
    expect(stale).toEqual([]);
  });

  it('should render the four-step method banner (le fil rouge)', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const steps = compiled.querySelectorAll('app-asili-method .method-steps .step');
    expect(steps.length).toBe(4);
    expect(component['methodSteps'].length).toBe(4);
  });
});
