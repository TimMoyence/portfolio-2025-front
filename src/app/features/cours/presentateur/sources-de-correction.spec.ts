import { ecransDuPupitreB2_01 } from '../../../../testing/fixtures/instantane-b2-01';
import { sourcesDeCorrection } from './sources-de-correction';

describe('sources des écrans de correction du déroulé', () => {
  const sources = [...sourcesDeCorrection(ecransDuPupitreB2_01())];

  it('G07 · retient la source de chaque exemple travaillé piloté en correction', () => {
    expect(sources).toContain('B2-01-A2-06-POINTS');
    expect(sources).toContain('B2-01-A3-04-FIL-TECHNIQUE');
    expect(sources).toContain('B2-01-A3-06-INDICE-ET-TAUX-MOYEN');
    expect(sources).toContain('B2-01-A5-03-MOYENNE-PONDEREE');
  });

  it('G07 · retient la source de chaque écran de correction projeté', () => {
    expect(sources).toContain('B2-01-A1-05-ANATOMIE');
    expect(sources).toContain('B2-01-A1-10-AUDIT-DIAPOSITIVE');
    expect(sources).toContain('B2-01-A6-02-COFFRE');
    expect(sources.length).toBe(18);
  });

  it('G07 · ignore un écran à réponses libres qu aucun écran ne corrige', () => {
    expect(sources).not.toContain('B2-01-A1-03-MISSION');
  });
});
