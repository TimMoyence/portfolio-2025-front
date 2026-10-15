import { buildEcranDeroule } from '../../../../testing/factories/formations.factory';
import { ecransDuPupitreDe } from '../../../../testing/fixtures/instantane-de-cours';
import { INSTANTANES_DES_COURS_SERVIS } from '../../../../testing/fixtures/instantanes-des-cours';
import { correctionsAffichees } from './corrections-affichees';

const BRIQUES_QUI_CORRIGENT: readonly string[] = ['fp-vote', 'fp-recall', 'fp-numeric'];

function ecransCorrigesDes(types: readonly string[]) {
  return INSTANTANES_DES_COURS_SERVIS.flatMap(([, instantane]) =>
    ecransDuPupitreDe(instantane),
  ).filter(({ type, corriges }) => types.includes(type) && corriges.length > 0);
}

describe('correctionsAffichees', () => {
  it('R1 · met en bandeau la réponse attendue d un écran porteur d un corrigé', () => {
    expect(correctionsAffichees(buildEcranDeroule({ type: 'fp-exit' })).length).toBeGreaterThan(0);
  });

  it('RET-32 · laisse au questionnaire sa correction sous chaque question, sans bandeau', () => {
    expect(correctionsAffichees(buildEcranDeroule({ type: 'questionnaire' }))).toEqual([]);
  });

  it('Q1 · ne met en bandeau aucune correction que la brique de l écran porte déjà', () => {
    const ecrans = ecransCorrigesDes(BRIQUES_QUI_CORRIGENT);

    expect(ecrans.map(({ type }) => type)).toContain('fp-vote');
    expect(
      ecrans.filter((ecran) => correctionsAffichees(ecran).length > 0).map(({ id }) => id),
    ).toEqual([]);
  });

  it('Q1 · garde le bandeau des écrans dont il est la seule correction écrite', () => {
    const ecrans = ecransCorrigesDes(['fp-exit', 'fp-spaced']);

    expect(ecrans.length).toBeGreaterThan(0);
    expect(
      ecrans.filter((ecran) => correctionsAffichees(ecran).length === 0).map(({ id }) => id),
    ).toEqual([]);
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
