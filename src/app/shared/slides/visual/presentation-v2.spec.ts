import type { EcranContent } from '../../../../cours/content/types';
import {
  aUnePresentation,
  objet,
  presentationDe,
  quizImbrique,
  quizPrincipal,
} from './presentation-v2';

const QUESTION = { id: 'b2-s3-quiz', type: 'quiz', question: 'Quelle échelle vérifier ?' };

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

describe('objet', () => {
  it('rend l’objet lui-même et rejette tableau, null et primitives', () => {
    const valeur = { a: 1 };

    expect(objet(valeur)).toBe(valeur);
    for (const refuse of [null, undefined, [], ['a'], 'texte', 3, true]) {
      expect(objet(refuse)).toBeNull();
    }
  });
});

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
    const attendue = presentation({ props: { title: 'Lire un chiffre' } });

    expect(presentationDe(ecran(attendue))).toEqual(attendue as never);
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

describe('quizPrincipal et quizImbrique', () => {
  it('lit le quiz principal d’un rendu quiz', () => {
    const vue = presentationDe(ecran(presentation({ props: { questionData: QUESTION } })));

    expect(quizPrincipal(vue)).toEqual(QUESTION);
  });

  it('ne lit aucun quiz principal quand le rendu n’est pas un quiz', () => {
    const vue = presentationDe(
      ecran(presentation({ renderer: 'hero', props: { questionData: QUESTION } })),
    );

    expect(quizPrincipal(vue)).toBeNull();
  });

  it('lit le quiz imbriqué quel que soit le rendu, et rend null quand il n’y en a pas', () => {
    const avec = presentationDe(
      ecran(presentation({ renderer: 'chart', props: { nestedQuiz: QUESTION } })),
    );
    const sans = presentationDe(ecran(presentation({ renderer: 'chart' })));

    expect(quizImbrique(avec)).toEqual(QUESTION);
    expect(quizImbrique(sans)).toBeNull();
  });

  it('rend null sur une présentation absente, sans lever', () => {
    expect(quizPrincipal(null)).toBeNull();
    expect(quizImbrique(null)).toBeNull();
  });
});
