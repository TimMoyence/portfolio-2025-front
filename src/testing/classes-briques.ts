import { feuilleDe } from '../cours/runtime/design/blocks';
import { base, stage, tokens } from '../cours/runtime/design/styles';

const RENDUS = ['stage', 'hand', 'board'] as const;

export function classesEmises(hote: HTMLElement): Set<string> {
  const emises = new Set<string>();
  for (const rendu of RENDUS) {
    hote.setAttribute('render', rendu);
    for (const noeud of hote.shadowRoot?.querySelectorAll('[class]') ?? []) {
      noeud.classList.forEach((classe) => emises.add(classe));
    }
  }
  return emises;
}

export function classesOrphelines(hote: HTMLElement, brique: string): string[] {
  const feuille = [tokens, base, feuilleDe(brique), stage].join('\n');
  return [...classesEmises(hote)].filter(
    (classe) => !new RegExp(`\\.${classe}(?![\\w-])`).test(feuille),
  );
}
