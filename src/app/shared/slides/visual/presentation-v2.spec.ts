import type { EcranContent } from '../../../../cours/content/types';
import {
  aUnePresentation,
  ecranSourceDe,
  presentationDe,
  RENDUS_DE_REVELATION,
} from './presentation-v2';

function ecran(presentation: unknown): EcranContent {
  return {
    id: 'B2-01-S03',
    type: 'fp-story',
    duree: 3,
    interactif: true,
    donnees: { recit: { id: 'B2-01-S03', presentation } },
  };
}

function presentation(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { version: 2, screenId: 'B2-01-S03', renderer: 'quiz', props: {}, ...overrides };
}

describe('aUnePresentation', () => {
  it('reconnaît une présentation v2 portée par n’importe quelle donnée de l’écran', () => {
    expect(aUnePresentation(ecran(presentation()))).toBeTrue();
  });

  it('refuse une autre version, un écran sans données et une présentation non objet', () => {
    expect(aUnePresentation(ecran(presentation({ version: 1 })))).toBeFalse();
    expect(aUnePresentation(ecran('présentation'))).toBeFalse();
    expect(aUnePresentation({ id: 'E', type: 'fp-vote', duree: 1, interactif: true })).toBeFalse();
  });
});

describe('presentationDe', () => {
  it('rend la présentation complète', () => {
    const attendue = presentation({ renderer: 'hero', props: { title: 'Lire un chiffre' } });

    expect(presentationDe(ecran(attendue))).toEqual(attendue as never);
  });

  it('CTR-03 · ne lit que les présentations dont le contrat sert le rendu', () => {
    const arbre = presentation({
      renderer: 'arbre',
      props: {
        title: 'Le paiement',
        branches: [{ evenement: 'M', probabilite: 0.35 }],
        description: 'Arbre pondéré à une génération.',
      },
    });
    const retirees = ['quiz', 'guide', 'answer-review', 'quote', 'cta', 'introuvable'].map(
      (renderer) => presentation({ renderer, props: { title: 'Lire un chiffre' } }),
    );

    expect(presentationDe(ecran(arbre))).toEqual(arbre as never);
    expect(retirees.map((retiree) => presentationDe(ecran(retiree)))).toEqual(
      retirees.map(() => null),
    );
  });

  it('refuse une présentation dont un champ manque ou change de type', () => {
    const incompletes = [
      presentation({ screenId: 12 }),
      presentation({ renderer: null }),
      presentation({ props: 'vide' }),
      presentation({ props: ['a'] }),
      { version: 2, screenId: 'S', renderer: 'quiz' },
    ];

    for (const incomplete of incompletes) {
      expect(presentationDe(ecran(incomplete)))
        .withContext(JSON.stringify(incomplete))
        .toBeNull();
    }
  });

  it('rend null pour un écran sans présentation', () => {
    expect(presentationDe({ id: 'E', type: 'fp-vote', duree: 1, interactif: true })).toBeNull();
  });
});

describe('ecranSourceDe et RENDUS_DE_REVELATION', () => {
  it('ne tient pour rendu de révélation que la revue du tri, seule servie par le contrat', () => {
    expect([...RENDUS_DE_REVELATION]).toEqual(['sort-review']);
  });

  it('lit l’écran source d’une correction, et rend null sans source ni identifiant textuel', () => {
    expect(ecranSourceDe({ screenId: 'B2-01-A1-05-ANATOMIE', sortId: 'K' })).toBe(
      'B2-01-A1-05-ANATOMIE',
    );
    for (const sans of [null, {}, { screenId: 12 }, { screenId: null }]) {
      expect(ecranSourceDe(sans)).withContext(JSON.stringify(sans)).toBeNull();
    }
  });
});
