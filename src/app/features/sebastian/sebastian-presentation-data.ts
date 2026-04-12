import type {
  SebastianBacDataPoint,
  SebastianBacResult,
  SebastianBadgeStatus,
  SebastianHealthScore,
  SebastianHeatmapPoint,
  SebastianTrendData,
} from "../../core/models/sebastian.model";

/**
 * Donnees fictives pour la page de presentation Sebastian.
 * Simulent un utilisateur en phase 2 avec un score de sante de 78/100,
 * des streaks actives et un BAC en decroissance apres une soiree legere.
 */

/** Score de sante : 78/100, phase 2, bonne forme. */
export const MOCK_HEALTH_SCORE: SebastianHealthScore = {
  score: 78,
  phase: 2,
  breakdown: {
    goalAdherence: 62,
    trendBonus: 10,
    streakBonus: 6,
  },
  streaks: {
    alcohol: 5,
    coffee: 3,
  },
  message: $localize`:@@sebastian-pres.health.message:Bonne forme, continuez !`,
};

/** Courbe BAC : 9 points de 20h00 a 00h00, pic a 0.38 puis decroissance. */
const BAC_CURVE: SebastianBacDataPoint[] = [
  { time: "2026-04-08T20:00:00.000Z", bac: 0.0 },
  { time: "2026-04-08T20:30:00.000Z", bac: 0.18 },
  { time: "2026-04-08T21:00:00.000Z", bac: 0.32 },
  { time: "2026-04-08T21:30:00.000Z", bac: 0.38 },
  { time: "2026-04-08T22:00:00.000Z", bac: 0.34 },
  { time: "2026-04-08T22:30:00.000Z", bac: 0.27 },
  { time: "2026-04-08T23:00:00.000Z", bac: 0.2 },
  { time: "2026-04-08T23:30:00.000Z", bac: 0.15 },
  { time: "2026-04-09T00:00:00.000Z", bac: 0.12 },
];

/** Resultat BAC : 0.12 g/L actuel, sobre dans ~1h20. */
export const MOCK_BAC: SebastianBacResult = {
  currentBac: 0.12,
  curve: BAC_CURVE,
  estimatedSoberAt: "2026-04-09T01:20:00.000Z",
  legalLimit: 0.5,
};

/** 10 badges, tous verrouilles (page de presentation, non authentifie). */
export const MOCK_BADGES: SebastianBadgeStatus[] = [
  {
    key: "first-log",
    name: $localize`:@@sebastian-pres.badge.first-log.name:Premier Log`,
    description: $localize`:@@sebastian-pres.badge.first-log.description:Enregistrez votre premiere consommation`,
    category: "onboarding",
    unlocked: false,
  },
  {
    key: "dry-week",
    name: $localize`:@@sebastian-pres.badge.dry-week.name:Semaine Sobre`,
    description: $localize`:@@sebastian-pres.badge.dry-week.description:7 jours sans alcool`,
    category: "alcohol",
    unlocked: false,
  },
  {
    key: "espresso-machine",
    name: $localize`:@@sebastian-pres.badge.espresso-machine.name:Maitre Barista`,
    description: $localize`:@@sebastian-pres.badge.espresso-machine.description:100 cafes enregistres`,
    category: "coffee",
    unlocked: false,
  },
  {
    key: "zen-monk-7",
    name: $localize`:@@sebastian-pres.badge.zen-monk-7.name:Zen Monk 7`,
    description: $localize`:@@sebastian-pres.badge.zen-monk-7.description:Score au-dessus de 80 pendant 7 jours`,
    category: "streaks",
    unlocked: false,
  },
  {
    key: "zen-monk-30",
    name: $localize`:@@sebastian-pres.badge.zen-monk-30.name:Zen Monk 30`,
    description: $localize`:@@sebastian-pres.badge.zen-monk-30.description:Score au-dessus de 80 pendant 30 jours`,
    category: "streaks",
    unlocked: false,
  },
  {
    key: "goal-crusher",
    name: $localize`:@@sebastian-pres.badge.goal-crusher.name:Goal Crusher`,
    description: $localize`:@@sebastian-pres.badge.goal-crusher.description:Respectez vos limites 7 jours d'affilee`,
    category: "goals",
    unlocked: false,
  },
  {
    key: "perfect-month",
    name: $localize`:@@sebastian-pres.badge.perfect-month.name:Mois Parfait`,
    description: $localize`:@@sebastian-pres.badge.perfect-month.description:Aucun depassement pendant 30 jours`,
    category: "goals",
    unlocked: false,
  },
  {
    key: "early-bird",
    name: $localize`:@@sebastian-pres.badge.early-bird.name:Early Bird`,
    description: $localize`:@@sebastian-pres.badge.early-bird.description:Premier log avant 8h du matin`,
    category: "timing",
    unlocked: false,
  },
  {
    key: "night-owl",
    name: $localize`:@@sebastian-pres.badge.night-owl.name:Night Owl`,
    description: $localize`:@@sebastian-pres.badge.night-owl.description:Log apres minuit`,
    category: "timing",
    unlocked: false,
  },
  {
    key: "comeback-kid",
    name: $localize`:@@sebastian-pres.badge.comeback-kid.name:Comeback Kid`,
    description: $localize`:@@sebastian-pres.badge.comeback-kid.description:Ameliorez votre score de 20 points en un mois`,
    category: "progress",
    unlocked: false,
  },
];

/** Tendances sur 7 jours avec valeurs realistes. */
export const MOCK_TRENDS: SebastianTrendData = {
  period: "7d",
  dataPoints: [
    { date: "2026-04-03", alcohol: 1, coffee: 2 },
    { date: "2026-04-04", alcohol: 0, coffee: 3 },
    { date: "2026-04-05", alcohol: 2, coffee: 2 },
    { date: "2026-04-06", alcohol: 1, coffee: 3 },
    { date: "2026-04-07", alcohol: 0, coffee: 2 },
    { date: "2026-04-08", alcohol: 3, coffee: 1 },
    { date: "2026-04-09", alcohol: 1, coffee: 2 },
  ],
  objectives: { alcohol: 3, coffee: 4 },
  summary: { avgAlcohol: 1.14, avgCoffee: 2.14 },
};

/** Heatmap : 28 jours d'activite combinee. */
export const MOCK_HEATMAP: SebastianHeatmapPoint[] = [
  { date: "2026-03-13", alcohol: 1, coffee: 2, combined: 3 },
  { date: "2026-03-14", alcohol: 0, coffee: 1, combined: 1 },
  { date: "2026-03-15", alcohol: 2, coffee: 3, combined: 5 },
  { date: "2026-03-16", alcohol: 0, coffee: 0, combined: 0 },
  { date: "2026-03-17", alcohol: 1, coffee: 2, combined: 3 },
  { date: "2026-03-18", alcohol: 3, coffee: 2, combined: 5 },
  { date: "2026-03-19", alcohol: 0, coffee: 1, combined: 1 },
  { date: "2026-03-20", alcohol: 0, coffee: 2, combined: 2 },
  { date: "2026-03-21", alcohol: 1, coffee: 3, combined: 4 },
  { date: "2026-03-22", alcohol: 2, coffee: 2, combined: 4 },
  { date: "2026-03-23", alcohol: 0, coffee: 3, combined: 3 },
  { date: "2026-03-24", alcohol: 1, coffee: 1, combined: 2 },
  { date: "2026-03-25", alcohol: 2, coffee: 3, combined: 5 },
  { date: "2026-03-26", alcohol: 0, coffee: 0, combined: 0 },
  { date: "2026-03-27", alcohol: 1, coffee: 2, combined: 3 },
  { date: "2026-03-28", alcohol: 0, coffee: 2, combined: 2 },
  { date: "2026-03-29", alcohol: 2, coffee: 2, combined: 4 },
  { date: "2026-03-30", alcohol: 3, coffee: 3, combined: 6 },
  { date: "2026-03-31", alcohol: 1, coffee: 1, combined: 2 },
  { date: "2026-04-01", alcohol: 0, coffee: 3, combined: 3 },
  { date: "2026-04-02", alcohol: 1, coffee: 2, combined: 3 },
  { date: "2026-04-03", alcohol: 1, coffee: 2, combined: 3 },
  { date: "2026-04-04", alcohol: 0, coffee: 3, combined: 3 },
  { date: "2026-04-05", alcohol: 2, coffee: 2, combined: 4 },
  { date: "2026-04-06", alcohol: 1, coffee: 3, combined: 4 },
  { date: "2026-04-07", alcohol: 0, coffee: 2, combined: 2 },
  { date: "2026-04-08", alcohol: 3, coffee: 1, combined: 4 },
  { date: "2026-04-09", alcohol: 1, coffee: 2, combined: 3 },
];

/** Compteurs journaliers : cafe 2/4, alcool 1/3. */
export const MOCK_DAILY_COUNTS = {
  coffee: { current: 2, goal: 4 },
  alcohol: { current: 1, goal: 3 },
} as const;

/** Labels des jours de la semaine pour la heatmap. */
export const HEATMAP_DAY_LABELS: readonly string[] = [
  $localize`:@@sebastian-pres.heatmap.day.mon:L`,
  $localize`:@@sebastian-pres.heatmap.day.tue:M`,
  $localize`:@@sebastian-pres.heatmap.day.wed:M`,
  $localize`:@@sebastian-pres.heatmap.day.thu:J`,
  $localize`:@@sebastian-pres.heatmap.day.fri:V`,
  $localize`:@@sebastian-pres.heatmap.day.sat:S`,
  $localize`:@@sebastian-pres.heatmap.day.sun:D`,
];

/** Labels des jours pour le graphique de tendance hebdomadaire. */
export const TREND_DAY_LABELS: readonly string[] = [
  $localize`:@@sebastian-pres.trend.day.mon:Lun`,
  $localize`:@@sebastian-pres.trend.day.tue:Mar`,
  $localize`:@@sebastian-pres.trend.day.wed:Mer`,
  $localize`:@@sebastian-pres.trend.day.thu:Jeu`,
  $localize`:@@sebastian-pres.trend.day.fri:Ven`,
  $localize`:@@sebastian-pres.trend.day.sat:Sam`,
  $localize`:@@sebastian-pres.trend.day.sun:Dim`,
];

/**
 * Calcule le niveau d'intensite d'un point heatmap (0-4)
 * pour determiner l'opacite CSS.
 */
export function getHeatmapLevel(point: SebastianHeatmapPoint): number {
  if (point.combined === 0) return 0;
  if (point.combined <= 1) return 1;
  if (point.combined <= 3) return 2;
  if (point.combined <= 4) return 3;
  return 4;
}
