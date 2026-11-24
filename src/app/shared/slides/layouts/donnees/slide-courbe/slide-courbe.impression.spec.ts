import {
  COURBE_DU_B2_07,
  monterLaCourbeDuB207,
  tangentesDuPapierALaLargeur,
} from '../../../../../../testing/rendu/courbe-du-b2-07';

describe('courbe pas à pas imprimée sans script (RET-03)', () => {
  const fixture = monterLaCourbeDuB207();

  it('RET-03 · avant window.print, la figure du papier a déjà placé chaque tangente servie, aucune masquée', async () => {
    expect(await tangentesDuPapierALaLargeur(fixture(), '64rem')).toEqual({
      placees: COURBE_DU_B2_07.steps.flatMap(({ tangent }) => tangent?.label ?? []),
      masquees: [],
    });
  });
});
