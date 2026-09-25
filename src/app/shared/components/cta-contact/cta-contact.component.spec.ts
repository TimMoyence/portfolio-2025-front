import { pageMontee } from '../../../../testing/montage-page';
import type { ContactMethod } from '../../models/contact.model';
import { ContactCtaComponent } from './cta-contact.component';

describe('ContactCtaComponent', () => {
  const cta = pageMontee(ContactCtaComponent);

  it('should create', () => {
    expect(cta.composant).toBeTruthy();
  });

  it('should display the heading and lead paragraph when provided', () => {
    cta.fixture.componentRef.setInput('leadParagraphs', ['Première phrase']);
    cta.fixture.detectChanges();
    expect(cta.racine.textContent).toContain(cta.composant.title);
    expect(cta.racine.textContent).toContain('Première phrase');
  });

  it('should render each contact method', () => {
    cta.composant.contactMethods.forEach((_: ContactMethod, index: number) => {
      const method = cta.racine.querySelector(`[data-testid="contact-method-${index}"]`);
      expect(method).withContext(`Missing method at index ${index}`).not.toBeNull();
    });
  });

  it('should set href attributes for linkable methods', () => {
    cta.fixture.detectChanges();
    const links = Array.from(cta.racine.querySelectorAll('a[href]')) as HTMLAnchorElement[];
    expect(links.length).toBeGreaterThan(0);
    cta.composant.contactMethods
      .filter((method: ContactMethod): method is ContactMethod & { href: string } => !!method.href)
      .forEach((method) => {
        const match = links.find(
          (link) =>
            link.getAttribute('href') === method.href || link.textContent?.includes(method.value),
        );
        expect(match).withContext(`Missing href for ${method.label}`).toBeTruthy();
      });
  });

  it('should render the contact section heading', () => {
    const heading = cta.racine.querySelector('#contact-heading');
    expect(heading?.textContent).toContain(cta.composant.title);
  });
});
