import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { LEAD_MAGNET_PORT } from '../../../../core/ports/lead-magnet.port';
import { createLeadMagnetPortStub } from '../../../../../testing/factories/lead-magnet.factory';
import { ToolkitFormComponent } from '../../../../shared/components/toolkit-form/toolkit-form.component';
import { ToolkitAuditSeoComponent } from './toolkit-audit-seo.component';

describe('ToolkitAuditSeoComponent', () => {
  let component: ToolkitAuditSeoComponent;
  let fixture: ComponentFixture<ToolkitAuditSeoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolkitAuditSeoComponent],
      providers: [
        { provide: LEAD_MAGNET_PORT, useValue: createLeadMagnetPortStub() },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ToolkitAuditSeoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait etre cree', () => {
    expect(component).toBeTruthy();
  });

  it('devrait rendre le titre principal (H1)', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const heading = compiled.querySelector('h1');
    expect(heading).not.toBeNull();
    expect(heading?.textContent?.toLowerCase()).toContain('audit seo');
  });

  it('devrait rendre le toolkit-form avec le slug audit-seo-diy', () => {
    const form = fixture.debugElement.query(By.directive(ToolkitFormComponent));
    expect(form).not.toBeNull();
    expect(form.componentInstance.formationSlug).toBe('audit-seo-diy');
  });

  it('devrait afficher la FAQ (AEO / FAQPage signal)', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent?.toLowerCase()).toContain('questions');
    const h3Questions = compiled.querySelectorAll('h3');
    expect(h3Questions.length).toBeGreaterThanOrEqual(3);
  });

  it("devrait afficher la section 'Ce que contient le toolkit'", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent?.toLowerCase()).toContain('ce que contient');
  });

  it('devrait afficher le nom de la marque', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Asili Design');
  });
});
