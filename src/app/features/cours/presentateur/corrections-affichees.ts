import type { EcranDeroule } from '../../../../cours/content/types';

export interface CorrectionAffichee {
  readonly enonce: string;
  readonly bonneReponse: string;
}

const NOMBRE_NU = /^-?\d+(\.\d+)?$/;
const NOMBRE_FRANCAIS = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });

export function enFrancais(reponse: string): string {
  return NOMBRE_NU.test(reponse.trim()) ? NOMBRE_FRANCAIS.format(Number(reponse)) : reponse;
}

export function correctionsAffichees(
  ecran: EcranDeroule | undefined,
): readonly CorrectionAffichee[] {
  return (ecran?.corriges ?? []).map((corrige) => ({
    enonce: ecran?.questions.find(({ id }) => id === corrige.questionId)?.enonce ?? '',
    bonneReponse: enFrancais(corrige.bonneReponse),
  }));
}
