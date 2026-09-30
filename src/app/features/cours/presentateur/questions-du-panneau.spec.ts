import { INSTANTANE_B2_04 } from '../../../../testing/fixtures/instantane-b2-04';
import { ecransDuPupitreDe } from '../../../../testing/fixtures/instantane-de-cours';
import { questionsDuPanneau } from './questions-du-panneau';

describe('questionsDuPanneau', () => {
  it('QF-25 · donne au pupitre l énoncé servi de chaque question de rappel, jamais son identifiant', () => {
    const rappel = ecransDuPupitreDe(INSTANTANE_B2_04).find(({ type }) => type === 'fp-spaced');
    if (rappel === undefined) {
      fail('écran de rappel absent du B2-04');
      return;
    }

    const questions = questionsDuPanneau(rappel);

    expect(questions.length).toBeGreaterThan(0);
    expect(questions.filter(({ enonce }) => enonce === '').map(({ corrige }) => corrige.questionId))
      .withContext('questions sans énoncé')
      .toEqual([]);
    expect(questions[0].enonce).toBe(
      rappel.questions.find(({ id }) => id === questions[0].corrige.questionId)?.enonce ?? '',
    );
  });
});
