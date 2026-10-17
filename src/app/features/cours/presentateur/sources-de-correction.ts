import type { EcranDeroule } from '../../../../cours/content/types';
import { chaineDe, objet } from '../../../../cours/runtime/core/valeurs';
import {
  ecranSourceDe,
  presentationDe,
  RENDUS_DE_REVELATION,
} from '../../../shared/slides/visual/presentation-v2';

export function sourceCorrigeePar(ecran: EcranDeroule): string | null {
  if (ecran.type === 'fp-worked') {
    return chaineDe(ecran.donnees, 'corrigeDe');
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
