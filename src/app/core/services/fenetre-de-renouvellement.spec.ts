import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { sansStockageLocal } from '../../../testing/sans-stockage';
import {
  CLE_DE_LA_FENETRE,
  FENETRE_OUVERTE,
  MEMOIRE_DU_RENOUVELLEMENT,
  PLUS_LONGUE_FENETRE_MS,
  creerMemoireDuRenouvellementEnMemoire,
  creerMemoireDuRenouvellementPartagee,
} from './fenetre-de-renouvellement';

const EN_PANNE = { pasAvant: Date.now() + 30 * 60_000, echecs: 5 };

describe('fenetre de renouvellement', () => {
  it('partage la fenetre entre les onglets du meme navigateur, qui partagent le cookie', () => {
    const pupitre = creerMemoireDuRenouvellementPartagee();
    const projection = creerMemoireDuRenouvellementPartagee();

    pupitre.ecrire(EN_PANNE);

    expect(projection.lire()).toEqual(EN_PANNE);
  });

  it('rouvre la fenetre de tous les onglets quand l un d eux la rouvre', () => {
    const pupitre = creerMemoireDuRenouvellementPartagee();
    const projection = creerMemoireDuRenouvellementPartagee();
    pupitre.ecrire(EN_PANNE);

    projection.ecrire(FENETRE_OUVERTE);

    expect(pupitre.lire()).toEqual(FENETRE_OUVERTE);
  });

  it('garde la fenetre de l onglet quand le stockage local manque', () => {
    sansStockageLocal(() => {
      const onglet = creerMemoireDuRenouvellementPartagee();

      onglet.ecrire(EN_PANNE);

      expect(onglet.lire()).toEqual(EN_PANNE);
    });
  });

  for (const [cas, brute] of [
    ['illisible', '{'],
    ['aux valeurs negatives', JSON.stringify({ pasAvant: -1, echecs: -3 })],
    ['aux valeurs non entieres', JSON.stringify({ pasAvant: '9', echecs: 1.5 })],
  ] as const) {
    it(`lit une fenetre ${cas} comme ouverte ou ramenee a zero`, () => {
      localStorage.setItem(CLE_DE_LA_FENETRE, brute);

      const lue = creerMemoireDuRenouvellementPartagee().lire();

      expect(lue).toEqual(FENETRE_OUVERTE);
    });
  }

  it('ne fait jamais attendre un onglet plus que la plus longue fenetre, meme apres un recul d horloge', () => {
    const maintenant = Date.now();
    localStorage.setItem(
      CLE_DE_LA_FENETRE,
      JSON.stringify({ pasAvant: maintenant + 30 * 24 * 60 * 60_000, echecs: 5 }),
    );

    const lue = creerMemoireDuRenouvellementPartagee().lire();

    expect(lue.pasAvant - Date.now()).toBeLessThanOrEqual(PLUS_LONGUE_FENETRE_MS);
    expect(lue.echecs).toBe(5);
  });

  for (const [cas, executer, creerLaMemoire] of [
    ['entre les onglets', <T>(action: () => T) => action(), creerMemoireDuRenouvellementPartagee],
    ['quand le stockage local manque', sansStockageLocal, creerMemoireDuRenouvellementPartagee],
    ['cote serveur', <T>(action: () => T) => action(), creerMemoireDuRenouvellementEnMemoire],
  ] as const) {
    it(`rouvre la fenetre au plus tard une plus longue fenetre apres une horloge future corrigee, ${cas}`, () => {
      executer(() => {
        const correction = Date.now();
        const horloge = spyOn(Date, 'now').and.returnValue(correction + 40 * 24 * 60 * 60_000);
        const onglet = creerLaMemoire();
        onglet.ecrire({ pasAvant: Date.now() + 30 * 60_000, echecs: 5 });
        horloge.and.returnValue(correction);
        onglet.lire();

        horloge.and.returnValue(correction + PLUS_LONGUE_FENETRE_MS + 1);

        expect(onglet.lire().pasAvant).toBeLessThan(Date.now());
        expect(onglet.lire().echecs).toBe(5);
      });
    });
  }

  it('partage avec les autres onglets la fenetre que le navigateur injecte', () => {
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'browser' }] });

    TestBed.inject(MEMOIRE_DU_RENOUVELLEMENT).ecrire(EN_PANNE);

    expect(creerMemoireDuRenouvellementPartagee().lire()).toEqual(EN_PANNE);
  });

  it('reste en memoire, sans stockage, cote serveur', () => {
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    const memoire = TestBed.inject(MEMOIRE_DU_RENOUVELLEMENT);

    memoire.ecrire(EN_PANNE);

    expect(memoire.lire()).toEqual(EN_PANNE);
    expect(localStorage.getItem(CLE_DE_LA_FENETRE)).toBeNull();
  });
});
