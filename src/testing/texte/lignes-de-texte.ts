function plageDe(cible: Range | Node): Range {
  if (cible instanceof Range) {
    return cible;
  }
  const plage = document.createRange();
  plage.selectNodeContents(cible);
  return plage;
}

export function lignesDe(cible: Range | Node): number {
  return new Set(
    [...plageDe(cible).getClientRects()]
      .filter(({ width }) => width > 0)
      .map(({ top }) => Math.round(top)),
  ).size;
}
