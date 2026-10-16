import { isPlatformBrowser } from '@angular/common';
import { InjectionToken, PLATFORM_ID, inject } from '@angular/core';
import { persistJson, readJson } from '../../../cours/runtime/core/storage';
import { estObjet } from '../../../cours/runtime/core/valeurs';

export interface FenetreDeRenouvellement {
  readonly pasAvant: number;
  readonly echecs: number;
}

export interface MemoireDuRenouvellement {
  lire(): FenetreDeRenouvellement;
  ecrire(fenetre: FenetreDeRenouvellement): void;
}

export const FENETRE_OUVERTE: FenetreDeRenouvellement = { pasAvant: 0, echecs: 0 };
export const CLE_DE_LA_FENETRE = 'portfolio-auth-refresh-fenetre';
export const PLUS_LONGUE_FENETRE_MS = 60 * 60_000;

function entierPositif(valeur: unknown): number {
  return typeof valeur === 'number' && Number.isSafeInteger(valeur) && valeur > 0 ? valeur : 0;
}

function fenetreLue(brute: unknown): FenetreDeRenouvellement | null {
  return estObjet(brute)
    ? { pasAvant: entierPositif(brute['pasAvant']), echecs: entierPositif(brute['echecs']) }
    : null;
}

function borneeALaLecture(memoire: MemoireDuRenouvellement): MemoireDuRenouvellement {
  return {
    lire: () => {
      const lue = memoire.lire();
      const auPlusTard = Date.now() + PLUS_LONGUE_FENETRE_MS;
      if (lue.pasAvant <= auPlusTard) {
        return lue;
      }
      const bornee = { ...lue, pasAvant: auPlusTard };
      memoire.ecrire(bornee);
      return bornee;
    },
    ecrire: (fenetre) => memoire.ecrire(fenetre),
  };
}

function memoireDeLOnglet(): MemoireDuRenouvellement {
  let fenetre = FENETRE_OUVERTE;
  return {
    lire: () => fenetre,
    ecrire: (suivante) => {
      fenetre = suivante;
    },
  };
}

export function creerMemoireDuRenouvellementEnMemoire(): MemoireDuRenouvellement {
  return borneeALaLecture(memoireDeLOnglet());
}

export function creerMemoireDuRenouvellementPartagee(): MemoireDuRenouvellement {
  const deLOnglet = memoireDeLOnglet();
  return borneeALaLecture({
    lire: () => fenetreLue(readJson<unknown>(CLE_DE_LA_FENETRE)) ?? deLOnglet.lire(),
    ecrire: (fenetre) => {
      deLOnglet.ecrire(fenetre);
      persistJson(CLE_DE_LA_FENETRE, fenetre);
    },
  });
}

export const MEMOIRE_DU_RENOUVELLEMENT = new InjectionToken<MemoireDuRenouvellement>(
  'MEMOIRE_DU_RENOUVELLEMENT',
  {
    providedIn: 'root',
    factory: () =>
      isPlatformBrowser(inject(PLATFORM_ID))
        ? creerMemoireDuRenouvellementPartagee()
        : creerMemoireDuRenouvellementEnMemoire(),
  },
);
