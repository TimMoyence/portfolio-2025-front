import { texteDe as texte } from '../../../testing/texte/textes-dom';
import { phasesDeLaMethode } from '../../shared/offre/socle-et-elan';
import { faqRendue } from '../../../testing/page/faq-rendue';
import { decrirePage } from '../../../testing/page/page-decrite';
import { PresentationComponent } from './presentation.component';

describe('PresentationComponent', () => {
  const { rendu: compiled, composant: component } = decrirePage(PresentationComponent);

  it('VIT2-10 · le titre dit le site pensé avec vous, prouvé avant d être promis', () => {
    const titres = [...compiled().querySelectorAll('h1')].map(texte);

    expect(titres).toEqual(['Votre site, pensé avec vous, prouvé avant d’être promis.']);
  });

  it('VIT2-10 · la méta Méthode nomme les phases de Socle & Élan', () => {
    const methode = [...compiled().querySelectorAll('.hero-meta-rows .row')].find(
      (ligne) => texte(ligne.querySelector('.k')) === 'Méthode',
    );

    expect(texte(methode?.querySelector('.v'))).toBe(
      phasesDeLaMethode()
        .map(({ titre }) => titre)
        .join(' · '),
    );
  });

  it('should compose the Asili sections (hero, méthode IA, bande CTA)', () => {
    expect(compiled().querySelector('app-asili-hero')).not.toBeNull();
    expect(compiled().querySelector('app-asili-ai-method')).not.toBeNull();
    expect(compiled().querySelector('app-asili-cta-band')).not.toBeNull();
  });

  it('should render the three expertise skills', () => {
    const skills = compiled().querySelectorAll('.skills-grid .skill');
    expect(skills.length).toBe(3);
  });

  it('should render the career timeline milestones as an ordered list', () => {
    const items = compiled().querySelectorAll('ol.timeline > li.tl-item');
    expect(items.length).toBe(component()['milestones'].length);
  });

  it('should render an SSR-safe FAQ with FAQPage microdata', () => {
    faqRendue(compiled(), component()['closing'].faq.items.length);
  });
});
