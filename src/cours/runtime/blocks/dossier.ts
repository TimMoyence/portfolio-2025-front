import { type EscapedHtml, escapeHtml, safeHtml, VIDE } from '../core/html';
import { estObjet } from '../core/valeurs';

export interface LigneDuDossier {
  readonly libelle: string;
  readonly valeur: string;
}

function lireRappel(valeur: unknown): readonly LigneDuDossier[] {
  return Array.isArray(valeur)
    ? valeur.filter(
        (ligne): ligne is LigneDuDossier =>
          estObjet(ligne) &&
          typeof ligne['libelle'] === 'string' &&
          typeof ligne['valeur'] === 'string',
      )
    : [];
}

export function copierRappel(source: { readonly rappel?: readonly LigneDuDossier[] }): {
  readonly rappel?: readonly LigneDuDossier[];
} {
  return source.rappel === undefined ? {} : { rappel: lireRappel(source.rappel) };
}

export function dossierDeRappel(rappel: readonly LigneDuDossier[] | undefined): EscapedHtml {
  if (rappel === undefined || rappel.length === 0) {
    return VIDE;
  }
  const lignes = rappel.map(
    (ligne) =>
      safeHtml`<div class="fp-dossier__ligne"><dt>${escapeHtml(ligne.libelle)}</dt><dd>${escapeHtml(ligne.valeur)}</dd></div>`,
  );
  return safeHtml`<dl class="fp-dossier" data-testid="rappel">${lignes}</dl>`;
}
