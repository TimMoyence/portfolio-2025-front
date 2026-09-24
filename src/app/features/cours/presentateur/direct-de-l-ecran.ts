import type { EcranContent, PilotageEcran } from '../../../../cours/content/types';
import type { DirectEcran } from '../../../shared/slides/session/contrat-hote';
import { objet } from '../../../shared/slides/visual/presentation-v2';
import type { ResultatsDuPupitre } from './cours-panneau-activite.component';

export function directDeLEcran(
  ecran: EcranContent,
  pilotage: PilotageEcran,
  resultats: ResultatsDuPupitre | null,
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
