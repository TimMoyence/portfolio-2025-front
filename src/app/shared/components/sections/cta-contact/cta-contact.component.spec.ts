import { pageMontee } from '../../../../../testing/page/montage-page';
import type { ContactMethod } from '../../../models/contact-method.model';
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

  it('chaque moyen de contact est un lien vers son adresse', () => {
    cta.fixture.detectChanges();
    const liens = [...cta.racine.querySelectorAll('[data-testid^="contact-method-"] a[href]')];

    expect(liens.map((lien) => [lien.getAttribute('href'), lien.textContent?.trim()])).toEqual(
      cta.composant.contactMethods.map(({ href, value }) => [href, value]),
    );
  });

  it('should render the contact section heading', () => {
    const heading = cta.racine.querySelector('#contact-heading');
    expect(heading?.textContent).toContain(cta.composant.title);
  });
});
