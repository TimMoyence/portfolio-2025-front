import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';

export interface ParametreReglable {
  readonly cle: string;
  readonly libelle: string;
  readonly min: number;
  readonly max: number;
  readonly pas: number;
  readonly defaut: number;
}

export function curseur(
  prefixe: string,
  parametre: ParametreReglable,
  valeur: number,
  enonce: string,
): EscapedHtml {
  const classe = `${prefixe}__curseur`;
  return safeHtml`<input class="${escapeHtml(classe)}" data-testid="curseur" data-cle="${escapeHtml(parametre.cle)}" type="range" min="${parametre.min}" max="${parametre.max}" step="${escapeHtml(parametre.pas > 0 ? parametre.pas : 'any')}" value="${valeur}" aria-label="${escapeHtml(enonce)}">`;
}

export function brancherCurseurs(
  racine: ShadowRoot,
  surChangement: (cle: string, valeur: number) => void,
): void {
  for (const champ of racine.querySelectorAll<HTMLInputElement>('input[data-testid="curseur"]')) {
    champ.addEventListener('input', () => {
      const valeur = Number(champ.value);
      if (Number.isFinite(valeur)) {
        surChangement(champ.dataset['cle'] ?? '', valeur);
      }
    });
  }
}
