import type {
  CoursContent,
  DerouleCours,
  EcranContent,
  EcranDeroule,
  GuideFormateur,
} from '../../../../cours/content/types';
import { annexeFormateurDeLEcran } from './annexe-formateur';
import type { QuestionDuPanneau } from './cours-panneau-question.component';
import { questionsDuPanneau } from './questions-du-panneau';

const ECRANS_DE_SEANCE_SEULEMENT: ReadonlySet<string> = new Set(['fp-pulse']);

const QUESTIONS_TIREES_EN_SEANCE: ReadonlySet<string> = new Set(['fp-spaced']);

const CORRIGES_DONNES_A_LA_SUITE: ReadonlySet<string> = new Set(['reflexion', 'revelation']);

const CORRIGES_SUR_PLACE: ReadonlySet<string> = new Set(['fp-worked']);

const ECRANS_SANS_INTITULE: ReadonlySet<string> = new Set(['fp-table-build', 'fp-challenge']);

export interface PageDuLivretEtudiant {
  readonly ecran: EcranContent;
  readonly titre: string | null;
}

type CleDuGuide = keyof GuideFormateur;

export interface RubriqueDuGuide {
  readonly cle: CleDuGuide;
  readonly libelle: string;
  readonly texte: string;
}

export interface PageDuCorrige {
  readonly ecran: EcranDeroule;
  readonly annexe: ReturnType<typeof annexeFormateurDeLEcran>;
  readonly reponses: readonly QuestionDuPanneau[];
  readonly guide: readonly RubriqueDuGuide[];
  readonly attendu: ReponseAttendue | null;
  readonly repeteLaSource: boolean;
}

export interface ReponseAttendue {
  readonly attendu: string;
  readonly suite: string;
}

const LIBELLES_DU_GUIDE: Readonly<Record<CleDuGuide, string>> = {
  aDire: $localize`:@@livretGuideADire:À dire`,
  question: $localize`:@@livretGuideQuestion:Question à poser`,
  reponse: $localize`:@@livretGuideReponse:Réponse attendue`,
  calcul: $localize`:@@livretGuideCalcul:Calcul`,
  relance: $localize`:@@livretGuideRelance:Relance`,
  transition: $localize`:@@livretGuideTransition:Transition`,
};

const ORDRE_DU_GUIDE: readonly CleDuGuide[] = [
  'aDire',
  'question',
  'reponse',
  'calcul',
  'relance',
  'transition',
];

function aTraiterSurPapier(ecran: EcranContent): boolean {
  return !ECRANS_DE_SEANCE_SEULEMENT.has(ecran.type);
}

function rubriquesDuGuide(guide: GuideFormateur | undefined): readonly RubriqueDuGuide[] {
  return ORDRE_DU_GUIDE.flatMap((cle) => {
    const texte = guide?.[cle];
    return texte === undefined || texte === ''
      ? []
      : [{ cle, libelle: LIBELLES_DU_GUIDE[cle], texte }];
  });
}

function reponseAttendue(ecran: EcranDeroule): ReponseAttendue | null {
  const corrige = ecran.corrigeEcran;
  return corrige?.type === 'reflexion' ? { attendu: corrige.attendu, suite: corrige.suite } : null;
}

function avecSaBanqueDeQuestions(ecran: EcranContent, corrige: DerouleCours): EcranContent {
  if (!QUESTIONS_TIREES_EN_SEANCE.has(ecran.type)) {
    return ecran;
  }
  return corrige.ecrans.find((candidat) => candidat.id === ecran.id) ?? ecran;
}

function reponseDonneeALaSuite(ecran: EcranContent, corrige: DerouleCours): boolean {
  if (QUESTIONS_TIREES_EN_SEANCE.has(ecran.type) || CORRIGES_SUR_PLACE.has(ecran.type)) {
    return true;
  }
  const deroule = corrige.ecrans.find((candidat) => candidat.id === ecran.id);
  const type = deroule?.corrigeEcran?.type;
  return (
    (deroule?.explications?.length ?? 0) > 0 ||
    (type !== undefined && CORRIGES_DONNES_A_LA_SUITE.has(type))
  );
}

function pageDuLivretEtudiant(ecran: EcranContent, corrige: DerouleCours): PageDuLivretEtudiant {
  return {
    ecran: avecSaBanqueDeQuestions(ecran, corrige),
    titre: ECRANS_SANS_INTITULE.has(ecran.type) ? (ecran.titre ?? null) : null,
  };
}

export function feuillesDuLivretEtudiant(
  sujet: CoursContent,
  corrige: DerouleCours,
): readonly (readonly PageDuLivretEtudiant[])[] {
  const feuilles: PageDuLivretEtudiant[][] = [[]];
  for (const ecran of sujet.ecrans) {
    if (ecran.ecranSource !== undefined) {
      feuilles.push([]);
    } else if (aTraiterSurPapier(ecran)) {
      feuilles[feuilles.length - 1].push(pageDuLivretEtudiant(ecran, corrige));
      if (reponseDonneeALaSuite(ecran, corrige)) {
        feuilles.push([]);
      }
    }
  }
  return feuilles.filter((feuille) => feuille.length > 0);
}

function repeteLaSource(ecran: EcranDeroule, corrige: DerouleCours): boolean {
  const source = corrige.ecrans.find((candidat) => candidat.id === ecran.ecranSource);
  return source !== undefined && source.type === ecran.type;
}

export function pagesDuCorrige(corrige: DerouleCours): readonly PageDuCorrige[] {
  return corrige.ecrans.filter(aTraiterSurPapier).map((ecran) => ({
    ecran,
    annexe: annexeFormateurDeLEcran(ecran),
    reponses: questionsDuPanneau(ecran),
    guide: rubriquesDuGuide(ecran.guide),
    attendu: reponseAttendue(ecran),
    repeteLaSource: repeteLaSource(ecran, corrige),
  }));
}
