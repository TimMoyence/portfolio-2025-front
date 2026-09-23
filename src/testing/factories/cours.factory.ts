import {
  type CoursContent,
  type EcranContent,
  type MetadonneesBrique,
  creerMetadonneesBrique,
} from '../../cours/content/types';
import type { CardsortPlanPublic } from '../../cours/runtime/blocks/FpCardsort';
import type { ChallengeProblemePublic } from '../../cours/runtime/blocks/FpChallenge';
import type { Concept4Definition } from '../../cours/runtime/blocks/FpConcept4';
import type { EscapeParcoursPublic } from '../../cours/runtime/blocks/FpEscape';
import type { ExitBilletPublic } from '../../cours/runtime/blocks/FpExit';
import type { NumericQuestionPublique } from '../../cours/runtime/blocks/FpNumeric';
import type { PlotDefinition } from '../../cours/runtime/blocks/FpPlot';
import type { ProCas } from '../../cours/runtime/blocks/FpPro';
import type { PulseSondage } from '../../cours/runtime/blocks/FpPulse';
import type { QuoteCitation } from '../../cours/runtime/blocks/FpQuote';
import type { RecallQuestionPublique } from '../../cours/runtime/blocks/FpRecall';
import type { SheetPlanPublic } from '../../cours/runtime/blocks/FpSheet';
import type { SpacedQuestionPublique, SpacedRappel } from '../../cours/runtime/blocks/FpSpaced';
import type { StoryRecit } from '../../cours/runtime/blocks/FpStory';
import type { TableBuildPlanPublic } from '../../cours/runtime/blocks/FpTableBuild';
import type { VoteQuestionPublique } from '../../cours/runtime/blocks/FpVote';
import type { WorkedExemple } from '../../cours/runtime/blocks/FpWorked';
import type {
  ProgressionDesEnigmes,
  StrategieServie,
  VerdictDeProduction,
  VerdictDeReponse,
  VerdictDeTentative,
} from '../../cours/runtime/blocks/retours';
import type { Brouillons } from '../../cours/runtime/core/storage';

function metadonnees(overrides: Partial<MetadonneesBrique> = {}): MetadonneesBrique {
  return creerMetadonneesBrique({
    concepts: ['capitalisation'],
    misconceptionsCiblees: [],
    dureeMinutes: 3,
    modalite: 'solo',
    regime: 'ouvert',
    ...overrides,
  });
}

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
    duree: 14,
    donnees: {
      intitule: 'Atelier 1 — Lire, rapporter, estimer',
      consigne: 'Répondez seul, sans calculatrice, dans l’ordre.',
      regime: 'focus',
      ordre: 'fixe',
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

export function buildVoteQuestion(
  overrides: Partial<VoteQuestionPublique> = {},
): VoteQuestionPublique {
  return {
    id: 'Q-CAP-03',
    enonce: 'Un capital de 1 000 € place a 4 % pendant 10 ans vaut :',
    options: [
      { id: 'a', libelle: '1 400 €' },
      { id: 'b', libelle: '1 480,24 €' },
      { id: 'c', libelle: '1 040 €' },
    ],
    ...overrides,
  };
}

export function buildNumericQuestion(
  overrides: Partial<NumericQuestionPublique> = {},
): NumericQuestionPublique {
  return {
    id: 'Q-VA-07',
    enonce: 'Quelle est la valeur acquise, au centime pres ?',
    unite: '€',
    metadonnees: metadonnees({ concepts: ['capitalisation', 'valeur-acquise'], regime: 'focus' }),
    ...overrides,
  };
}

export function buildRecallQuestion(
  overrides: Partial<RecallQuestionPublique> = {},
): RecallQuestionPublique {
  return {
    id: 'Q-RAPPEL-04',
    enonce: 'Sans vos notes : comment passe-t-on d une valeur actuelle a une valeur acquise ?',
    options: [
      { id: 'a', libelle: 'On multiplie par (1 + i) puissance n' },
      { id: 'b', libelle: 'On multiplie par 1 + i fois n' },
      { id: 'c', libelle: 'On divise par (1 + i) puissance n' },
    ],
    metadonnees: metadonnees({ dureeMinutes: 4, regime: 'examen' }),
    ...overrides,
  };
}

export function buildExitBillet(overrides: Partial<ExitBilletPublic> = {}): ExitBilletPublic {
  return {
    id: 'B-SORTIE-09',
    question: 'Le taux equivalent mensuel d un taux annuel de 12 % vaut :',
    invite: 'Qu est-ce qui reste flou ?',
    options: [
      { id: 'a', libelle: 'Un peu moins de 1 %' },
      { id: 'b', libelle: 'Exactement 1 %' },
      { id: 'c', libelle: 'Un peu plus de 1 %' },
    ],
    metadonnees: metadonnees({ concepts: ['taux-equivalent'], dureeMinutes: 5 }),
    ...overrides,
  };
}

export function buildPulseSondage(overrides: Partial<PulseSondage> = {}): PulseSondage {
  return {
    id: 'P-PULSE-02',
    invite: 'Ou en etes-vous sur le passage du taux annuel au taux mensuel ?',
    metadonnees: metadonnees({
      concepts: ['taux-equivalent'],
      dureeMinutes: 1,
      modalite: 'classe',
    }),
    ...overrides,
  };
}

export function buildChallengeProbleme(
  overrides: Partial<ChallengeProblemePublic> = {},
): ChallengeProblemePublic {
  return {
    id: 'D-DEFI-05',
    enonce:
      'Un capital double en combien d annees a 7 % par an ? Cherchez sans formule, estimez et expliquez.',
    invite: 'Ecrivez votre tentative et la maniere dont vous avez raisonne',
    strategies: [],
    metadonnees: metadonnees({ dureeMinutes: 7, modalite: 'binome' }),
    ...overrides,
  };
}

export function buildStrategiesServies(revelees = false): StrategieServie[] {
  const strategies = [
    { id: 'diviser-cent', libelle: 'Diviser 100 par 7 et arrondir', fausse: true },
    {
      id: 'ajouter-sept',
      libelle: 'Ajouter 7 % au capital annee apres annee jusqu a depasser le double',
      fausse: false,
    },
  ];
  return strategies.map(({ fausse, ...strategie }) =>
    revelees ? { ...strategie, fausse } : strategie,
  );
}

export function buildQuoteCitation(overrides: Partial<QuoteCitation> = {}): QuoteCitation {
  return {
    id: 'C-CITATION-01',
    texte: 'L interet compose est la huitieme merveille du monde : qui le comprend le percoit.',
    auteur: 'Mayer Amschel Rothschild',
    source: 'attribue',
    metadonnees: metadonnees({ dureeMinutes: 1, modalite: 'classe' }),
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
    metadonnees: metadonnees({
      concepts: ['capitalisation', 'valeur-acquise'],
      modalite: 'classe',
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
    metadonnees: metadonnees({
      concepts: ['taux-equivalent'],
      dureeMinutes: 4,
      modalite: 'binome',
    }),
    ...overrides,
  };
}

export function buildProCasAQuestionsLibres(overrides: Partial<ProCas> = {}): ProCas {
  return buildProCas({
    id: 'B2-01-A1-03-MISSION',
    questionsLibres: [
      {
        id: 'b2-01-a1-mission:mesure',
        question: 'Que mesure chaque chiffre ?',
        placeholder: 'Un montant, une part, une évolution…',
      },
      {
        id: 'b2-01-a1-mission:comparable',
        question: 'Les bases et les périodes sont-elles comparables ?',
      },
    ],
    ...overrides,
  });
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
    metadonnees: metadonnees({ dureeMinutes: 6, modalite: 'binome' }),
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
    metadonnees: metadonnees({ dureeMinutes: 8, regime: 'focus' }),
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
    metadonnees: metadonnees({ dureeMinutes: 7, modalite: 'binome' }),
    ...overrides,
  };
}

export function buildPlotEnBarres(overrides: Partial<PlotDefinition> = {}): PlotDefinition {
  return buildPlotDefinition({
    id: 'K-BARRES-01',
    forme: 'barres',
    unite: 'euros',
    abscisse: { libelle: 'Année', min: 0, max: 3 },
    etiquettes: ['2022', '2023', '2024', '2025'],
    ordonnee: 'Marge brute (€)',
    bornesOrdonnee: { minParametre: 'origine', max: 292000 },
    parametres: [
      {
        cle: 'origine',
        libelle: 'Origine de l’axe',
        min: 0,
        max: 284000,
        pas: 4000,
        defaut: 284000,
      },
    ],
    prereglages: [
      { libelle: 'Axe de Samir', valeurs: { origine: 284000 } },
      { libelle: 'Axe à zéro', valeurs: { origine: 0 } },
    ],
    series: [
      {
        id: 'marge',
        libelle: 'Marge brute',
        trait: 'plein',
        calcul: 'SI(x<=1;285000+3000*x;SI(x<=2;288000+1800*(x-1);289800+1200*(x-2)))',
      },
    ],
    ...overrides,
  });
}

export function buildTableBuildPlan(
  overrides: Partial<TableBuildPlanPublic> = {},
): TableBuildPlanPublic {
  return {
    id: 'b2-01-a4-indice-toile',
    intitule: 'Tâche de tableur 2 — Prix et indice de la toile en 2025',
    consignes: [
      'Pour chaque révision, calculez le nouveau prix à partir du prix précédent.',
      'Calculez l’indice de chaque prix, base 100 au 1er janvier.',
    ],
    echeances: 4,
    libellesLignes: [
      '1er mars : +8 %',
      '1er juin : −5 %',
      '1er septembre : +4 %',
      '1er décembre : −3 %',
    ],
    parametres: { prixInitial: 20 },
    colonnes: [
      {
        cle: 'taux',
        intitule: 'Taux annoncé (%)',
        role: 'donnee',
        valeurs: [8, -5, 4, -3],
        decimales: 0,
        totalise: true,
      },
      {
        cle: 'prix',
        intitule: 'Prix du m² après révision (€ HT)',
        role: 'saisie',
        decimales: 2,
        totalise: false,
      },
      {
        cle: 'coef',
        intitule: 'Coefficient appliqué',
        role: 'deduite',
        formuleInitiale: 'prix / prixInitial',
        formule: 'prix / avantPrix',
        decimales: 4,
        totalise: false,
      },
      {
        cle: 'indice',
        intitule: 'Indice (base 100 au 1er janvier)',
        role: 'saisie',
        decimales: 2,
        totalise: false,
      },
      {
        cle: 'evolution',
        intitule: 'Évolution depuis le 1er janvier (%)',
        role: 'deduite',
        formule: 'indice - 100',
        decimales: 2,
        totalise: false,
      },
    ],
    synthese: [
      {
        libelle: 'Somme des taux annoncés (calcul du tableau de bord)',
        formule: 'totalTaux',
        unite: '%',
        decimales: 2,
      },
      {
        libelle: 'Évolution réelle sur l’année',
        formule: 'dernierEvolution',
        unite: '%',
        decimales: 2,
      },
    ],
    metadonnees: metadonnees({
      concepts: ['evolutions-successives'],
      dureeMinutes: 11,
      regime: 'focus',
    }),
    ...overrides,
  };
}

export function buildCardsortPlan(overrides: Partial<CardsortPlanPublic> = {}): CardsortPlanPublic {
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
    metadonnees: metadonnees({ concepts: ['charges-fixes'], dureeMinutes: 8, modalite: 'binome' }),
    ...overrides,
  };
}

export function buildSheetPlan(overrides: Partial<SheetPlanPublic> = {}): SheetPlanPublic {
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
    consignes: ['En C3, calculez le montant HT.', 'En D3, calculez le montant TTC en figeant B1.'],
    metadonnees: metadonnees({ concepts: ['tableur'], dureeMinutes: 15, regime: 'focus' }),
    ...overrides,
  };
}

export function buildEscapeParcours(
  overrides: Partial<EscapeParcoursPublic> = {},
): EscapeParcoursPublic {
  return {
    id: 'K-EVASION-01',
    intitule: 'Ouvrez le coffre du service comptable',
    delaiIndiceMs: 120000,
    budgetEnigmeMs: 360000,
    tentativesMax: 10,
    enigmes: [
      {
        id: 'seuil',
        intitule: 'Le seuil de rentabilite',
        enonce: 'Charges fixes 12 000 EUR, taux de marge sur cout variable 40 %. Quel seuil ?',
        indice: 'Divisez les charges fixes par le taux de marge sur cout variable',
      },
      {
        id: 'marge',
        intitule: 'La marge commerciale',
        enonce: 'Ventes 80 000 EUR, achats revendus 50 000 EUR. Quelle marge commerciale ?',
        indice: 'La marge commerciale est la difference entre les ventes et les achats revendus',
      },
      {
        id: 'tva',
        intitule: 'La TVA a decaisser',
        enonce: 'TVA collectee 4 200 EUR, TVA deductible 1 700 EUR. Combien decaisser ?',
        indice: 'Retranchez la TVA deductible de la TVA collectee',
      },
    ],
    metadonnees: metadonnees({ dureeMinutes: 25, modalite: 'groupe' }),
    ...overrides,
  };
}

export function buildSpacedRappel(overrides: Partial<SpacedRappel> = {}): SpacedRappel {
  return {
    id: 'b2-01-rappel',
    intitule: 'Rappel espacé : ce que vous avez travaillé ce matin',
    metadonnees: metadonnees({ dureeMinutes: 3, regime: 'examen' }),
    ...overrides,
  };
}

function buildSpacedQuestion(
  overrides: Partial<SpacedQuestionPublique> = {},
): SpacedQuestionPublique {
  return {
    questionId: 'Q-ACT-01',
    concept: 'actualisation',
    boite: 1,
    cours: 'Seance 3 — Actualisation',
    enonce: 'Que vaut aujourd hui un encaissement de 1 000 EUR dans un an, au taux de 5 % ?',
    options: [
      { id: 'act-a', libelle: '952,38 EUR' },
      { id: 'act-b', libelle: '1 050,00 EUR' },
      { id: 'act-c', libelle: '1 000,00 EUR' },
    ],
    ...overrides,
  };
}

export function buildSpacedQuestions(): SpacedQuestionPublique[] {
  return [
    buildSpacedQuestion(),
    buildSpacedQuestion({
      questionId: 'Q-VAN-02',
      concept: 'valeur-actuelle-nette',
      boite: 2,
      cours: 'Seance 5 — Choix d investissement',
      enonce: 'Un projet dont la VAN est negative au taux exige doit-il etre retenu ?',
      options: [
        { id: 'van-a', libelle: 'Non, il detruit de la valeur' },
        { id: 'van-b', libelle: 'Oui, si le TRI est positif' },
      ],
    }),
    buildSpacedQuestion({
      questionId: 'Q-AMO-03',
      concept: 'amortissement',
      boite: 3,
      cours: 'Seance 2 — Amortissements',
      enonce: 'L amortissement lineaire fait-il sortir de la tresorerie chaque annee ?',
      options: [
        { id: 'amo-a', libelle: 'Non, c est une charge calculee' },
        { id: 'amo-b', libelle: 'Oui, du montant de l annuite' },
      ],
    }),
  ];
}

export function buildVerdictDeReponse(overrides: Partial<VerdictDeReponse> = {}): VerdictDeReponse {
  return {
    questionId: 'Q-CAP-03',
    correcte: false,
    libelleConfusion: 'Intérêts simples au lieu de composés',
    ...overrides,
  };
}

export function buildVerdictDeProduction(
  overrides: Partial<VerdictDeProduction> = {},
): VerdictDeProduction {
  return {
    questionId: 'K-TABLEUR-01',
    correcte: false,
    score: 0.5,
    details: [
      { cle: 'C3', juste: true, libelleConfusion: null },
      { cle: 'D3', juste: false, libelleConfusion: 'Référence relative non figée' },
    ],
    ...overrides,
  };
}

export function buildVerdictDeTentative(
  overrides: Partial<VerdictDeTentative> = {},
): VerdictDeTentative {
  return {
    parcoursId: 'K-EVASION-01',
    enigmeId: 'seuil',
    correcte: true,
    fragment: 'TR',
    tentativesRestantes: 9,
    ...overrides,
  };
}

export function buildProgressionDesEnigmes(
  overrides: Partial<ProgressionDesEnigmes> = {},
): ProgressionDesEnigmes {
  return {
    parcoursId: 'K-EVASION-01',
    resolues: [{ enigmeId: 'seuil', fragment: 'TR' }],
    tentativesRestantes: { seuil: 8, marge: 10, tva: 10 },
    ...overrides,
  };
}

export function createBrouillonsStub(): jasmine.SpyObj<Brouillons> {
  const stub = jasmine.createSpyObj<Brouillons>('Brouillons', ['lire', 'ecrire', 'purger']);
  stub.lire.and.returnValue(null);
  return stub;
}
