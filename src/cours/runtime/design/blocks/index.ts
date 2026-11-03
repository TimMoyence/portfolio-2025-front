import { cardsort } from './questions/cardsort';
import { challenge } from './activites/challenge';
import { concept4 } from './contenus/concept4';
import { escape } from './activites/escape';
import { pro, quote, story } from './contenus/narration';
import { numeric } from './questions/numeric';
import { plot } from './contenus/plot';
import { pulse } from './questions/pulse';
import { recall } from './questions/recall';
import { sheet } from './activites/sheet';
import { spaced } from './questions/spaced';
import { tableBuild } from './activites/table-build';
import { vote } from './questions/vote';
import { worked } from './activites/worked';

const FEUILLES: Readonly<Record<string, string>> = {
  cardsort,
  challenge,
  concept4,
  escape,
  numeric,
  plot,
  pro,
  pulse,
  quote,
  recall,
  sheet,
  spaced,
  story,
  'table-build': tableBuild,
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
