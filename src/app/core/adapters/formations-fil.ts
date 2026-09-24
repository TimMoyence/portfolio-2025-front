import type {
  CorrigeEcranPresentateur,
  CoursContent,
  DerouleCours,
  EcranContent,
  RevelationServie,
} from '../../../cours/content/types';

interface QuestionCorrigeeDuFil {
  readonly questionId: string;
  readonly bonneReponse: string;
  readonly optionId: string | null;
}

interface CorrectionDuFil {
  readonly ecranId: string;
  readonly questions: readonly QuestionCorrigeeDuFil[];
  readonly corrige: CorrigeEcranPresentateur | null;
  readonly reflexion: RevelationServie['reflexion'];
}

type EcranDuFil<E extends EcranContent> = Omit<E, 'ecranSource' | 'revelation'> & {
  readonly ecranCorrige?: string;
  readonly correction?: CorrectionDuFil;
};

export type SujetDuFil = Omit<CoursContent, 'ecrans'> & {
  readonly ecrans: readonly EcranDuFil<EcranContent>[];
};

export type DerouleDuFil = Omit<DerouleCours, 'ecrans'> & {
  readonly ecrans: readonly EcranDuFil<DerouleCours['ecrans'][number]>[];
};

function revelationDuFil(correction: CorrectionDuFil): RevelationServie {
  return {
    ecranId: correction.ecranId,
    questions: correction.questions.map(({ questionId, bonneReponse, optionId }) => ({
      questionId,
      cible: bonneReponse,
      optionId,
    })),
    annexe: correction.corrige,
    reflexion: correction.reflexion,
  };
}

function ecranDuFil<E extends EcranContent>(ecran: EcranDuFil<E>): E {
  const { ecranCorrige, correction, ...reste } = ecran;
  return {
    ...reste,
    ...(ecranCorrige === undefined ? {} : { ecranSource: ecranCorrige }),
    ...(correction === undefined ? {} : { revelation: revelationDuFil(correction) }),
  } as unknown as E;
}

export function sujetDuFil(sujet: SujetDuFil): CoursContent {
  return { ...sujet, ecrans: sujet.ecrans.map(ecranDuFil) };
}

export function derouleDuFil(deroule: DerouleDuFil): DerouleCours {
  return { ...deroule, ecrans: deroule.ecrans.map(ecranDuFil) };
}
