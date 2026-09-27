import { lignesDeCalcul } from '../../content/lignes-de-calcul';
import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';

export function lignesDeCalculHtml(texte: string): EscapedHtml {
  return safeHtml`${lignesDeCalcul(texte).map(
    (ligne) => safeHtml`<span class="fp-ligne-de-calcul">${escapeHtml(ligne)}</span>`,
  )}`;
}
