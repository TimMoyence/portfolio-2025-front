import { faqRendue } from '../../../testing/faq-rendue';
import { decrirePage } from '../../../testing/page-decrite';
import { PresentationComponent } from './presentation.component';

describe('PresentationComponent', () => {
  const { rendu: compiled, composant: component } = decrirePage(PresentationComponent);

  it('should render a single dev-forward hero title', () => {
    const headings = compiled().querySelectorAll('h1');
    expect(headings.length).toBe(1);
    expect(headings[0]?.textContent).toContain('Développeur full-stack & IA.');
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
