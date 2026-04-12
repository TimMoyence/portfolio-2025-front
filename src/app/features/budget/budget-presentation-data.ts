import type { BudgetCategoryModel } from "../../core/models/budget.model";

/**
 * Donnees fictives pour la page de presentation budget.
 * Simulent un mois d'avril avec 8 categories, contributions couple
 * et metriques de synthese.
 */

/** 8 categories avec les couleurs reelles du graphique donut. */
export const MOCK_CATEGORIES: BudgetCategoryModel[] = [
  {
    id: "cat-1",
    groupId: "grp-1",
    name: $localize`:@@budget-pres.cat.logement:Logement`,
    color: "#0f7b65",
    icon: "apartment",
    budgetType: "FIXED",
    budgetLimit: 950,
    displayOrder: 1,
  },
  {
    id: "cat-2",
    groupId: "grp-1",
    name: $localize`:@@budget-pres.cat.courses:Courses`,
    color: "#F59E0B",
    icon: "shopping_cart",
    budgetType: "VARIABLE",
    budgetLimit: 500,
    displayOrder: 2,
  },
  {
    id: "cat-3",
    groupId: "grp-1",
    name: $localize`:@@budget-pres.cat.loisirs:Loisirs`,
    color: "#8B5CF6",
    icon: "sports_esports",
    budgetType: "VARIABLE",
    budgetLimit: 300,
    displayOrder: 3,
  },
  {
    id: "cat-4",
    groupId: "grp-1",
    name: $localize`:@@budget-pres.cat.transport:Transport`,
    color: "#EF4444",
    icon: "directions_car",
    budgetType: "FIXED",
    budgetLimit: 250,
    displayOrder: 4,
  },
  {
    id: "cat-5",
    groupId: "grp-1",
    name: $localize`:@@budget-pres.cat.sante:Sante`,
    color: "#EC4899",
    icon: "health_and_safety",
    budgetType: "VARIABLE",
    budgetLimit: 150,
    displayOrder: 5,
  },
  {
    id: "cat-6",
    groupId: "grp-1",
    name: $localize`:@@budget-pres.cat.abonnements:Abonnements`,
    color: "#3B82F6",
    icon: "subscriptions",
    budgetType: "FIXED",
    budgetLimit: 120,
    displayOrder: 6,
  },
  {
    id: "cat-7",
    groupId: "grp-1",
    name: $localize`:@@budget-pres.cat.epargne:Epargne`,
    color: "#14B8A6",
    icon: "savings",
    budgetType: "FIXED",
    budgetLimit: 400,
    displayOrder: 7,
  },
  {
    id: "cat-8",
    groupId: "grp-1",
    name: $localize`:@@budget-pres.cat.autres:Autres`,
    color: "#6366F1",
    icon: "more_horiz",
    budgetType: "VARIABLE",
    budgetLimit: 200,
    displayOrder: 8,
  },
];

/** Totaux par categorie pour le tableau recapitulatif. */
export interface CategoryTotal {
  name: string;
  color: string;
  spent: number;
  limit: number;
  percent: number;
}

/** Totaux calcules a partir des categories. */
export const MOCK_CATEGORY_TOTALS: CategoryTotal[] = [
  {
    name: $localize`:@@budget-pres.cat.logement:Logement`,
    color: "#0f7b65",
    spent: 920,
    limit: 950,
    percent: 97,
  },
  {
    name: $localize`:@@budget-pres.cat.courses:Courses`,
    color: "#F59E0B",
    spent: 487,
    limit: 500,
    percent: 97,
  },
  {
    name: $localize`:@@budget-pres.cat.loisirs:Loisirs`,
    color: "#8B5CF6",
    spent: 284,
    limit: 300,
    percent: 95,
  },
  {
    name: $localize`:@@budget-pres.cat.transport:Transport`,
    color: "#EF4444",
    spent: 235,
    limit: 250,
    percent: 94,
  },
  {
    name: $localize`:@@budget-pres.cat.sante:Sante`,
    color: "#EC4899",
    spent: 126,
    limit: 150,
    percent: 84,
  },
  {
    name: $localize`:@@budget-pres.cat.abonnements:Abonnements`,
    color: "#3B82F6",
    spent: 115,
    limit: 120,
    percent: 96,
  },
  {
    name: $localize`:@@budget-pres.cat.epargne:Epargne`,
    color: "#14B8A6",
    spent: 400,
    limit: 400,
    percent: 100,
  },
  {
    name: $localize`:@@budget-pres.cat.autres:Autres`,
    color: "#6366F1",
    spent: 280,
    limit: 200,
    percent: 140,
  },
];

/** Metriques de synthese affichees dans les cartes summary. */
export interface BudgetSummaryMetrics {
  totalExpenses: string;
  totalIncoming: string;
  mariaContribution: string;
  timContribution: string;
  pocketsTotal: string;
}

/** Metriques de synthese du mois. */
export const MOCK_SUMMARY: BudgetSummaryMetrics = {
  totalExpenses: "2 847 \u20AC",
  totalIncoming: "4 120 \u20AC",
  mariaContribution: "1 897 \u20AC",
  timContribution: "2 223 \u20AC",
  pocketsTotal: "650 \u20AC",
};

/** Contributions de chaque membre du couple. */
export interface ContributionData {
  tim: { name: string; salary: number; percentage: number };
  maria: { name: string; salary: number; percentage: number };
  combined: number;
}

/** Contributions Tim/Maria fictives. */
export const MOCK_CONTRIBUTIONS: ContributionData = {
  tim: { name: "Tim", salary: 2800, percentage: 54 },
  maria: { name: "Maria", salary: 2400, percentage: 46 },
  combined: 5200,
};

/** Liste des mois affichee en pilules. */
export const MOCK_MONTHS: string[] = [
  $localize`:@@budget-pres.month.jan:Jan`,
  $localize`:@@budget-pres.month.fev:Fev`,
  $localize`:@@budget-pres.month.mar:Mar`,
  $localize`:@@budget-pres.month.avr:Avr`,
  $localize`:@@budget-pres.month.mai:Mai`,
  $localize`:@@budget-pres.month.jun:Jun`,
];

/** Mois actif par defaut. */
export const MOCK_ACTIVE_MONTH = $localize`:@@budget-pres.month.avr:Avr`;

/** Segments du donut pour le conic-gradient CSS. */
export interface DonutSegment {
  name: string;
  color: string;
  value: number;
  startDeg: number;
  endDeg: number;
}

/**
 * Construit les segments du donut a partir des totaux par categorie.
 * Chaque segment a ses angles de debut et fin en degres.
 */
export function buildDonutSegments(totals: CategoryTotal[]): DonutSegment[] {
  const total = totals.reduce((sum, t) => sum + t.spent, 0);
  let currentDeg = 0;

  return totals.map((t) => {
    const portion = (t.spent / total) * 360;
    const segment: DonutSegment = {
      name: t.name,
      color: t.color,
      value: t.spent,
      startDeg: Math.round(currentDeg * 10) / 10,
      endDeg: Math.round((currentDeg + portion) * 10) / 10,
    };
    currentDeg += portion;
    return segment;
  });
}

/** Segments pre-calcules pour le template. */
export const MOCK_DONUT_SEGMENTS: DonutSegment[] =
  buildDonutSegments(MOCK_CATEGORY_TOTALS);

/**
 * Genere la valeur CSS conic-gradient a partir des segments.
 * Utilise dans le style inline du donut.
 */
export function buildConicGradient(segments: DonutSegment[]): string {
  const stops = segments
    .map((s) => `${s.color} ${s.startDeg}deg ${s.endDeg}deg`)
    .join(", ");
  return `conic-gradient(${stops})`;
}

/** Gradient conique pre-calcule. */
export const MOCK_CONIC_GRADIENT: string =
  buildConicGradient(MOCK_DONUT_SEGMENTS);

/** Fonctionnalites marketing affichees dans les sections features. */
export interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

/** Les 4 fonctionnalites phares de l'app budget. */
export const MOCK_FEATURES: FeatureItem[] = [
  {
    icon: "assets/images/auto_graph.png",
    title: $localize`:@@budget-pres.feature.0.title:Suivi en temps reel`,
    description: $localize`:@@budget-pres.feature.0.description:Visualisez vos depenses au fur et a mesure. Graphiques par categorie, evolution mensuelle et alertes quand un budget est depasse.`,
  },
  {
    icon: "assets/images/balance.png",
    title: $localize`:@@budget-pres.feature.1.title:Contributions equitables`,
    description: $localize`:@@budget-pres.feature.1.description:Chacun contribue au prorata de ses revenus. Le calcul est automatique, transparent et mis a jour chaque mois.`,
  },
  {
    icon: "assets/images/folder_copy.png",
    title: $localize`:@@budget-pres.feature.2.title:Import CSV intelligent`,
    description: $localize`:@@budget-pres.feature.2.description:Importez vos releves bancaires en un clic. L'auto-categorisation reconnait vos depenses recurrentes.`,
  },
  {
    icon: "assets/images/smart_toy.png",
    title: $localize`:@@budget-pres.feature.3.title:Auto-categorisation IA`,
    description: $localize`:@@budget-pres.feature.3.description:Les transactions sont classees automatiquement grace a l'intelligence artificielle. Fini le tri manuel.`,
  },
];

/** Elements de la timeline "Comment ca marche". */
export interface TimelineStep {
  number: number;
  icon: string;
  title: string;
  description: string;
}

/** 4 etapes de la timeline. */
export const MOCK_TIMELINE: TimelineStep[] = [
  {
    number: 1,
    icon: "assets/images/edit_note.png",
    title: $localize`:@@budget-pres.timeline.0.title:Creez votre budget`,
    description: $localize`:@@budget-pres.timeline.0.description:Definissez vos categories, limites mensuelles et partagez l'acces avec votre partenaire.`,
  },
  {
    number: 2,
    icon: "assets/images/inventory_2.png",
    title: $localize`:@@budget-pres.timeline.1.title:Importez vos releves`,
    description: $localize`:@@budget-pres.timeline.1.description:Glissez votre CSV bancaire. Les transactions sont triees et categorisees automatiquement.`,
  },
  {
    number: 3,
    icon: "assets/images/flag.png",
    title: $localize`:@@budget-pres.timeline.2.title:Suivez vos objectifs`,
    description: $localize`:@@budget-pres.timeline.2.description:Chaque categorie a sa jauge. Vous voyez en un clin d'oeil ou vous en etes.`,
  },
  {
    number: 4,
    icon: "assets/images/history.png",
    title: $localize`:@@budget-pres.timeline.3.title:Analysez l'historique`,
    description: $localize`:@@budget-pres.timeline.3.description:Comparez mois par mois, identifiez les tendances et ajustez votre budget en consequence.`,
  },
];
