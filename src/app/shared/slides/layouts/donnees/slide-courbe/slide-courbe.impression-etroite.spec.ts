import {
  monterLaCourbeDuB207,
  tangentesDuPapierALaLargeur,
} from '../../../../../../testing/rendu/courbe-du-b2-07';

describe('courbe pas à pas imprimée depuis une fenêtre étroite (RET-03)', () => {
  const fixture = monterLaCourbeDuB207();

  it('RET-03 · livret ouvert sur un téléphone : avant window.print, aucune tangente du papier n est masquée', async () => {
    const { masquees } = await tangentesDuPapierALaLargeur(fixture(), '358px');

    expect(masquees).toEqual([]);
  });
});
