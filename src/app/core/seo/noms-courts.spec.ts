import { buildPageSeoFr } from '../../../testing/factories/seo-metadata.factory';
import { nomCourt } from './noms-courts';
import type { SeoLocaleMeta } from './seo-metadata.model';

const page = (locales: Record<string, Partial<SeoLocaleMeta>>) =>
  buildPageSeoFr(
    'page',
    '/page',
    {},
    {
      locales: Object.fromEntries(
        Object.entries(locales).map(([langue, meta]) => [
          langue,
          { title: 'x', description: 'x', ...meta },
        ]),
      ),
    },
  );

describe('nomCourt', () => {
  it('SEO-2 · prend le texte avant le premier « — », sans ses espaces', () => {
    expect(
      nomCourt(page({ fr: { title: 'Proportions et pourcentages — B1 — Tim Moyence' } }), 'fr'),
    ).toBe('Proportions et pourcentages');
  });

  it('SEO-2 · un « | » ne coupe pas', () => {
    expect(nomCourt(page({ fr: { title: 'Articles — Morning-Brief | Asili Design' } }), 'fr')).toBe(
      'Articles',
    );
    expect(nomCourt(page({ fr: { title: 'A | B' } }), 'fr')).toBe('A | B');
  });

  it('SEO-2 · un titre sans « — » est son propre nom court', () => {
    expect(nomCourt(page({ fr: { title: 'Page introuvable' } }), 'fr')).toBe('Page introuvable');
  });

  it('SEO-2 · un nom écrit l emporte sur la tête du titre, dans chaque langue', () => {
    const accueil = page({
      fr: { title: 'Asili Design — x', nom: 'Accueil' },
      en: { title: 'Asili Design — y', nom: 'Home' },
    });

    expect(nomCourt(accueil, 'fr')).toBe('Accueil');
    expect(nomCourt(accueil, 'en')).toBe('Home');
  });

  it('SEO-2 · une langue absente de la page retombe sur la langue par défaut', () => {
    expect(nomCourt(page({ fr: { title: 'Contact — x' } }), 'en')).toBe('Contact');
  });

  it('SEO-2 · un nom qui recopie la tête du titre est refusé', () => {
    const projets = page({
      fr: { title: 'Réalisations — x', nom: 'Réalisations' },
      en: { title: 'Work — y', nom: 'Projects' },
    });

    expect(() => nomCourt(projets, 'fr')).toThrowError('nom recopie la tête du titre : page (fr)');
  });

  it('SEO-2 · un nom écrit dans une seule langue est refusé', () => {
    const audit = page({
      fr: { title: 'Diagnostic gratuit de votre site — x', nom: 'Diagnostic gratuit' },
      en: { title: 'Free diagnosis of your website — y' },
    });

    expect(() => nomCourt(audit, 'fr')).toThrowError('nom sans traduction : page (en)');
  });
});
