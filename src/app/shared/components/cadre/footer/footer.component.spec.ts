import { pageMontee } from '../../../../../testing/page/montage-page';
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

  it('NL-01 · le pied de page porte le bloc newsletter', () => {
    const champs = pied.racine.querySelectorAll(
      'app-newsletter-form input[type="email"], app-newsletter-form [data-newsletter-consentement]',
    );

    expect(champs.length).toBe(2);
  });

  it('should render all navigation columns and links', () => {
    const columns = pied.racine.querySelectorAll('[data-testid="footer-column"]');
    expect(columns.length).toBe(pied.composant.navColumns.length);

    pied.composant.navColumns.forEach((column, index) => {
      const renderedLinks = columns[index].querySelectorAll('li');
      expect(renderedLinks.length).toBe(column.links.length);
    });
  });

  it('should point the « Réalisations » work link to /projets', () => {
    expect(lienDeTravail('Réalisations')?.href).toBe('/projets');
  });

  it('should expose the free diagnostic link in the work column', () => {
    expect(lienDeTravail('Diagnostic gratuit')?.href).toBe('/growth-audit');
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

  it('VIT2-03 · porte le lotus de l en-tête, sans rond, et l adresse une seule fois, en lien vers la carte', () => {
    const logo = pied.racine.querySelector('.asili-logo');
    const adresses = pied.racine.querySelectorAll(
      'address a[href*="google"], address a[href*="maps"]',
    );

    expect(logo?.querySelector('.asili-logo__name')?.textContent).toContain('Asili');
    expect(
      logo
        ?.querySelector('img.asili-logo_img')
        ?.getAttribute('srcset')
        ?.replace(/\s+/g, ' ')
        .trim(),
    ).toBe(
      '/assets/images/logo/64.webp 64w, /assets/images/logo/128.webp 128w, /assets/images/logo/192.webp 192w',
    );
    expect(logo?.querySelector('.asili-logo__dot')).toBeNull();
    expect(pied.racine.textContent?.match(/33100/g)?.length).toBe(1);
    expect(adresses.length).toBe(1);
  });

  it('should render the brand baseline', () => {
    const baseline = pied.racine.querySelector('.asili-footer__baseline');
    expect(baseline?.textContent?.trim()).toBe(pied.composant.brandBaseline);
  });

  it('SEO-6 · l adresse ne porte aucune microdonnée : le JSON-LD décrit seul l entreprise', () => {
    expect(pied.racine.querySelector('[itemscope], [itemprop]')).toBeNull();
  });

  it('sépare le code postal de la ville dans l adresse affichée', () => {
    const adresse = pied.racine.querySelector('address .asili-footer__address-line');

    expect(adresse?.textContent).toMatch(/33100\s+Bordeaux/);
  });
});
