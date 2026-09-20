import type { ResumeBareme } from '../../../../cours/content/types';
import {
  buildRegleNotation,
  buildResumeBareme,
} from '../../../../testing/factories/formations.factory';
import type { RegleNotation } from '../../../core/ports/formations.port';
import { phraseDeNotation } from './regle-de-notation';

const NOTES_MAX = [0, 1, 20, 100];
const PARTS_DE_COHORTE = [0, 0.05, 0.333, 1];
const RATIOS_DE_SEUIL = [0, 0.4, 1];
const POINTS_DE_NON_REPONSE = [0, 0.5, 2];
const SEUILS_DE_PROBLEME = [0, 0.7, 1];
const QUESTIONS_NOTEES = [null, 0, 31];
const BOOLEENS = [true, false];
const INTERDITS = ['undefined', 'NaN', 'null', 'Infinity', '{', '}', '\n'];

type Surcharges = Partial<RegleNotation>;

interface Combinaison {
  readonly regle: RegleNotation;
  readonly bareme: ResumeBareme | null;
}

const AXES: readonly (readonly Surcharges[])[] = [
  NOTES_MAX.map((noteMax) => ({ noteMax })),
  PARTS_DE_COHORTE.map((partCohorteReference) => ({ partCohorteReference })),
  RATIOS_DE_SEUIL.map((ratioSeuilValidation) => ({ ratioSeuilValidation })),
  POINTS_DE_NON_REPONSE.map((pointsNonReponse) => ({ pointsNonReponse })),
  SEUILS_DE_PROBLEME.map((seuilQuestionProbleme) => ({ seuilQuestionProbleme })),
  BOOLEENS.map((neSaitPasCompteCommeReponse) => ({ neSaitPasCompteCommeReponse })),
  BOOLEENS.map((reponsesLibresNotees) => ({ reponsesLibresNotees })),
];

function produitDesAxes(axes: readonly (readonly Surcharges[])[]): Surcharges[] {
  return axes.reduce<Surcharges[]>(
    (acquises, axe) => acquises.flatMap((debut) => axe.map((valeur) => ({ ...debut, ...valeur }))),
    [{}],
  );
}

const COMBINAISONS: readonly Combinaison[] = produitDesAxes(AXES).flatMap((surcharges) =>
  QUESTIONS_NOTEES.map((questionsNotees) => ({
    regle: buildRegleNotation(surcharges),
    bareme: questionsNotees === null ? null : buildResumeBareme({ questionsNotees }),
  })),
);

function pourCent(part: number): string {
  return `${Math.round(part * 100)} %`;
}

function intitule({ regle, bareme }: Combinaison): string {
  return [
    `note /${regle.noteMax}`,
    `cohorte ${regle.partCohorteReference}`,
    `seuil ${regle.ratioSeuilValidation}`,
    `non-réponse ${regle.pointsNonReponse}`,
    `problème ${regle.seuilQuestionProbleme}`,
    `je ne sais pas ${regle.neSaitPasCompteCommeReponse}`,
    `libres ${regle.reponsesLibresNotees}`,
    `barème ${bareme === null ? 'absent' : bareme.questionsNotees}`,
  ].join(' · ');
}

describe('simulation : la phrase de notation sur tout le produit des options', () => {
  it('enumere bien le produit cartesien des options servies', () => {
    const attendu = AXES.reduce((compte, axe) => compte * axe.length, 1) * QUESTIONS_NOTEES.length;

    expect(COMBINAISONS.length).toBe(attendu);
    expect(attendu).toBeGreaterThan(1000);
  });

  it('ne laisse jamais passer undefined, NaN ni une cle de gabarit', () => {
    for (const combinaison of COMBINAISONS) {
      const phrase = phraseDeNotation(combinaison.regle, combinaison.bareme);
      const contexte = intitule(combinaison);
      const fuites = INTERDITS.filter((interdit) => phrase.includes(interdit));

      expect(fuites).withContext(contexte).toEqual([]);
      expect(phrase.trim().length).withContext(contexte).toBeGreaterThan(0);
    }
  });

  it('dit la note, les pourcentages et les points que la regle porte', () => {
    for (const combinaison of COMBINAISONS) {
      const { regle } = combinaison;
      const phrase = phraseDeNotation(regle, combinaison.bareme);
      const contexte = intitule(combinaison);
      const manquants = [
        pourCent(regle.partCohorteReference),
        pourCent(regle.ratioSeuilValidation),
        pourCent(regle.seuilQuestionProbleme),
        `vaut ${regle.pointsNonReponse} point`,
      ].filter((attendu) => !phrase.includes(attendu));

      expect(phrase.startsWith(`Note /${regle.noteMax} `))
        .withContext(contexte)
        .toBeTrue();
      expect(manquants).withContext(contexte).toEqual([]);
    }
  });

  it('suit chaque option binaire au lieu de la supposer', () => {
    for (const combinaison of COMBINAISONS) {
      const { regle } = combinaison;
      const phrase = phraseDeNotation(regle, combinaison.bareme);
      const contexte = intitule(combinaison);
      const neComptePas = phrase.includes('« je ne sais pas » ne compte pas');
      const libresNotees = phrase.includes('les réponses libres sont notées');

      expect(neComptePas).withContext(contexte).toBe(!regle.neSaitPasCompteCommeReponse);
      expect(libresNotees).withContext(contexte).toBe(regle.reponsesLibresNotees);
    }
  });

  it('n annonce un denominateur de questions notees que quand le bareme est servi', () => {
    for (const combinaison of COMBINAISONS) {
      const phrase = phraseDeNotation(combinaison.regle, combinaison.bareme);
      const contexte = intitule(combinaison);
      const bareme = combinaison.bareme;

      if (bareme === null) {
        expect(phrase).withContext(contexte).not.toContain('questions notées');
        continue;
      }
      const sansBareme = phraseDeNotation(combinaison.regle, null);

      expect(phrase.startsWith(`${sansBareme} `))
        .withContext(contexte)
        .toBeTrue();
      expect(phrase).withContext(contexte).toContain(`sur ${bareme.questionsNotees} questions`);
    }
  });
});
