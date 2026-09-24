import { toutesLesFeuilles } from './blocks';
import { base, correction, tokens } from './styles';

let feuille: CSSStyleSheet | null = null;

function construire(): CSSStyleSheet {
  const construite = new CSSStyleSheet();
  construite.replaceSync([tokens, base, ...toutesLesFeuilles(), correction].join('\n'));
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
