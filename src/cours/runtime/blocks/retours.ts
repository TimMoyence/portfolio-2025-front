import type { QuestionRevelee } from '../../content/types';
import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { estObjet } from '../core/valeurs';

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
  readonly neSaitPas: boolean;
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

export function lireTextes(valeur: unknown): Readonly<Record<string, string>> {
  if (!estObjet(valeur)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(valeur).filter(
      (entree): entree is [string, string] => typeof entree[1] === 'string',
    ),
  );
}

export type CibleRevelee = Pick<QuestionRevelee, 'cible' | 'optionId'>;

export function lireCibleRevelee(valeur: unknown): CibleRevelee | null {
  if (!estObjet(valeur) || typeof valeur['cible'] !== 'string') {
    return null;
  }
  const optionId = valeur['optionId'];
  return { cible: valeur['cible'], optionId: typeof optionId === 'string' ? optionId : null };
}

function cibleTypee(valeur: unknown): CibleRevelee | null {
  return estObjet(valeur) && valeur['type'] === 'cible' ? lireCibleRevelee(valeur) : null;
}

export function lireBonneReponse(valeur: unknown): string | null {
  return cibleTypee(valeur)?.cible ?? null;
}

export function lireBonneOption(valeur: unknown): string | null {
  return cibleTypee(valeur)?.optionId ?? null;
}

export function marqueDeCorrection(juste: boolean | null): EscapedHtml {
  if (juste === null) {
    return escapeHtml('');
  }
  return safeHtml` data-correction="${escapeHtml(juste ? 'juste' : 'fausse')}"`;
}

export function marqueDOption(
  id: string,
  bonneOption: string | null,
  choisie: boolean,
): EscapedHtml {
  if (bonneOption === null || (id !== bonneOption && !choisie)) {
    return marqueDeCorrection(null);
  }
  return marqueDeCorrection(id === bonneOption);
}

const ENCADRE_CONFIRME = safeHtml`class="fp-encadre" data-etat="confirme"`;

export function bonneReponseRevelee(
  libelle: string,
  bonneReponse: string | null,
  forme: EscapedHtml = ENCADRE_CONFIRME,
): EscapedHtml {
  return bonneReponse === null
    ? escapeHtml('')
    : safeHtml`<p ${forme} data-testid="bonne-reponse">${escapeHtml(libelle)} ${escapeHtml(bonneReponse)}</p>`;
}

export function estVerdictDeReponse(valeur: unknown): valeur is VerdictDeReponse {
  return (
    estObjet(valeur) &&
    typeof valeur['questionId'] === 'string' &&
    typeof valeur['correcte'] === 'boolean' &&
    (valeur['libelleConfusion'] === null || typeof valeur['libelleConfusion'] === 'string')
  );
}

export class VerdictsParQuestion {
  private readonly parQuestion: ReadonlyMap<string, VerdictDeReponse>;

  constructor(valeur: unknown = null, retenir: (questionId: string) => boolean = () => true) {
    const verdicts = Array.isArray(valeur) ? valeur.filter(estVerdictDeReponse) : [];
    this.parQuestion = new Map(
      verdicts
        .filter((verdict) => retenir(verdict.questionId))
        .map((verdict) => [verdict.questionId, verdict]),
    );
  }

  a(questionId: string): boolean {
    return this.parQuestion.has(questionId);
  }

  de(questionId: string): VerdictDeReponse | null {
    return this.parQuestion.get(questionId) ?? null;
  }

  liste(): readonly VerdictDeReponse[] {
    return [...this.parQuestion.values()];
  }
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
    valeur['details'].every(estDetail) &&
    typeof valeur['neSaitPas'] === 'boolean'
  );
}
