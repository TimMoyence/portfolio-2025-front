import {
  buildEcranQuestionnaire,
  buildNumericQuestion,
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
import {
  enoncesDuDeroule,
  identifiantsDesQuestions,
  planDeMontage,
  questionsDeLEcran,
} from './lecture-ecran';

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

  it('refuse le plan de montage d une brique inconnue', () => {
    expect(planDeMontage(buildVisualSlide({ type: 'brique-inconnue' }))).toBeNull();
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
