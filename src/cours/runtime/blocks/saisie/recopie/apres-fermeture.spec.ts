import {
  cellule,
  demandeDe,
  evaluations,
  installerLaFeuille,
  lancerLaRecopieApresVerdict,
  MONTANT_HT,
  servirLaRecopie,
  TTC_CORRIGE,
} from '../../../../../testing/briques/feuille';
import type { FpSheet } from '../../activites/FpSheet';

describe('FpSheet · recopie arrivée après la fermeture', () => {
  let hote: FpSheet;
  installerLaFeuille((feuille) => (hote = feuille));

  it('TAB-03 · n applique pas une recopie arrivee apres la fermeture de la saisie et reevalue la feuille sans elle', () => {
    const demandes = evaluations(hote);
    lancerLaRecopieApresVerdict(hote);
    hote.saisieFermee = true;

    servirLaRecopie(hote, demandes.at(-1));

    expect(demandes.at(-1)).toEqual(demandeDe({ C3: MONTANT_HT, D3: TTC_CORRIGE }));
    expect(cellule(hote, 'D4').value).toBe('');
    expect(cellule(hote, 'D4').closest('td')?.getAttribute('data-etat')).not.toBe('reprise');
  });
});
