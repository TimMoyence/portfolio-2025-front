import type { EcranContent, PilotageEcran, ResultatsSeance } from '../../../cours/content/types';
import type { ResultatsDuFlux } from '../../../cours/runtime/core/sync';
import type { DirectEcran } from '../../shared/slides/session/contrat-hote';
import { objet } from '../../shared/slides/visual/presentation-v2';

export type ResultatsDuDirect = Pick<ResultatsSeance, 'questions'> &
  Partial<Pick<ResultatsDuFlux, 'jalons'>>;

export function directDeLEcran(
  ecran: EcranContent,
  pilotage: PilotageEcran,
  resultats: ResultatsDuDirect | null,
  seuilDeProjection: number,
): DirectEcran {
  const sondageId = objet(ecran.donnees?.['sondage'])?.['id'];
  const comptes = typeof sondageId === 'string' ? (resultats?.jalons?.[sondageId] ?? null) : null;
  return {
    pilotage,
    resultats: resultats?.questions ?? null,
    comptesJalon: comptes !== null && comptes.total >= seuilDeProjection ? comptes : null,
  };
}

export function directDeLEcranCourant(
  ecran: EcranContent | null,
  pilotages: Readonly<Record<string, PilotageEcran>>,
  resultats: ResultatsDuDirect | null,
  seuilDeProjection: number,
): DirectEcran | null {
  return ecran === null
    ? null
    : directDeLEcran(ecran, pilotages[ecran.id] ?? {}, resultats, seuilDeProjection);
}
