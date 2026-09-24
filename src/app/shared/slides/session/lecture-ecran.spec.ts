import {
  buildCoursContent,
  buildEcran,
  buildEcranQuestionnaire,
  buildNumericQuestion,
  buildSpacedRappel,
  buildVoteQuestion,
} from '../../../../testing/factories/cours.factory';
import {
  buildDerouleCours,
  buildEcranDeroule,
} from '../../../../testing/factories/formations.factory';
import {
  buildVisualNestedQuizSlide,
  buildVisualQuizSlide,
  buildVisualSlide,
} from '../../../../testing/factories/visual-slide.factory';
import { ecransDuPupitreB2_01 } from '../../../../testing/fixtures/instantane-b2-01';
import {
  ECRAN_VERROUILLE,
  ecranDuRappel,
  ecransDesIdentifiants,
  enoncesDesActivites,
  enoncesDuDeroule,
  enteteDeQuestionnaire,
  identifiantsDesQuestions,
  identifiantsDuMontage,
  planDeMontage,
  PROPRIETES_PAR_BRIQUE,
  questionsDeLEcran,
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
    expect(enonces.get('b2-01-a1-mission:mesure')).toBe('Que mesure chaque chiffre ?');
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

  it('lit la question du billet de sortie', () => {
    const enonces = enoncesDesActivites(ecran('BILLET-DE-SORTIE'));

    expect(enonces.get('b2-01-a6-billet')).toContain('Le comité ne retiendra');
  });

  it('ne trouve aucune activite libre sur un ecran de vote', () => {
    const vote = ecransDuPupitreB2_01().find(({ type }) => type === 'fp-vote');

    expect(vote === undefined ? null : enoncesDesActivites(vote).size).toBe(0);
  });
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

  it('ignore un quiz v2 sans identifiant', () => {
    const ecran = buildVisualQuizSlide({
      donnees: {
        recit: {
          presentation: {
            version: 2,
            screenId: 'S',
            renderer: 'quiz',
            props: { questionData: { question: 'Sans id ?' } },
          },
        },
      },
    });

    expect(questionsDeLEcran(ecran)).toEqual([]);
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

  it('ne rend rien pour un questionnaire sans entete complete', () => {
    const sansConsigne = buildEcranQuestionnaire({
      donnees: { intitule: 'Atelier 1', questions: [] },
    });
    const intituleNonTexte = buildEcranQuestionnaire({
      donnees: { intitule: 3, consigne: 'Répondez.', questions: [] },
    });

    expect(enteteDeQuestionnaire(sansConsigne)).toBeNull();
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
