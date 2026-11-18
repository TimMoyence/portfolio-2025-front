import { empreinteSurDeuxImages } from './deux-images';

describe('empreinteSurDeuxImages', () => {
  const lire = (mesures: readonly string[]): string[] => {
    let rang = 0;
    const empreinte = empreinteSurDeuxImages(() => mesures[rang++] ?? '');
    return mesures.map(() => empreinte());
  };

  it('reste la même tant que la mise en page alterne entre deux états', () => {
    const lues = lire(['A', 'B', 'A', 'B', 'A']);

    expect(new Set(lues.slice(1)).size).toBe(1);
  });

  it('reste la même quand la mise en page ne bouge plus', () => {
    const lues = lire(['A', 'A', 'A']);

    expect(new Set(lues).size).toBe(1);
  });

  it('change à chaque nouvel état, tant que la mise en page se déplace', () => {
    const lues = lire(['A', 'B', 'C', 'D']);

    expect(new Set(lues).size).toBe(4);
  });
});
