export const BLOCS: ReadonlyArray<{
  nom: string;
  charge: () => Promise<CustomElementConstructor>;
}> = [{ nom: 'fp-vote', charge: async () => (await import('../blocks/FpVote')).FpVote }];

let enregistre = false;

export async function registerCoursBlocks(): Promise<void> {
  if (enregistre || typeof customElements === 'undefined') {
    return;
  }
  for (const bloc of BLOCS) {
    if (!customElements.get(bloc.nom)) {
      customElements.define(bloc.nom, await bloc.charge());
    }
  }
  enregistre = true;
}

export function resetCoursBlocksRegistration(): void {
  enregistre = false;
}
