import { z } from 'zod';
import { REPONSES_SERVIES, reponsesServiesPar } from './fixtures/reponses-servies';
import { cheminsServis, tolerancesDe, type ContratDuBack } from './tolerances-des-schemas';

export interface ReponsesServiesLues {
  readonly nom: string;
  readonly routes: readonly (readonly [string, z.ZodType])[];
  readonly schemas: Readonly<Record<string, unknown>>;
  readonly horsRoute?: readonly z.ZodType[];
  readonly documentsDe: (route: string) => readonly unknown[];
  readonly optionnelles: Readonly<Partial<Record<string, readonly string[]>>>;
  readonly normaliser?: (chemin: string) => string;
  readonly ouvert?: (chemin: string) => boolean;
}

export interface RoutesServiesSansSchema {
  readonly nonLues: readonly string[];
  readonly declareesNonServies: readonly string[];
}

export function routesServiesSansSchema(
  routes: readonly (readonly [string, z.ZodType])[],
  duPerimetre: (servie: string) => boolean,
  sansLecteur: Readonly<Record<string, string>>,
): RoutesServiesSansSchema {
  const lues = new Set(routes.map(([lue]) => lue));
  const servies = new Set(REPONSES_SERVIES.map(({ route }) => route).filter(duPerimetre));
  return {
    nonLues: [...servies].filter((servie) => !lues.has(servie) && !(servie in sansLecteur)),
    declareesNonServies: Object.keys(sansLecteur).filter((servie) => !servies.has(servie)),
  };
}

export function lireLesReponsesServies(lues: ReponsesServiesLues): void {
  const normaliser = lues.normaliser ?? ((chemin: string) => chemin);
  const contrat: ContratDuBack = {
    optionnelle: (chemin, cle) => lues.optionnelles[normaliser(chemin)]?.includes(cle) ?? false,
    ouvert: lues.ouvert,
  };

  it('a au moins une réponse servie pour chaque route que le front lit', () => {
    const sansReponse = lues.routes
      .map(([lue]) => lue)
      .filter((lue) => reponsesServiesPar(lue).length === 0);

    expect(sansReponse).toEqual([]);
  });

  it(`associe chaque schéma exporté ${lues.nom} à une route lue`, () => {
    const associes = new Set<unknown>([
      ...lues.routes.map(([, schema]) => schema),
      ...(lues.horsRoute ?? []),
    ]);
    const orphelins = Object.entries(lues.schemas)
      .filter(([, valeur]) => valeur instanceof z.ZodType && !associes.has(valeur))
      .map(([nom]) => nom);

    expect(orphelins).toEqual([]);
  });

  it('ne déclare optionnelle au contrat qu’une clé réellement servie', () => {
    const servies = new Set(
      lues.routes.flatMap(([lue, schema]) =>
        [...cheminsServis(schema, lues.documentsDe(lue)).servis].flatMap(([chemin, { toujours }]) =>
          [...toujours].map((cle) => `${normaliser(chemin)} ${cle}`),
        ),
      ),
    );
    const declarees = Object.entries(lues.optionnelles).flatMap(([chemin, cles]) =>
      (cles ?? []).map((cle) => `${chemin} ${cle}`),
    );

    expect(declarees.filter((declaree) => !servies.has(declaree))).toEqual([]);
  });

  for (const [lue, schema] of lues.routes) {
    describe(lue, () => {
      it('lit chaque réponse servie sans écart, ni clé ajoutée ni clé perdue', () => {
        for (const document of lues.documentsDe(lue)) {
          const lu = schema.safeParse(document);

          expect(lu.success ? [] : lu.error.issues).toEqual([]);
          expect(lu.data).toEqual(document);
        }
      });

      it('refuse une clé inconnue et l absence d une clé toujours servie, à chaque niveau', () => {
        expect(tolerancesDe(schema, lues.documentsDe(lue), contrat)).toEqual([]);
      });
    });
  }
}
