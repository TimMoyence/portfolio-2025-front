import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AsiliClosingComponent, type AsiliClosing } from './asili-closing.component';

const CLOTURE: AsiliClosing = {
  faq: {
    kicker: 'Questions fréquentes',
    title: 'Avant de se lancer.',
    items: [{ q: 'Pourquoi pas de grille de prix ?', a: 'Chaque besoin est cadré.' }],
  },
  cta: {
    kicker: 'Prêt à clarifier ?',
    title: 'Décrivez votre besoin.',
    actions: [{ libelle: 'Démarrer', lien: '/contact', variante: 'principale' }],
  },
};

describe('AsiliClosingComponent', () => {
  let fixture: ComponentFixture<AsiliClosingComponent>;
  let page: HTMLElement;

  beforeEach(() => {
    fixture = TestBed.configureTestingModule({
      imports: [AsiliClosingComponent],
      providers: [provideRouter([])],
    }).createComponent(AsiliClosingComponent);
    fixture.componentRef.setInput('contenu', CLOTURE);
    fixture.detectChanges();
    page = fixture.nativeElement as HTMLElement;
  });

  it('clot la page par la FAQ puis par le bandeau CTA', () => {
    const blocs = Array.from(page.children).map((bloc) => bloc.tagName.toLowerCase());
    expect(blocs).toEqual(['app-asili-faq', 'app-asili-cta-band']);
  });

  it('rend la FAQ fournie avec ses questions', () => {
    const faq = page.querySelector('app-asili-faq') as HTMLElement;
    expect(faq.textContent).toContain('Avant de se lancer.');
    expect(faq.querySelectorAll('details.faq-item').length).toBe(1);
  });

  it('rend le bandeau CTA fourni avec son kicker et ses actions', () => {
    const cta = page.querySelector('app-asili-cta-band') as HTMLElement;
    expect(cta.querySelector('.cta-kicker')?.textContent).toBe('Prêt à clarifier ?');
    expect(cta.querySelector('h2.cta-title')?.textContent).toBe('Décrivez votre besoin.');
    expect(cta.querySelector('.cta-actions a')?.getAttribute('href')).toBe('/contact');
  });
});
