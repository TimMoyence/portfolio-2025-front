import { buildEcranDeroule } from '../../../../testing/factories/formations.factory';
import { correctionsAffichees } from './corrections-affichees';

describe('correctionsAffichees', () => {
  it('R1 · met en bandeau la réponse attendue d un écran porteur d un corrigé', () => {
    expect(correctionsAffichees(buildEcranDeroule({ type: 'vote' })).length).toBeGreaterThan(0);
  });

  it('RET-32 · laisse au questionnaire sa correction sous chaque question, sans bandeau', () => {
    expect(correctionsAffichees(buildEcranDeroule({ type: 'questionnaire' }))).toEqual([]);
  });
});
