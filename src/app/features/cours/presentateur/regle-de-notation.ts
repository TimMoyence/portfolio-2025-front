import type { ResumeBareme } from '../../../../cours/content/types';
import { formaterPart } from '../../../../cours/runtime/core/typographie';
import type { RegleNotation } from '../../../core/ports/formations.port';

type TypeDuBareme = keyof ResumeBareme['parType'];

const LIBELLES_DES_TYPES: Readonly<Record<TypeDuBareme, string>> = {
  vote: $localize`:@@presentateurNotationTypeVote:votes`,
  numeric: $localize`:@@presentateurNotationTypeNumerique:numérique`,
  classement: $localize`:@@presentateurNotationTypeClassement:classement`,
  feuille: $localize`:@@presentateurNotationTypeFeuille:feuille`,
  tableau: $localize`:@@presentateurNotationTypeTableau:tableau`,
  enigme: $localize`:@@presentateurNotationTypeEnigme:énigmes`,
};

function typesOu(
  bareme: ResumeBareme,
  retenu: (decompte: ResumeBareme['parType'][TypeDuBareme]) => boolean,
): string {
  const types = (Object.keys(bareme.parType) as TypeDuBareme[]).filter((type) =>
    retenu(bareme.parType[type]),
  );
  return new Intl.ListFormat($localize.locale ?? 'fr', { type: 'conjunction' }).format(
    types.map((type) => LIBELLES_DES_TYPES[type]),
  );
}

function phraseDuBareme(bareme: ResumeBareme | null): string {
  if (bareme === null) {
    return '';
  }
  const notes = typesOu(bareme, ({ notees }) => notees > 0);
  const exclus = typesOu(bareme, ({ notees, nonNotees }) => notees === 0 && nonNotees > 0);
  const phrase = $localize`:@@presentateurNotationBareme:sur ${bareme.questionsNotees}:questionsNotees: questions notées comptent (${notes}:typesNotes:) ; « je ne sais pas » compte aussi pour une production ; une production vide est refusée.`;
  if (exclus === '') {
    return ` ${phrase}`;
  }
  const exclusion = $localize`:@@presentateurNotationExclus:Ne comptent pas : ${exclus}:typesExclus:.`;
  return ` ${phrase} ${exclusion}`;
}

export function phraseDeNotation(regle: RegleNotation, bareme: ResumeBareme | null = null): string {
  const neSaitPas = regle.neSaitPasCompteCommeReponse
    ? $localize`:@@presentateurNotationNeSaitPasCompte:« je ne sais pas » compte comme une réponse`
    : $localize`:@@presentateurNotationNeSaitPasNeComptePas:« je ne sais pas » ne compte pas comme une réponse`;
  const libres = regle.reponsesLibresNotees
    ? $localize`:@@presentateurNotationLibresNotees:les réponses libres sont notées`
    : $localize`:@@presentateurNotationLibresNonNotees:les réponses libres ne sont pas notées`;
  const phrase = $localize`:@@presentateurNotation:Note /${regle.noteMax}:noteMax: relative aux ${formaterPart(regle.partCohorteReference)}:reference: les plus actifs. Sous ${formaterPart(regle.ratioSeuilValidation)}:validation: de cette référence, l’étudiant est signalé sous le seuil. ${neSaitPas}:neSaitPas: ; une non-réponse vaut ${regle.pointsNonReponse}:pointsNonReponse: point ; ${libres}:libres:. Une question est problématique sous ${formaterPart(regle.seuilQuestionProbleme)}:seuilProbleme: de réussite.`;
  return `${phrase}${phraseDuBareme(bareme)}`;
}
