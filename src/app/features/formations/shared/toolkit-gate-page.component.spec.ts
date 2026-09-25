import type { ComponentFixture } from '@angular/core/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { LEAD_MAGNET_PORT } from '../../../core/ports/lead-magnet.port';
import { createLeadMagnetPortStub } from '../../../../testing/factories/lead-magnet.factory';
import { ToolkitFormComponent } from '../../../shared/components/toolkit-form/toolkit-form.component';
import { ToolkitGatePageComponent } from './toolkit-gate-page.component';
import { TOOLKITS_FORMATIONS, type ToolkitFormation } from './toolkits-formations.data';

@Component({
  standalone: true,
  imports: [ToolkitGatePageComponent],
  template: `
    <app-toolkit-gate-page [formationSlug]="slug">
      <ng-container title>Le toolkit IA pour <em>solopreneurs</em>.</ng-container>
    </app-toolkit-gate-page>
  `,
})
class HostComponent {
  slug: Exclude<ToolkitFormation, 'ia-solo'> | null = null;
  readonly data = TOOLKITS_FORMATIONS['ia-solo'];
}

describe('ToolkitGatePageComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        { provide: LEAD_MAGNET_PORT, useValue: createLeadMagnetPortStub() },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    document.documentElement.classList.remove('anim-ready');
  });

  it('devrait etre cree', () => {
    expect(host).toBeTruthy();
  });

  it("devrait projeter le titre (avec accent) dans l'unique h1", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const headings = compiled.querySelectorAll('h1');
    expect(headings.length).toBe(1);
    expect(headings[0]?.textContent).toContain('toolkit IA');
    expect(headings[0]?.querySelector('em')?.textContent).toContain('solopreneurs');
  });

  it('devrait rendre un item par entree de data.items', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const items = compiled.querySelectorAll('.tk-items .it');
    expect(items.length).toBe(host.data.items.length);
    expect(compiled.textContent).toContain(host.data.items[0]?.label ?? '');
  });

  it('devrait rendre le contenu editorial (contents + FAQ)', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Ce que contient le toolkit');
    expect(compiled.querySelectorAll('.tk-list li').length).toBe(host.data.contents.length);
    expect(compiled.querySelectorAll('.tk-faq .tk-qa').length).toBe(host.data.faq.length);
    expect(compiled.querySelectorAll('.tk-faq h3').length).toBeGreaterThanOrEqual(2);
  });

  it('devrait afficher la marque et un lien privacy SANS prefixe de locale', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Asili Design');
    const link = compiled.querySelector('.tk-brand a');
    expect(link).not.toBeNull();
    expect(link?.getAttribute('href')).toBe('/privacy');
  });

  it('devrait embarquer le formulaire de capture sans slug par defaut', () => {
    const form = fixture.debugElement.query(By.directive(ToolkitFormComponent));
    expect(form).not.toBeNull();
    expect(form.componentInstance.formationSlug).toBe('ia-solopreneurs');
  });

  it('devrait transmettre le formationSlug fourni au formulaire (cle metier)', () => {
    host.slug = 'audit-seo-diy';
    fixture.detectChanges();
    const form = fixture.debugElement.query(By.directive(ToolkitFormComponent));
    expect(form.componentInstance.formationSlug).toBe('audit-seo-diy');
  });

  it('devrait afficher le contenu du toolkit de la formation designee par le slug', () => {
    host.slug = 'audit-seo-diy';
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.lead')?.textContent).toBe(
      TOOLKITS_FORMATIONS['audit-seo-diy'].lead,
    );
  });

  it("devrait deriver des id d'en-tete uniques depuis le slug", () => {
    host.slug = 'automatiser-avec-ia';
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#toolkit-automatiser-avec-ia-contents-heading')).not.toBeNull();
    expect(compiled.querySelector('#toolkit-automatiser-avec-ia-faq-heading')).not.toBeNull();
  });
});
