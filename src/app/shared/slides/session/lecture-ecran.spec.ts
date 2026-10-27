import {
  buildCoursContent,
  buildEcran,
  buildEcranQuestionnaire,
  buildEcranQuestionnaireSansConsigne,
  buildNumericQuestion,
  buildSpacedRappel,
  buildVoteQuestion,
} from '../../../../testing/factories/cours.factory';
import {
  buildDerouleCours,
  buildEcranDeroule,
  buildResultatsDeChaqueQuestion,
} from '../../../../testing/factories/formations.factory';
import {
  buildVisualNestedQuizSlide,
  buildVisualQuizSlide,
  buildVisualSlide,
} from '../../../../testing/factories/visual-slide.factory';
import { ecransDuPupitreB2_01 } from '../../../../testing/fixtures/instantane-b2-01';
import { ecransDuPupitreDe } from '../../../../testing/fixtures/instantane-de-cours';
import { INSTANTANES_DES_COURS_SERVIS } from '../../../../testing/fixtures/instantanes-des-cours';
import {
  deLaQuestion,
  ECRAN_VERROUILLE,
  ecranAuRang,
  ecranDIdentifiant,
  ecranDuRappel,
  ecransDesIdentifiants,
  enoncesDesActivites,
  enoncesDuDeroule,
  enteteDeQuestionnaire,
  identifiantPorte,
  identifiantsDesQuestions,
  identifiantsDuMontage,
  planDeMontage,
  PROPRIETES_PAR_BRIQUE,
  questionsDeLEcran,
  questionServie,
  titreDeLEcran,
} from './lecture-ecran';

describe('enonces des activites libres du cours B2-01', () => {
  const ecran = (suffixe: string) => {
    const trouve = ecransDuPupitreB2_01().find(({ id }) => id.endsWith(suffixe));
    if (trouve === undefined) {
      throw new Error(`écran ${suffixe} absent de l'instantané`);
    }
    return trouve;
  };

  it('lit les trois questions libres de la mission', () => {
    const enonces = enoncesDesActivites(ecran('A1-03-MISSION'));

    expect(enonces.size).toBe(3);
    expect(enonces.get('b2-01-a1-mission:mesure')).toMatch(/^Que mesure chaque chiffre\s\?$/);
  });

  it('lit la question d un ecran de reflexion', () => {
    const enonces = enoncesDesActivites(ecran('A1-08-QUESTION-DE-GESTION'));

    expect([...enonces.keys()]).toEqual(['b2-01-a1-question-gestion']);
    expect(enonces.get('b2-01-a1-question-gestion')).toContain('Hélène demande');
  });

  it('lit l invite de chaque etape d un exercice travaille non pilote', () => {
    const exercice = ecransDuPupitreB2_01().find(
      (candidat) => candidat.type === 'fp-worked' && candidat.donnees?.['pilote'] !== true,
    );
    if (exercice === undefined) {
      throw new Error('aucun exercice travaillé non piloté dans l instantané');
    }
    const enonces = enoncesDesActivites(exercice);

    expect(enonces.size).toBeGreaterThan(0);
    for (const cle of enonces.keys()) {
      expect(cle).toMatch(/^[^:]+:[^:]+$/);
    }
  });

  it('ne trouve aucune activite libre sur un ecran de vote', () => {
    const vote = ecransDuPupitreB2_01().find(({ type }) => type === 'fp-vote');

    expect(vote === undefined ? null : enoncesDesActivites(vote).size).toBe(0);
  });

  it('ignore une activite dont l identifiant ou l enonce n est pas un texte', () => {
    const activites = (type: string, donnees: Readonly<Record<string, unknown>>) =>
      enoncesDesActivites(buildEcran({ type, donnees })).size;
    const etapes = [{ id: 'etape-1', invite: 'Calculez la marge.' }];

    expect(activites('fp-challenge', { probleme: { id: 7, invite: 'Estimez.' } })).toBe(0);
    expect(activites('fp-challenge', { probleme: { id: 'defi-1', invite: 7 } })).toBe(0);
    expect(activites('fp-worked', { exemple: { id: 'exemple-1', etapes } })).toBe(1);
    expect(activites('fp-worked', { exemple: { id: 7, etapes } })).toBe(0);
  });
});

describe('enonces des defis de tous les cours servis', () => {
  const DEFIS = INSTANTANES_DES_COURS_SERVIS.flatMap(([, instantane]) =>
    ecransDuPupitreDe(instantane).filter(({ type }) => type === 'fp-challenge'),
  );

  it('sert des défis dans les cours servis', () => {
    expect(DEFIS.length).toBeGreaterThan(0);
  });

  for (const defi of DEFIS) {
    it(`${defi.id} : nomme la tentative du défi par l invite de son problème`, () => {
      const probleme = defi.donnees?.['probleme'] as {
        readonly id: string;
        readonly invite: string;
      };

      expect(probleme.invite.trim()).not.toBe('');
      expect([...enoncesDesActivites(defi)]).toEqual([[probleme.id, probleme.invite]]);
    });
  }
});

describe('QP-01 · ne compte pas l activité libre d un rappel sans délai, sur les écrans des cours servis', () => {
  const RAPPELS = INSTANTANES_DES_COURS_SERVIS.flatMap(([, instantane]) =>
    ecransDuPupitreDe(instantane).filter(({ type }) => type === 'fp-recall'),
  );

  it('sert des rappels dans les cours servis', () => {
    expect(RAPPELS.length).toBeGreaterThan(0);
  });

  for (const rappel of RAPPELS) {
    const question = rappel.donnees?.['question'] as { readonly id: string };
    const avecDelai = (delaiMs: unknown) => ({
      ...rappel,
      donnees: { ...rappel.donnees, delaiMs },
    });

    it(`${rappel.id} : aucune ligne « rappel » sans délai, où le poste n offre aucune saisie ; une ligne sinon`, () => {
      expect([...enoncesDesActivites(avecDelai(0)).keys()]).toEqual([]);
      expect([...enoncesDesActivites(avecDelai(8000)).keys()]).toEqual([`${question.id}:rappel`]);
      expect([...enoncesDesActivites(avecDelai(undefined)).keys()]).toEqual([
        `${question.id}:rappel`,
      ]);
    });
  }
});

describe('lecture de l ecran', () => {
  it('lit la question du QCM principal d un ecran servi en presentation v2, sans correction', () => {
    const ecran = buildVisualQuizSlide();

    expect(ecran.type).toBe('fp-story');
    expect(questionsDeLEcran(ecran)).toEqual([
      { id: 'b2-s03-prediction', enonce: 'Quelle échelle ?' },
    ]);
  });

  it('lit la question du quiz imbrique dans un autre rendu v2', () => {
    expect(questionsDeLEcran(buildVisualNestedQuizSlide())).toEqual([
      { id: 'b2-s07-repere', enonce: 'Que faut-il vérifier en premier ?' },
    ]);
  });

  it('ne trouve aucune question dans un ecran v2 d exposition', () => {
    expect(identifiantsDesQuestions(buildVisualSlide())).toEqual([]);
  });

  function quizV2(
    questionData: Readonly<Record<string, unknown>>,
  ): ReturnType<typeof buildVisualQuizSlide> {
    return buildVisualQuizSlide({
      donnees: {
        recit: {
          presentation: { version: 2, screenId: 'S', renderer: 'quiz', props: { questionData } },
        },
      },
    });
  }

  it('ignore un quiz v2 sans identifiant', () => {
    expect(questionsDeLEcran(quizV2({ question: 'Sans id ?' }))).toEqual([]);
  });

  it('donne un enonce vide a un quiz v2 dont la question n est pas un texte', () => {
    expect(questionsDeLEcran(quizV2({ id: 'Q-NOMBRE', question: 12 }))).toEqual([
      { id: 'Q-NOMBRE', enonce: '' },
    ]);
  });

  it('lit toujours les questions des briques d un questionnaire', () => {
    const ecran = buildEcranQuestionnaire();

    expect(identifiantsDesQuestions(ecran)).toEqual([
      buildNumericQuestion().id,
      buildVoteQuestion().id,
    ]);
    expect(planDeMontage(ecran)?.map((montage) => montage.brique)).toEqual([
      'fp-numeric',
      'fp-vote',
    ]);
  });

  it('R1 · signale a la brique que son ecran est resolu par un ecran suivant', () => {
    const plan = { intitule: 'Classez', cartes: [], categories: [] };
    const resolu = buildEcran({
      type: 'fp-cardsort',
      donnees: { plan },
      resoluPar: ['B2-01-A1-05-CORRECTION'],
    });

    expect(planDeMontage(resolu)?.[0].donnees).toEqual({ plan, resoluAilleurs: true });
    expect(
      planDeMontage(buildEcran({ type: 'fp-cardsort', donnees: { plan } }))?.[0].donnees,
    ).toEqual({ plan, resoluAilleurs: false });
    expect(PROPRIETES_PAR_BRIQUE['fp-cardsort']).toContain('resoluAilleurs');
  });

  it('refuse le plan de montage d une brique inconnue', () => {
    expect(planDeMontage(buildVisualSlide({ type: 'brique-inconnue' }))).toBeNull();
  });

  it('titre un ecran v2 par son titre, a defaut par sa question, sinon ne l invente pas', () => {
    expect(titreDeLEcran(buildVisualSlide())).toBe('Lire un chiffre');
    expect(titreDeLEcran(buildVisualQuizSlide())).toBe('Quelle échelle ?');
    expect(titreDeLEcran(buildEcranQuestionnaire())).toBeNull();
  });

  it('associe chaque question du deroule a son enonce, v2 comme brique', () => {
    const deroule = buildDerouleCours({
      ecrans: [
        buildEcranDeroule(buildVisualQuizSlide()),
        buildEcranDeroule({ type: 'fp-vote', donnees: { question: buildVoteQuestion() } }),
      ],
    });

    expect([...enoncesDuDeroule(deroule)]).toEqual([
      ['b2-s03-prediction', 'Quelle échelle ?'],
      [buildVoteQuestion().id, buildVoteQuestion().enonce],
    ]);
  });

  it('nomme aussi les questions que seul le déroulé sert, comme celles du rappel', () => {
    const deroule = buildDerouleCours({
      ecrans: [
        buildEcranDeroule({
          type: 'fp-spaced',
          donnees: { rappel: { id: 'rappel' } },
          questions: [
            { id: 'r-nature', enonce: 'Quelle est la nature de la suite ?', options: [] },
          ],
        }),
      ],
    });

    expect([...enoncesDuDeroule(deroule)]).toEqual([
      ['r-nature', 'Quelle est la nature de la suite ?'],
    ]);
  });
});

describe('table des proprietes par brique', () => {
  it('donne a chaque brique montable la liste des proprietes qu elle lit', () => {
    expect(PROPRIETES_PAR_BRIQUE['fp-vote']).toEqual(['question', 'questionJumelle']);
    expect(PROPRIETES_PAR_BRIQUE['fp-recall']).toEqual(['question', 'delaiMs', 'consigne']);
    expect(PROPRIETES_PAR_BRIQUE[ECRAN_VERROUILLE]).toBeUndefined();
    expect(PROPRIETES_PAR_BRIQUE['questionnaire']).toBeUndefined();
  });
});

describe('entete de questionnaire', () => {
  it('lit l intitule et la consigne d un questionnaire', () => {
    expect(enteteDeQuestionnaire(buildEcranQuestionnaire())).toEqual({
      intitule: 'Atelier 1 — Lire, rapporter, estimer',
      consigne: 'Répondez seul, sans calculatrice, dans l’ordre.',
    });
  });

  it('lit l intitule d un questionnaire sans consigne, que son intitule suffit a presenter', () => {
    expect(enteteDeQuestionnaire(buildEcranQuestionnaireSansConsigne())).toEqual({
      intitule: 'Atelier 1 — Lire, rapporter, estimer',
      consigne: null,
    });
  });

  it('ne rend rien pour un questionnaire a l entete mal formee', () => {
    const consigneNonTexte = buildEcranQuestionnaire({
      donnees: { intitule: 'Atelier 1', consigne: 3, questions: [] },
    });
    const intituleNonTexte = buildEcranQuestionnaire({
      donnees: { intitule: 3, consigne: 'Répondez.', questions: [] },
    });

    expect(enteteDeQuestionnaire(consigneNonTexte)).toBeNull();
    expect(enteteDeQuestionnaire(intituleNonTexte)).toBeNull();
  });

  it('ne rend rien pour un ecran qui n est pas un questionnaire', () => {
    expect(enteteDeQuestionnaire(buildVisualSlide())).toBeNull();
  });
});

describe('identifiants portes par un montage', () => {
  it('rend les identifiants des deux porteurs d un vote jumele', () => {
    const question = buildVoteQuestion();
    const jumelle = buildVoteQuestion({ id: 'Q-CAP-03-bis' });

    expect(
      identifiantsDuMontage({ brique: 'fp-vote', donnees: { question, questionJumelle: jumelle } }),
    ).toEqual([question.id, 'Q-CAP-03-bis']);
  });

  it('ignore un porteur absent, sans identifiant, ou dont l identifiant est vide', () => {
    expect(identifiantsDuMontage({ brique: 'fp-vote', donnees: {} })).toEqual([]);
    expect(
      identifiantsDuMontage({ brique: 'fp-numeric', donnees: { question: { enonce: 'X' } } }),
    ).toEqual([]);
    expect(
      identifiantsDuMontage({ brique: 'fp-numeric', donnees: { question: { id: '' } } }),
    ).toEqual([]);
  });

  it('L3 · identifie le cas professionnel pour reprendre le brouillon de ses reponses', () => {
    expect(
      identifiantsDuMontage({ brique: 'fp-pro', donnees: { cas: { id: 'B2-01-A1-03-MISSION' } } }),
    ).toEqual(['B2-01-A1-03-MISSION']);
  });

  it('ne rend aucun identifiant pour une brique sans porteur declare', () => {
    expect(
      identifiantsDuMontage({ brique: 'fp-story', donnees: { recit: { id: 'R-1' } } }),
    ).toEqual([]);
  });

  it('lit l identifiant non vide d un porteur, rien pour des donnees absentes ou un autre identifiant', () => {
    expect(identifiantPorte({ sondage: { id: 'J1' } }, 'sondage')).toBe('J1');
    expect(identifiantPorte(undefined, 'sondage')).toBeNull();
    expect(identifiantPorte({ sondage: 'J1' }, 'sondage')).toBeNull();
    expect(identifiantPorte({ sondage: { id: 7 } }, 'sondage')).toBeNull();
    expect(identifiantPorte({ sondage: { id: '' } }, 'sondage')).toBeNull();
  });
});

describe('carte des identifiants vers leur ecran', () => {
  it('associe chaque question et chaque porteur a l ecran qui le monte', () => {
    const cours = buildCoursContent({
      ecrans: [
        buildEcran({
          id: 'ecran-vote',
          type: 'fp-vote',
          donnees: { question: buildVoteQuestion({ id: 'Q-VOTE-SEUL' }) },
        }),
        buildEcranQuestionnaire({ id: 'ecran-questionnaire' }),
      ],
    });

    expect([...ecransDesIdentifiants(cours)]).toEqual([
      ['Q-VOTE-SEUL', 'ecran-vote'],
      [buildNumericQuestion().id, 'ecran-questionnaire'],
      [buildVoteQuestion().id, 'ecran-questionnaire'],
    ]);
  });

  it('garde le dernier ecran quand deux ecrans portent le meme identifiant', () => {
    const question = buildVoteQuestion();
    const cours = buildCoursContent({
      ecrans: [
        buildEcran({ id: 'ecran-a', type: 'fp-vote', donnees: { question } }),
        buildEcran({ id: 'ecran-b', type: 'fp-vote', donnees: { question } }),
      ],
    });

    expect(ecransDesIdentifiants(cours).get(question.id)).toBe('ecran-b');
  });

  it('rend une carte vide pour un cours sans brique identifiee', () => {
    expect(ecransDesIdentifiants(buildCoursContent({ ecrans: [] })).size).toBe(0);
  });
});

describe('ecran du rappel espace', () => {
  it('nomme le premier ecran fp-spaced du cours', () => {
    const cours = buildCoursContent({
      ecrans: [
        buildEcran({ id: 'ecran-vote', type: 'fp-vote' }),
        buildEcran({
          id: 'ecran-rappel',
          type: 'fp-spaced',
          donnees: { rappel: buildSpacedRappel() },
        }),
        buildEcran({ id: 'ecran-rappel-bis', type: 'fp-spaced' }),
      ],
    });

    expect(ecranDuRappel(cours)).toBe('ecran-rappel');
  });

  it('rend null quand le cours ne porte aucun rappel espace', () => {
    expect(ecranDuRappel(buildCoursContent())).toBeNull();
  });
});

describe('ecran designe par son identifiant', () => {
  for (const [prefixe, instantane] of INSTANTANES_DES_COURS_SERVIS) {
    it(`${prefixe} : rend chaque ecran du deroule par son identifiant, rien pour un identifiant absent`, () => {
      const ecrans = ecransDuPupitreDe(instantane);

      for (const ecran of ecrans) {
        expect(ecranDIdentifiant(ecrans, ecran.id)).withContext(ecran.id).toBe(ecran);
      }
      expect(ecranDIdentifiant(ecrans, `${prefixe}-absent`)).toBeUndefined();
      expect(ecranDIdentifiant(ecrans, undefined)).toBeUndefined();
    });
  }
});

describe('ecran au rang du deroule', () => {
  for (const [prefixe, instantane] of INSTANTANES_DES_COURS_SERVIS) {
    it(`${prefixe} : rend chaque ecran a son rang, rien au-dela du dernier ni sans deroule`, () => {
      const ecrans = ecransDuPupitreDe(instantane);

      ecrans.forEach((ecran, rang) => {
        expect(ecranAuRang({ ecrans }, rang)).withContext(ecran.id).toBe(ecran);
      });
      expect(ecranAuRang({ ecrans }, ecrans.length)).toBeUndefined();
      expect(ecranAuRang(null, 0)).toBeUndefined();
    });
  }
});

describe('resultat, corrige et question servie d un identifiant de question', () => {
  for (const [prefixe, instantane] of INSTANTANES_DES_COURS_SERVIS) {
    it(`${prefixe} : rend le resultat et le corrige de chaque question de l ecran, rien pour une autre`, () => {
      let lus = 0;
      for (const ecran of ecransDuPupitreDe(instantane)) {
        const { questions } = buildResultatsDeChaqueQuestion([ecran]);
        for (const resultat of questions) {
          expect(deLaQuestion(questions, resultat.questionId))
            .withContext(resultat.questionId)
            .toBe(resultat);
        }
        for (const corrige of ecran.corriges) {
          expect(deLaQuestion(ecran.corriges, corrige.questionId))
            .withContext(corrige.questionId)
            .toBe(corrige);
        }
        lus += questions.length + ecran.corriges.length;
        expect(deLaQuestion(questions, `${ecran.id}-absente`)).toBeUndefined();
        expect(deLaQuestion(questions, null)).toBeUndefined();
        expect(deLaQuestion(null, questions[0]?.questionId)).toBeUndefined();
      }
      expect(lus).toBeGreaterThan(0);
    });

    it(`${prefixe} : rend chaque question servie d un ecran par son identifiant, rien pour une autre`, () => {
      let lues = 0;
      for (const ecran of ecransDuPupitreDe(instantane)) {
        for (const question of ecran.questions) {
          expect(questionServie(ecran, question.id)).withContext(question.id).toBe(question);
          lues += 1;
        }
        expect(questionServie(ecran, `${ecran.id}-absente`)).toBeUndefined();
      }
      expect(lues).toBeGreaterThan(0);
    });
  }
});
