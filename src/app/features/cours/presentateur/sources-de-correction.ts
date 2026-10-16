import type { EcranDeroule } from '../../../../cours/content/types';
import {
  ecranSourceDe,
  objet,
  presentationDe,
  RENDUS_DE_REVELATION,
} from '../../../shared/slides/visual/presentation-v2';

export function sourceCorrigeePar(ecran: EcranDeroule): string | null {
  if (ecran.type === 'fp-worked') {
    const source = ecran.donnees?.['corrigeDe'];
    return typeof source === 'string' ? source : null;
  }
  const presentation = presentationDe(ecran);
  if (presentation === null || !RENDUS_DE_REVELATION.has(presentation.renderer)) {
    return null;
  }
  return ecranSourceDe(objet(presentation.props['source']));
}

export function sourcesDeCorrection(ecrans: readonly EcranDeroule[]): ReadonlySet<string> {
  return new Set(
    ecrans.map(sourceCorrigeePar).filter((source): source is string => source !== null),
  );
}
