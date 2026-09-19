export const BLOCS: ReadonlyArray<{
  nom: string;
  charge: () => Promise<CustomElementConstructor>;
}> = [
  { nom: 'fp-vote', charge: async () => (await import('../blocks/FpVote')).FpVote },
  { nom: 'fp-numeric', charge: async () => (await import('../blocks/FpNumeric')).FpNumeric },
  { nom: 'fp-recall', charge: async () => (await import('../blocks/FpRecall')).FpRecall },
  { nom: 'fp-exit', charge: async () => (await import('../blocks/FpExit')).FpExit },
  { nom: 'fp-challenge', charge: async () => (await import('../blocks/FpChallenge')).FpChallenge },
  { nom: 'fp-quote', charge: async () => (await import('../blocks/FpQuote')).FpQuote },
  { nom: 'fp-story', charge: async () => (await import('../blocks/FpStory')).FpStory },
  { nom: 'fp-pro', charge: async () => (await import('../blocks/FpPro')).FpPro },
  { nom: 'fp-concept4', charge: async () => (await import('../blocks/FpConcept4')).FpConcept4 },
  { nom: 'fp-worked', charge: async () => (await import('../blocks/FpWorked')).FpWorked },
  { nom: 'fp-plot', charge: async () => (await import('../blocks/FpPlot')).FpPlot },
  { nom: 'fp-cardsort', charge: async () => (await import('../blocks/FpCardsort')).FpCardsort },
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
