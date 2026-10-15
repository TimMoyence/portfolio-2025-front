function facesNonChargees(): readonly string[] {
  return [...document.fonts]
    .filter((face) => face.status !== 'loaded')
    .map((face) => `${face.family} ${face.weight} ${face.style} ${face.unicodeRange}`);
}

describe('Polices des specs', () => {
  it('chaque face déclarée par les styles est chargée avant le premier test, pour qu aucune mesure ne se prenne sur une police de repli', () => {
    expect(document.fonts.size).toBeGreaterThan(0);
    expect(facesNonChargees()).toEqual([]);
  });
});
