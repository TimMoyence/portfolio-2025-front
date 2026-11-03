function facesNonChargees(): readonly string[] {
  return [...document.fonts]
    .filter((face) => face.status !== 'loaded')
    .map((face) => `${face.family} ${face.weight} ${face.style} ${face.unicodeRange}`);
}

describe('Polices des specs', () => {
  it('chaque face déclarée par les styles est chargée avant le premier test ; un glyphe hors de leurs plages (∧ ∨ ⇒ ≈ ≤ …) reste dessiné par la police de repli du système', () => {
    expect(document.fonts.size).toBeGreaterThan(0);
    expect(facesNonChargees()).toEqual([]);
  });
});
