import type { NatureDeCellule } from '../../cours/content/types';
import { FpSheet } from '../../cours/runtime/blocks/activites/FpSheet';
import type { DetailDeVerdict } from '../../cours/runtime/blocks/retours';
import {
  buildFeuilleEvaluee,
  buildSheetPlan,
  buildVerdictDeProduction,
} from '../factories/formations/cours.factory';
import { cliquerOmbre, detailsEmis, installerBrique, noeudOmbre } from './banc-de-brique';
import type { TracesEffets } from './effets-briques';

export interface Resultat {
  readonly affichage: string;
  readonly nature: NatureDeCellule;
  readonly formule?: boolean;
}

export const PLAN = buildSheetPlan();
export const RENVOYER = 'Renvoyer les cases corrigées';
export const MONTANT_HT = '=A3*B3';
export const MONTANT_TTC = '=C3*(1+$B$1)';
export const TTC_CORRIGE = '=C3*(1+B1)';
export const TTC_RECOPIE = '=C4*(1+B2)';
export const TTC: Resultat = { affichage: '64,8', nature: 'nombre' };
export const DEUX_FAUSSES: readonly DetailDeVerdict[] = [
  { cle: 'C3', juste: true, libelleConfusion: null },
  { cle: 'D3', juste: false, libelleConfusion: 'Référence relative non figée' },
  { cle: 'D4', juste: false, libelleConfusion: 'Référence relative non figée' },
];

export function installerLaFeuille(retenir: (feuille: FpSheet) => void): TracesEffets {
  return installerBrique<FpSheet>({
    balise: 'fp-sheet',
    classe: FpSheet,
    poser: (feuille) => {
      retenir(feuille);
      feuille.plan = buildSheetPlan();
    },
  });
}

export function cellule(hote: FpSheet, nom: string): HTMLInputElement {
  const trouvee = hote.shadowRoot?.querySelector<HTMLInputElement>(
    `[data-testid="cellule"][data-nom="${nom}"]`,
  );
  if (!(trouvee instanceof HTMLInputElement)) {
    throw new Error(`aucune cellule ${nom} dans la grille`);
  }
  return trouvee;
}

export function barre(hote: FpSheet): HTMLInputElement {
  const trouvee = noeudOmbre(hote, 'barre');
  if (!(trouvee instanceof HTMLInputElement)) {
    throw new Error('aucune barre de formule');
  }
  return trouvee;
}

export function bouton(hote: FpSheet, nom: string): HTMLButtonElement {
  const trouve = noeudOmbre(hote, nom);
  if (!(trouve instanceof HTMLButtonElement)) {
    throw new Error(`aucun bouton ${nom}`);
  }
  return trouve;
}

export function selectionner(hote: FpSheet, nom: string): void {
  cellule(hote, nom).dispatchEvent(new FocusEvent('focus', { bubbles: true }));
}

export function formuleDe(hote: FpSheet, nom: string): string {
  selectionner(hote, nom);
  return barre(hote).value;
}

export function saisir(hote: FpSheet, nom: string, texte: string): void {
  const champ = cellule(hote, nom);
  champ.value = texte;
  champ.dispatchEvent(new Event('input', { bubbles: true }));
}

export function chiffrer(hote: FpSheet): void {
  saisir(hote, 'C3', MONTANT_HT);
  saisir(hote, 'D3', MONTANT_TTC);
}

export function evaluations(hote: FpSheet): Record<string, unknown>[] {
  return detailsEmis(hote, 'fp-sheet-evaluation');
}

export function envois(hote: FpSheet): Record<string, unknown>[] {
  return detailsEmis(hote, 'fp-sheet-submit');
}

export function demandeDe(cellules: Readonly<Record<string, string>>): Record<string, unknown> {
  return { planId: PLAN.id, rang: jasmine.any(Number), cellules };
}

export function repondre(
  hote: FpSheet,
  demande: Readonly<Record<string, unknown>> | undefined,
  resultats: Readonly<Record<string, Resultat>>,
  recopiees: Readonly<Record<string, string>> = {},
): void {
  const initiale = hote.plan?.initiale ?? buildFeuilleEvaluee();
  const entrees = Object.entries(resultats);
  hote.evaluation = {
    rang: Number(demande?.['rang']),
    evaluee: buildFeuilleEvaluee({
      saisies: { ...(demande?.['cellules'] as Record<string, string>), ...recopiees },
      affichages: {
        ...initiale.affichages,
        ...Object.fromEntries(entrees.map(([nom, { affichage }]) => [nom, affichage])),
      },
      natures: {
        ...initiale.natures,
        ...Object.fromEntries(entrees.map(([nom, { nature }]) => [nom, nature])),
      },
      formules: entrees.filter(([, { formule }]) => formule !== false).map(([nom]) => nom),
    }),
  };
}

export function recevoirLeVerdict(hote: FpSheet): void {
  chiffrer(hote);
  cliquerOmbre(hote, 'valider');
  hote.verdict = buildVerdictDeProduction({ questionId: PLAN.id });
}

export function reprendreD3ApresVerdict(hote: FpSheet, details: readonly DetailDeVerdict[]): void {
  chiffrer(hote);
  cliquerOmbre(hote, 'valider');
  hote.verdict = buildVerdictDeProduction({ questionId: PLAN.id, details: [...details] });
  saisir(hote, 'D3', TTC_CORRIGE);
}

export function recopiesDemandees(
  demandes: readonly Record<string, unknown>[],
): Record<string, unknown>[] {
  return demandes.filter((demande) => demande['recopie'] !== undefined);
}

export function lancerLaRecopieApresVerdict(hote: FpSheet): void {
  reprendreD3ApresVerdict(hote, DEUX_FAUSSES);
  cliquerOmbre(hote, 'recopier');
}

export function servirLaRecopie(
  hote: FpSheet,
  demande: Readonly<Record<string, unknown>> | undefined,
): void {
  repondre(hote, demande, { D3: TTC, D4: TTC }, { D4: TTC_RECOPIE });
}
