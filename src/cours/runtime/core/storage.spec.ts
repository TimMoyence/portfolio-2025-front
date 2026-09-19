import { sansStockageLocal } from '../../../testing/sans-stockage';
import { creerBrouillons, purgerLesAutresBrouillons, readJson, removeKey } from './storage';

const SEANCE = '11111111-1111-4111-8111-111111111111';
const AUTRE_SEANCE = '99999999-9999-4999-8999-999999999999';
const PARTICIPANT = '22222222-2222-4222-8222-222222222222';
const CLE_FEUILLE = `fp.${SEANCE}.${PARTICIPANT}.fp-sheet.b2-01-a4-feuille-canaux`;
const CLE_AUTRE = `fp.${AUTRE_SEANCE}.${PARTICIPANT}.fp-sheet.b2-01-a4-feuille-canaux`;
const CLES_HORS_BROUILLON = ['fp.identite', 'fp.file-reponses'];

describe('brouillons locaux', () => {
  beforeEach(() => {
    jasmine.clock().install();
    for (const cle of [CLE_FEUILLE, CLE_AUTRE, ...CLES_HORS_BROUILLON]) {
      removeKey(cle);
    }
  });

  afterEach(() => {
    jasmine.clock().uninstall();
    for (const cle of [CLE_FEUILLE, CLE_AUTRE, ...CLES_HORS_BROUILLON]) {
      removeKey(cle);
    }
  });

  it('range un brouillon sous fp.<seance>.<participant>.<brique>.<id> une seconde apres la saisie', () => {
    const brouillons = creerBrouillons(SEANCE, PARTICIPANT);
    brouillons.ecrire('fp-sheet', 'b2-01-a4-feuille-canaux', { D2: '=(C2-B2)/B2' });

    jasmine.clock().tick(999);
    expect(readJson(CLE_FEUILLE)).toBeNull();

    jasmine.clock().tick(1);
    expect(readJson(CLE_FEUILLE)).toEqual({ D2: '=(C2-B2)/B2' });
    expect(brouillons.lire('fp-sheet', 'b2-01-a4-feuille-canaux')).toEqual({ D2: '=(C2-B2)/B2' });
  });

  it('ne garde que la derniere saisie d une rafale', () => {
    const ecriture = spyOn(globalThis.localStorage, 'setItem').and.callThrough();
    const brouillons = creerBrouillons(SEANCE, PARTICIPANT);
    brouillons.ecrire('fp-sheet', 'b2-01-a4-feuille-canaux', { D2: '=' });
    jasmine.clock().tick(500);
    brouillons.ecrire('fp-sheet', 'b2-01-a4-feuille-canaux', { D2: '=C2' });
    jasmine.clock().tick(1000);

    expect(ecriture).toHaveBeenCalledTimes(1);
    expect(readJson(CLE_FEUILLE)).toEqual({ D2: '=C2' });
  });

  it('purge les brouillons de la seance, y compris une ecriture encore differee', () => {
    const brouillons = creerBrouillons(SEANCE, PARTICIPANT);
    brouillons.ecrire('fp-sheet', 'b2-01-a4-feuille-canaux', { D2: '=C2' });
    jasmine.clock().tick(1000);
    brouillons.ecrire('fp-sheet', 'b2-01-a4-feuille-canaux', { D2: '=C3' });

    brouillons.purger();
    jasmine.clock().tick(1000);

    expect(readJson(CLE_FEUILLE)).toBeNull();
  });

  it('au rattachement, purge les brouillons des autres seances sans toucher aux autres cles fp', () => {
    globalThis.localStorage.setItem(CLE_AUTRE, JSON.stringify({ D2: '=1' }));
    globalThis.localStorage.setItem(CLE_FEUILLE, JSON.stringify({ D2: '=2' }));
    globalThis.localStorage.setItem('fp.identite', JSON.stringify({ prenom: 'Lea' }));

    purgerLesAutresBrouillons(SEANCE, PARTICIPANT);

    expect(readJson(CLE_AUTRE)).toBeNull();
    expect(readJson(CLE_FEUILLE)).toEqual({ D2: '=2' });
    expect(readJson('fp.identite')).toEqual({ prenom: 'Lea' });
  });

  it('reste silencieux quand le stockage local est absent', () => {
    sansStockageLocal(() => {
      const brouillons = creerBrouillons(SEANCE, PARTICIPANT);
      brouillons.ecrire('fp-sheet', 'b2-01-a4-feuille-canaux', { D2: '=C2' });
      jasmine.clock().tick(1000);
      expect(brouillons.lire('fp-sheet', 'b2-01-a4-feuille-canaux')).toBeNull();
      expect(() => purgerLesAutresBrouillons(SEANCE, PARTICIPANT)).not.toThrow();
    });
  });
});
