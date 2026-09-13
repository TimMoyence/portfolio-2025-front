import { challenge } from './challenge';
import { concept4 } from './concept4';
import { exit } from './exit';
import { pro, quote, story } from './narration';
import { numeric } from './numeric';
import { plot } from './plot';
import { pulse } from './pulse';
import { recall } from './recall';
import { vote } from './vote';
import { worked } from './worked';

const FEUILLES: Readonly<Record<string, string>> = {
  challenge,
  concept4,
  exit,
  numeric,
  plot,
  pro,
  pulse,
  quote,
  recall,
  story,
  vote,
  worked,
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
