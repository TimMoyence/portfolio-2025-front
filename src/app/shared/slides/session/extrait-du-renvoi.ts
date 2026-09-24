import type { CadrageDuRenvoi, EcranContent } from '../../../../cours/content/types';

type Objet = Readonly<Record<string, unknown>>;

const CHAMPS_DU_CAS = ['metier', 'situation', 'geste'] as const;

function estObjet(valeur: unknown): valeur is Objet {
  return typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur);
}

function sans(objet: Objet, cles: readonly string[]): Objet {
  return Object.fromEntries(Object.entries(objet).filter(([cle]) => !cles.includes(cle)));
}

function lignesDuTableau(donnees: Objet, lignes: readonly number[]): Objet {
  const recit = donnees['recit'];
  const presentation = estObjet(recit) ? recit['presentation'] : undefined;
  const props = estObjet(presentation) ? presentation['props'] : undefined;
  if (!estObjet(recit) || !estObjet(presentation) || !estObjet(props)) {
    return donnees;
  }
  const reste = sans(props, ['title', 'subtitle', 'note']);
  const rows = Array.isArray(props['rows']) ? props['rows'] : [];
  return {
    ...donnees,
    recit: {
      ...recit,
      presentation: {
        ...presentation,
        props: { ...reste, rows: lignes.flatMap((rang) => rows[rang] ?? []) },
      },
    },
  };
}

function champsDuCas(donnees: Objet, champs: readonly string[]): Objet {
  const cas = donnees['cas'];
  if (!estObjet(cas)) {
    return donnees;
  }
  const reste = sans(cas, ['questionsLibres']);
  const gardes = new Set(champs);
  return {
    ...donnees,
    cas: {
      ...reste,
      ...Object.fromEntries(
        CHAMPS_DU_CAS.filter((champ) => !gardes.has(champ)).map((champ) => [champ, '']),
      ),
      consequence: gardes.has('consequence') ? reste['consequence'] : null,
    },
  };
}

export function extraireDuRenvoi(
  ecran: EcranContent,
  cadrage: CadrageDuRenvoi | undefined,
): EcranContent {
  const extrait = cadrage?.extrait;
  const donnees = ecran.donnees;
  if (extrait === undefined || donnees === undefined) {
    return ecran;
  }
  const parLignes =
    extrait.lignes === undefined ? donnees : lignesDuTableau(donnees, extrait.lignes);
  const parChamps =
    extrait.champs === undefined ? parLignes : champsDuCas(parLignes, extrait.champs);
  return { ...ecran, donnees: { ...parChamps } };
}
