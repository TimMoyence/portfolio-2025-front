import type {
  CorrigeEcranPresentateur,
  CoursContent,
  DerouleCours,
  EcranDeroule,
} from '../../../../cours/content/types';
import type { ValeurFormule } from '../../../../cours/runtime/core/formula';
import { type Recolte, recolterDansLArbre } from '../../../../testing/arbre-json';
import { INSTANTANE_B2_02 } from '../../../../testing/fixtures/instantane-b2-02';
import { INSTANTANES_DES_COURS_SERVIS } from '../../../../testing/fixtures/instantanes-des-cours';
import { type FicheDuLivretEtudiant, feuillesDuLivretEtudiant } from './livret-papier';

interface ExtraitAdmis {
  readonly extrait: string;
  readonly raison: string;
}

const EXTRAITS_ADMIS: Readonly<Partial<Record<string, readonly ExtraitAdmis[]>>> = {
  'B2-03-A2-01-CONTRAIRE': [
    {
      extrait: 'sans employer le mot « non »',
      raison:
        'la consigne interdit le connecteur « non » ; elle ne livre pas la valeur « Non » de la cellule D4 du tableur A1-11',
    },
  ],
};

const CHAMPS_TECHNIQUES: ReadonlySet<string> = new Set(['id', 'type']);

function ecritEnFrancais(nombre: number, decimales = 6): string {
  return nombre.toLocaleString('fr-FR', { maximumFractionDigits: decimales });
}

function formesDeLaReponse(valeur: ValeurFormule): readonly string[] {
  if (typeof valeur === 'boolean') {
    return [valeur ? 'VRAI' : 'FAUX'];
  }
  if (typeof valeur === 'string') {
    return [valeur];
  }
  const pourcentage =
    valeur !== 0 && Math.abs(valeur) < 1 ? [`${ecritEnFrancais(valeur * 100, 2)} %`] : [];
  return [...new Set([ecritEnFrancais(valeur), ecritEnFrancais(valeur, 2), ...pourcentage])];
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
      return corrige.attendus.flatMap(({ valeur }) => formesDeLaReponse(valeur));
    case 'feuille':
      return corrige.attendus.flatMap(({ formuleReference, valeur }) => [
        formuleReference,
        ...formesDeLaReponse(valeur),
      ]);
    case 'classement':
      return corrige.attendus.map(({ justification }) => justification);
    case 'defi':
      return corrige.strategies.filter(({ fausse }) => !fausse).map(({ libelle }) => libelle);
    case 'enigmes':
      return [...corrige.enigmes.map(({ solution }) => solution), corrige.codeFinal];
  }
}

function reponsesDe(ecran: EcranDeroule | undefined): readonly string[] {
  if (ecran === undefined) {
    return [];
  }
  return [
    ...ecran.corriges.map(({ bonneReponse }) => bonneReponse),
    ...(ecran.explications ?? []).map(({ texte }) => texte),
    ...reponsesDuCorrige(ecran.corrigeEcran),
  ];
}

function normaliser(texte: string): string {
  return texte.normalize('NFKC').replaceAll('−', '-').replace(/\s+/gu, ' ').trim().toLowerCase();
}

const texteDuChamp: Recolte = (cle, contenu, descendre) => {
  if (typeof contenu === 'string') {
    return CHAMPS_TECHNIQUES.has(cle) ? [] : [contenu];
  }
  if (typeof contenu === 'number') {
    return [ecritEnFrancais(contenu)];
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

function extraitsAdmisDe(fiche: FicheDuLivretEtudiant): readonly string[] {
  return (EXTRAITS_ADMIS[fiche.pages[0].ecran.id] ?? []).map(({ extrait }) => normaliser(extrait));
}

function texteAVerifier(fiche: FicheDuLivretEtudiant): string {
  return extraitsAdmisDe(fiche).reduce(
    (reste, extrait) => reste.replaceAll(extrait, ' '),
    texteImprime(fiche),
  );
}

function cite(texte: string, reponse: string): boolean {
  const cherchee = normaliser(reponse);
  if (cherchee === '') {
    return false;
  }
  const motif = cherchee.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  return new RegExp(`(?<![\\p{L}\\p{N}])${motif}(?![\\p{L}\\p{N}])`, 'u').test(texte);
}

function fichesAvantElleSurSaPage(
  fiches: readonly FicheDuLivretEtudiant[],
  rang: number,
): readonly FicheDuLivretEtudiant[] {
  let debut = rang;
  while (debut > 0 && fiches[debut].aLaSuite) {
    debut -= 1;
  }
  return fiches.slice(debut, rang);
}

function citationsDesFichesALaSuite(
  fiches: readonly FicheDuLivretEtudiant[],
  deroule: DerouleCours,
): readonly string[] {
  const corrige = new Map(deroule.ecrans.map((ecran) => [ecran.id, ecran]));
  const citations = fiches.flatMap((fiche, rang) => {
    if (!fiche.aLaSuite) {
      return [];
    }
    const texte = texteAVerifier(fiche);
    return fichesAvantElleSurSaPage(fiches, rang).flatMap(({ pages }) =>
      pages.flatMap(({ ecran }) =>
        reponsesDe(corrige.get(ecran.id))
          .filter((reponse) => cite(texte, reponse))
          .map(
            (reponse) =>
              `${fiche.pages[0].ecran.id} cite « ${normaliser(reponse)} » de ${ecran.id}`,
          ),
      ),
    );
  });
  return [...new Set(citations)];
}

function sujetOuLaQuestionCite(ecranId: string, citation: string): CoursContent {
  return {
    ...INSTANTANE_B2_02.sujet,
    ecrans: INSTANTANE_B2_02.sujet.ecrans.map((ecran) =>
      ecran.id === ecranId ? { ...ecran, titre: `${ecran.titre} (${citation})` } : ecran,
    ),
  };
}

describe('livret papier des cours servis', () => {
  for (const [cours, instantane] of INSTANTANES_DES_COURS_SERVIS) {
    const fiches = feuillesDuLivretEtudiant(instantane.sujet, instantane.deroule);

    it(`${cours} · imprime au moins une fiche à la suite de la précédente`, () => {
      expect(fiches.some(({ aLaSuite }) => aLaSuite)).toBeTrue();
    });

    it(`${cours} · aucune fiche imprimée à la suite ne cite une réponse d une fiche de sa page`, () => {
      expect(citationsDesFichesALaSuite(fiches, instantane.deroule)).toEqual([]);
    });

    it(`${cours} · chaque extrait admis figure encore dans la fiche qui le porte`, () => {
      const absents = fiches.flatMap((fiche) =>
        extraitsAdmisDe(fiche).filter((extrait) => !texteImprime(fiche).includes(extrait)),
      );

      expect(absents).toEqual([]);
    });
  }

  it('n admet que des extraits rattachés à une fiche servie', () => {
    const premiers = new Set(
      INSTANTANES_DES_COURS_SERVIS.flatMap(([, { sujet, deroule }]) =>
        feuillesDuLivretEtudiant(sujet, deroule).map(({ pages }) => pages[0].ecran.id),
      ),
    );

    expect(Object.keys(EXTRAITS_ADMIS).filter((ecranId) => !premiers.has(ecranId))).toEqual([]);
  });

  it('repère la réponse que cite la question imprimée à la suite, signe moins typographique compris', () => {
    const fiches = feuillesDuLivretEtudiant(
      sujetOuLaQuestionCite('B2-02-A3-01-JUSQU-OU', '−66'),
      INSTANTANE_B2_02.deroule,
    );

    expect(citationsDesFichesALaSuite(fiches, INSTANTANE_B2_02.deroule)).toEqual([
      'B2-02-A3-01-JUSQU-OU cite « -66 » de B2-02-A2-06-ECARTS-POINT-MOYEN',
    ]);
  });

  it('repère la réponse d une fiche plus haut sur la page, pas seulement de la précédente', () => {
    const fiches = feuillesDuLivretEtudiant(
      sujetOuLaQuestionCite('B2-02-A3-01-JUSQU-OU', '−66'),
      INSTANTANE_B2_02.deroule,
    );
    const fiche = (ecranId: string): FicheDuLivretEtudiant => {
      const trouvee = fiches.find(({ pages }) => pages.some(({ ecran }) => ecran.id === ecranId));
      if (trouvee === undefined) {
        throw new Error(`Fiche absente : ${ecranId}`);
      }
      return trouvee;
    };
    const page = [
      fiche('B2-02-A2-06-ECARTS-POINT-MOYEN'),
      { ...fiche('B2-02-A4-04-RAPPEL'), aLaSuite: true },
      fiche('B2-02-A3-01-JUSQU-OU'),
    ];

    expect(citationsDesFichesALaSuite(page, INSTANTANE_B2_02.deroule)).toContain(
      'B2-02-A3-01-JUSQU-OU cite « -66 » de B2-02-A2-06-ECARTS-POINT-MOYEN',
    );
  });

  it('cherche une réponse sous sa formule, son arrondi, son pourcentage et sa valeur logique', () => {
    const tableur = INSTANTANE_B2_02.deroule.ecrans.find(
      ({ id }) => id === 'B2-02-A4-02-TABLEUR-FIBRE',
    );

    expect(reponsesDe(tableur)).toEqual(
      jasmine.arrayContaining(['=PENTE(B2:B6;A2:A6)', '0,997852', '1', '99,79 %', '3,51']),
    );
    expect(formesDeLaReponse(false)).toEqual(['FAUX']);
  });
});
