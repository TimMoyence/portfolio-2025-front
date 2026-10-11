import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { estObjet } from '../core/valeurs';

export interface LigneDuDossier {
  readonly libelle: string;
  readonly valeur: string;
}

const VIDE = escapeHtml('');

export function lireRappel(valeur: unknown): readonly LigneDuDossier[] {
  return Array.isArray(valeur)
    ? valeur.filter(
        (ligne): ligne is LigneDuDossier =>
          estObjet(ligne) &&
          typeof ligne['libelle'] === 'string' &&
          typeof ligne['valeur'] === 'string',
      )
    : [];
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
