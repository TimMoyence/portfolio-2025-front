import { lierLesNombres } from './typographie';

const INSECABLE = ' ';

describe('lierLesNombres', () => {
  it('lie un nombre à son unité et ses groupes de milliers', () => {
    expect(lierLesNombres('part de 0 € et de 284 000 €, soit 27,6 %')).toBe(
      `part de 0${INSECABLE}€ et de 284${INSECABLE}000${INSECABLE}€, soit 27,6${INSECABLE}%`,
    );
  });

  it('laisse les autres espaces sécables', () => {
    expect(lierLesNombres('en 2025 les 12 mois')).toBe('en 2025 les 12 mois');
  });
});
