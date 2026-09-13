import { exit } from './exit';
import { numeric } from './numeric';
import { recall } from './recall';
import { vote } from './vote';

const FEUILLES: Readonly<Record<string, string>> = {
  exit,
  numeric,
  recall,
  vote,
};

export function feuilleDe(nom: string): string {
  return FEUILLES[nom] ?? '';
}

export function toutesLesFeuilles(): readonly string[] {
  return Object.values(FEUILLES);
}

export function nomsDesBriques(): readonly string[] {
  return Object.keys(FEUILLES);
}
