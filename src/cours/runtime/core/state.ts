import type { FreeRange, PacingMode } from '../../content/types';
import { readJson, removeKey, writeJson } from './storage';

export interface DeckState {
  coursId: string;
  ecranCourant: number;
  modeRythme: PacingMode;
  intervalleLibre: FreeRange | null;
  reponses: Record<string, unknown>;
  majLe: string;
}

function cle(coursId: string): string {
  return `fp.deck.${coursId}`;
}

export function loadDeckState(coursId: string): DeckState | null {
  return readJson<DeckState>(cle(coursId));
}

export function saveDeckState(etat: DeckState): void {
  writeJson(cle(etat.coursId), { ...etat, majLe: new Date().toISOString() });
}

export function clearDeckState(coursId: string): void {
  removeKey(cle(coursId));
}
