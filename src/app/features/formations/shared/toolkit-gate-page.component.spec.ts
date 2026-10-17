import type { ComponentFixture } from '@angular/core/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { LEAD_MAGNET_PORT } from '../../../core/ports/lead-magnet.port';
import { createLeadMagnetPortStub } from '../../../../testing/factories/lead-magnet.factory';
import { ToolkitFormComponent } from '../../../shared/components/toolkit-form/toolkit-form.component';
import { ToolkitGatePageComponent } from './toolkit-gate-page.component';
import { TOOLKIT_IA_SOLO } from './toolkits-formations.data';

@Component({
  standalone: true,
  imports: [ToolkitGatePageComponent],
  template: `
    <app-toolkit-gate-page>
      <ng-container title>Le toolkit IA pour <em>solopreneurs</em>.</ng-container>
    </app-toolkit-gate-page>
  `,
})
class HostComponent {
  readonly data = TOOLKIT_IA_SOLO;
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

  it('devrait embarquer le formulaire de capture du toolkit ia-solopreneurs', () => {
    const form = fixture.debugElement.query(By.directive(ToolkitFormComponent));
    expect(form).not.toBeNull();
    expect(form.componentInstance.formationSlug).toBe('ia-solopreneurs');
  });

  it('relie chaque section editoriale a son titre', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    for (const id of ['toolkit-ia-solo-contents-heading', 'toolkit-ia-solo-faq-heading']) {
      expect(compiled.querySelector(`#${id}`))
        .withContext(id)
        .not.toBeNull();
      expect(compiled.querySelector(`[aria-labelledby="${id}"]`))
        .withContext(id)
        .not.toBeNull();
    }
  });
});
