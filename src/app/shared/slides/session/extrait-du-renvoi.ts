import type { CadrageDuRenvoi, EcranContent } from '../../../../cours/content/types';
import { estObjet, objet } from '../../../../cours/runtime/core/valeurs';

type Objet = Readonly<Record<string, unknown>>;

const CHAMPS_DU_CAS = ['metier', 'situation', 'geste'] as const;

function sans(source: Objet, cles: readonly string[]): Objet {
  return Object.fromEntries(Object.entries(source).filter(([cle]) => !cles.includes(cle)));
}

function lignesDuTableau(donnees: Objet, lignes: readonly number[]): Objet {
  const recit = objet(donnees['recit']);
  const presentation = objet(recit?.['presentation']);
  const props = objet(presentation?.['props']);
  if (recit === null || presentation === null || props === null) {
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
