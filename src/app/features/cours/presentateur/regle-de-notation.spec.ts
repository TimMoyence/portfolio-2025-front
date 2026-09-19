import { buildRegleNotation } from '../../../../testing/factories/formations.factory';
import { phraseDeNotation } from './regle-de-notation';

describe('phraseDeNotation', () => {
  it('rend la regle servie en une phrase lisible par le formateur', () => {
    const phrase = phraseDeNotation(buildRegleNotation());

    expect(phrase).toMatch(/^Note \/20 de participation relative à la cohorte/);
    expect(phrase).toMatch(/20\s?% les plus actifs/);
    expect(phrase).toMatch(/sous 40\s?% de cette référence/);
    expect(phrase).toContain('« je ne sais pas » compte comme une réponse');
    expect(phrase).toContain('une non-réponse vaut 0 point');
    expect(phrase).toContain('les réponses libres ne sont pas notées');
    expect(phrase).toMatch(/problématique sous 70\s?% de réussite/);
    expect(phrase).not.toContain('\n');
  });

  it('suit les options de la regle au lieu de les supposer', () => {
    const phrase = phraseDeNotation(
      buildRegleNotation({
        noteMax: 10,
        neSaitPasCompteCommeReponse: false,
        reponsesLibresNotees: true,
      }),
    );

    expect(phrase).toMatch(/^Note \/10 /);
    expect(phrase).toContain('« je ne sais pas » ne compte pas comme une réponse');
    expect(phrase).toContain('les réponses libres sont notées');
  });
});
