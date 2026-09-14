import {
  type CoursContent,
  type EcranContent,
  creerMetadonneesBrique,
} from '../../cours/content/types';
import type { CardsortPlan } from '../../cours/runtime/blocks/FpCardsort';
import type { ChallengeProbleme } from '../../cours/runtime/blocks/FpChallenge';
import type { Concept4Definition } from '../../cours/runtime/blocks/FpConcept4';
import type { EscapeParcours } from '../../cours/runtime/blocks/FpEscape';
import type { ExitBillet } from '../../cours/runtime/blocks/FpExit';
import type { NumericQuestion } from '../../cours/runtime/blocks/FpNumeric';
import type { PlotDefinition } from '../../cours/runtime/blocks/FpPlot';
import type { ProCas } from '../../cours/runtime/blocks/FpPro';
import type { PulseSondage } from '../../cours/runtime/blocks/FpPulse';
import type { QuoteCitation } from '../../cours/runtime/blocks/FpQuote';
import type { RecallQuestion } from '../../cours/runtime/blocks/FpRecall';
import type { SheetPlan } from '../../cours/runtime/blocks/FpSheet';
import type { SpacedQuestion } from '../../cours/runtime/blocks/FpSpaced';
import type { StoryRecit } from '../../cours/runtime/blocks/FpStory';
import type { TableBuildPlan, TableColonne } from '../../cours/runtime/blocks/FpTableBuild';
import type { VoteQuestion } from '../../cours/runtime/blocks/FpVote';
import type { WorkedExemple } from '../../cours/runtime/blocks/FpWorked';
import type { DeckState } from '../../cours/runtime/core/state';

export function buildEcran(overrides: Partial<EcranContent> = {}): EcranContent {
  return {
    id: 'ecran-1',
    type: 'vote',
    duree: 180,
    interactif: true,
    ...overrides,
  };
}

export function buildEcranQuestionnaire(overrides: Partial<EcranContent> = {}): EcranContent {
  return buildEcran({
    id: 'ecran-questionnaire',
    type: 'questionnaire',
    duree: 600,
    donnees: {
      regime: 'focus',
      questions: [
        { brique: 'fp-numeric', donnees: { question: buildNumericQuestion() } },
        { brique: 'fp-vote', donnees: { question: buildVoteQuestion() } },
      ],
    },
    ...overrides,
  });
}

export function buildCoursContent(overrides: Partial<CoursContent> = {}): CoursContent {
  return {
    id: 'b1-09-interets-composes',
    titre: 'Faire fructifier : interets composes et capitalisation',
    niveau: 'B1',
    duree: 210,
    concepts: ['capitalisation', 'valeur-acquise'],
    ecrans: [
      buildEcran({ id: 'ecran-1' }),
      buildEcran({ id: 'ecran-2' }),
      buildEcran({ id: 'ecran-3', interactif: false }),
      buildEcran({ id: 'ecran-4' }),
    ],
    ...overrides,
  };
}

export function buildVoteQuestion(overrides: Partial<VoteQuestion> = {}): VoteQuestion {
  return {
    id: 'Q-CAP-03',
    enonce: 'Un capital de 1 000 € place a 4 % pendant 10 ans vaut :',
    options: [
      { id: 'a', libelle: '1 400 €', misconception: 'interet-simple' },
      { id: 'b', libelle: '1 480,24 €', misconception: null },
      { id: 'c', libelle: '1 040 €', misconception: 'oubli-de-la-duree' },
    ],
    metadonnees: creerMetadonneesBrique({
      concepts: ['capitalisation', 'valeur-acquise'],
      misconceptionsCiblees: ['interet-simple', 'oubli-de-la-duree'],
      dureeMinutes: 3,
      modalite: 'classe',
      regime: 'ouvert',
    }),
    ...overrides,
  };
}

export function buildNumericQuestion(overrides: Partial<NumericQuestion> = {}): NumericQuestion {
  return {
    id: 'Q-VA-07',
    enonce: 'Quelle est la valeur acquise, au centime pres ?',
    unite: '€',
    metadonnees: creerMetadonneesBrique({
      concepts: ['capitalisation', 'valeur-acquise'],
      misconceptionsCiblees: ['interet-simple'],
      dureeMinutes: 3,
      modalite: 'solo',
      regime: 'focus',
    }),
    tolerance: { type: 'absolue', valeur: 0.01 },
    valeurAttendue: 1480.24,
    ...overrides,
  };
}

export function buildRecallQuestion(overrides: Partial<RecallQuestion> = {}): RecallQuestion {
  return {
    id: 'Q-RAPPEL-04',
    enonce: 'Sans vos notes : comment passe-t-on d une valeur actuelle a une valeur acquise ?',
    options: [
      { id: 'a', libelle: 'On multiplie par (1 + i) puissance n', misconception: null },
      { id: 'b', libelle: 'On multiplie par 1 + i fois n', misconception: 'interet-simple' },
      { id: 'c', libelle: 'On divise par (1 + i) puissance n', misconception: 'sens-inverse' },
    ],
    metadonnees: creerMetadonneesBrique({
      concepts: ['capitalisation'],
      misconceptionsCiblees: ['interet-simple', 'sens-inverse'],
      dureeMinutes: 4,
      modalite: 'solo',
      regime: 'examen',
    }),
    ...overrides,
  };
}

export function buildExitBillet(overrides: Partial<ExitBillet> = {}): ExitBillet {
  return {
    id: 'B-SORTIE-09',
    question: 'Le taux equivalent mensuel d un taux annuel de 12 % vaut :',
    invite: 'Qu est-ce qui reste flou ?',
    options: [
      { id: 'a', libelle: 'Un peu moins de 1 %', misconception: null },
      { id: 'b', libelle: 'Exactement 1 %', misconception: 'proportionnalite' },
      { id: 'c', libelle: 'Un peu plus de 1 %', misconception: 'sens-inverse' },
    ],
    metadonnees: creerMetadonneesBrique({
      concepts: ['taux-equivalent'],
      misconceptionsCiblees: ['proportionnalite'],
      dureeMinutes: 5,
      modalite: 'solo',
      regime: 'ouvert',
    }),
    ...overrides,
  };
}

export function buildPulseSondage(overrides: Partial<PulseSondage> = {}): PulseSondage {
  return {
    id: 'P-PULSE-02',
    invite: 'Ou en etes-vous sur le passage du taux annuel au taux mensuel ?',
    metadonnees: creerMetadonneesBrique({
      concepts: ['taux-equivalent'],
      misconceptionsCiblees: ['proportionnalite'],
      dureeMinutes: 1,
      modalite: 'classe',
      regime: 'ouvert',
    }),
    ...overrides,
  };
}

export function buildChallengeProbleme(
  overrides: Partial<ChallengeProbleme> = {},
): ChallengeProbleme {
  return {
    id: 'D-DEFI-05',
    enonce:
      'Un capital double en combien d annees a 7 % par an ? Cherchez sans formule, estimez et expliquez.',
    invite: 'Ecrivez votre tentative et la maniere dont vous avez raisonne',
    strategies: [
      { id: 'a', libelle: 'Diviser 100 par 7 et arrondir', fausse: true },
      {
        id: 'b',
        libelle: 'Ajouter 7 % au capital annee apres annee jusqu a depasser le double',
        fausse: false,
      },
      { id: 'c', libelle: 'Multiplier 7 % par 2 pour obtenir la duree', fausse: true },
    ],
    metadonnees: creerMetadonneesBrique({
      concepts: ['capitalisation'],
      misconceptionsCiblees: ['interet-simple'],
      dureeMinutes: 7,
      modalite: 'binome',
      regime: 'ouvert',
    }),
    ...overrides,
  };
}

export function buildQuoteCitation(overrides: Partial<QuoteCitation> = {}): QuoteCitation {
  return {
    id: 'C-CITATION-01',
    texte: 'L interet compose est la huitieme merveille du monde : qui le comprend le percoit.',
    auteur: 'Mayer Amschel Rothschild',
    source: 'attribue',
    metadonnees: creerMetadonneesBrique({
      concepts: ['capitalisation'],
      misconceptionsCiblees: ['interet-simple'],
      dureeMinutes: 1,
      modalite: 'classe',
      regime: 'ouvert',
    }),
    ...overrides,
  };
}

export function buildStoryRecit(overrides: Partial<StoryRecit> = {}): StoryRecit {
  return {
    id: 'R-RECIT-03',
    titre: 'Le livret ouvert a la naissance',
    paragraphes: [
      'En 2008, les parents de Sofia deposent 500 € sur un livret ouvert le jour de sa naissance.',
      'Personne n y touche pendant dix-huit ans : chaque annee, les interets rejoignent le capital.',
      'Le jour de ses dix-huit ans, Sofia ne retrouve pas 500 € augmentes d un peu : elle retrouve un capital qui a travaille pour elle.',
    ],
    metadonnees: creerMetadonneesBrique({
      concepts: ['capitalisation', 'valeur-acquise'],
      misconceptionsCiblees: ['interet-simple'],
      dureeMinutes: 3,
      modalite: 'classe',
      regime: 'ouvert',
    }),
    ...overrides,
  };
}

export function buildProCas(overrides: Partial<ProCas> = {}): ProCas {
  return {
    id: 'M-METIER-06',
    metier: 'Gestionnaire de credit en agence',
    situation:
      'Un client compare deux offres de pret : 4,2 % sur douze mois et 0,35 % par mois sur la meme duree.',
    geste:
      'Ramener les deux taux a la meme periode avant de comparer : on eleve (1 + i) a la puissance 12, on ne multiplie pas par 12.',
    consequence:
      'Annoncer le mauvais taux equivalent engage l agence sur un cout que le client decouvrira a la premiere echeance.',
    metadonnees: creerMetadonneesBrique({
      concepts: ['taux-equivalent'],
      misconceptionsCiblees: ['proportionnalite'],
      dureeMinutes: 4,
      modalite: 'binome',
      regime: 'ouvert',
    }),
    ...overrides,
  };
}

export function buildConcept4Definition(
  overrides: Partial<Concept4Definition> = {},
): Concept4Definition {
  return {
    id: 'K-QUATRE-FACES-01',
    parametres: [
      { cle: 'C', libelle: 'Capital place en euros', min: 100, max: 5000, pas: 100, defaut: 1000 },
      { cle: 'i', libelle: 'Taux annuel en pourcent', min: 1, max: 10, pas: 0.5, defaut: 4 },
      { cle: 'n', libelle: 'Duree en annees', min: 1, max: 30, pas: 1, defaut: 10 },
    ],
    formuleLatexSimplifie: 'C × (1 + i)^n',
    calcul: 'C*(1+i/100)^n',
    phrase: 'Un capital de {C} € placé à {i} % pendant {n} an(s) devient {resultat} €.',
    metadonnees: creerMetadonneesBrique({
      concepts: ['capitalisation', 'valeur-acquise'],
      misconceptionsCiblees: ['interet-simple'],
      dureeMinutes: 6,
      modalite: 'binome',
      regime: 'ouvert',
    }),
    ...overrides,
  };
}

export function buildWorkedExemple(overrides: Partial<WorkedExemple> = {}): WorkedExemple {
  return {
    id: 'K-RESOLU-01',
    enonce: 'Un capital de 1 000 € est place a 4 % pendant 3 ans : calculez la valeur acquise.',
    etapes: [
      {
        id: 'e1',
        intitule: 'Relever les donnees',
        raisonnement: 'C = 1 000 €, i = 4 % soit 0,04, n = 3 ans.',
        invite: 'Pourquoi ecrire le taux en decimal avant de calculer ?',
      },
      {
        id: 'e2',
        intitule: 'Choisir la formule',
        raisonnement: 'La valeur acquise vaut C × (1 + i)^n car les interets se capitalisent.',
        invite: 'Pourquoi une puissance plutot qu une multiplication par 3 ?',
      },
      {
        id: 'e3',
        intitule: 'Remplacer les valeurs',
        raisonnement: '1 000 × (1 + 0,04)^3 = 1 000 × 1,124864.',
        invite: 'Pourquoi eleve-t-on 1,04 et non 0,04 a la puissance 3 ?',
      },
      {
        id: 'e4',
        intitule: 'Conclure',
        raisonnement: 'La valeur acquise est de 1 124,86 € au bout de trois ans.',
        invite: 'Pourquoi arrondir seulement a la fin du calcul ?',
      },
    ],
    metadonnees: creerMetadonneesBrique({
      concepts: ['capitalisation', 'valeur-acquise'],
      misconceptionsCiblees: ['interet-simple'],
      dureeMinutes: 8,
      modalite: 'solo',
      regime: 'focus',
    }),
    ...overrides,
  };
}

export function buildPlotDefinition(overrides: Partial<PlotDefinition> = {}): PlotDefinition {
  return {
    id: 'K-COURBE-01',
    abscisse: { libelle: 'Duree en annees', min: 0, max: 20 },
    ordonnee: 'Capital acquis en euros',
    parametres: [
      { cle: 'C', libelle: 'Capital place en euros', min: 100, max: 5000, pas: 100, defaut: 1000 },
      { cle: 'i', libelle: 'Taux annuel en pourcent', min: 1, max: 10, pas: 0.5, defaut: 4 },
    ],
    series: [
      {
        id: 'compose',
        libelle: 'Interets composes',
        trait: 'plein',
        calcul: 'C*(1+i/100)^x',
      },
      {
        id: 'simple',
        libelle: 'Interets simples',
        trait: 'tirets',
        calcul: 'C*(1+i/100*x)',
      },
    ],
    metadonnees: creerMetadonneesBrique({
      concepts: ['capitalisation', 'interet-simple'],
      misconceptionsCiblees: ['croissance-lineaire'],
      dureeMinutes: 7,
      modalite: 'binome',
      regime: 'ouvert',
    }),
    ...overrides,
  };
}

const COLONNES_AMORTISSEMENT: readonly TableColonne[] = [
  {
    cle: 'crd',
    intitule: 'Capital restant du',
    role: 'deduite',
    calcul: (contexte) =>
      contexte.precedente === null
        ? contexte.parametres['montant']
        : contexte.precedente['crd'] - contexte.precedente['amortissement'],
    soldeDe: null,
    totalise: false,
  },
  {
    cle: 'interets',
    intitule: 'Interets',
    role: 'saisie',
    calcul: null,
    soldeDe: null,
    totalise: true,
  },
  {
    cle: 'amortissement',
    intitule: 'Amortissement',
    role: 'deduite',
    calcul: (contexte) => contexte.parametres['annuite'] - contexte.ligne['interets'],
    soldeDe: 'crd',
    totalise: true,
  },
  {
    cle: 'annuite',
    intitule: 'Annuite',
    role: 'deduite',
    calcul: (contexte) => contexte.ligne['interets'] + contexte.ligne['amortissement'],
    soldeDe: null,
    totalise: true,
  },
];

export function buildTableBuildPlan(overrides: Partial<TableBuildPlan> = {}): TableBuildPlan {
  return {
    id: 'K-AMORTISSEMENT-01',
    intitule: 'Emprunt de 10 000 € a 3 % sur 5 ans, annuites constantes',
    echeances: 5,
    parametres: { montant: 10000, taux: 0.03, annuite: 2183.55 },
    colonnes: COLONNES_AMORTISSEMENT,
    metadonnees: creerMetadonneesBrique({
      concepts: ['emprunt-indivis', 'amortissement'],
      misconceptionsCiblees: ['amortissement-constant'],
      dureeMinutes: 12,
      modalite: 'solo',
      regime: 'focus',
    }),
    attendus: [
      { rang: 0, cle: 'interets', valeur: 300 },
      { rang: 1, cle: 'interets', valeur: 243.49 },
      { rang: 2, cle: 'interets', valeur: 185.29 },
      { rang: 3, cle: 'interets', valeur: 125.34 },
      { rang: 4, cle: 'interets', valeur: 63.6 },
    ],
    tolerance: { type: 'absolue', valeur: 0.01 },
    ...overrides,
  };
}

export function buildCardsortPlan(overrides: Partial<CardsortPlan> = {}): CardsortPlan {
  return {
    id: 'K-CHARGES-01',
    intitule: 'Classez chaque charge selon sa reaction au volume produit',
    cartes: [
      { id: 'loyer', libelle: 'Loyer de l atelier' },
      { id: 'matieres', libelle: 'Achat de matieres premieres' },
      { id: 'assurance', libelle: 'Prime d assurance annuelle' },
      { id: 'commissions', libelle: 'Commissions versees sur les ventes' },
      { id: 'gerant', libelle: 'Salaire fixe du gerant' },
      { id: 'energie', libelle: 'Energie consommee par les machines' },
    ],
    categories: [
      { id: 'fixe', libelle: 'Charges fixes' },
      { id: 'variable', libelle: 'Charges variables' },
    ],
    metadonnees: creerMetadonneesBrique({
      concepts: ['charges-fixes', 'charges-variables'],
      misconceptionsCiblees: ['charge-fixe-par-unite'],
      dureeMinutes: 8,
      modalite: 'binome',
      regime: 'ouvert',
    }),
    attendus: [
      { carteId: 'loyer', categorieId: 'fixe' },
      { carteId: 'matieres', categorieId: 'variable' },
      { carteId: 'assurance', categorieId: 'fixe' },
      { carteId: 'commissions', categorieId: 'variable' },
      { carteId: 'gerant', categorieId: 'fixe' },
      { carteId: 'energie', categorieId: 'variable' },
    ],
    ...overrides,
  };
}

export function buildSheetPlan(overrides: Partial<SheetPlan> = {}): SheetPlan {
  return {
    id: 'K-TABLEUR-01',
    intitule: 'Facture : quantites, prix unitaires et total TTC',
    lignes: 6,
    colonnes: 4,
    cellules: {
      A1: 'Taux de TVA',
      B1: '0,2',
      A2: 'Quantite',
      B2: 'Prix unitaire',
      C2: 'Montant HT',
      D2: 'Montant TTC',
      A3: '12',
      B3: '4,5',
      A4: '3',
      B4: '120',
      A5: '7',
      B5: '18,9',
    },
    verrouillees: ['A1', 'B1', 'A2', 'B2', 'C2', 'D2', 'A3', 'B3', 'A4', 'B4', 'A5', 'B5'],
    metadonnees: creerMetadonneesBrique({
      concepts: ['tableur', 'pourcentage'],
      misconceptionsCiblees: ['reference-relative-figee'],
      dureeMinutes: 15,
      modalite: 'binome',
      regime: 'focus',
    }),
    attendus: [
      { reference: 'C3', valeur: 54 },
      { reference: 'D3', valeur: 64.8 },
    ],
    ...overrides,
  };
}

export function buildEscapeParcours(overrides: Partial<EscapeParcours> = {}): EscapeParcours {
  return {
    id: 'K-EVASION-01',
    intitule: 'Ouvrez le coffre du service comptable',
    delaiIndiceMs: 120000,
    budgetEnigmeMs: 360000,
    enigmes: [
      {
        id: 'seuil',
        intitule: 'Le seuil de rentabilite',
        enonce: 'Charges fixes 12 000 EUR, taux de marge sur cout variable 40 %. Quel seuil ?',
        indice: 'Divisez les charges fixes par le taux de marge sur cout variable',
        solution: '30000',
        fragment: 'TR',
      },
      {
        id: 'marge',
        intitule: 'La marge commerciale',
        enonce: 'Ventes 80 000 EUR, achats revendus 50 000 EUR. Quelle marge commerciale ?',
        indice: 'La marge commerciale est la difference entre les ventes et les achats revendus',
        solution: '30000',
        fragment: 'ES',
      },
      {
        id: 'tva',
        intitule: 'La TVA a decaisser',
        enonce: 'TVA collectee 4 200 EUR, TVA deductible 1 700 EUR. Combien decaisser ?',
        indice: 'Retranchez la TVA deductible de la TVA collectee',
        solution: '2500',
        fragment: 'OR',
      },
    ],
    metadonnees: creerMetadonneesBrique({
      concepts: ['seuil-de-rentabilite', 'marge-commerciale', 'tva'],
      misconceptionsCiblees: ['tva-collectee-confondue-avec-tva-a-decaisser'],
      dureeMinutes: 25,
      modalite: 'groupe',
      regime: 'ouvert',
    }),
    ...overrides,
  };
}

export function buildSpacedQuestion(overrides: Partial<SpacedQuestion> = {}): SpacedQuestion {
  return {
    questionId: 'Q-ACT-01',
    concept: 'actualisation',
    boite: 1,
    cours: 'Seance 3 — Actualisation',
    enonce: 'Que vaut aujourd hui un encaissement de 1 000 EUR dans un an, au taux de 5 % ?',
    options: [
      { id: 'act-a', libelle: '952,38 EUR', misconception: null },
      {
        id: 'act-b',
        libelle: '1 050,00 EUR',
        misconception: 'actualisation-confondue-avec-capitalisation',
      },
      { id: 'act-c', libelle: '1 000,00 EUR', misconception: 'valeur-temps-de-l-argent-ignoree' },
      { id: 'act-d', libelle: '950,00 EUR', misconception: 'taux-applique-en-interet-simple' },
    ],
    metadonnees: creerMetadonneesBrique({
      concepts: ['actualisation'],
      misconceptionsCiblees: ['actualisation-confondue-avec-capitalisation'],
      dureeMinutes: 2,
      modalite: 'solo',
      regime: 'examen',
    }),
    ...overrides,
  };
}

export function buildSpacedQuestions(): SpacedQuestion[] {
  return [
    buildSpacedQuestion(),
    buildSpacedQuestion({
      questionId: 'Q-VAN-02',
      concept: 'valeur-actuelle-nette',
      boite: 2,
      cours: 'Seance 5 — Choix d investissement',
      enonce: 'Un projet dont la VAN est negative au taux exige doit-il etre retenu ?',
      options: [
        { id: 'van-a', libelle: 'Non, il detruit de la valeur', misconception: null },
        {
          id: 'van-b',
          libelle: 'Oui, si le TRI est positif',
          misconception: 'tri-positif-confondu-avec-projet-rentable',
        },
      ],
    }),
    buildSpacedQuestion({
      questionId: 'Q-AMO-03',
      concept: 'amortissement',
      boite: 3,
      cours: 'Seance 2 — Amortissements',
      enonce: 'L amortissement lineaire fait-il sortir de la tresorerie chaque annee ?',
      options: [
        { id: 'amo-a', libelle: 'Non, c est une charge calculee', misconception: null },
        {
          id: 'amo-b',
          libelle: 'Oui, du montant de l annuite',
          misconception: 'charge-calculee-confondue-avec-decaissement',
        },
      ],
    }),
  ];
}

export function buildDeckState(overrides: Partial<DeckState> = {}): DeckState {
  return {
    coursId: 'b1-09-interets-composes',
    ecranCourant: 0,
    modeRythme: 'pilote',
    intervalleLibre: null,
    reponses: {},
    majLe: '2026-09-11T08:00:00.000Z',
    ...overrides,
  };
}
