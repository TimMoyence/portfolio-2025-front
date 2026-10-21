import type {
  CorrectionServieResponseDto,
  DerouleResponseDto,
  LivretResponseDto,
  SujetResponseDto,
} from '../../../../contrat/types.gen';
import type {
  CoursContent,
  DerouleCours,
  EcranContent,
  RevelationServie,
} from '../../../cours/content/types';
import type { LivretDuCours } from '../ports/formations.port';

export type SujetDuFil = SujetResponseDto;
export type DerouleDuFil = DerouleResponseDto;
export type LivretDuFil = LivretResponseDto;

interface EcranDuFil {
  readonly ecranCorrige?: string;
  readonly correction?: CorrectionServieResponseDto;
}

function revelationDuFil(correction: CorrectionServieResponseDto): RevelationServie {
  return {
    ecranId: correction.ecranId,
    questions: correction.questions.map(({ questionId, bonneReponse, optionId }) => ({
      questionId,
      cible: bonneReponse,
      optionId,
    })),
    annexe: correction.corrige,
    reflexion: correction.reflexion,
    ...(correction.explications === undefined ? {} : { explications: correction.explications }),
  };
}

function ecranDuFil<E extends EcranContent>(ecran: EcranDuFil): E {
  const { ecranCorrige, correction, ...reste } = ecran;
  return {
    ...reste,
    ...(ecranCorrige === undefined ? {} : { ecranSource: ecranCorrige }),
    ...(correction === undefined ? {} : { revelation: revelationDuFil(correction) }),
  } as unknown as E;
}

export function sujetDuFil(sujet: SujetDuFil): CoursContent {
  return { ...sujet, ecrans: sujet.ecrans.map((ecran) => ecranDuFil(ecran)) };
}

export function derouleDuFil(deroule: DerouleDuFil): DerouleCours {
  return { ...deroule, ecrans: deroule.ecrans.map((ecran) => ecranDuFil(ecran)) };
}

export function livretDuFil(livret: LivretDuFil): LivretDuCours {
  return {
    version: livret.version,
    sujet: sujetDuFil(livret.sujet),
    corrige: derouleDuFil(livret.corrige),
  };
}
