import { buildEcran } from '../../../../testing/factories/cours.factory';
import { directDeLEcran } from './direct-de-l-ecran';

const COMPTES = { perdu: 1, 'ca-va': 1, clair: 1, total: 3 };
const SONDAGE = buildEcran({ type: 'fp-pulse', donnees: { sondage: { id: 'J1' } } });
const RESULTATS = { participants: 3, questions: [], jalons: { J1: COMPTES } };

describe('directDeLEcran', () => {
  it('rend le pilotage, les resultats et les comptes du sondage porte par l ecran', () => {
    expect(directDeLEcran(SONDAGE, { revele: true }, RESULTATS, 0)).toEqual({
      pilotage: { revele: true },
      resultats: [],
      comptesJalon: COMPTES,
    });
  });

  it('retient les comptes tant que la salle n atteint pas le seuil de projection', () => {
    expect(directDeLEcran(SONDAGE, {}, RESULTATS, 5).comptesJalon).toBeNull();
  });

  it('ne rend aucun compte a un ecran sans sondage ni avant les premiers resultats', () => {
    expect(directDeLEcran(buildEcran(), {}, RESULTATS, 0).comptesJalon).toBeNull();
    expect(directDeLEcran(SONDAGE, {}, null, 0)).toEqual({
      pilotage: {},
      resultats: null,
      comptesJalon: null,
    });
  });
});
