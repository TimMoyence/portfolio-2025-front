import type { CorrigeEcranPresentateur, EcranDeroule } from '../../../../cours/content/types';
import type { ValeurFormule } from '../../../../cours/runtime/core/formula';
import { type Recolte, recolterDansLArbre } from '../../../../testing/arbre-json';
import { INSTANTANE_B2_01 } from '../../../../testing/fixtures/instantane-b2-01';
import { INSTANTANE_B2_02 } from '../../../../testing/fixtures/instantane-b2-02';
import { INSTANTANE_B2_03 } from '../../../../testing/fixtures/instantane-b2-03';
import { INSTANTANE_B2_04 } from '../../../../testing/fixtures/instantane-b2-04';
import { INSTANTANE_B2_05 } from '../../../../testing/fixtures/instantane-b2-05';
import { INSTANTANE_B2_06 } from '../../../../testing/fixtures/instantane-b2-06';
import { INSTANTANE_B3_01 } from '../../../../testing/fixtures/instantane-b3-01';
import type { InstantaneDuCoursB2 } from '../../../../testing/fixtures/instantane-de-cours';
import { type FicheDuLivretEtudiant, feuillesDuLivretEtudiant } from './livret-papier';

const COURS_SERVIS: readonly (readonly [string, InstantaneDuCoursB2])[] = [
  ['B2-01', INSTANTANE_B2_01],
  ['B2-02', INSTANTANE_B2_02],
  ['B2-03', INSTANTANE_B2_03],
  ['B2-04', INSTANTANE_B2_04],
  ['B2-05', INSTANTANE_B2_05],
  ['B2-06', INSTANTANE_B2_06],
  ['B3-01', INSTANTANE_B3_01],
];

const CITATIONS_ADMISES: Readonly<Partial<Record<string, Readonly<Record<string, string>>>>> = {
  'B2-03': {
    'B2-03-A2-01-CONTRAIRE cite « Non » de B2-03-A1-11-TABLEUR-SI-OU':
      'la fiche porte sur la négation : « non » y est le connecteur, pas la valeur de la cellule D2',
  },
};

const CHAMPS_TECHNIQUES: ReadonlySet<string> = new Set(['id', 'type']);

function enFrancais(valeur: ValeurFormule): readonly string[] {
  if (typeof valeur === 'number') {
    return [valeur.toLocaleString('fr-FR', { maximumFractionDigits: 6 })];
  }
  return typeof valeur === 'string' ? [valeur] : [];
}

function reponsesDuCorrige(corrige: CorrigeEcranPresentateur | null): readonly string[] {
  if (corrige === null) {
    return [];
  }
  switch (corrige.type) {
    case 'reflexion':
      return [corrige.attendu];
    case 'revelation':
      return corrige.lignes;
    case 'tableau':
    case 'feuille':
      return corrige.attendus.flatMap(({ valeur }) => enFrancais(valeur));
    case 'enigmes':
      return [...corrige.enigmes.map(({ solution }) => solution), corrige.codeFinal];
    default:
      return [];
  }
}

function reponsesDe(ecran: EcranDeroule | undefined): readonly string[] {
  if (ecran === undefined) {
    return [];
  }
  return [
    ...ecran.corriges.map(({ bonneReponse }) => bonneReponse),
    ...reponsesDuCorrige(ecran.corrigeEcran),
  ];
}

function normaliser(texte: string): string {
  return texte.normalize('NFKC').replace(/\s+/gu, ' ').toLowerCase();
}

const texteDuChamp: Recolte = (cle, contenu, descendre) => {
  if (typeof contenu === 'string') {
    return CHAMPS_TECHNIQUES.has(cle) ? [] : [contenu];
  }
  if (typeof contenu === 'number') {
    return enFrancais(contenu);
  }
  if (Array.isArray(contenu)) {
    return contenu.flatMap((element: unknown) => texteDuChamp(cle, element, descendre));
  }
  return descendre(contenu);
};

function texteImprime(fiche: FicheDuLivretEtudiant): string {
  const ecrans = fiche.pages.map(({ ecran }) => ecran);
  return normaliser(recolterDansLArbre(ecrans, texteDuChamp).join('\n'));
}

function cite(texte: string, reponse: string): boolean {
  const motif = normaliser(reponse).replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  return new RegExp(`(?<![\\p{L}\\p{N}])${motif}(?![\\p{L}\\p{N}])`, 'u').test(texte);
}

function citationsDesFichesALaSuite(instantane: InstantaneDuCoursB2): readonly string[] {
  const fiches = feuillesDuLivretEtudiant(instantane.sujet, instantane.deroule);
  const corrige = new Map(instantane.deroule.ecrans.map((ecran) => [ecran.id, ecran]));
  const citations = fiches.flatMap((fiche, rang) => {
    if (!fiche.aLaSuite) {
      return [];
    }
    const texte = texteImprime(fiche);
    return fiches[rang - 1].pages.flatMap(({ ecran }) =>
      reponsesDe(corrige.get(ecran.id))
        .filter((reponse) => cite(texte, reponse))
        .map((reponse) => `${fiche.pages[0].ecran.id} cite « ${reponse} » de ${ecran.id}`),
    );
  });
  return [...new Set(citations)];
}

describe('livret papier des cours servis', () => {
  for (const [cours, instantane] of COURS_SERVIS) {
    it(`${cours} · imprime au moins une fiche à la suite de la précédente`, () => {
      const fiches = feuillesDuLivretEtudiant(instantane.sujet, instantane.deroule);

      expect(fiches.some(({ aLaSuite }) => aLaSuite)).toBeTrue();
    });

    it(`${cours} · aucune fiche imprimée à la suite ne cite une réponse de la fiche précédente`, () => {
      expect(citationsDesFichesALaSuite(instantane)).toEqual(
        Object.keys(CITATIONS_ADMISES[cours] ?? {}),
      );
    });
  }

  it('repère la citation d une réponse quand une fiche à la suite la reprend', () => {
    const fiches = feuillesDuLivretEtudiant(INSTANTANE_B2_02.sujet, INSTANTANE_B2_02.deroule);
    const diagnostic = fiches.findIndex(({ pages }) =>
      pages.some(({ ecran }) => ecran.id === 'B2-02-A1-01-DIAGNOSTIC'),
    );
    const reponse = reponsesDe(
      INSTANTANE_B2_02.deroule.ecrans.find(({ id }) => id === 'B2-02-A1-01-DIAGNOSTIC'),
    );

    expect(reponse).toContain('30 jours');
    expect(cite(texteImprime(fiches[diagnostic + 1]), '30 jours')).toBeTrue();
    expect(fiches[diagnostic + 1].aLaSuite).toBeFalse();
  });
});
