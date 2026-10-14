import { buildEcranDeroule } from '../../../../testing/factories/formations.factory';
import { ecransDuPupitreDe } from '../../../../testing/fixtures/instantane-de-cours';
import { INSTANTANES_DES_COURS_SERVIS } from '../../../../testing/fixtures/instantanes-des-cours';
import { correctionsAffichees } from './corrections-affichees';

describe('correctionsAffichees', () => {
  it('R1 · met en bandeau la réponse attendue d un écran porteur d un corrigé', () => {
    expect(correctionsAffichees(buildEcranDeroule({ type: 'vote' })).length).toBeGreaterThan(0);
  });

  it('RET-32 · laisse au questionnaire sa correction sous chaque question, sans bandeau', () => {
    expect(correctionsAffichees(buildEcranDeroule({ type: 'questionnaire' }))).toEqual([]);
  });

  it('D-05 · projette chaque bonne réponse servie par les cours telle que le back l écrit', () => {
    const corriges = INSTANTANES_DES_COURS_SERVIS.flatMap(([, instantane]) =>
      ecransDuPupitreDe(instantane).flatMap((ecran) => ecran.corriges),
    );

    expect(
      correctionsAffichees(buildEcranDeroule({ corriges })).map(({ bonneReponse }) => bonneReponse),
    ).toEqual(corriges.map(({ bonneReponse }) => bonneReponse));
  });
});
