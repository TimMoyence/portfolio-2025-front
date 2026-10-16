import type { z } from 'zod';
import { estObjet } from '../cours/runtime/core/valeurs';

type Objet = Record<string, unknown>;

export const CLE_INCONNUE = 'cleInconnueDuContrat';

const DISCRIMINANTS = ['type', 'renderer'] as const;

export interface ContratDuBack {
  readonly optionnelle: (chemin: string, cle: string) => boolean;
  readonly ouvert?: (chemin: string) => boolean;
}

function variante(objet: Objet): string {
  const discriminant = DISCRIMINANTS.find((cle) => typeof objet[cle] === 'string');
  return discriminant === undefined ? '' : `<${discriminant}=${String(objet[discriminant])}>`;
}

function objetsDe(
  valeur: unknown,
  chemin: string,
  rencontre: (chemin: string, objet: Objet) => void,
  enregistrements: ReadonlySet<string>,
): void {
  if (Array.isArray(valeur)) {
    for (const element of valeur) {
      objetsDe(element, `${chemin}[]`, rencontre, enregistrements);
    }
  } else if (estObjet(valeur)) {
    const objet = valeur as Objet;
    const ici = `${chemin}${variante(objet)}`;
    rencontre(ici, objet);
    for (const [cle, contenu] of Object.entries(objet)) {
      objetsDe(
        contenu,
        `${ici}.${enregistrements.has(ici) ? '*' : cle}`,
        rencontre,
        enregistrements,
      );
    }
  }
}

function muter(
  document: unknown,
  chemin: string,
  enregistrements: ReadonlySet<string>,
  mutation: (objet: Objet) => void,
): unknown {
  const copie: unknown = structuredClone(document);
  let fait = false;
  objetsDe(
    copie,
    '$',
    (ici, objet) => {
      if (!fait && ici === chemin) {
        mutation(objet);
        fait = true;
      }
    },
    enregistrements,
  );
  return copie;
}

function accepte(schema: z.ZodType, valeur: unknown): boolean {
  return schema.safeParse(valeur).success;
}

interface CheminServi {
  toujours: ReadonlySet<string>;
  document: unknown;
  taille: number;
}

interface Chemins {
  readonly servis: ReadonlyMap<string, CheminServi>;
  readonly enregistrements: ReadonlySet<string>;
}

export function cheminsServis(schema: z.ZodType, documents: readonly unknown[]): Chemins {
  const servis = new Map<string, CheminServi>();
  const enregistrements = new Set<string>();
  const classes = new Set<string>();
  for (const document of documents.filter((servi) => accepte(schema, servi))) {
    const taille = JSON.stringify(document).length;
    const rencontre = (chemin: string, objet: Objet): void => {
      const premiere = Object.keys(objet).at(0);
      if (!classes.has(chemin) && premiere !== undefined) {
        classes.add(chemin);
        const copieSousUnAutreNom = muter(document, chemin, enregistrements, (ici) => {
          ici[CLE_INCONNUE] = ici[premiere];
        });
        if (accepte(schema, copieSousUnAutreNom)) {
          enregistrements.add(chemin);
        }
      }
      const cles = new Set(Object.keys(objet));
      const connu = servis.get(chemin);
      if (connu === undefined) {
        servis.set(chemin, { toujours: cles, document, taille });
        return;
      }
      connu.toujours = new Set([...connu.toujours].filter((cle) => cles.has(cle)));
      if (taille < connu.taille) {
        connu.document = document;
        connu.taille = taille;
      }
    };
    objetsDe(document, '$', rencontre, enregistrements);
  }
  return { servis, enregistrements };
}

export function tolerancesDe(
  schema: z.ZodType,
  documents: readonly unknown[],
  contrat: ContratDuBack,
): readonly string[] {
  const fautes: string[] = [];
  const { servis, enregistrements } = cheminsServis(schema, documents);
  for (const [chemin, { toujours, document }] of servis) {
    if (contrat.ouvert?.(chemin) === true) {
      continue;
    }
    const avecUneCleInconnue = muter(document, chemin, enregistrements, (objet) => {
      objet[CLE_INCONNUE] = { [CLE_INCONNUE]: true };
    });
    if (accepte(schema, avecUneCleInconnue)) {
      fautes.push(`${chemin} accepte une clé inconnue`);
    }
    const requises = [...toujours].filter((cle) => !contrat.optionnelle(chemin, cle));
    for (const cle of enregistrements.has(chemin) ? [] : requises) {
      const sansLaCle = muter(document, chemin, enregistrements, (objet) => {
        delete objet[cle];
      });
      if (accepte(schema, sansLaCle)) {
        fautes.push(`${chemin}.${cle} toujours servie, mais tolérée absente`);
      }
    }
  }
  return fautes;
}
