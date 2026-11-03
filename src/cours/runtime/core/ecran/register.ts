export const BLOCS: ReadonlyArray<{
  nom: string;
  charge: () => Promise<CustomElementConstructor>;
}> = [
  { nom: 'fp-vote', charge: async () => (await import('../../blocks/questions/FpVote')).FpVote },
  {
    nom: 'fp-numeric',
    charge: async () => (await import('../../blocks/questions/FpNumeric')).FpNumeric,
  },
  {
    nom: 'fp-recall',
    charge: async () => (await import('../../blocks/questions/FpRecall')).FpRecall,
  },
  { nom: 'fp-pulse', charge: async () => (await import('../../blocks/questions/FpPulse')).FpPulse },
  {
    nom: 'fp-challenge',
    charge: async () => (await import('../../blocks/activites/FpChallenge')).FpChallenge,
  },
  { nom: 'fp-quote', charge: async () => (await import('../../blocks/contenus/FpQuote')).FpQuote },
  { nom: 'fp-story', charge: async () => (await import('../../blocks/contenus/FpStory')).FpStory },
  { nom: 'fp-pro', charge: async () => (await import('../../blocks/activites/FpPro')).FpPro },
  {
    nom: 'fp-concept4',
    charge: async () => (await import('../../blocks/contenus/FpConcept4')).FpConcept4,
  },
  {
    nom: 'fp-worked',
    charge: async () => (await import('../../blocks/activites/FpWorked')).FpWorked,
  },
  { nom: 'fp-plot', charge: async () => (await import('../../blocks/contenus/FpPlot')).FpPlot },
  {
    nom: 'fp-table-build',
    charge: async () => (await import('../../blocks/activites/FpTableBuild')).FpTableBuild,
  },
  { nom: 'fp-sheet', charge: async () => (await import('../../blocks/activites/FpSheet')).FpSheet },
  {
    nom: 'fp-cardsort',
    charge: async () => (await import('../../blocks/questions/FpCardsort')).FpCardsort,
  },
  {
    nom: 'fp-escape',
    charge: async () => (await import('../../blocks/activites/FpEscape')).FpEscape,
  },
  {
    nom: 'fp-spaced',
    charge: async () => (await import('../../blocks/questions/FpSpaced')).FpSpaced,
  },
];

let enregistre = false;

export async function registerCoursBlocks(): Promise<void> {
  if (enregistre || typeof customElements === 'undefined') {
    return;
  }
  const aDefinir = BLOCS.filter((bloc) => !customElements.get(bloc.nom));
  const constructeurs = await Promise.all(aDefinir.map((bloc) => bloc.charge()));
  aDefinir.forEach((bloc, rang) => {
    if (!customElements.get(bloc.nom)) {
      customElements.define(bloc.nom, constructeurs[rang]);
    }
  });
  enregistre = true;
}

export function resetCoursBlocksRegistration(): void {
  enregistre = false;
}
