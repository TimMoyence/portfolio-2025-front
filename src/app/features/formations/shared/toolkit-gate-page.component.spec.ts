import type { ComponentFixture } from '@angular/core/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { LEAD_MAGNET_PORT } from '../../../core/ports/lead-magnet.port';
import { createLeadMagnetPortStub } from '../../../../testing/factories/lead-magnet.factory';
import { ToolkitFormComponent } from '../../../shared/components/toolkit-form/toolkit-form.component';
import { ToolkitGatePageComponent } from './toolkit-gate-page.component';
import type { ToolkitGatePageData } from './toolkit-gate-page.model';

/** Donnees de test minimales mais representatives d'une page gate. */
function buildGateData(overrides: Partial<ToolkitGatePageData> = {}): ToolkitGatePageData {
  return {
    lead: 'Un kit de demarrage concret, offert.',
    items: [{ label: "30 prompts prets a l'emploi" }, { label: 'Une checklist' }],
    foot: 'Gratuit, sans engagement.',
    contentsTitle: 'Ce que contient le toolkit',
    contents: ['16 outils IA selectionnes', 'Les budgets mensuels estimes'],
    faqTitle: 'Questions frequentes',
    faq: [
      { question: "A qui s'adresse ce toolkit ?", answer: 'Aux solopreneurs.' },
      { question: 'Pourquoi gratuit ?', answer: 'Version condensee.' },
    ],
    brand: 'Asili Design — asilidesign.fr',
    privacyLabel: 'Politique de confidentialite',
    ...overrides,
  };
}

/**
 * Hote de test : projette un titre (avec accent `<em>`) et fournit les inputs,
 * comme le font les pages shell reelles.
 */
@Component({
  standalone: true,
  imports: [ToolkitGatePageComponent],
  template: `
    <app-toolkit-gate-page [data]="data" [formationSlug]="slug">
      <ng-container title>Le toolkit IA pour <em>solopreneurs</em>.</ng-container>
    </app-toolkit-gate-page>
  `,
})
class HostComponent {
  data: ToolkitGatePageData = buildGateData();
  slug: string | null = null;
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

  // `appReveal` pose `anim-ready` sur <html> (singleton partage) : on nettoie.
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
    expect(compiled.textContent).toContain("30 prompts prets a l'emploi");
  });

  it('devrait rendre le contenu editorial (contents + FAQ)', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Ce que contient le toolkit');
    expect(compiled.querySelectorAll('.tk-list li').length).toBe(host.data.contents.length);
    expect(compiled.querySelectorAll('.tk-faq .tk-qa').length).toBe(host.data.faq.length);
    // FAQ AEO : une question = un <h3>.
    expect(compiled.querySelectorAll('.tk-faq h3').length).toBeGreaterThanOrEqual(2);
  });

  it('devrait afficher la marque et un lien privacy SANS prefixe de locale', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Asili Design');
    const link = compiled.querySelector('.tk-brand a');
    expect(link).not.toBeNull();
    // Bug corrige : route privacy = `/privacy` (pas `/fr/privacy`), sinon le
    // build EN casse.
    expect(link?.getAttribute('href')).toBe('/privacy');
  });

  it('devrait embarquer le formulaire de capture sans slug par defaut', () => {
    const form = fixture.debugElement.query(By.directive(ToolkitFormComponent));
    expect(form).not.toBeNull();
    // Aucun slug fourni : le formulaire applique son defaut (ia-solopreneurs).
    // Le slug transite par une liaison de propriete (`@Input`), non reflechie
    // en attribut DOM : on lit donc l'instance du composant enfant.
    expect(form.componentInstance.formationSlug).toBe('ia-solopreneurs');
  });

  it('devrait transmettre le formationSlug fourni au formulaire (cle metier)', () => {
    host.slug = 'audit-seo-diy';
    fixture.detectChanges();
    const form = fixture.debugElement.query(By.directive(ToolkitFormComponent));
    expect(form.componentInstance.formationSlug).toBe('audit-seo-diy');
  });

  it("devrait deriver des id d'en-tete uniques depuis le slug", () => {
    host.slug = 'automatiser-avec-ia';
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#toolkit-automatiser-avec-ia-contents-heading')).not.toBeNull();
    expect(compiled.querySelector('#toolkit-automatiser-avec-ia-faq-heading')).not.toBeNull();
  });
});
