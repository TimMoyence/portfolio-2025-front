import { feuilleDe, nomsDesBriques } from './index';
import { base, correction } from '../styles';

const MOTIF_CLASSE = /\.fp-[\w-]+/g;

function classesDeclarees(feuille: string): string[] {
  const sansPortee = feuille.replace(/:where\([^)]*\)/g, '');
  const trouvees = sansPortee.match(MOTIF_CLASSE) ?? [];
  return [...new Set(trouvees)];
}

describe('nommage css des briques', () => {
  const classesDeLaBase = new Set(classesDeclarees(base));

  for (const [nom, couche] of [
    ['base', base],
    ['correction', correction],
  ] as const) {
    for (const classe of classesDeclarees(couche)) {
      it(`styles.ts (${nom}) ne nomme aucune classe de brique : ${classe}`, () => {
        const brique = nomsDesBriques().find((candidat) => classe.startsWith(`.fp-${candidat}__`));
        expect(brique)
          .withContext(
            `styles.ts (${nom}) : \`${classe}\` appartient a la brique « ${brique} » et doit vivre dans sa feuille, sinon styles.ts redevient le point de contention que seize briques se disputeront`,
          )
          .toBeUndefined();
      });
    }
  }

  for (const brique of nomsDesBriques()) {
    const feuille = feuilleDe(brique);
    const classes = classesDeclarees(feuille);
    const prefixe = `.fp-${brique}__`;
    const fichier = `${brique}.ts`;

    describe(fichier, () => {
      it('declare au moins une classe', () => {
        expect(classes.length)
          .withContext(`${fichier} : aucune classe css trouvee, la garde ne garde rien`)
          .toBeGreaterThan(0);
      });

      it('n exige jamais le prefixe de brique sur fp-root', () => {
        expect(feuille.includes('.fp-root'))
          .withContext(
            `${fichier} : .fp-root est attendu comme portee, il devrait apparaitre dans la feuille`,
          )
          .toBe(true);
        expect(classes.includes('.fp-root'))
          .withContext(
            `${fichier} : .fp-root a ete traite comme une classe propre a la brique alors qu il est l exception posee par FpBlock.refresh()`,
          )
          .toBe(false);
      });

      for (const classe of classes) {
        it(`${classe} respecte le motif ${prefixe}*`, () => {
          expect(classe.startsWith(prefixe))
            .withContext(`${fichier} : \`${classe}\` ne respecte pas le motif \`${prefixe}*\``)
            .toBe(true);
        });

        it(`${classe} ne redefinit pas une classe de la base`, () => {
          expect(classesDeLaBase.has(classe))
            .withContext(`${fichier} : \`${classe}\` redéfinit une classe de la base`)
            .toBe(false);
        });
      }
    });
  }
});
