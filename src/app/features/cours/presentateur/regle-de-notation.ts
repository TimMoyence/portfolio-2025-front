import type { RegleNotation } from '../../../core/ports/formations.port';

function pourcentage(part: number): string {
  return `${Math.round(part * 100)} %`;
}

export function phraseDeNotation(regle: RegleNotation): string {
  const neSaitPas = regle.neSaitPasCompteCommeReponse
    ? $localize`:@@presentateurNotationNeSaitPasCompte:« je ne sais pas » compte comme une réponse`
    : $localize`:@@presentateurNotationNeSaitPasNeComptePas:« je ne sais pas » ne compte pas comme une réponse`;
  const libres = regle.reponsesLibresNotees
    ? $localize`:@@presentateurNotationLibresNotees:les réponses libres sont notées`
    : $localize`:@@presentateurNotationLibresNonNotees:les réponses libres ne sont pas notées`;
  return $localize`:@@presentateurNotation:Note /${regle.noteMax}:noteMax: de participation relative à la cohorte : la participation de chacun est rapportée à celle des ${pourcentage(regle.partCohorteReference)}:reference: les plus actifs, et sous ${pourcentage(regle.ratioSeuilValidation)}:validation: de cette référence l’étudiant est signalé sous le seuil ; ${neSaitPas}:neSaitPas:, une non-réponse vaut ${regle.pointsNonReponse}:pointsNonReponse: point, ${libres}:libres: ; une question est jugée problématique sous ${pourcentage(regle.seuilQuestionProbleme)}:seuilProbleme: de réussite.`;
}
