export const GRAPHIQUE_MARGE_BRUTE = {
  title: 'Marge brute d’Atelier Rivage, 2022–2025',
  caption: 'Axe vertical de 0 à 300 000 €',
  labels: ['2022', '2023', '2024', '2025'],
  series: [
    { label: 'Marge brute', values: [285000, 288000, 289800, 291000], tone: 'teal' as const },
  ],
  axisRanges: [[0, 300000]],
  unit: '€',
  source: 'Comptes de résultat 2022 à 2025 d’Atelier Rivage (données fictives).',
};
