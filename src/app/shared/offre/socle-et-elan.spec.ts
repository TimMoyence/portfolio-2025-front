import { faqDuSite, type OffreDeSite } from './prix-et-delai';
import { ENGAGEMENTS_INCLUS, etapesDeLaMethode, phasesDeLaMethode } from './socle-et-elan';

describe('VIT2-05 · la méthode Socle & Élan s écrit une seule fois et suit l offre', () => {
  it('VIT2-05 · cinq phases dans l ordre, chacune avec sa phrase, son livrable et sa durée', () => {
    const phases = phasesDeLaMethode();

    expect(phases.map(({ titre }) => titre)).toEqual([
      'Cadrer',
      'Écrire',
      'Construire',
      'Lancer',
      'Élan',
    ]);
    expect(phases.map(({ duree }) => duree)).toEqual([
      'jours 1-2',
      'semaine 1',
      'semaines 2 à 3',
      'semaines 3 à 4',
      '30 jours après',
    ]);
    for (const { phrase, livrable } of phases) {
      expect(phrase).toMatch(/^[^.!?]+[.!?]$/);
      expect(livrable.length).toBeGreaterThan(0);
    }
  });

  it('VIT2-05 · une autre offre change les durées de Construire et de Lancer, rien d autre', () => {
    const autre: OffreDeSite = { prixPlancherHt: 1800, semainesMin: 4, semainesMax: 6 };

    expect(phasesDeLaMethode(autre).map(({ duree }) => duree)).toEqual([
      'jours 1-2',
      'semaine 1',
      'semaines 2 à 4',
      'semaines 4 à 6',
      '30 jours après',
    ]);
  });

  it('VIT2-05 · les étapes affichées numérotent les cinq phases de 01 à 05, sans rien en perdre', () => {
    expect(etapesDeLaMethode()).toEqual(
      phasesDeLaMethode().map(({ titre, phrase, livrable, duree }, rang) => ({
        num: ['01', '02', '03', '04', '05'][rang],
        title: titre,
        desc: phrase,
        livrable,
        duree,
      })),
    );
  });

  it('VIT2-05 · inclus : démo en semaine 1, carnet de décisions, rapport de vérification, bilan à 30 jours, une phrase chacun', () => {
    expect(ENGAGEMENTS_INCLUS.map(({ titre }) => titre)).toEqual([
      'Une démo dès la semaine 1',
      'Un carnet de décisions',
      'Un rapport de vérification',
      'Un bilan à 30 jours',
    ]);
    for (const { phrase } of ENGAGEMENTS_INCLUS) {
      expect(phrase).toMatch(/^[^.!?]+[.!?]$/);
    }
  });

  it('VIT2-05 · la FAQ du délai cite toujours l offre et ne demande plus des textes fournis', () => {
    const delai = faqDuSite('fr')[1].reponse;

    expect(delai).toContain('en ligne en 3 à 4 semaines');
    expect(delai).not.toContain('textes et vos photos');
  });
});
