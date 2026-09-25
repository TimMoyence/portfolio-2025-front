import { faqRendue } from '../../../testing/faq-rendue';
import { pageMontee } from '../../../testing/montage-page';
import { OfferComponent } from './offer.component';

describe('OfferComponent', () => {
  const page = pageMontee(OfferComponent);

  it('should create', () => {
    expect(page.composant).toBeTruthy();
  });

  it('should render a single hero title with the accentuated need', () => {
    const headings = page.racine.querySelectorAll('h1');
    expect(headings.length).toBe(1);
    const title = page.racine.querySelector('[data-testid="hero-title"]');
    expect(title?.textContent).toContain('Un périmètre défini sur');
    expect(title?.querySelector('.accent')?.textContent).toContain('votre');
  });

  it('should compose the Asili sections (hero, méthode, bande CTA)', () => {
    expect(page.racine.querySelector('app-asili-hero')).not.toBeNull();
    expect(page.racine.querySelector('app-asili-method')).not.toBeNull();
    expect(page.racine.querySelector('app-asili-cta-band')).not.toBeNull();
  });

  it('should render the four intervention modes', () => {
    const modes = page.racine.querySelectorAll('[data-testid="modes-section"] .mode');
    expect(modes.length).toBe(4);
  });

  it('should sell AI training that includes management practices', () => {
    expect(page.composant['modes'][3].desc.toLowerCase()).toContain('management');
  });

  it('should render the three differentiators', () => {
    const diffs = page.racine.querySelectorAll('[data-testid="diff-section"] .diff');
    expect(diffs.length).toBe(page.composant['diffs'].length);
  });

  it('should render an SSR-safe FAQ with FAQPage microdata and the pricing question', () => {
    const faq = faqRendue(page.racine, page.composant['closing'].faq.items.length);
    expect(faq.textContent).toContain('Pourquoi pas de grille de prix ?');
  });
});
