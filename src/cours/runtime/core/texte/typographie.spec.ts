import { enFrancais, formaterPart, lierLesNombres } from './typographie';

const ESPACE_FINE = ' ';

describe('enFrancais', () => {
  it('L4-F11 · ecrit les milliers en espace fine insecable, la virgule et deux decimales au plus', () => {
    expect(enFrancais(6400)).toBe(`6${ESPACE_FINE}400`);
    expect(enFrancais(12500.5)).toBe(`12${ESPACE_FINE}500,5`);
    expect(enFrancais(-1234.567)).toBe(`-1${ESPACE_FINE}234,57`);
    expect(enFrancais(27.6)).toBe('27,6');
    expect(enFrancais(999)).toBe('999');
  });

  it('L4-F11 · arrondit un demi loin de zero sur la valeur ecrite, comme Excel, pas sur sa forme binaire', () => {
    expect(enFrancais(0.565)).toBe('0,57');
    expect(enFrancais(1.005, 2)).toBe('1,01');
    expect(enFrancais(-2.675, 2)).toBe('-2,68');
  });

  it('L4-F11 · ecrit un tiret pour une valeur absente ou non finie', () => {
    for (const valeur of [
      undefined,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
    ]) {
      expect(enFrancais(valeur)).withContext(String(valeur)).toBe('—');
    }
  });

  it('L4-F11 · n ecrit aucun signe devant un zero, meme arrondi', () => {
    expect(enFrancais(-0)).toBe('0');
    expect(enFrancais(-0.001)).toBe('0');
    expect(enFrancais(-0.001, 2)).toBe('0,00');
  });

  it('L4-F11 · ecrit un nombre de decimales fixe quand on le lui donne, milliers compris', () => {
    expect(enFrancais(12500.5, 2)).toBe(`12${ESPACE_FINE}500,50`);
    expect(enFrancais(1.08, 4)).toBe('1,0800');
    expect(enFrancais(8, 0)).toBe('8');
    expect(enFrancais(Number.NaN, 2)).toBe('—');
  });
});

const INSECABLE = '\u00a0';

describe('lierLesNombres', () => {
  it('lie les milliers en espace fine insécable et l unité en espace insécable, comme Intl', () => {
    expect(lierLesNombres('part de 0 € et de 284 000 €, soit 27,6 %')).toBe(
      `part de 0${INSECABLE}€ et de 284${ESPACE_FINE}000${INSECABLE}€, soit 27,6${INSECABLE}%`,
    );
  });

  it('laisse les autres espaces sécables', () => {
    expect(lierLesNombres('en 2025 les 12 mois')).toBe('en 2025 les 12 mois');
  });
});

describe('formaterPart', () => {
  it('arrondit la part écrite, pas sa forme binaire : 0,285 donne 29 %, comme PercentPipe', () => {
    expect(formaterPart(0.285, 'fr')).toBe(`29${INSECABLE}%`);
    expect(formaterPart(0.005, 'fr')).toBe(`1${INSECABLE}%`);
  });

  it('écrit les bornes et un négatif sans signe devant un zéro arrondi', () => {
    expect(formaterPart(0, 'fr')).toBe(`0${INSECABLE}%`);
    expect(formaterPart(1, 'fr')).toBe(`100${INSECABLE}%`);
    expect(formaterPart(-0.285, 'fr')).toBe(`-29${INSECABLE}%`);
    expect(formaterPart(-0.004, 'fr')).toBe(`0${INSECABLE}%`);
  });

  it('écrit un tiret pour une part non finie', () => {
    for (const valeur of [Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(formaterPart(valeur, 'fr')).withContext(String(valeur)).toBe('—');
    }
  });

  it('suit la typographie de la locale : pas d espace avant % en anglais', () => {
    expect(formaterPart(0.42, 'en')).toBe('42%');
  });

  it('prend la locale du build quand on ne la donne pas, le français à défaut', () => {
    expect(formaterPart(0.42)).toBe(formaterPart(0.42, $localize.locale ?? 'fr'));
  });
});
