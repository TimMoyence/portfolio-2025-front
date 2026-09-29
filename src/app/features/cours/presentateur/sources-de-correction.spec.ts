import { buildEcranDeroule } from '../../../../testing/factories/formations.factory';
import { ecransDuPupitreB2_01 } from '../../../../testing/fixtures/instantane-b2-01';
import { sourcesDeCorrection } from './sources-de-correction';

describe('sources des écrans de correction du déroulé', () => {
  const sources = [...sourcesDeCorrection(ecransDuPupitreB2_01())];

  it('G07 · ne retient au B2-01 que les tris, seuls exercices encore corrigés sur un écran suivant', () => {
    expect(sources).toEqual([
      'B2-01-A1-05-ANATOMIE',
      'B2-01-A2-07-JEU-COMPARABLE',
      'B2-01-A5-07-CONTROLE-DISCRIMINANT',
    ]);
  });

  it('G07 · retient encore la source d un exemple travaillé piloté d une version stockée', () => {
    const correction = buildEcranDeroule({
      id: 'ecran-correction',
      type: 'fp-worked',
      donnees: { corrigeDe: 'ecran-exemple', pilote: true },
    });

    expect([...sourcesDeCorrection([correction])]).toEqual(['ecran-exemple']);
  });

  it('G07 · ignore un écran à réponses libres qu aucun écran ne corrige', () => {
    expect(sources).not.toContain('B2-01-A1-03-MISSION');
  });
});
