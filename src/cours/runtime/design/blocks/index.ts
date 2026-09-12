import { vote } from './vote';

const FEUILLES: Readonly<Record<string, string>> = {
  vote,
};

export function feuilleDe(nom: string): string {
  return FEUILLES[nom] ?? '';
}

export function toutesLesFeuilles(): readonly string[] {
  return Object.values(FEUILLES);
}
