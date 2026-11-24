import { texteDe as texte } from '../../../testing/texte/textes-dom';
import { pageMontee } from '../../../testing/page/montage-page';
import { ENGAGEMENTS_INCLUS, phasesDeLaMethode } from '../../shared/offre/socle-et-elan';
import { OfferComponent } from './offer.component';

describe('VIT2-05 · Créer mon site projette le visiteur dans Socle & Élan', () => {
  const page = pageMontee(OfferComponent);

  it('VIT2-05 · le héros porte l illustration de Tim au travail', () => {
    expect(page.racine.querySelector('app-asili-hero .hero-visuel img')?.getAttribute('src')).toBe(
      '/assets/images/audit.webp',
    );
  });

  it('VIT2-05 · la méthode déroule ses cinq phases, chacune avec sa durée, sa phrase et son livrable', () => {
    const methode = page.racine.querySelector('app-asili-method') as Element;
    const phases = [...methode.querySelectorAll('.step')].map((phase) => [
      texte(phase.querySelector('h3')),
      texte(phase.querySelector('.duree')),
      texte(phase.querySelector('p:not(.livrable)')),
      texte(phase.querySelector('.livrable')),
    ]);

    expect(texte(methode.querySelector('h2'))).toContain('Socle & Élan');
    expect(phases).toEqual(
      phasesDeLaMethode().map(({ titre, duree, phrase, livrable }) => [
        titre,
        duree,
        phrase,
        livrable,
      ]),
    );
  });

  it('VIT2-05 · l aperçu montre les sites web réalisés, chacun menant à sa fiche', () => {
    const cartes = [...page.racine.querySelectorAll('.apercu .proj')].map((carte) => [
      texte(carte.querySelector('h3')),
      carte.querySelector('a')?.getAttribute('href'),
    ]);

    expect(cartes).toEqual([
      ['AtlanticBike', '/projets/atlanticbike'],
      ['Maria Naumenko', '/projets/maria-naumenko'],
      ['asilidesign.fr', '/projets/asilidesign'],
    ]);
  });

  it('VIT2-05 · Inclus détaille chaque engagement en une phrase', () => {
    const inclus = page.racine.querySelector('.inclus') as Element;
    const points = [...inclus.querySelectorAll('li')].map((point) => [
      texte(point.querySelector('h3')),
      texte(point.querySelector('p')),
    ]);

    expect(texte(inclus.querySelector('h2'))).toBe('Inclus');
    expect(points).toEqual(ENGAGEMENTS_INCLUS.map(({ titre, phrase }) => [titre, phrase]));
    for (const [, phrase] of points) {
      expect(phrase).toMatch(/^[^.!?]+[.!?]$/);
    }
  });
});
