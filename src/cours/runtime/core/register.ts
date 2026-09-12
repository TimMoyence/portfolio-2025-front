export const BLOCS: ReadonlyArray<{
  nom: string;
  charge: () => Promise<CustomElementConstructor>;
}> = [
  { nom: 'fp-vote', charge: async () => (await import('../blocks/FpVote')).FpVote },
  { nom: 'fp-numeric', charge: async () => (await import('../blocks/FpNumeric')).FpNumeric },
];

let enregistre = false;

export async function registerCoursBlocks(): Promise<void> {
  if (enregistre || typeof customElements === 'undefined') {
    return;
  }
  const aDefinir = BLOCS.filter((bloc) => !customElements.get(bloc.nom));
  const constructeurs = await Promise.all(aDefinir.map((bloc) => bloc.charge()));
  aDefinir.forEach((bloc, rang) => {
    customElements.define(bloc.nom, constructeurs[rang]);
  });
  enregistre = true;
}

export function resetCoursBlocksRegistration(): void {
  enregistre = false;
}
