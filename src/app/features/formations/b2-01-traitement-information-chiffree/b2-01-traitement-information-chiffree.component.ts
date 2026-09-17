import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  SlideChartComponent,
  SlideComparisonComponent,
  SlideComponent,
  SlideCtaComponent,
  SlideDeckComponent,
  SlideGridComponent,
  SlideGuideComponent,
  SlideHeroComponent,
  SlideImageComponent,
  SlideMethodPathComponent,
  SlideQuoteComponent,
  SlideReflectionComponent,
  SlideStatsComponent,
  SlideTableComponent,
  type SlideChartSeries,
  type SlideMethodStep,
} from '../../../shared/slides';
import type { QuizInteraction } from '../../../shared/slides/interactions/slide-quiz/slide-quiz.component';
import { SlideQuizComponent } from '../../../shared/slides/interactions/slide-quiz/slide-quiz.component';
import type { ReflectionInteraction } from '../../../shared/slides/interactions/slide-reflection/slide-reflection.component';

const PHOTO_FINANCE =
  'https://images.pexels.com/photos/33175649/pexels-photo-33175649.jpeg?auto=compress&cs=tinysrgb&w=1600';
const PLAYFAIR_GRAPHIC =
  'https://upload.wikimedia.org/wikipedia/commons/d/d8/Playfair_TimeSeries.png';
const NIGHTINGALE_GRAPHIC =
  'https://upload.wikimedia.org/wikipedia/commons/1/17/Nightingale-mortality.jpg';
const PACIOLI_GRAPHIC = 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Luca_Pacioli.jpg';

const METHOD_STEPS: readonly SlideMethodStep[] = [
  {
    id: 'lire',
    title: 'Lire',
    question: 'Qu’est-ce qui est réellement mesuré ?',
    proof: 'Unité, période, périmètre et source.',
    result: 'Un chiffre dont le sens est défendable.',
  },
  {
    id: 'calculer',
    title: 'Calculer',
    question: 'Quelle base et quelle opération répondent à la question ?',
    proof: 'Écart, taux, points, coefficient ou moyenne pondérée.',
    result: 'Un résultat reproductible par un autre professionnel.',
  },
  {
    id: 'representer',
    title: 'Représenter',
    question: 'Quelle relation le lecteur doit-il vérifier ?',
    proof: 'Titre, unité, axes, échelle et source.',
    result: 'Une forme fidèle aux valeurs, sans effet de manche.',
  },
  {
    id: 'expliquer',
    title: 'Expliquer',
    question: 'Quel mécanisme peut expliquer l’écart observé ?',
    proof: 'Poids, mix, volume et hypothèses alternatives.',
    result: 'Une cause plausible, séparée du simple constat.',
  },
  {
    id: 'prouver',
    title: 'Prouver',
    question: 'Quelle trace permet de vérifier la conclusion ?',
    proof: 'Source, rapprochement, contrôle et limite.',
    result: 'Une décision traçable et auditable.',
  },
  {
    id: 'outiller',
    title: 'Outiller',
    question: 'Comment gagner du temps sans perdre la maîtrise ?',
    proof: 'Excel, BI et IA avec contrôles, version et validation humaine.',
    result: 'Une automatisation utile, jamais une boîte noire.',
  },
];

const QCM_PREDICTION: QuizInteraction = {
  id: 'b2-s03-prediction',
  type: 'quiz',
  question: 'Une courbe paraît plus pentue que l’autre. Que vérifier avant de conclure ?',
  options: [
    'Les valeurs, l’unité et l’échelle',
    'La couleur de la courbe',
    'Le nombre de points',
    'La taille du titre',
  ],
  correctIndex: 0,
  context:
    'En cabinet, en contrôle de gestion ou en audit, une pente peut donner une impression de performance avant même la lecture des valeurs. Le premier réflexe est de vérifier le repère.',
  competency: 'C4 · Représentation : distinguer valeur et perception',
  explanation:
    'Une forme ne suffit jamais. Il faut lire les valeurs, l’unité, la période et l’amplitude de l’axe avant de comparer deux évolutions.',
  nextAction:
    'Lire le titre, l’unité, la période, la source, l’origine et l’amplitude de l’axe avant de conclure. La slide suivante montre le piège.',
};

const QCM_FONDATIONS: QuizInteraction = {
  id: 'b2-s09-fondations',
  type: 'quiz',
  question: '« 27,6 % » suffit-il pour décider ?',
  options: ['Oui', 'Non', 'Cela dépend'],
  correctIndex: 1,
  context:
    'Un taux est une information relationnelle. Sans sa base, sa période et son périmètre, il ne permet pas de comparer ni de recommander.',
  competency: 'C1 · Sens du chiffre : établir le contrat de lecture',
  explanation:
    '27,6 % décrit un rapport, mais ne dit pas quel indicateur est mesuré, sur quelle base, pour quelle période, ni avec quelle source.',
  nextAction:
    'Demander la mesure, l’unité, la période, le périmètre, la source et la règle d’agrégation.',
};

const QCM_S23: QuizInteraction = {
  id: 'b2-s23-inflation',
  type: 'quiz',
  question: 'L’inflation baisse. Les prix baissent-ils ?',
  options: ['Oui', 'Non', 'Cela dépend'],
  correctIndex: 1,
  context:
    'Une baisse du rythme d’inflation ne signifie pas que le panier moyen revient à son prix initial.',
  competency: 'C2 · Transformation : distinguer rythme et niveau',
  explanation:
    'L’inflation mesure une variation annuelle. Tant que le taux reste positif, l’indice des prix continue de monter, même si la hausse ralentit.',
  nextAction: 'Tracer séparément le taux annuel et l’indice cumulé base 100.',
};

const QCM_S25: QuizInteraction = {
  id: 'b2-s25-desinflation',
  type: 'quiz',
  question: 'De 4,9 % à 2,0 %, que devient le niveau général des prix ?',
  options: ['Il baisse', 'Il reste stable', 'Il augmente encore', 'Impossible à savoir'],
  correctIndex: 2,
  context:
    'Pour un budget, une grille tarifaire ou une analyse de pouvoir d’achat, la question est de savoir si le niveau des prix a baissé ou si sa hausse a seulement ralenti.',
  competency: 'C2 · Transformation : lire une série cumulée',
  explanation:
    'Passer de 4,9 % à 2,0 % signifie que la hausse annuelle est moins forte. Comme 2,0 % reste positif, le niveau général des prix augmente encore.',
  nextAction: 'Vérifier l’indice cumulé avant de rédiger la conclusion.',
};

const QCM_S31: QuizInteraction = {
  id: 'b2-s31-relecture',
  type: 'quiz',
  question: 'Que vérifier en premier sur les graphiques du défi initial ?',
  options: ['Le titre', 'L’origine et l’amplitude de l’axe', 'La couleur', 'L’épaisseur'],
  correctIndex: 1,
  context:
    'Un analyste commence par vérifier le repère avant de commenter la forme. Un graphique exact peut tout de même produire une lecture disproportionnée.',
  competency: 'C4 · Représentation : auditer l’échelle',
  explanation:
    'L’origine et l’amplitude de l’axe déterminent l’espace visuel accordé à la variation. Les couleurs et l’épaisseur ne prouvent rien.',
  nextAction: 'Comparer la valeur absolue, la variation relative et la plage de l’axe.',
};

const QCM_S35: QuizInteraction = {
  id: 'b2-s35-correlation',
  type: 'quiz',
  question: 'Deux courbes qui montent ensemble prouvent-elles une cause ?',
  options: ['Oui', 'Non', 'Seulement avec une source'],
  correctIndex: 1,
  context:
    'Deux indicateurs qui évoluent ensemble peuvent avoir une cause commune, une relation indirecte ou une simple coïncidence.',
  competency: 'C4 · Représentation : ne pas confondre corrélation et causalité',
  explanation:
    'Deux courbes ascendantes ne suffisent pas à établir un mécanisme causal. Il faut une hypothèse, un périmètre, une période et des contrôles concurrents.',
  nextAction: 'Formuler au moins deux explications alternatives avant d’attribuer une cause.',
};

const QCM_S38: QuizInteraction = {
  id: 'b2-s38-mix',
  type: 'quiz',
  question:
    'Le chiffre d’affaires et la marge augmentent, mais le taux de marge baisse. Quelle première conclusion est défendable ?',
  options: ['Erreur certaine', 'Effet de mix possible', 'Aucune analyse n’est nécessaire'],
  correctIndex: 1,
  context:
    'Le chiffre d’affaires, la marge en euros et le taux de marge répondent à trois questions différentes. Leur évolution peut diverger sans qu’il y ait une erreur.',
  competency: 'C3 · Agrégation : lire l’effet de composition',
  explanation:
    'Un canal moins rentable peut peser davantage dans le chiffre d’affaires. La marge totale peut progresser tandis que le taux moyen recule.',
  nextAction: 'Comparer les taux locaux, les poids de chaque canal et les totaux en valeur.',
};

const QCM_S46: QuizInteraction = {
  id: 'b2-s46-peer-vote-1',
  type: 'quiz',
  question:
    'Le taux global baisse alors que chaque taux local est stable. Quelle explication est possible ?',
  options: [
    'Une erreur certaine',
    'Un changement de mix',
    'Une baisse de tous les volumes',
    'Aucune explication',
  ],
  correctIndex: 1,
  context:
    'Un taux global est une moyenne pondérée. Le poids d’un canal peut changer même si son propre taux reste identique.',
  competency: 'C3 · Agrégation : prévoir l’effet d’un changement de mix',
  explanation:
    'Si un canal moins margé prend plus de poids, il tire le taux global vers le bas. La moyenne simple ne tient pas compte des chiffres d’affaires.',
  nextAction: 'Calculer chaque poids : CA du canal / CA total, puis vérifier la somme des marges.',
};

const QCM_S48: QuizInteraction = {
  id: 'b2-s48-peer-vote-2',
  type: 'quiz',
  question:
    'Le taux global baisse alors que chaque taux local est stable. Quel argument faut-il mobiliser ?',
  options: ['Les poids des canaux', 'La couleur du graphique', 'Le nombre de canaux seulement'],
  correctIndex: 0,
  context:
    'Pour défendre une analyse devant un responsable, l’argument doit relier les taux locaux, les poids et le calcul global.',
  competency: 'C3 · Agrégation : expliquer un résultat',
  explanation:
    'Le changement de poids est la preuve du mécanisme. La couleur ou le nombre de canaux ne permet pas d’expliquer la variation.',
  nextAction: 'Illustrer le raisonnement avec un cas chiffré à deux canaux.',
};

const QCM_S50: QuizInteraction = {
  id: 'b2-s50-pacioli',
  type: 'quiz',
  question: 'Une concordance des totaux signifie-t-elle qu’il n’y a aucune erreur ?',
  options: ['Oui', 'Non, des erreurs peuvent se compenser', 'Oui, si le total est signé'],
  correctIndex: 1,
  context:
    'Le rapprochement comptable vérifie une relation entre une écriture et une pièce source. Il ne se limite pas à regarder si deux totaux se ressemblent.',
  competency: 'C5 · Contrôle et preuve : distinguer concordance et exactitude',
  explanation:
    'Des erreurs opposées peuvent se compenser. La concordance des totaux est un signal de cohérence, pas une preuve ligne par ligne.',
  nextAction: 'Rapprocher les lignes et conserver la pièce probante indépendante.',
};

const QCM_S54: QuizInteraction = {
  id: 'b2-s54-multiple-neuf',
  type: 'quiz',
  question: 'Un écart de 90 €, divisible par 9, prouve-t-il une transposition ?',
  options: ['Oui', 'Non, c’est un indice à confirmer', 'Seulement si le total concorde'],
  correctIndex: 1,
  context:
    'Le test du multiple de 9 peut orienter une recherche d’erreur de transposition, mais il ne localise ni ne prouve l’anomalie.',
  competency: 'C5 · Contrôle et preuve : hiérarchiser les indices',
  explanation:
    'Un indice réduit l’espace de recherche. Seule la comparaison avec la pièce source peut confirmer la valeur attendue.',
  nextAction: 'Passer du signal numérique au rapprochement de la ligne et de la pièce.',
};

const QCM_S57: QuizInteraction = {
  id: 'b2-s57-compensation',
  type: 'quiz',
  question: 'Le total concorde, mais F002 est à +100 € et F003 à -100 €. Peut-on valider ?',
  options: ['Oui', 'Non, les erreurs se compensent'],
  correctIndex: 1,
  context:
    'Un total exact peut masquer deux écarts de sens contraire. C’est pourquoi le contrôle doit descendre au niveau des lignes.',
  competency: 'C5 · Contrôle et preuve : repérer les compensations',
  explanation:
    'F002 à +100 € et F003 à -100 € ramènent le total à zéro, mais chaque écriture reste fausse.',
  nextAction: 'Filtrer les écarts non nuls puis rechercher la preuve source de chaque ligne.',
};

const QCM_S63: QuizInteraction = {
  id: 'b2-s63-flash-points',
  type: 'quiz',
  question: 'Un taux passe de 12 % à 15 %. Quel écart en points ?',
  options: ['3 points', '25 points', '0,25 point'],
  correctIndex: 0,
  context:
    'En contrôle de gestion, un écart entre deux taux n’est pas toujours une évolution en pourcentage. Il faut nommer précisément la comparaison.',
  competency: 'C2 · Transformation : distinguer points et variation relative',
  explanation: '15 % - 12 % = +3 points. Le taux lui-même a augmenté de 3 / 12 = +25 % en relatif.',
  nextAction:
    'Écrire l’unité dans la conclusion : points pour l’écart, % pour l’évolution relative.',
};

const QCM_S64: QuizInteraction = {
  id: 'b2-s64-flash-preuve',
  type: 'quiz',
  question: 'Un multiple de 9 suffit-il à prouver une transposition ?',
  options: ['Oui', 'Non, il faut rapprocher une pièce source'],
  correctIndex: 1,
  context:
    'Le contrôle par 9 est un outil de repérage rapide, pas une pièce justificative utilisable seul dans un dossier d’audit.',
  competency: 'C5 · Contrôle et preuve : choisir une preuve indépendante',
  explanation:
    'La divisibilité par 9 peut signaler une transposition, mais elle ne distingue pas toutes les erreurs possibles.',
  nextAction: 'Rapprocher l’écriture de la pièce source et documenter l’écart trouvé.',
};

const REFLECTION_C1: ReflectionInteraction = {
  id: 'b2-s11-c1',
  type: 'reflection',
  question:
    'Un tableau affiche « 4,9 » dans une colonne Performance. Quelle est votre première question ?',
  placeholder: 'Mesure, unité, période et source…',
  context:
    'Vous préparez une revue d’indicateurs pour un dirigeant. Une valeur isolée peut être exacte et pourtant inutilisable.',
  competency: 'C1 · Sens du chiffre',
  expected:
    'Demander au minimum l’indicateur, l’unité, la période, le périmètre, la source, la base de calcul et l’agrégation.',
  nextAction: 'Refuser la comparaison tant que le contrat de lecture n’est pas complet.',
};

const REFLECTION_CALCUL: ReflectionInteraction = {
  id: 'b2-s14-calcul',
  type: 'reflection',
  question:
    'Le chiffre d’affaires passe de 120 000 € à 138 000 €. Calculez et interprétez le taux.',
  placeholder: 'Écart, dénominateur, taux et phrase complète…',
  context:
    'Le taux d’évolution répond à la question : de quelle proportion la valeur d’arrivée s’est-elle écartée de la valeur de départ ?',
  competency: 'C2 · Transformation',
  expected: 'Écart : 18 000 €. Taux : 18 000 / 120 000 = 0,15, soit +15 %.',
  nextAction: 'Contrôler avec 120 000 × 1,15 = 138 000 €.',
};

const REFLECTION_C2: ReflectionInteraction = {
  id: 'b2-s22-c2',
  type: 'reflection',
  question: 'Pourquoi +10 % puis -10 % ne ramène-t-il pas à la valeur initiale ?',
  placeholder: 'Bases différentes ; 10 % de 110 vaut 11.',
  context:
    'Une hausse puis une baisse portent sur deux bases différentes. Cette situation apparaît dans les remises, les prix, les volumes et les budgets.',
  competency: 'C2 · Transformation',
  expected:
    '100 × 1,10 × 0,90 = 99. La baisse de 10 % porte sur 110, donc elle retire 11 et non 10.',
  nextAction: 'Écrire les coefficients avant de calculer une série de variations.',
};

const REFLECTION_S28: ReflectionInteraction = {
  id: 'b2-s28-inflation',
  type: 'reflection',
  question:
    'Entre fin 2019 et fin 2024, comment conclure sur l’indice et le rythme de l’inflation ?',
  placeholder: 'Constat, calcul, interprétation et limite…',
  context:
    'Une note de conjoncture doit distinguer le rythme de hausse annuel et le niveau de prix atteint depuis une base.',
  competency: 'C2 · Transformation et C1 · Sens du chiffre',
  expected:
    'Le taux ralentit en 2024, mais l’indice atteint environ 114,93 : le niveau des prix est supérieur d’environ 14,93 % à la base.',
  nextAction: 'Citer la période, la base et l’unité dans la phrase finale.',
};

const REFLECTION_S43: ReflectionInteraction = {
  id: 'b2-s43-marge-2024',
  type: 'reflection',
  question: '289 800 / 1 050 000 : quel taux de marge et quelle phrase de sens ?',
  placeholder: 'Estimation, calcul, pourcentage et unité de sens…',
  context:
    'Le taux de marge compare la marge réalisée au chiffre d’affaires de la même période et du même périmètre.',
  competency: 'C3 · Agrégation',
  expected:
    '289 800 / 1 050 000 = 27,60 %. Pour 100 € de CA, l’entreprise conserve en moyenne 27,60 € de marge selon cette définition.',
  nextAction: 'Vérifier la définition de marge avant de comparer deux exercices.',
};

const REFLECTION_S44: ReflectionInteraction = {
  id: 'b2-s44-marge-2025',
  type: 'reflection',
  question: 'Quel est le taux 2025 et quel est l’écart avec 2024 ?',
  placeholder: 'Taux 2025, écart en points, évolution relative facultative…',
  context:
    'La comparaison 2024/2025 doit séparer la valeur de marge, le taux de marge et la progression du chiffre d’affaires.',
  competency: 'C3 · Agrégation',
  expected: '291 000 / 1 150 000 = 25,30 %. L’écart est de -2,30 points par rapport à 27,60 %.',
  nextAction: 'Chercher un effet de mix ou de coûts avant d’écrire une cause certaine.',
};

const REFLECTION_S45: ReflectionInteraction = {
  id: 'b2-s45-recommandation',
  type: 'reflection',
  question: 'Rédigez une recommandation : constat, cause plausible, preuve manquante et action.',
  placeholder: 'La marge… ; le taux… ; vérifier…',
  context:
    'Une recommandation professionnelle sépare toujours le constat calculé, l’hypothèse et le contrôle à réaliser.',
  competency: 'C5 · Communiquer une conclusion contrôlable',
  expected:
    'Constat : marge +1 200 €, taux -2,30 points. Hypothèse : CA ou mix en hausse plus rapide. Preuve : détail par canal et coûts.',
  nextAction: 'Ne pas transformer une hypothèse plausible en cause prouvée.',
};

const REFLECTION_S47: ReflectionInteraction = {
  id: 'b2-s47-peer-argument',
  type: 'reflection',
  question:
    'Expliquez avec deux canaux comment un changement de poids peut faire baisser le taux global.',
  placeholder: 'Poids × taux local…',
  context:
    'L’objectif n’est pas seulement de calculer une moyenne. Il faut expliquer pourquoi le poids d’un canal déplace le résultat global.',
  competency: 'C3 · Agrégation',
  expected:
    'Un canal à 16 % qui passe de 20 % à 50 % du CA tire le taux global vers le bas si les autres taux restent constants.',
  nextAction: 'Comparer prévision et calcul, puis nommer le poids qui a changé.',
};

const REFLECTION_S58: ReflectionInteraction = {
  id: 'b2-s58-alert',
  type: 'reflection',
  question: 'Rédigez l’alerte professionnelle à partir de l’écart F004.',
  placeholder: 'Constat, attendu, observé, écart, hypothèse, preuve, action…',
  context:
    'Une alerte comptable doit permettre à un tiers de refaire le contrôle sans vous demander ce que vous aviez en tête.',
  competency: 'C5 · Contrôle et preuve',
  expected:
    'F004 est enregistrée à 12 430 € HT contre 12 340 € HT sur la pièce, soit +90 €. Vérifier la pièce et corriger l’écriture avant validation.',
  nextAction: 'Joindre la pièce source et conserver le calcul HT, TVA et TTC.',
};

const REFLECTION_S62: ReflectionInteraction = {
  id: 'b2-s62-decision',
  type: 'reflection',
  question: 'Je recommande… parce que… Je vérifierais… La limite principale est…',
  placeholder: 'Une décision, un calcul, une preuve indépendante et une limite…',
  context:
    'Une décision de gestion défendable relie le sens du chiffre, la méthode de calcul, la preuve et la limite de l’analyse.',
  competency: 'C1 à C5 · Synthèse professionnelle',
  expected:
    'Prioriser une alerte, donner le calcul ou le rapprochement, citer la source indépendante et expliciter ce qui reste à vérifier.',
  nextAction: 'Écrire comme dans une note de contrôle : constat, analyse, preuve, action, limite.',
};

const AXES: readonly SlideChartSeries[] = [
  { label: 'Série A', values: [100, 103, 105, 108], tone: 'teal' },
  { label: 'Série B', values: [100, 103, 105, 108], tone: 'gold' },
];

const AXIS_RANGES = [
  [0, 120],
  [98, 110],
] as const;

const POINTS: readonly SlideChartSeries[] = [{ label: 'Taux', values: [12, 15], tone: 'teal' }];

const PRICE_FLOW: readonly SlideChartSeries[] = [
  { label: 'Prix de vente unitaire', values: [100, 110, 99], tone: 'teal' },
  { label: "Coût d'achat unitaire", values: [80, 80, 80], tone: 'ink' },
  { label: 'Marge unitaire', values: [20, 30, 19], tone: 'gold' },
];

const INFLATION_RATES: readonly SlideChartSeries[] = [
  { label: 'Inflation annuelle', values: [0.5, 1.6, 5.2, 4.9, 2.0], tone: 'teal' },
];

const INFLATION_INDEX: readonly SlideChartSeries[] = [
  { label: 'Indice base 100 fin 2019', values: [100.5, 102.1, 107.4, 112.7, 114.93], tone: 'gold' },
];

const MIX: readonly SlideChartSeries[] = [
  { label: 'Taux global', values: [28.8, 24.0], tone: 'teal' },
  { label: 'Marge en euros', values: [288000, 240000], tone: 'gold' },
];

const AUDIT_TOTALS: readonly SlideChartSeries[] = [
  { label: 'Pièces HT', values: [48705], tone: 'teal' },
  { label: 'Grand livre HT', values: [48795], tone: 'gold' },
];

@Component({
  selector: 'app-b2-01-traitement-information-chiffree',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SlideChartComponent,
    SlideComparisonComponent,
    SlideComponent,
    SlideCtaComponent,
    SlideDeckComponent,
    SlideGridComponent,
    SlideGuideComponent,
    SlideHeroComponent,
    SlideImageComponent,
    SlideMethodPathComponent,
    SlideQuoteComponent,
    SlideQuizComponent,
    SlideReflectionComponent,
    SlideStatsComponent,
    SlideTableComponent,
  ],
  templateUrl: './b2-01-traitement-information-chiffree.component.html',
  styleUrl: './b2-01-traitement-information-chiffree.component.scss',
})
export class B2TraitementInformationChiffreeComponent {
  protected readonly methodSteps = METHOD_STEPS;
  protected readonly photoFinance = PHOTO_FINANCE;
  protected readonly playfairGraphic = PLAYFAIR_GRAPHIC;
  protected readonly nightingaleGraphic = NIGHTINGALE_GRAPHIC;
  protected readonly pacioliGraphic = PACIOLI_GRAPHIC;
  protected readonly qcmPrediction = QCM_PREDICTION;
  protected readonly qcmFondations = QCM_FONDATIONS;
  protected readonly qcmS23 = QCM_S23;
  protected readonly qcmS25 = QCM_S25;
  protected readonly qcmS31 = QCM_S31;
  protected readonly qcmS35 = QCM_S35;
  protected readonly qcmS38 = QCM_S38;
  protected readonly qcmS46 = QCM_S46;
  protected readonly qcmS48 = QCM_S48;
  protected readonly qcmS50 = QCM_S50;
  protected readonly qcmS54 = QCM_S54;
  protected readonly qcmS57 = QCM_S57;
  protected readonly qcmS63 = QCM_S63;
  protected readonly qcmS64 = QCM_S64;
  protected readonly reflectionC1 = REFLECTION_C1;
  protected readonly reflectionCalcul = REFLECTION_CALCUL;
  protected readonly reflectionC2 = REFLECTION_C2;
  protected readonly reflectionS28 = REFLECTION_S28;
  protected readonly reflectionS43 = REFLECTION_S43;
  protected readonly reflectionS44 = REFLECTION_S44;
  protected readonly reflectionS45 = REFLECTION_S45;
  protected readonly reflectionS47 = REFLECTION_S47;
  protected readonly reflectionS58 = REFLECTION_S58;
  protected readonly reflectionS62 = REFLECTION_S62;
  protected readonly axes = AXES;
  protected readonly axisRanges = AXIS_RANGES;
  protected readonly points = POINTS;
  protected readonly priceFlow = PRICE_FLOW;
  protected readonly inflationRates = INFLATION_RATES;
  protected readonly inflationIndex = INFLATION_INDEX;
  protected readonly mix = MIX;
  protected readonly auditTotals = AUDIT_TOTALS;

  protected readonly inflationRows = [
    { year: '2020', rate: '0,5 %', index: '100,50' },
    { year: '2021', rate: '1,6 %', index: '102,11' },
    { year: '2022', rate: '5,2 %', index: '107,42' },
    { year: '2023', rate: '4,9 %', index: '112,68' },
    { year: '2024', rate: '2,0 %', index: '114,93' },
  ];

  protected readonly auditRows = [
    { id: 'F001', piece: '12 000 €', grandLivre: '12 000 €', ecart: '0 €' },
    { id: 'F002', piece: '8 500 €', grandLivre: '8 500 €', ecart: '0 €' },
    { id: 'F003', piece: '15 865 €', grandLivre: '15 865 €', ecart: '0 €' },
    { id: 'F004', piece: '12 340 €', grandLivre: '12 430 €', ecart: '+90 €' },
  ];

  protected readonly f004Rows = [
    { champ: 'Pièce validée', valeur: '12 340 € HT' },
    { champ: 'TVA à 20 %', valeur: '2 468 €' },
    { champ: 'Total TTC', valeur: '14 808 €' },
    { champ: 'Écriture saisie', valeur: '12 430 € HT' },
  ];
}
