import { toutesLesFeuilles } from './blocks';
import { defileurDeTableau } from './defileur';
import { base, correction, impression, tokens } from './styles';

let feuille: CSSStyleSheet | null = null;

function construire(): CSSStyleSheet {
  const construite = new CSSStyleSheet();
  construite.replaceSync(
    [tokens, base, defileurDeTableau, ...toutesLesFeuilles(), correction, impression].join('\n'),
  );
  return construite;
}

export function adoptCoursStyles(racine: ShadowRoot | Document): void {
  if (typeof CSSStyleSheet === 'undefined') {
    return;
  }
  feuille ??= construire();
  if (racine.adoptedStyleSheets.includes(feuille)) {
    return;
  }
  racine.adoptedStyleSheets = [...racine.adoptedStyleSheets, feuille];
}

export function resetCoursStyles(): void {
  feuille = null;
}
