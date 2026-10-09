import type {
  CorrigeEcranPresentateur,
  CoursContent,
  DerouleCours,
  EcranContent,
  EcranDeroule,
} from '../../../../cours/content/types';
import type { ValeurFormule } from '../../../../cours/runtime/core/formula';
import { type Recolte, recolterDansLArbre } from '../../../../testing/arbre-json';
import { objet } from '../../../shared/slides/visual/presentation-v2';
import { INSTANTANE_B2_01 } from '../../../../testing/fixtures/instantane-b2-01';
import { INSTANTANE_B2_02 } from '../../../../testing/fixtures/instantane-b2-02';
import { INSTANTANE_B2_03 } from '../../../../testing/fixtures/instantane-b2-03';
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

const EXPOSANTS_ET_INDICES = /[²³¹⁰-₟]/gu;

function normaliser(texte: string): string {
  return texte
    .replaceAll(EXPOSANTS_ET_INDICES, ' ')
    .normalize('NFKC')
    .replaceAll('−', '-')
    .replace(/\s+/gu, ' ')
    .trim()
    .toLowerCase();
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

function raisonnementsCachesAuLivret(ecran: EcranContent): readonly string[] {
  const etapes = objet(ecran.donnees?.['exemple'])?.['etapes'];
  if (ecran.type !== 'fp-worked' || !Array.isArray(etapes)) {
    return [];
  }
  return etapes.flatMap((etape: unknown) => {
    const raisonnement = objet(etape)?.['raisonnement'];
    return typeof raisonnement === 'string' ? [raisonnement] : [];
  });
}

function texteImprimeDe(ecran: EcranContent): string {
  return raisonnementsCachesAuLivret(ecran).reduce(
    (reste, cache) => reste.replaceAll(normaliser(cache), ' '),
    normaliser(recolterDansLArbre([ecran], texteDuChamp).join('\n')),
  );
}

function texteImprime(fiche: FicheDuLivretEtudiant): string {
  return fiche.pages.map(({ ecran }) => texteImprimeDe(ecran)).join(' ');
}

const NOMBRE = /\d{1,3}(?: \d{3})+(?:,\d+)?|\d+(?:,\d+)?/gu;

function sansZeroFinal(nombre: string): string {
  return normaliser(ecritEnFrancais(Number(nombre.replaceAll(' ', '').replace(',', '.'))));
}

function sortDuChiffreSeul(nombre: string): boolean {
  return nombre.includes(',') || nombre.replaceAll(' ', '').length > 1;
}

function nombresEcrits(texte: string): readonly string[] {
  return Array.from(normaliser(texte).matchAll(NOMBRE), ([nombre]) => nombre);
}

function nombresDe(texte: string): ReadonlySet<string> {
  return new Set(nombresEcrits(texte).filter(sortDuChiffreSeul).map(sansZeroFinal));
}

function tousLesNombresDe(texte: string): ReadonlySet<string> {
  return new Set(nombresEcrits(texte).map(sansZeroFinal));
}

function reponsesRedigees(ecran: EcranDeroule | undefined): readonly string[] {
  const corrige = ecran?.corrigeEcran ?? null;
  return [
    ...(ecran?.explications ?? []).map(({ texte }) => texte),
    ...(corrige?.type === 'revelation' ? corrige.lignes : []),
    ...(corrige?.type === 'reflexion' ? [corrige.attendu] : []),
  ];
}

function nombresACalculer(
  ecran: EcranContent,
  deroule: EcranDeroule | undefined,
): readonly string[] {
  const donnes = nombresDe(texteImprimeDe(ecran));
  const redigees = [...raisonnementsCachesAuLivret(ecran), ...reponsesRedigees(deroule)];
  return [...nombresDe(redigees.join('\n'))].filter((nombre) => !donnes.has(nombre));
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
    const nombresImprimes = tousLesNombresDe(texte);
    return fichesAvantElleSurSaPage(fiches, rang).flatMap(({ pages }) =>
      pages.flatMap(({ ecran }) => {
        const deroule = corrige.get(ecran.id);
        return [
          ...reponsesDe(deroule).filter((reponse) => cite(texte, reponse)),
          ...nombresACalculer(ecran, deroule).filter((nombre) => nombresImprimes.has(nombre)),
        ].map(
          (reponse) => `${fiche.pages[0].ecran.id} cite « ${normaliser(reponse)} » de ${ecran.id}`,
        );
      }),
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

function ficheDe(
  fiches: readonly FicheDuLivretEtudiant[],
): (ecranId: string) => FicheDuLivretEtudiant {
  return (ecranId) => {
    const trouvee = fiches.find(({ pages }) => pages.some(({ ecran }) => ecran.id === ecranId));
    if (trouvee === undefined) {
      throw new Error(`Fiche absente : ${ecranId}`);
    }
    return trouvee;
  };
}

function exempleEtSonVoteSurUneMemePage(etayage?: number): readonly FicheDuLivretEtudiant[] {
  const fiche = ficheDe(feuillesDuLivretEtudiant(INSTANTANE_B2_01.sujet, INSTANTANE_B2_01.deroule));
  const exemple = fiche('B2-01-A5-03-MOYENNE-PONDEREE');
  return [
    {
      ...exemple,
      pages: exemple.pages.map((page) =>
        page.ecran.id === 'B2-01-A5-03-MOYENNE-PONDEREE' && etayage !== undefined
          ? { ...page, ecran: { ...page.ecran, donnees: { ...page.ecran.donnees, etayage } } }
          : page,
      ),
    },
    { ...fiche('B2-01-A5-02-VOTE-PARADOXE'), aLaSuite: true },
  ];
}

const VOTE_DU_B2_01 = 'B2-01-A3-01-VOTE-HAUSSE-BAISSE';

const JEU_DU_B2_01 = 'B2-01-A2-07-JEU-COMPARABLE';

function voteDuB2_01ALaSuite(
  vote: (ecran: EcranContent) => EcranContent,
  jeu: (ecran: EcranDeroule) => EcranDeroule = (ecran) => ecran,
): boolean {
  const { sujet, deroule } = INSTANTANE_B2_01;
  const fiches = feuillesDuLivretEtudiant(
    {
      ...sujet,
      ecrans: sujet.ecrans.map((ecran) => (ecran.id === VOTE_DU_B2_01 ? vote(ecran) : ecran)),
    },
    {
      ...deroule,
      ecrans: deroule.ecrans.map((ecran) => (ecran.id === JEU_DU_B2_01 ? jeu(ecran) : ecran)),
    },
  );
  return ficheDe(fiches)(VOTE_DU_B2_01).aLaSuite;
}

function avecLEnonce(ajout: string): (ecran: EcranContent) => EcranContent {
  return (ecran) => {
    const question = objet(ecran.donnees?.['question']);
    return {
      ...ecran,
      donnees: {
        ...ecran.donnees,
        question: { ...question, enonce: `${String(question?.['enonce'])} ${ajout}` },
      },
    };
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

    expect(citationsDesFichesALaSuite(fiches, INSTANTANE_B2_02.deroule)).toContain(
      'B2-02-A3-01-JUSQU-OU cite « -66 » de B2-02-A2-06-ECARTS-POINT-MOYEN',
    );
  });

  it('repère la réponse d une fiche plus haut sur la page, pas seulement de la précédente', () => {
    const fiche = ficheDe(
      feuillesDuLivretEtudiant(
        sujetOuLaQuestionCite('B2-02-A3-01-JUSQU-OU', '−66'),
        INSTANTANE_B2_02.deroule,
      ),
    );
    const page = [
      fiche('B2-02-A2-06-ECARTS-POINT-MOYEN'),
      { ...fiche('B2-02-A4-04-RAPPEL'), aLaSuite: true },
      fiche('B2-02-A3-01-JUSQU-OU'),
    ];

    expect(citationsDesFichesALaSuite(page, INSTANTANE_B2_02.deroule)).toContain(
      'B2-02-A3-01-JUSQU-OU cite « -66 » de B2-02-A2-06-ECARTS-POINT-MOYEN',
    );
  });

  it('imprime sur une page neuve la question qui suit un exemple guidé à compléter sur la copie', () => {
    const fiche = ficheDe(
      feuillesDuLivretEtudiant(INSTANTANE_B2_01.sujet, INSTANTANE_B2_01.deroule),
    );

    expect(fiche('B2-01-A5-02-VOTE-PARADOXE').aLaSuite).toBeFalse();
  });

  it('repère le résultat qu un exemple guidé fait calculer sur la copie, zéro final compris, quel que soit son étayage', () => {
    for (const etayage of [undefined, 6]) {
      expect(
        citationsDesFichesALaSuite(
          exempleEtSonVoteSurUneMemePage(etayage),
          INSTANTANE_B2_01.deroule,
        ),
      )
        .withContext(`étayage ${String(etayage)}`)
        .toEqual(
          jasmine.arrayContaining([
            'B2-01-A5-02-VOTE-PARADOXE cite « 27,6 » de B2-01-A5-03-MOYENNE-PONDEREE',
            'B2-01-A5-02-VOTE-PARADOXE cite « 25,3 » de B2-01-A5-03-MOYENNE-PONDEREE',
          ]),
        );
    }
  });

  it('ne compte pas comme réponse les données que l énoncé imprime', () => {
    const citations = citationsDesFichesALaSuite(
      exempleEtSonVoteSurUneMemePage(),
      INSTANTANE_B2_01.deroule,
    );

    expect(citations.some((citation) => /« (36|28|16) »/u.test(citation))).toBeFalse();
  });

  it('ne colle pas au nombre l exposant qui le suit', () => {
    const nombres = nombresDe('8 000 × 1,02⁵');

    expect(nombres.has('1,02')).toBeTrue();
    expect(nombres.has('1,025')).toBeFalse();
  });

  it('retient un nombre écrit avec des décimales nulles, même réduit à un chiffre', () => {
    expect(nombresDe('+6,00 % par an').has('6')).toBeTrue();
  });

  it('imprime sur une page neuve la question qui reprend une réponse rédigée de sa page', () => {
    const fiche = ficheDe(
      feuillesDuLivretEtudiant(INSTANTANE_B2_03.sujet, INSTANTANE_B2_03.deroule),
    );

    expect(fiche('B2-03-A3-01-VOTE-TOUTES').aLaSuite).toBeFalse();
    expect(fiche('B2-03-A2-01-CONTRAIRE').aLaSuite).toBeTrue();
  });

  it('ne compte une reprise qu à partir de quatre mots de suite que l énoncé imprime', () => {
    expect(voteDuB2_01ALaSuite(avecLEnonce('même périmètre, même'))).toBeTrue();
    expect(voteDuB2_01ALaSuite(avecLEnonce('même périmètre, même unité'))).toBeFalse();
  });

  it('ne compte comme reprise ni le titre que le livret n imprime pas, ni une confusion du corrigé', () => {
    expect(
      voteDuB2_01ALaSuite((ecran) => ({
        ...ecran,
        titre: 'même mois, même périmètre, même unité',
      })),
    ).toBeTrue();
    expect(
      voteDuB2_01ALaSuite(
        (ecran) => ecran,
        (jeu) => ({
          ...jeu,
          corriges: [
            {
              questionId: 'jeu-comparable',
              bonneReponse: 'non comparable',
              confusions: [{ id: 'meme-prix', libelle: 'Identique au prix de départ' }],
            },
          ],
        }),
      ),
    ).toBeTrue();
  });

  it('repère un nombre à calculer que la fiche à la suite imprime sans ses décimales', () => {
    const fiche = ficheDe(
      feuillesDuLivretEtudiant(INSTANTANE_B2_01.sujet, INSTANTANE_B2_01.deroule),
    );
    const vote = fiche('B2-01-A5-02-VOTE-PARADOXE');
    const page = [
      fiche('B2-01-A3-06-INDICE-ET-TAUX-MOYEN'),
      {
        aLaSuite: true,
        pages: vote.pages.map((page) => ({
          ...page,
          ecran: { ...page.ecran, titre: '+6 % par an' },
        })),
      },
    ];

    expect(citationsDesFichesALaSuite(page, INSTANTANE_B2_01.deroule)).toContain(
      'B2-01-A5-02-VOTE-PARADOXE cite « 6 » de B2-01-A3-06-INDICE-ET-TAUX-MOYEN',
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
