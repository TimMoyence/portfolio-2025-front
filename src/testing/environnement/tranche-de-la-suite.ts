import contrat from './tranche-de-la-suite.json';

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

export function jouerLaTranche(
  env: jasmine.Env,
  lue: string | undefined,
  publier: (ligne: string) => void,
): void {
  const tranche = lireLaTranche(lue);
  if (tranche === null) {
    return;
  }
  let retenues: ReadonlySet<string> | null = null;
  env.configure({
    specFilter: (spec) => {
      retenues ??= new Set(specsDeLaTranche(nomsTries(env, publier), tranche));
      return retenues.has(spec.getFullName());
    },
  });
}

const GRAINE_FNV = 0x811c9dc5;
const PREMIER_FNV = 0x01000193;

function empreinteDesNoms(noms: readonly string[]): string {
  const texte = noms.join('\n');
  let empreinte = GRAINE_FNV;
  for (let rang = 0; rang < texte.length; rang += 1) {
    empreinte = Math.imul(empreinte ^ texte.charCodeAt(rang), PREMIER_FNV) >>> 0;
  }
  return `${noms.length}-${empreinte.toString(16)}`;
}

function nomsTries(env: jasmine.Env, publier: (ligne: string) => void): string[] {
  const noms = [...new Set(nomsDesSpecs(env.topSuite()))].sort(parCodeUnite);
  publier(`${contrat.marqueDeLEmpreinte} ${empreinteDesNoms(noms)}`);
  return noms;
}

export function specsDeLaTranche<T>(specs: readonly T[], { rang, total }: Tranche): T[] {
  return specs.filter((_, position) => position % total === rang);
}
