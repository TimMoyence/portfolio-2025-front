import { buildSpacedQuestions } from '../../../../testing/factories/cours.factory';
import {
  buildResultatQuestion,
  buildSyntheseConcept,
} from '../../../../testing/factories/formations.factory';
import type { DirectEcran, RetourBrique } from './contrat-hote';
import {
  type ContexteDeReinjection,
  memeValeur,
  type MontageIdentifie,
  posesDeReinjection,
} from './reinjection';

const DONNEES_FORMATEUR = { type: 'classement', attendus: [] };

function montage(brique: string, identifiants: readonly string[]): MontageIdentifie {
  return { brique, donnees: {}, identifiants };
}

function contexte(overrides: Partial<ContexteDeReinjection> = {}): ContexteDeReinjection {
  return {
    retours: [],
    direct: null,
    render: 'hand',
    role: 'etudiant',
    donneesFormateur: DONNEES_FORMATEUR,
    maitrise: null,
    dernierEmetteur: false,
    ...overrides,
  };
}

function direct(overrides: Partial<DirectEcran> = {}): DirectEcran {
  return { pilotage: {}, resultats: null, comptesJalon: null, ...overrides };
}

function pose(
  brique: string,
  identifiants: readonly string[],
  propriete: string,
  surcharges: Partial<ContexteDeReinjection> = {},
): unknown {
  return new Map(posesDeReinjection(montage(brique, identifiants), contexte(surcharges))).get(
    propriete,
  );
}

const VERDICT_JUSTE: RetourBrique = {
  kind: 'verdict-reponse',
  questionId: 'Q-VA-07',
  correcte: true,
  libelleConfusion: null,
};

describe('posesDeReinjection : retours du serveur poses sur une brique deja montee (F6)', () => {
  it('pose sur une question simple le dernier verdict qui la vise, et seulement celui-la', () => {
    const autre: RetourBrique = { ...VERDICT_JUSTE, questionId: 'Q-AUTRE' };
    expect(pose('fp-numeric', ['Q-VA-07'], 'verdict', { retours: [VERDICT_JUSTE, autre] })).toEqual(
      VERDICT_JUSTE,
    );
    expect(pose('fp-numeric', ['Q-VA-07'], 'verdict', { retours: [autre] })).toBeNull();
  });

  it('pose sur le vote la phase pilotee et les resultats de la question jumelle au revote', () => {
    const suivi = direct({
      pilotage: { phase: 'revote' },
      resultats: [
        buildResultatQuestion({ questionId: 'Q-CAP-03', total: 20 }),
        buildResultatQuestion({ questionId: 'Q-CAP-03-bis', total: 18, parOption: { a: 18 } }),
      ],
    });
    expect(pose('fp-vote', ['Q-CAP-03', 'Q-CAP-03-bis'], 'phase', { direct: suivi })).toBe(
      'revote',
    );
    expect(pose('fp-vote', ['Q-CAP-03', 'Q-CAP-03-bis'], 'resultats', { direct: suivi })).toEqual({
      total: 18,
      parOption: { a: 18 },
    });
  });

  it('ne donne les donnees du formateur qu au pupitre, et en projection qu apres la revelation', () => {
    const cartes = ['K-CHARGES-01'];
    expect(
      pose('fp-cardsort', cartes, 'corrige', { role: 'etudiant', render: 'board' }),
    ).toBeNull();
    expect(pose('fp-cardsort', cartes, 'corrige', { role: 'presentateur', render: 'board' })).toBe(
      DONNEES_FORMATEUR,
    );
    expect(
      pose('fp-cardsort', cartes, 'corrige', { role: 'presentateur', render: 'stage' }),
    ).toBeNull();
    expect(
      pose('fp-cardsort', cartes, 'corrige', {
        role: 'presentateur',
        render: 'stage',
        direct: direct({ pilotage: { revele: true } }),
      }),
    ).toBe(DONNEES_FORMATEUR);
    expect(
      posesDeReinjection(
        montage('fp-numeric', ['Q-VA-07']),
        contexte({ role: 'presentateur', render: 'board' }),
      ).map(([propriete]) => propriete),
    )
      .withContext('une brique qui ne lit pas les donnees du formateur ne les recoit pas')
      .not.toContain('corrige');
  });

  it('sert au rappel espace les questions dues, leurs verdicts et la maitrise au seul pupitre', () => {
    const questions = buildSpacedQuestions();
    const verdict: RetourBrique = { ...VERDICT_JUSTE, questionId: questions[0].questionId };
    const retours: RetourBrique[] = [{ kind: 'rappels', questions }, verdict, VERDICT_JUSTE];
    const maitrise = [buildSyntheseConcept()];

    expect(pose('fp-spaced', ['b2-01-rappel'], 'questions', { retours })).toBe(questions);
    expect(pose('fp-spaced', ['b2-01-rappel'], 'verdicts', { retours })).toEqual([verdict]);
    expect(pose('fp-spaced', ['b2-01-rappel'], 'maitrise', { retours, maitrise })).toBeNull();
    expect(
      pose('fp-spaced', ['b2-01-rappel'], 'maitrise', { retours, maitrise, role: 'presentateur' }),
    ).toBe(maitrise);
  });

  it('pose sur le coffre la progression reprise et les tentatives de son parcours', () => {
    const progression: RetourBrique = {
      kind: 'progression-enigmes',
      parcoursId: 'K-EVASION-01',
      resolues: [],
      tentativesRestantes: {},
    };
    const tentative: RetourBrique = {
      kind: 'tentative',
      parcoursId: 'K-EVASION-01',
      enigmeId: 'seuil',
      correcte: false,
      fragment: null,
      tentativesRestantes: 9,
    };
    const etrangere: RetourBrique = { ...tentative, parcoursId: 'K-AUTRE' };
    const retours = [progression, tentative, etrangere];
    expect(pose('fp-escape', ['K-EVASION-01'], 'progression', { retours })).toBe(progression);
    expect(pose('fp-escape', ['K-EVASION-01'], 'tentatives', { retours })).toEqual([tentative]);
  });

  it('pose sur le defi les strategies servies et l etat de revelation', () => {
    const strategies = [{ id: 'capitaliser', libelle: 'Capitaliser annee par annee' }];
    const retours: RetourBrique[] = [{ kind: 'strategies', defiId: 'D-DEFI-07', strategies }];
    expect(pose('fp-challenge', ['D-DEFI-07'], 'strategies', { retours })).toBe(strategies);
    expect(
      pose('fp-challenge', ['D-DEFI-07'], 'revele', {
        direct: direct({ pilotage: { revele: true } }),
      }),
    ).toBeTrue();
  });

  it('pose l etayage pilote sur l exemple guide et les comptes agreges sur le jalon', () => {
    const comptes = { perdu: 1, 'ca-va': 4, clair: 3, total: 8 };
    expect(
      pose('fp-worked', ['E-CAP-01'], 'etayage', { direct: direct({ pilotage: { etayage: 2 } }) }),
    ).toBe(2);
    expect(
      pose('fp-pulse', ['P-PULSE-01'], 'comptes', { direct: direct({ comptesJalon: comptes }) }),
    ).toBe(comptes);
  });

  it('marque deja repondu la brique visee et ne montre un refus qu a la brique qui a emis', () => {
    const retours: RetourBrique[] = [
      { kind: 'deja-repondu', questionId: 'Q-VA-07' },
      { kind: 'refus', motif: 'ecran-non-servi', message: 'Cet écran n’est pas encore ouvert' },
    ];
    expect(pose('fp-numeric', ['Q-VA-07'], 'dejaRepondu', { retours })).toBeTrue();
    expect(pose('fp-numeric', ['Q-AUTRE'], 'dejaRepondu', { retours })).toBeFalse();
    expect(pose('fp-numeric', ['Q-VA-07'], 'erreur', { retours })).toBeNull();
    expect(pose('fp-numeric', ['Q-VA-07'], 'erreur', { retours, dernierEmetteur: true })).toBe(
      'Cet écran n’est pas encore ouvert',
    );
  });
});

describe('memeValeur', () => {
  it('compare les listes element par element et le reste par identite', () => {
    const verdict = { questionId: 'Q-1' };
    expect(memeValeur([verdict], [verdict])).toBeTrue();
    expect(memeValeur([verdict], [{ questionId: 'Q-1' }])).toBeFalse();
    expect(memeValeur([verdict], [verdict, verdict])).toBeFalse();
    expect(memeValeur(Number.NaN, Number.NaN)).toBeTrue();
    expect(memeValeur({ a: 1 }, { a: 1 })).toBeFalse();
  });
});
