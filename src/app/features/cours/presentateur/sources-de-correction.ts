import type { EcranDeroule } from '../../../../cours/content/types';
import { objet, presentationDe } from '../../../shared/slides/visual/presentation-v2';

const RENDUS_DE_CORRECTION: ReadonlySet<string> = new Set(['sort-review', 'answer-review']);

export function sourceCorrigeePar(ecran: EcranDeroule): string | null {
  if (ecran.type === 'fp-worked') {
    const source = ecran.donnees?.['corrigeDe'];
    return typeof source === 'string' ? source : null;
  }
  const presentation = presentationDe(ecran);
  if (presentation === null || !RENDUS_DE_CORRECTION.has(presentation.renderer)) {
    return null;
  }
  const source = objet(presentation.props['source'])?.['screenId'];
  return typeof source === 'string' ? source : null;
}

export function sourcesDeCorrection(ecrans: readonly EcranDeroule[]): ReadonlySet<string> {
  return new Set(
    ecrans.map(sourceCorrigeePar).filter((source): source is string => source !== null),
  );
}
