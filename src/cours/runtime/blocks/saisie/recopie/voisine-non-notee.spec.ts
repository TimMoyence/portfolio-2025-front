import { cliquerOmbre, texteOmbre } from '../../../../../testing/briques/banc-de-brique';
import {
  evaluations,
  installerLaFeuille,
  recevoirLeVerdict,
  recopiesDemandees,
  saisir,
  TTC_CORRIGE,
} from '../../../../../testing/briques/feuille';
import type { FpSheet } from '../../activites/FpSheet';

const REFUS = 'La cellule voisine n’est pas à reprendre : la recopie s’arrête ici';

describe('FpSheet · recopie vers une voisine non notée', () => {
  let hote: FpSheet;
  installerLaFeuille((feuille) => (hote = feuille));

  it('TAB-03 · refuse apres verdict de recopier sur une voisine que le verdict ne note pas, en le disant', () => {
    const demandes = evaluations(hote);
    recevoirLeVerdict(hote);
    saisir(hote, 'D3', TTC_CORRIGE);

    cliquerOmbre(hote, 'recopier');

    expect(recopiesDemandees(demandes)).toEqual([]);
    expect(texteOmbre(hote, 'retour')).toBe(REFUS);
  });
});
