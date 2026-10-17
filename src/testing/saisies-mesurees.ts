import type { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { type ChampsAntiRobotLus, champsAntiRobotDe, horlogesDeSaisie } from './horloge-simulee';

const DUREES_DE_SAISIE_MS = [20_000, 5_000];

export const SAISIES_MESUREES: ChampsAntiRobotLus[] = DUREES_DE_SAISIE_MS.map((duree) => ({
  formFillDurationMs: duree,
  heureDeDebutEnvoyee: false,
}));

export function champsAntiRobotDeChaqueSaisie<T>(
  composant: Type<T>,
  soumettre: (instance: T) => void,
  envois: jasmine.Spy,
): ChampsAntiRobotLus[] {
  const horloges = horlogesDeSaisie();
  const instance = TestBed.createComponent(composant).componentInstance;
  for (const duree of DUREES_DE_SAISIE_MS) {
    horloges.saisirPendant(duree);
    soumettre(instance);
  }
  return envois.calls.allArgs().map(([corps]) => champsAntiRobotDe(corps));
}
