import {
  buildFeuilleEvaluee,
  buildProgressionDesEnigmes,
  buildRevelationServie,
  buildSortiesMachine,
  buildSortiesMachineATrenteAns,
  buildSpacedQuestions,
  buildTableauEvalue,
  buildVerdictDeTentative,
} from '../../../../testing/factories/cours.factory';
import {
  buildResultatQuestion,
  buildSyntheseConcept,
} from '../../../../testing/factories/formations.factory';
import { ecransDuPupitreDe } from '../../../../testing/fixtures/instantane-de-cours';
import { INSTANTANES_DES_COURS_SERVIS } from '../../../../testing/fixtures/instantanes-des-cours';
import type { CorrigeEcranPresentateur } from '../../../../cours/content/types';
import { annexeFormateurDeLEcran } from '../../../features/cours/presentateur/annexe-formateur';
import type { RetourBrique } from '../../../core/ports/formations.port';
import type { DirectEcran } from './contrat-hote';
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
    papier: null,
    explications: [],
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

  it('pose sur le vote la phase pilotee', () => {
    const suivi = voteJumele({ phase: 'question-2', questionAffichee: 'Q-CAP-03-bis' });
    expect(pose('fp-vote', ['Q-CAP-03', 'Q-CAP-03-bis'], 'phase', { direct: suivi })).toBe(
      'question-2',
    );
  });

  it('F-29 · pose sur le vote la question que le back sert, sans la deduire de la phase', () => {
    const identifiants = ['Q-CAP-03', 'Q-CAP-03-bis'];
    const servie = (pilotage: DirectEcran['pilotage'] | null): unknown =>
      pose('fp-vote', identifiants, 'questionAffichee', {
        direct: pilotage === null ? null : voteJumele(pilotage),
      });

    expect(servie({ phase: 'question-2', questionAffichee: 'Q-CAP-03' })).toBe('Q-CAP-03');
    expect(servie({ phase: 'question-1', questionAffichee: 'Q-CAP-03-bis' })).toBe('Q-CAP-03-bis');
    expect(servie(null)).toBe('Q-CAP-03');
  });

  it('QA-01 · pose sur le vote la phase que le serveur sert, sans en deduire une de la revelation ni en supposer une', () => {
    const identifiants = ['Q-CAP-03', 'Q-CAP-03-bis'];
    const phaseServie = (pilotage: DirectEcran['pilotage'] | null): unknown =>
      pose('fp-vote', identifiants, 'phase', {
        direct: pilotage === null ? null : direct({ pilotage }),
      });

    expect(phaseServie({ phase: 'question-1', revele: true })).toBe('question-1');
    expect(phaseServie({ revele: true })).toBeNull();
    expect(phaseServie({})).toBeNull();
    expect(phaseServie(null)).toBeNull();
  });

  it('M3 · pose les resultats de chaque question du vote, quelle que soit la question affichee', () => {
    const identifiants = ['Q-CAP-03', 'Q-CAP-03-bis'];
    for (const questionAffichee of identifiants) {
      const suivi = voteJumele({ questionAffichee, revele: true }, { parOption: { b: 20 } });

      expect(pose('fp-vote', identifiants, 'resultats', { direct: suivi })).toEqual({
        total: 20,
        parOption: { b: 20 },
      });
      expect(pose('fp-vote', identifiants, 'resultatsJumelle', { direct: suivi })).toEqual({
        total: 18,
        parOption: { a: 18 },
      });
    }
    expect(
      pose('fp-vote', ['Q-CAP-03'], 'resultatsJumelle', { direct: voteJumele({ revele: true }) }),
    ).toBeNull();
  });

  it('M3 · confie au vote les reponses de ses deux questions, sans les reduire a la question affichee', () => {
    const reponses = {
      type: 'reponses',
      reponses: {
        'Q-CAP-03': { cible: '1 480,24 €', optionId: 'b' },
        'Q-CAP-03-bis': { cible: '2 960,49 €', optionId: 'j-b' },
      },
    };

    expect(
      pose('fp-vote', ['Q-CAP-03', 'Q-CAP-03-bis'], 'corrige', {
        role: 'presentateur',
        donneesFormateur: reponses,
        direct: voteJumele({ questionAffichee: 'Q-CAP-03-bis', revele: true }),
      }),
    ).toEqual(reponses);
  });

  describe('ecranRevele : le presentateur ne recoit le corrige qu une fois la correction pilotee', () => {
    const cartes = ['K-CHARGES-01'];
    const PILOTAGES_REVELES = [
      { nom: 'revele', pilotage: { revele: true } },
      { nom: 'etayage avance', pilotage: { etayage: 1 } },
    ];
    const PILOTAGES_MUETS = [
      { nom: 'sans direct', direct: null },
      { nom: 'pilotage vide', direct: direct() },
      { nom: 'revele faux', direct: direct({ pilotage: { revele: false } }) },
      { nom: 'question 2 sans revele', direct: direct({ pilotage: { phase: 'question-2' } }) },
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

    it('pose le corrige du formateur sur papier, sans correction pilotee', () => {
      expect(
        pose('fp-cardsort', cartes, 'corrige', { role: 'presentateur', papier: { questions: [] } }),
      ).toBe(DONNEES_FORMATEUR);
    });

    it('ne pose aucun corrige a l etudiant sur papier', () => {
      expect(pose('fp-cardsort', cartes, 'corrige', { papier: { questions: [] } })).toBeNull();
    });

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
        pose('fp-numeric', ['Q-CAP-03'], 'corrige', { revelation: buildRevelationServie() }),
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

  describe('M3 · le vote revele recoit la bonne option de chacune de ses questions', () => {
    const votes = INSTANTANES_DES_COURS_SERVIS.flatMap(([, instantane]) =>
      ecransDuPupitreDe(instantane),
    ).filter(({ type, questions }) => type === 'fp-vote' && questions.length === 2);

    it('couvre les votes a deux questions de tous les cours servis', () => {
      expect(votes.length).toBeGreaterThan(0);
    });

    for (const ecran of votes) {
      it(`pose sur ${ecran.id} la bonne option de ses deux questions, sans prose`, () => {
        const identifiants = ecran.questions.map(({ id }) => id);
        const options = ecran.questions.map(
          (question) =>
            question.options?.find(
              ({ libelle }) =>
                libelle ===
                ecran.corriges.find(({ questionId }) => questionId === question.id)?.bonneReponse,
            )?.id,
        );

        expect(options.every((option) => option !== undefined))
          .withContext('option juste du corrigé')
          .toBeTrue();
        const corrige = pose('fp-vote', identifiants, 'corrige', {
          role: 'presentateur',
          donneesFormateur: annexeFormateurDeLEcran(ecran),
          direct: direct({ pilotage: { revele: true, questionAffichee: identifiants[0] } }),
        }) as { reponses: Readonly<Record<string, { optionId: string }>> };

        expect(identifiants.map((id) => corrige.reponses[id].optionId)).toEqual(
          options as string[],
        );
      });
    }
  });

  describe('annexeDuMontage : un questionnaire corrige se decoupe par question affichee', () => {
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
    for (const brique of ['fp-pro', 'fp-worked', 'fp-spaced', 'fp-pulse']) {
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

  it('pose la cloture sur les seules questions revelables, d apres la saisie fermee servie', () => {
    const fermee = direct({ pilotage: { saisieFermee: true } });
    const reveleSansFermeture = direct({ pilotage: { revele: true } });
    for (const brique of ['fp-vote', 'fp-numeric', 'fp-recall', 'fp-spaced']) {
      expect(pose(brique, ['Q-VA-07'], 'cloture', { direct: fermee }))
        .withContext(brique)
        .toBeTrue();
      expect(pose(brique, ['Q-VA-07'], 'cloture', { direct: reveleSansFermeture }))
        .withContext(brique)
        .toBeFalse();
      expect(pose(brique, ['Q-VA-07'], 'cloture', {}))
        .withContext(brique)
        .toBeFalse();
    }
    expect(pose('fp-sheet', ['Q-VA-07'], 'cloture', { direct: fermee })).toBeUndefined();
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

  it('pose sur papier au rappel toute la banque de l écran, faute de tirage en séance', () => {
    const papier = {
      questions: [
        {
          id: 'Q-VAN-02',
          enonce: 'Un projet à VAN négative doit-il être retenu ?',
          options: [{ id: 'van-a', libelle: 'Non' }],
        },
        { id: 'Q-LIBRE', enonce: 'Question sans options', options: null },
      ],
    };

    expect(pose('fp-spaced', ['b2-01-rappel'], 'questions', { papier })).toEqual([
      {
        questionId: 'Q-VAN-02',
        concept: '',
        boite: 1,
        cours: '',
        enonce: 'Un projet à VAN négative doit-il être retenu ?',
        options: [{ id: 'van-a', libelle: 'Non' }],
      },
      {
        questionId: 'Q-LIBRE',
        concept: '',
        boite: 1,
        cours: '',
        enonce: 'Question sans options',
        options: [],
      },
    ]);
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
      ...buildProgressionDesEnigmes({
        resolues: [],
        tentativesRestantes: {},
        etats: {
          seuil: { etat: 'ouverte', tentativesRestantes: 10 },
          marge: { etat: 'verrouillee', tentativesRestantes: 10 },
          tva: { etat: 'verrouillee', tentativesRestantes: 10 },
        },
        enigmeOuverte: 'seuil',
      }),
    };
    const tentative: RetourBrique = {
      kind: 'tentative',
      ...buildVerdictDeTentative({ correcte: false, fragment: null, tentativesRestantes: 9 }),
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

  it('F-37 · pose sur la machine du formateur les sorties projetees, sur celle de l etudiant sa derniere evaluation', () => {
    const projetees = buildSortiesMachine({ valeurs: { C: 1000, i: 4, n: 20 } });
    const pilote = direct({ pilotage: { reglages: { n: 20 }, sortiesProjetees: projetees } });
    const derniere = buildSortiesMachineATrenteAns();
    const retours: RetourBrique[] = [
      { kind: 'machine-evaluee', sorties: buildSortiesMachine() },
      { kind: 'machine-evaluee', sorties: derniere },
    ];

    expect(
      pose('fp-concept4', ['K-MACHINE'], 'evaluee', { role: 'presentateur', direct: pilote }),
    ).toBe(projetees);
    expect(pose('fp-concept4', ['K-MACHINE'], 'evaluee', { role: 'presentateur' })).toBeNull();
    expect(pose('fp-concept4', ['K-MACHINE'], 'evaluee', { direct: pilote, retours })).toBe(
      derniere,
    );
    expect(pose('fp-concept4', ['K-MACHINE'], 'evaluee', { direct: pilote })).toBeNull();
    expect(pose('fp-plot', ['K-MACHINE'], 'evaluee', { retours })).toBeUndefined();
  });

  it('F-36 · pose sur la feuille de l etudiant la derniere evaluation servie pour son plan, rien sur celle du formateur', () => {
    const evaluationDe = (planId: string, rang: number): RetourBrique => ({
      kind: 'feuille-evaluee',
      planId,
      rang,
      evaluee: buildFeuilleEvaluee(),
    });
    const derniere = evaluationDe('K-TABLEUR-01', 2);
    const retours = [evaluationDe('K-TABLEUR-01', 1), derniere, evaluationDe('K-TABLEUR-02', 3)];

    expect(pose('fp-sheet', ['K-TABLEUR-01'], 'evaluation', { retours })).toBe(derniere);
    expect(pose('fp-sheet', ['K-TABLEUR-01'], 'evaluation', {})).toBeNull();
    expect(
      pose('fp-sheet', ['K-TABLEUR-01'], 'evaluation', { role: 'presentateur', retours }),
    ).toBeNull();
    expect(pose('fp-table-build', ['K-TABLEUR-01'], 'evaluation', { retours })).toBeNull();
  });

  it('F-37 · pose sur le tableau de l etudiant la derniere evaluation servie pour son plan, rien sur celui du formateur', () => {
    const evaluationDe = (planId: string, rang: number): RetourBrique => ({
      kind: 'tableau-evalue',
      planId,
      rang,
      evalue: buildTableauEvalue(),
    });
    const derniere = evaluationDe('b2-01-a4-indice-toile', 2);
    const retours = [
      evaluationDe('b2-01-a4-indice-toile', 1),
      derniere,
      evaluationDe('b2-02-a2-ecarts-point-moyen', 3),
    ];

    expect(pose('fp-table-build', ['b2-01-a4-indice-toile'], 'evaluation', { retours })).toBe(
      derniere,
    );
    expect(pose('fp-table-build', ['b2-01-a4-indice-toile'], 'evaluation', {})).toBeNull();
    expect(
      pose('fp-table-build', ['b2-01-a4-indice-toile'], 'evaluation', {
        role: 'presentateur',
        retours,
      }),
    ).toBeNull();
    expect(pose('fp-sheet', ['b2-01-a4-indice-toile'], 'evaluation', { retours })).toBeNull();
  });

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

  describe('correction sur place : chaque question se corrige sur l écran de l exercice', () => {
    const PREMIERE = { reference: 'Q-VA-07', texte: '1 200 × 1,05 = 1 260 €.' };
    const REPONSES = {
      type: 'reponses',
      reponses: {
        'Q-VA-07': { cible: '1260', optionId: null },
        'Q-VA-08': { cible: '5 %', optionId: 'b' },
      },
    };
    const PUPITRE = {
      role: 'presentateur' as const,
      donneesFormateur: REPONSES,
      direct: direct({ pilotage: { explicationsDevoilees: 1 } }),
    };

    it('S-02 · clôt la question corrigée et lui pose son explication, sans toucher la suivante', () => {
      expect(pose('fp-numeric', ['Q-VA-07'], 'cloture', { explications: [PREMIERE] })).toBeTrue();
      expect(pose('fp-numeric', ['Q-VA-07'], 'explications', { explications: [PREMIERE] })).toEqual(
        [PREMIERE],
      );
      expect(pose('fp-vote', ['Q-VA-08'], 'cloture', {})).toBeFalse();
      expect(pose('fp-vote', ['Q-VA-08'], 'explications', {})).toEqual([]);
    });

    it('S-02 · donne au pupitre la bonne réponse de la seule question corrigée', () => {
      expect(
        pose('fp-numeric', ['Q-VA-07'], 'corrige', { ...PUPITRE, explications: [PREMIERE] }),
      ).toEqual({ type: 'cible', cible: '1260', optionId: null });
      expect(pose('fp-vote', ['Q-VA-08'], 'corrige', PUPITRE)).toBeNull();
    });
  });

  it('S-01 · garde figée chez l étudiant l étape déjà corrigée, même quand le formateur la masque', () => {
    const masquee = direct({ pilotage: { etayage: 0, etayageAtteint: 2 } });

    expect(pose('fp-worked', ['E-CAP-01'], 'etayage', { direct: masquee })).toBe(2);
    expect(
      pose('fp-worked', ['E-CAP-01'], 'etayage', { direct: masquee, role: 'presentateur' }),
    ).toBe(0);
  });

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
