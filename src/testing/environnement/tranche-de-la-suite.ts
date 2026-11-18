export interface Tranche {
  readonly rang: number;
  readonly total: number;
}

const FORME_D_UNE_TRANCHE = /^(\d+)\/(\d+)$/;

export function lireLaTranche(lue: string | undefined): Tranche | null {
  if (lue === undefined || lue === '') {
    return null;
  }
  const trouvee = FORME_D_UNE_TRANCHE.exec(lue);
  const rang = Number(trouvee?.[1]);
  const total = Number(trouvee?.[2]);
  if (trouvee === null || total === 0 || rang >= total) {
    throw new Error(`tranche « ${lue} » hors de la suite : attendu « rang/total », rang < total`);
  }
  return { rang, total };
}

function nomsDesSpecs(noeud: jasmine.Spec | jasmine.Suite): string[] {
  return 'children' in noeud ? noeud.children.flatMap(nomsDesSpecs) : [noeud.getFullName()];
}

const parCodeUnite = (gauche: string, droite: string): number =>
  Number(gauche > droite) - Number(gauche < droite);

export function jouerLaTranche(env: jasmine.Env, lue: string | undefined): void {
  const tranche = lireLaTranche(lue);
  if (tranche === null) {
    return;
  }
  let retenues: ReadonlySet<string> | null = null;
  env.configure({
    specFilter: (spec) => {
      retenues ??= new Set(
        specsDeLaTranche([...new Set(nomsDesSpecs(env.topSuite()))].sort(parCodeUnite), tranche),
      );
      return retenues.has(spec.getFullName());
    },
  });
}

export function specsDeLaTranche<T>(specs: readonly T[], { rang, total }: Tranche): T[] {
  return specs.filter((_, position) => position % total === rang);
}
