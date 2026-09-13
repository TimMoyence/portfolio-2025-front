import { challenge } from './challenge';
import { exit } from './exit';
import { pro, quote, story } from './narration';
import { numeric } from './numeric';
import { pulse } from './pulse';
import { recall } from './recall';
import { vote } from './vote';

const FEUILLES: Readonly<Record<string, string>> = {
  challenge,
  exit,
  numeric,
  pro,
  pulse,
  quote,
  recall,
  story,
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
