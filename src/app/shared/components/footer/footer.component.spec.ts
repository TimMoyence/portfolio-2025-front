import { pageMontee } from '../../../../testing/montage-page';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  const pied = pageMontee(FooterComponent);

  const lienDeTravail = (libelle: string) =>
    pied.composant.navColumns
      .find((column) => column.heading === 'Travailler')
      ?.links.find((link) => link.label === libelle);

  it('should create', () => {
    expect(pied.composant).toBeTruthy();
  });

  it('should render all navigation columns and links', () => {
    const columns = pied.racine.querySelectorAll('[data-testid="footer-column"]');
    expect(columns.length).toBe(pied.composant.navColumns.length);

    pied.composant.navColumns.forEach((column, index) => {
      const renderedLinks = columns[index].querySelectorAll('li');
      expect(renderedLinks.length).toBe(column.links.length);
    });
  });

  it('should point the « Projets » work link to /projets', () => {
    expect(lienDeTravail('Projets')?.href).toBe('/projets');
  });

  it('should expose the audit link in the work column', () => {
    expect(lienDeTravail('Audit')?.href).toBe('/growth-audit');
  });

  it('should render a social link entry for each configured link', () => {
    const socialLinks = pied.racine.querySelectorAll('[data-testid="social-link"]');
    expect(socialLinks.length).toBe(pied.composant.socialLinks.length);
  });

  it('should include the legal links list', () => {
    const legalList = pied.racine.querySelector('[data-testid="legal-links"]');
    expect(legalList).toBeTruthy();
    expect(legalList?.querySelectorAll('li').length).toBe(pied.composant.legalLinks.length);
  });

  it('should render the Asili brand logo with name and teal dot', () => {
    const logo = pied.racine.querySelector('.asili-logo');
    expect(logo).toBeTruthy();
    expect(logo?.querySelector('.asili-logo__name')?.textContent).toContain('Asili');
    expect(logo?.querySelector('.asili-logo__dot')).toBeTruthy();
  });

  it('should render the brand baseline', () => {
    const baseline = pied.racine.querySelector('.asili-footer__baseline');
    expect(baseline?.textContent?.trim()).toBe(pied.composant.brandBaseline);
  });

  it('should keep the structured <address> with postal address microdata', () => {
    const address = pied.racine.querySelector('address[itemscope]');
    expect(address).toBeTruthy();
    expect(address?.querySelector('[itemprop="address"][itemscope]')).toBeTruthy();
    expect(address?.querySelector('[itemprop="addressLocality"]')?.textContent).toContain(
      'Bordeaux',
    );
  });
});
