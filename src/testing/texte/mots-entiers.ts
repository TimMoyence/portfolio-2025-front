import { echapperPourRegex } from '../../cours/runtime/core/texte/valeurs';

export const enMotEntier = (motif: string): string =>
  `(?<![\\p{L}\\p{N}])(?:${motif})(?![\\p{L}\\p{N}])`;

const motifDuMot = (mot: string): string =>
  echapperPourRegex(mot.normalize('NFC')).replace(/ +/g, '\\s+');

export const motsTrouves = (texte: string, mots: readonly string[]): string[] => {
  if (mots.length === 0) return [];
  const motif = new RegExp(enMotEntier(mots.map(motifDuMot).join('|')), 'giu');
  return [...new Set(Array.from(texte.normalize('NFC').matchAll(motif), ([trouve]) => trouve))];
};

export const MOTS_TECHNIQUES_DU_DIAGNOSTIC = [
  'CTA',
  'PageSpeed',
  'Core Web Vitals',
  'SEO',
  'CMS',
  'H1',
  'meta',
  'Quick wins',
  'Scorecard',
  'scalabilité',
  'scalability',
] as const;
