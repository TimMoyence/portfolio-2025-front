import { signal } from '@angular/core';
import { dureeMonotoneDepuis, instantMonotone } from '../../../../cours/runtime/core/saisie/duree';

export function saisieAntiRobot() {
  const website = signal('');
  const debut = instantMonotone();
  return {
    website,
    champs: () => ({ website: website(), formFillDurationMs: dureeMonotoneDepuis(debut) }),
  };
}
