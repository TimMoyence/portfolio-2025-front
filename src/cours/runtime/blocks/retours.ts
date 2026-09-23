export interface VerdictDeReponse {
  readonly questionId: string;
  readonly correcte: boolean;
  readonly libelleConfusion: string | null;
}

export interface DetailDeVerdict {
  readonly cle: string;
  readonly juste: boolean;
  readonly libelleConfusion: string | null;
}

export interface VerdictDeProduction {
  readonly questionId: string;
  readonly correcte: boolean;
  readonly score: number;
  readonly details: readonly DetailDeVerdict[];
}

export interface VerdictDeTentative {
  readonly parcoursId: string;
  readonly enigmeId: string;
  readonly correcte: boolean;
  readonly fragment: string | null;
  readonly tentativesRestantes: number;
}

export interface ProgressionDesEnigmes {
  readonly parcoursId: string;
  readonly resolues: readonly { readonly enigmeId: string; readonly fragment: string }[];
  readonly tentativesRestantes: Readonly<Record<string, number>>;
}

export interface StrategieServie {
  readonly id: string;
  readonly libelle: string;
  readonly fausse?: boolean;
}

export interface ConceptMaitrise {
  readonly concept: string;
  readonly libelle: string;
  readonly boite1: number;
  readonly boite2: number;
  readonly boite3: number;
  readonly nonVus: number;
}

export const PROPRIETE_FORMATEUR = 'corrige';

export function estObjet(valeur: unknown): valeur is Readonly<Record<string, unknown>> {
  return typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur);
}

export function lireBonneReponse(valeur: unknown): string | null {
  if (!estObjet(valeur) || valeur['type'] !== 'cible') {
    return null;
  }
  const bonneReponse = valeur['cible'];
  return typeof bonneReponse === 'string' ? bonneReponse : null;
}

export function estVerdictDeReponse(valeur: unknown): valeur is VerdictDeReponse {
  return (
    estObjet(valeur) &&
    typeof valeur['questionId'] === 'string' &&
    typeof valeur['correcte'] === 'boolean' &&
    (valeur['libelleConfusion'] === null || typeof valeur['libelleConfusion'] === 'string')
  );
}

function estDetail(valeur: unknown): valeur is DetailDeVerdict {
  return (
    estObjet(valeur) &&
    typeof valeur['cle'] === 'string' &&
    typeof valeur['juste'] === 'boolean' &&
    (valeur['libelleConfusion'] === null || typeof valeur['libelleConfusion'] === 'string')
  );
}

export function estVerdictDeProduction(valeur: unknown): valeur is VerdictDeProduction {
  return (
    estObjet(valeur) &&
    typeof valeur['questionId'] === 'string' &&
    typeof valeur['correcte'] === 'boolean' &&
    typeof valeur['score'] === 'number' &&
    Array.isArray(valeur['details']) &&
    valeur['details'].every(estDetail)
  );
}
