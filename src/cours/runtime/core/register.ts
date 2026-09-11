let enregistre = false;

export async function registerCoursBlocks(): Promise<void> {
  if (enregistre || typeof customElements === 'undefined') {
    return;
  }
  const { FpVote } = await import('../blocks/FpVote');
  if (!customElements.get('fp-vote')) {
    customElements.define('fp-vote', FpVote);
  }
  enregistre = true;
}
