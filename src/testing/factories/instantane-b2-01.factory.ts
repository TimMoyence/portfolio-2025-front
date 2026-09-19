import type { EcranContent } from '../../cours/content/types';
import type { DonneesParBrique } from '../../cours/runtime/blocks/donnees-publiques';
import {
  buildCardsortPlan,
  buildChallengeProbleme,
  buildConcept4Definition,
  buildEcran,
  buildEscapeParcours,
  buildExitBillet,
  buildNumericQuestion,
  buildPlotDefinition,
  buildProCas,
  buildPulseSondage,
  buildRecallQuestion,
  buildSheetPlan,
  buildSpacedRappel,
  buildStoryRecit,
  buildTableBuildPlan,
  buildVoteQuestion,
  buildWorkedExemple,
} from './cours.factory';
import { buildVisualQuizSlide, buildVisualSlide } from './visual-slide.factory';

export function buildDonneesParBrique(): DonneesParBrique {
  const numerique = buildNumericQuestion();
  const vote = buildVoteQuestion();
  return {
    'fp-story': { recit: buildStoryRecit() },
    'fp-pro': { cas: buildProCas() },
    'fp-worked': { exemple: buildWorkedExemple(), etayage: 2 },
    'fp-concept4': { definition: buildConcept4Definition() },
    'fp-plot': {
      definition: { ...buildPlotDefinition(), description: 'Deux courbes à comparer.' },
    },
    'fp-challenge': { probleme: { ...buildChallengeProbleme(), strategies: [] } },
    'fp-cardsort': { plan: { ...buildCardsortPlan(), dureeJeuMs: 240000 } },
    'fp-sheet': { plan: { ...buildSheetPlan(), consignes: ['En C3, calculez le montant HT.'] } },
    'fp-table-build': { plan: buildTableBuildPlan() },
    'fp-escape': { parcours: buildEscapeParcours() },
    'fp-pulse': { sondage: buildPulseSondage() },
    'fp-spaced': { rappel: buildSpacedRappel() },
    'fp-numeric': { question: numerique },
    'fp-vote': { question: vote, questionJumelle: buildVoteQuestion({ id: 'Q-CAP-03-bis' }) },
    'fp-recall': { question: buildRecallQuestion(), delaiMs: 8000 },
    'fp-exit': { billet: buildExitBillet() },
    questionnaire: {
      intitule: 'Atelier 1 — Lire, rapporter, estimer',
      consigne: 'Répondez seul, sans calculatrice, dans l’ordre.',
      regime: 'focus',
      ordre: 'fixe',
      questions: [
        { brique: 'fp-numeric', donnees: { question: numerique } },
        { brique: 'fp-vote', donnees: { question: vote } },
      ],
    },
    'ecran-verrouille': {},
  };
}

export function buildInstantaneDeSubstitution(): readonly EcranContent[] {
  const parBrique = Object.entries(buildDonneesParBrique()).map(([type, donnees], rang) =>
    buildEcran({
      id: `b2-01-substitution-${String(rang + 1).padStart(2, '0')}`,
      type,
      titre: `Écran ${type}`,
      duree: 5,
      interactif: type !== 'ecran-verrouille',
      donnees: { ...donnees },
    }),
  );
  return [...parBrique, buildVisualSlide(), buildVisualQuizSlide()];
}
