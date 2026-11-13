import { cliquerOmbre } from '../../../../../testing/briques/banc-de-brique';
import {
  envois,
  evaluations,
  installerLaFeuille,
  lancerLaRecopieApresVerdict,
  MONTANT_HT,
  servirLaRecopie,
  TTC_CORRIGE,
  TTC_RECOPIE,
} from '../../../../../testing/briques/feuille';
import type { FpSheet } from '../../activites/FpSheet';

describe('FpSheet · renvoi pendant une recopie', () => {
  let hote: FpSheet;
  installerLaFeuille((feuille) => (hote = feuille));

  it('TAB-03 · attend la recopie en cours avant de renvoyer, puis renvoie la voisine recopiee', () => {
    const recus = envois(hote);
    const demandes = evaluations(hote);
    lancerLaRecopieApresVerdict(hote);

    cliquerOmbre(hote, 'valider');
    expect(recus.length).toBe(1);
    servirLaRecopie(hote, demandes.at(-1));

    expect(recus.map((recu) => recu['cellules'])).toEqual([
      jasmine.any(Object),
      { C3: MONTANT_HT, D3: TTC_CORRIGE, D4: TTC_RECOPIE },
    ]);
  });
});
