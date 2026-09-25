import {
  buildRevelationServie,
  buildSpacedQuestions,
} from '../../../../testing/factories/cours.factory';
import {
  buildResultatQuestion,
  buildSyntheseConcept,
} from '../../../../testing/factories/formations.factory';
import type { CorrigeEcranPresentateur } from '../../../../cours/content/types';
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
    revelation: null,
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

  function voteJumele(
    pilotage: DirectEcran['pilotage'],
    premierVote: Parameters<typeof buildResultatQuestion>[0] = {},
  ): DirectEcran {
    return direct({
      pilotage,
      resultats: [
        buildResultatQuestion({ questionId: 'Q-CAP-03', total: 20, ...premierVote }),
        buildResultatQuestion({ questionId: 'Q-CAP-03-bis', total: 18, parOption: { a: 18 } }),
      ],
    });
  }

  it('pose sur le vote la phase pilotee et les resultats de la question jumelle au revote', () => {
    const suivi = voteJumele({ phase: 'revote' });
    expect(pose('fp-vote', ['Q-CAP-03', 'Q-CAP-03-bis'], 'phase', { direct: suivi })).toBe(
      'revote',
    );
    expect(pose('fp-vote', ['Q-CAP-03', 'Q-CAP-03-bis'], 'resultats', { direct: suivi })).toEqual({
      total: 18,
      parOption: { a: 18 },
    });
  });

  it('RET-20 · pose sur le vote jumele les resultats du premier vote, quelle que soit la phase', () => {
    const revele = voteJumele({ phase: 'revele' }, { parOption: { b: 20 } });
    expect(
      pose('fp-vote', ['Q-CAP-03', 'Q-CAP-03-bis'], 'resultatsPremierVote', { direct: revele }),
    ).toEqual({ total: 20, parOption: { b: 20 } });
    expect(pose('fp-vote', ['Q-CAP-03'], 'resultatsPremierVote', { direct: revele })).toBeNull();
  });

  describe('ecranRevele : le presentateur ne recoit le corrige qu une fois la correction pilotee', () => {
    const cartes = ['K-CHARGES-01'];
    const PILOTAGES_REVELES = [
      { nom: 'revele', pilotage: { revele: true } },
      { nom: 'phase revele', pilotage: { phase: 'revele' as const } },
      { nom: 'etayage avance', pilotage: { etayage: 1 } },
    ];
    const PILOTAGES_MUETS = [
      { nom: 'sans direct', direct: null },
      { nom: 'pilotage vide', direct: direct() },
      { nom: 'revele faux', direct: direct({ pilotage: { revele: false } }) },
      { nom: 'phase discussion', direct: direct({ pilotage: { phase: 'discussion' } }) },
      { nom: 'etayage nul', direct: direct({ pilotage: { etayage: 0 } }) },
    ];

    for (const cas of PILOTAGES_REVELES) {
      it(`pose le corrige du formateur apres ${cas.nom}`, () => {
        expect(
          pose('fp-cardsort', cartes, 'corrige', {
            role: 'presentateur',
            direct: direct({ pilotage: cas.pilotage }),
          }),
        ).toBe(DONNEES_FORMATEUR);
      });
    }

    for (const cas of PILOTAGES_MUETS) {
      it(`ne pose aucun corrige au presentateur avec ${cas.nom}`, () => {
        expect(
          pose('fp-cardsort', cartes, 'corrige', { role: 'presentateur', direct: cas.direct }),
        ).toBeNull();
      });
    }

    it('ignore la correction servie a l ecran quand le role est presentateur', () => {
      expect(
        pose('fp-cardsort', cartes, 'corrige', {
          role: 'presentateur',
          revelation: buildRevelationServie({ questions: [], annexe: null }),
        }),
      ).toBeNull();
    });
  });

  describe('annexeVisible et annexeDeLaRevelation : l etudiant lit la revelation servie a l ecran', () => {
    const CORRIGE_ECRAN: CorrigeEcranPresentateur = {
      type: 'classement',
      attendus: [{ carteId: 'loyer', categorieId: 'fixe', justification: 'Montant stable' }],
      seuilReussite: 0.8,
    };

    it('ne pose aucun corrige a l etudiant tant que l ecran ne sert pas de correction', () => {
      expect(
        pose('fp-cardsort', ['K-CHARGES-01'], 'corrige', {
          direct: direct({ pilotage: { revele: true } }),
        }),
      ).toBeNull();
    });

    it('ne lit jamais les donnees du formateur pour l etudiant, meme apres la revelation', () => {
      expect(
        pose('fp-cardsort', ['K-CHARGES-01'], 'corrige', {
          direct: direct({ pilotage: { revele: true } }),
          revelation: buildRevelationServie({ questions: [], annexe: null }),
        }),
      ).toBeNull();
    });

    it('pose le corrige de l ecran tel quel quand la correction ne porte aucune question', () => {
      const revelation = buildRevelationServie({ questions: [], annexe: CORRIGE_ECRAN });
      expect(pose('fp-cardsort', ['K-CHARGES-01'], 'corrige', { revelation })).toBe(CORRIGE_ECRAN);
    });

    it('pose sur une question la bonne reponse et l option qui la porte', () => {
      expect(
        pose('fp-vote', ['Q-CAP-03'], 'corrige', { revelation: buildRevelationServie() }),
      ).toEqual({ type: 'cible', cible: '1 480,24 €', optionId: 'b' });
    });

    it('garde une option nulle quand la question corrigee n a pas d option', () => {
      const revelation = buildRevelationServie({
        questions: [{ questionId: 'Q-VA-07', cible: '1 124,86', optionId: null }],
      });
      expect(pose('fp-numeric', ['Q-VA-07'], 'corrige', { revelation })).toEqual({
        type: 'cible',
        cible: '1 124,86',
        optionId: null,
      });
    });

    it('ne pose rien sur une question que la correction ne vise pas', () => {
      expect(
        pose('fp-numeric', ['Q-AUTRE'], 'corrige', { revelation: buildRevelationServie() }),
      ).toBeNull();
    });

    it('pose sur le rappel la bonne reponse de sa question', () => {
      const revelation = buildRevelationServie({
        questions: [{ questionId: 'Q-RAPPEL-04', cible: 'Puissance', optionId: 'a' }],
      });
      expect(pose('fp-recall', ['Q-RAPPEL-04'], 'corrige', { revelation })).toEqual({
        type: 'cible',
        cible: 'Puissance',
        optionId: 'a',
      });
    });
  });

  describe('annexeDuMontage : un questionnaire corrige se decoupe par question affichee', () => {
    const revelation = buildRevelationServie({
      questions: [
        { questionId: 'Q-CAP-03', cible: '1 480,24 €', optionId: 'b' },
        { questionId: 'Q-CAP-03-bis', cible: '2 960,49 €', optionId: 'j-b' },
      ],
    });
    const jumeles = ['Q-CAP-03', 'Q-CAP-03-bis'];

    it('pose la bonne reponse de la question principale avant le revote', () => {
      expect(
        pose('fp-vote', jumeles, 'corrige', {
          revelation,
          direct: direct({ pilotage: { phase: 'discussion' } }),
        }),
      ).toEqual({ type: 'cible', cible: '1 480,24 €', optionId: 'b' });
    });

    for (const phase of ['revote', 'revele'] as const) {
      it(`pose la bonne reponse de la jumelle en phase ${phase}`, () => {
        expect(
          pose('fp-vote', jumeles, 'corrige', {
            revelation,
            direct: direct({ pilotage: { phase } }),
          }),
        ).toEqual({ type: 'cible', cible: '2 960,49 €', optionId: 'j-b' });
      });
    }

    const CIBLE_SANS_OPTION = { type: 'cible', cible: '1 124,86', optionId: null };
    const reponsesAuPresentateur: readonly (readonly [string, unknown, unknown])[] = [
      [
        'decoupe aussi les reponses du questionnaire servies au presentateur',
        { cible: '1 124,86', optionId: null },
        CIBLE_SANS_OPTION,
      ],
      ['ecarte une reponse du questionnaire sans cible textuelle', '1 124,86', null],
      [
        'ignore une option qui n est pas une chaine',
        { cible: '1 124,86', optionId: 7 },
        CIBLE_SANS_OPTION,
      ],
    ];

    for (const [cas, reponse, attendu] of reponsesAuPresentateur) {
      it(cas, () => {
        expect(
          pose('fp-numeric', ['Q-VA-07'], 'corrige', {
            role: 'presentateur',
            donneesFormateur: { type: 'reponses', reponses: { 'Q-VA-07': reponse } },
            direct: direct({ pilotage: { revele: true } }),
          }),
        ).toEqual(attendu);
      });
    }
  });

  it('ne pose le corrige que sur les briques qui le lisent', () => {
    const revele = direct({ pilotage: { revele: true } });
    for (const brique of ['fp-exit', 'fp-pro', 'fp-worked', 'fp-spaced', 'fp-pulse']) {
      expect(
        posesDeReinjection(
          montage(brique, ['Q-VA-07']),
          contexte({ role: 'presentateur', direct: revele, revelation: buildRevelationServie() }),
        ).map(([propriete]) => propriete),
      )
        .withContext(brique)
        .not.toContain('corrige');
    }
    for (const brique of [
      'fp-vote',
      'fp-numeric',
      'fp-recall',
      'fp-challenge',
      'fp-escape',
      'fp-sheet',
      'fp-table-build',
      'fp-cardsort',
    ]) {
      expect(
        posesDeReinjection(montage(brique, ['Q-VA-07']), contexte()).map(
          ([propriete]) => propriete,
        ),
      )
        .withContext(brique)
        .toContain('corrige');
    }
  });

  it('pose la cloture sur les seules questions revelables, d apres le pilotage', () => {
    const revele = direct({ pilotage: { revele: true } });
    for (const brique of ['fp-vote', 'fp-numeric', 'fp-recall', 'fp-exit']) {
      expect(pose(brique, ['Q-VA-07'], 'cloture', { direct: revele }))
        .withContext(brique)
        .toBeTrue();
      expect(pose(brique, ['Q-VA-07'], 'cloture', {}))
        .withContext(brique)
        .toBeFalse();
    }
    expect(pose('fp-sheet', ['Q-VA-07'], 'cloture', { direct: revele })).toBeUndefined();
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

  it('T9 · pose au rappel espacé de l étudiant les bonnes réponses révélées de ses questions', () => {
    const revelation = buildRevelationServie({
      questions: [{ questionId: 'Q-VAN-02', cible: 'Non', optionId: 'van-a' }],
    });

    expect(pose('fp-spaced', ['b2-01-rappel'], 'corrige', { revelation })).toEqual({
      type: 'reponses',
      reponses: { 'Q-VAN-02': { cible: 'Non', optionId: 'van-a' } },
    });
    expect(pose('fp-spaced', ['b2-01-rappel'], 'corrige', {})).toBeNull();
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

  for (const brique of ['fp-concept4', 'fp-plot']) {
    it(`RET-21 · pose les reglages pilotes sur ${brique} du formateur, jamais sur celle de l etudiant`, () => {
      const pilote = direct({ pilotage: { reglages: { n: 20 } } });
      expect(
        pose(brique, ['K-MACHINE'], 'reglages', { role: 'presentateur', direct: pilote }),
      ).toEqual({ n: 20 });
      expect(
        pose(brique, ['K-MACHINE'], 'reglages', { role: 'etudiant', direct: pilote }),
      ).toBeUndefined();
    });
  }

  it('F02 · pose sur le rappel des deux roles les options affichees par le formateur', () => {
    const pilote = direct({ pilotage: { optionsAffichees: true } });
    for (const role of ['presentateur', 'etudiant'] as const) {
      expect(pose('fp-recall', ['R-RAPPEL'], 'optionsAffichees', { role, direct: pilote }))
        .withContext(role)
        .toBeTrue();
    }
    expect(
      pose('fp-recall', ['R-RAPPEL'], 'optionsAffichees', { direct: direct({ pilotage: {} }) }),
    ).toBeFalse();
  });

  for (const brique of ['fp-worked', 'fp-sheet', 'fp-table-build']) {
    it(`pose l etayage pilote sur ${brique}`, () => {
      expect(
        pose(brique, ['E-CAP-01'], 'etayage', { direct: direct({ pilotage: { etayage: 2 } }) }),
      ).toBe(2);
    });
  }

  it('RET-23 · pose zero correction sur l exemple guide tant que le formateur n a rien revele', () => {
    expect(pose('fp-worked', ['E-CAP-01'], 'etayage', { direct: direct({ pilotage: {} }) })).toBe(
      0,
    );
    expect(pose('fp-worked', ['E-CAP-01'], 'etayage', {})).toBe(0);
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
  it('compare les listes element par element, par identite', () => {
    const verdict = { questionId: 'Q-1' };
    expect(memeValeur([verdict], [verdict])).toBeTrue();
    expect(memeValeur([verdict], [{ questionId: 'Q-1' }])).toBeFalse();
    expect(memeValeur([verdict], [verdict, verdict])).toBeFalse();
  });

  it('compare les objets en profondeur, y compris leurs listes imbriquees', () => {
    expect(memeValeur({ a: 1 }, { a: 1 })).toBeTrue();
    expect(memeValeur({ a: 1 }, { a: 2 })).toBeFalse();
    expect(
      memeValeur(
        { type: 'cible', cible: '1 480,24 €', optionId: 'b' },
        { type: 'cible', cible: '1 480,24 €', optionId: 'b' },
      ),
    ).toBeTrue();
    expect(
      memeValeur({ total: 3, parOption: { a: 2 } }, { total: 3, parOption: { a: 1 } }),
    ).toBeFalse();
    expect(memeValeur({ attendus: [{ cle: 'x' }] }, { attendus: [{ cle: 'x' }] })).toBeTrue();
    expect(memeValeur({ attendus: [{ cle: 'x' }] }, { attendus: [] })).toBeFalse();
  });

  it('juge egaux deux objets dont les cles arrivent dans un autre ordre', () => {
    expect(memeValeur({ a: 1, b: { c: 2, d: 3 } }, { b: { d: 3, c: 2 }, a: 1 })).toBeTrue();
    expect(memeValeur({ a: 1, b: 2 }, { a: 1, c: 2 })).toBeFalse();
    expect(memeValeur({ a: [1] }, { a: { 0: 1 } })).toBeFalse();
  });

  it('compare le reste par identite, sans confondre objet, liste et null', () => {
    expect(memeValeur(Number.NaN, Number.NaN)).toBeTrue();
    expect(memeValeur(0, -0)).toBeFalse();
    expect(memeValeur('revele', 'revele')).toBeTrue();
    expect(memeValeur(null, null)).toBeTrue();
    expect(memeValeur({}, null)).toBeFalse();
    expect(memeValeur({}, [])).toBeFalse();
    expect(memeValeur(null, {})).toBeFalse();
  });
});
