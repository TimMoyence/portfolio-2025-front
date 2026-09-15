import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { setupTestBed } from '../../../testing/setup-test-bed';
import { creerVerrouInterOnglets, VERROU_INTER_ONGLETS } from './verrou-inter-onglets';

const NOM = 'verrou-inter-onglets-spec';

async function attendreQue(condition: () => boolean | Promise<boolean>): Promise<void> {
  for (let tour = 0; tour < 100 && !(await condition()); tour += 1) {
    await new Promise<void>((resoudre) => setTimeout(resoudre, 10));
  }
}

describe('verrou inter-onglets', () => {
  it('fait attendre un second travail tant que le premier tient le verrou du navigateur', async () => {
    const verrou = creerVerrouInterOnglets(navigator.locks);
    const journal: string[] = [];
    let liberer: () => void = () => undefined;
    const retenue = new Promise<void>((resoudre) => {
      liberer = resoudre;
    });

    const premier = verrou(NOM, async () => {
      journal.push('premier');
      await retenue;
      journal.push('premier libere');
    });
    const second = verrou(NOM, async () => {
      journal.push('second');
      return 42;
    });
    await attendreQue(() => journal.length > 0);
    await attendreQue(async () => ((await navigator.locks.query()).pending ?? []).length > 0);

    expect(journal).toEqual(['premier']);

    liberer();
    await premier;

    expect(await second).toBe(42);
    expect(journal).toEqual(['premier', 'premier libere', 'second']);
  });

  it('execute le travail sans verrou quand le navigateur n en fournit pas', async () => {
    const verrou = creerVerrouInterOnglets(null);

    expect(await verrou(NOM, () => Promise.resolve('fait'))).toBe('fait');
  });

  it('ne demande aucun verrou au navigateur pendant un rendu serveur', async () => {
    const demande = spyOn(navigator.locks, 'request').and.callThrough();
    setupTestBed({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    const verrou = TestBed.inject(VERROU_INTER_ONGLETS);

    expect(await verrou(NOM, () => Promise.resolve('serveur'))).toBe('serveur');
    expect(demande).not.toHaveBeenCalled();
  });
});
