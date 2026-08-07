import { clamp } from './math.utils';

describe('clamp', () => {
  it('devrait retourner la valeur quand elle est dans les bornes', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('devrait retourner min quand la valeur est sous min', () => {
    expect(clamp(-3, 0, 10)).toBe(0);
  });

  it('devrait retourner max quand la valeur est au-dessus de max', () => {
    expect(clamp(42, 0, 10)).toBe(10);
  });

  it('devrait inclure les bornes (valeur === min)', () => {
    expect(clamp(0, 0, 10)).toBe(0);
  });

  it('devrait inclure les bornes (valeur === max)', () => {
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it('devrait retourner NaN quand la valeur est NaN (comportement natif preserve)', () => {
    expect(clamp(NaN, 0, 10)).toBeNaN();
  });

  it('devrait faire gagner min quand min > max (bornes inversees non corrigees)', () => {
    // Math.min(0, 5) = 0 ; Math.max(10, 0) = 10 -> identique a l'expression d'origine
    expect(clamp(5, 10, 0)).toBe(10);
  });

  it('devrait retourner la valeur telle quelle avec des bornes infinies', () => {
    expect(clamp(7, -Infinity, Infinity)).toBe(7);
    expect(clamp(-12345, -Infinity, Infinity)).toBe(-12345);
  });

  it('devrait gerer des bornes negatives (cas not-found)', () => {
    expect(clamp(-5, -16, 16)).toBe(-5);
  });

  it('devrait clamper aux bornes negatives', () => {
    expect(clamp(-20, -16, 16)).toBe(-16);
    expect(clamp(20, -16, 16)).toBe(16);
  });

  it("devrait rester coherent avec l'expression Math.max(min, Math.min(max, value))", () => {
    // Verifie l'equivalence octet-pour-octet sur un echantillon de valeurs.
    const cases: Array<[number, number, number]> = [
      [5, 0, 10],
      [-3, 0, 10],
      [42, 0, 10],
      [-5, -16, 16],
      [1, -10, 40],
      [50, -10, 40],
      [0.5, 0, 1],
    ];
    for (const [value, min, max] of cases) {
      expect(clamp(value, min, max)).toBe(Math.max(min, Math.min(max, value)));
    }
  });

  it('devrait retourner 0 pour clamp(-0, 0, 10) (semantique Math native)', () => {
    // On ne sur-teste pas le signe du zero : la valeur numerique est 0.
    expect(clamp(-0, 0, 10)).toBe(0);
  });
});
