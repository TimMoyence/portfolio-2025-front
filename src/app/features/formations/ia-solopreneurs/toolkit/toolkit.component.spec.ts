import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LEAD_MAGNET_PORT } from '../../../../core/ports/lead-magnet.port';
import { createLeadMagnetPortStub } from '../../../../../testing/factories/lead-magnet.factory';
import { ToolkitComponent } from './toolkit.component';

describe('ToolkitComponent', () => {
  let component: ToolkitComponent;
  let fixture: ComponentFixture<ToolkitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolkitComponent],
      providers: [
        { provide: LEAD_MAGNET_PORT, useValue: createLeadMagnetPortStub() },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ToolkitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    document.documentElement.classList.remove('anim-ready');
  });

  it('devrait etre cree', () => {
    expect(component).toBeTruthy();
  });

  it('devrait rendre le titre principal (wording maquette)', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const heading = compiled.querySelector('h1');
    expect(heading).not.toBeNull();
    expect(heading?.textContent).toContain('toolkit IA');
    expect(heading?.textContent).toContain('solopreneurs');
  });

  it('devrait rendre le composant toolkit-form (capture lead-magnet)', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const form = compiled.querySelector('app-toolkit-form');
    expect(form).not.toBeNull();
  });

  it("devrait afficher la section 'Ce que contient le toolkit'", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent?.toLowerCase()).toContain('ce que contient');
  });

  it('devrait afficher le nom de la marque', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Asili Design');
  });

  it('devrait pointer le lien privacy vers /privacy (sans prefixe de locale)', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const link = compiled.querySelector('.tk-brand a');
    expect(link?.getAttribute('href')).toBe('/privacy');
  });
});
