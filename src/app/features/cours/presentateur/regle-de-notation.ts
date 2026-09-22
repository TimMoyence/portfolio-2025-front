import type { ResumeBareme } from '../../../../cours/content/types';
import type { RegleNotation } from '../../../core/ports/formations.port';

function pourcentage(part: number): string {
  return `${Math.round(part * 100)} %`;
}

function phraseDuBareme(bareme: ResumeBareme | null): string {
  if (bareme === null) {
    return '';
  }
  const phrase = $localize`:@@presentateurNotationBareme:sur ${bareme.questionsNotees}:questionsNotees: questions notées comptent (votes, numérique, classement, feuille et tableau) ; « je ne sais pas » compte aussi pour une production ; une production vide est refusée ; énigmes et rappels sont exclus.`;
  return ` ${phrase}`;
}

export function phraseDeNotation(regle: RegleNotation, bareme: ResumeBareme | null = null): string {
  const neSaitPas = regle.neSaitPasCompteCommeReponse
    ? $localize`:@@presentateurNotationNeSaitPasCompte:« je ne sais pas » compte comme une réponse`
    : $localize`:@@presentateurNotationNeSaitPasNeComptePas:« je ne sais pas » ne compte pas comme une réponse`;
  const libres = regle.reponsesLibresNotees
    ? $localize`:@@presentateurNotationLibresNotees:les réponses libres sont notées`
    : $localize`:@@presentateurNotationLibresNonNotees:les réponses libres ne sont pas notées`;
  const phrase = $localize`:@@presentateurNotation:Note /${regle.noteMax}:noteMax: relative aux ${pourcentage(regle.partCohorteReference)}:reference: les plus actifs. Sous ${pourcentage(regle.ratioSeuilValidation)}:validation: de cette référence, l’étudiant est signalé sous le seuil. ${neSaitPas}:neSaitPas: ; une non-réponse vaut ${regle.pointsNonReponse}:pointsNonReponse: point ; ${libres}:libres:. Une question est problématique sous ${pourcentage(regle.seuilQuestionProbleme)}:seuilProbleme: de réussite.`;
  return `${phrase}${phraseDuBareme(bareme)}`;
}
