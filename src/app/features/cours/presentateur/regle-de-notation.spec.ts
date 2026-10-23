import {
  buildRegleNotation,
  buildResumeBareme,
} from '../../../../testing/factories/formations.factory';
import { phraseDeNotation } from './regle-de-notation';

describe('phraseDeNotation', () => {
  it('rend la regle servie en une phrase lisible par le formateur', () => {
    const phrase = phraseDeNotation(buildRegleNotation());

    expect(phrase).toMatch(/^L’avancement d’un étudiant est la part des questions du barème/);
    expect(phrase).not.toMatch(/Note \/|sous le seuil/);
    expect(phrase).not.toContain('20 % les plus actifs');
    expect(phrase).not.toContain('Sous 40 % de cette référence');
    expect(phrase).toContain('« je ne sais pas » compte comme une réponse');
    expect(phrase).toContain('une non-réponse vaut 0 point');
    expect(phrase).toContain('les réponses libres ne sont pas notées');
    expect(phrase).toContain('problématique sous 70 % de réussite');
    expect(phrase).not.toContain('\n');
  });

  it('suit les options de la regle au lieu de les supposer', () => {
    const phrase = phraseDeNotation(
      buildRegleNotation({
        neSaitPasCompteCommeReponse: false,
        reponsesLibresNotees: true,
      }),
    );

    expect(phrase).toContain('« je ne sais pas » ne compte pas comme une réponse');
    expect(phrase).toContain('les réponses libres sont notées');
  });

  it('ne redit pas le sort de « je ne sais pas » dans la phrase du barème, qui ne lit pas la règle', () => {
    const phrase = phraseDeNotation(
      buildRegleNotation({ neSaitPasCompteCommeReponse: false }),
      buildResumeBareme(),
    );

    expect(phrase.match(/« je ne sais pas »/gu)).toEqual(['« je ne sais pas »']);
  });

  it('donne le denominateur des questions notees quand le bareme est servi', () => {
    const sansBareme = phraseDeNotation(buildRegleNotation());
    const avecBareme = phraseDeNotation(buildRegleNotation(), buildResumeBareme());

    expect(sansBareme).not.toContain('questions notées');
    expect(avecBareme.startsWith(sansBareme)).toBeTrue();
    expect(avecBareme).toContain(
      'sur 31 questions notées comptent (votes, numérique, classement, feuille et tableau)',
    );
    expect(avecBareme).toContain('une production vide est refusée');
    expect(avecBareme).toContain('Ne comptent pas : énigmes.');
  });

  it('nomme les types notés et exclus d après le barème servi, pas d après une liste écrite', () => {
    const phrase = phraseDeNotation(
      buildRegleNotation(),
      buildResumeBareme({
        questionsNotees: 4,
        parType: {
          vote: { notees: 0, nonNotees: 2 },
          numeric: { notees: 4, nonNotees: 0 },
          classement: { notees: 0, nonNotees: 0 },
          feuille: { notees: 0, nonNotees: 0 },
          tableau: { notees: 0, nonNotees: 0 },
          enigme: { notees: 0, nonNotees: 0 },
        },
      }),
    );

    expect(phrase).toContain('sur 4 questions notées comptent (numérique)');
    expect(phrase).toContain('Ne comptent pas : votes.');
  });
});
