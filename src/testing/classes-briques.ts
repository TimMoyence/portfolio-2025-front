import { feuilleDe } from '../cours/runtime/design/blocks';
import { base, correction, tokens } from '../cours/runtime/design/styles';

const ROLES = ['etudiant', 'presentateur'] as const;

export function classesEmises(hote: HTMLElement): Set<string> {
  const emises = new Set<string>();
  for (const role of ROLES) {
    hote.setAttribute('data-cours-role', role);
    for (const noeud of hote.shadowRoot?.querySelectorAll('[class]') ?? []) {
      noeud.classList.forEach((classe) => emises.add(classe));
    }
  }
  return emises;
}

export function classesOrphelines(hote: HTMLElement, brique: string): string[] {
  const feuille = [tokens, base, feuilleDe(brique), correction].join('\n');
  return [...classesEmises(hote)].filter(
    (classe) => !new RegExp(`\\.${classe}(?![\\w-])`).test(feuille),
  );
}
