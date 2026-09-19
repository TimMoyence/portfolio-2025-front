export function melangeur(graine: number): () => number {
  let etat = graine >>> 0;
  return () => {
    etat = (etat + 0x6d2b79f5) >>> 0;
    let melange = Math.imul(etat ^ (etat >>> 15), 1 | etat);
    melange = (melange + Math.imul(melange ^ (melange >>> 7), 61 | melange)) ^ melange;
    return ((melange ^ (melange >>> 14)) >>> 0) / 4294967296;
  };
}
