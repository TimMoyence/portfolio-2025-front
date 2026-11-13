import { cliquerOmbre } from '../../../../../testing/briques/banc-de-brique';
import {
  cellule,
  DEUX_FAUSSES,
  evaluations,
  installerLaFeuille,
  repondre,
  reprendreD3ApresVerdict,
  saisir,
  selectionner,
  servirLaRecopie,
  TTC,
} from '../../../../../testing/briques/feuille';
import type { FpSheet } from '../../activites/FpSheet';

const FORMULE_MODIFIEE = '=C3*2';

describe('FpSheet · affichage après une recopie abandonnée', () => {
  let hote: FpSheet;
  installerLaFeuille((feuille) => (hote = feuille));

  it('TAB-04 · montre la formule d une case modifiee tant que la feuille reevaluee n est pas revenue', () => {
    const demandes = evaluations(hote);
    reprendreD3ApresVerdict(hote, DEUX_FAUSSES);
    selectionner(hote, 'D4');
    repondre(hote, demandes.at(-1), { D3: TTC });
    expect(cellule(hote, 'D3').value).toBe(TTC.affichage);

    selectionner(hote, 'D3');
    saisir(hote, 'D3', FORMULE_MODIFIEE);
    cliquerOmbre(hote, 'recopier');
    selectionner(hote, 'D4');
    hote.saisieFermee = true;
    servirLaRecopie(hote, demandes.at(-1));

    expect(cellule(hote, 'D3').value).toBe(FORMULE_MODIFIEE);
  });
});
