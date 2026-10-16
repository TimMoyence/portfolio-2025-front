import { z } from 'zod';
import { MODALITES, REGIMES_DE_VERROU } from '../../../cours/content/types';
import {
  sortiesDeMachine,
  valeurAffichee,
  valeursParCle,
} from '../../../cours/runtime/core/schemas-communs';

const strict = <F extends z.ZodRawShape>(forme: F) => z.object(forme).strict();

const textes = z.array(z.string());
const intervalle = z.tuple([z.number(), z.number()]);

export const optionPublique = strict({ id: z.string(), libelle: z.string() });

const metadonnees = strict({
  concepts: textes,
  misconceptionsCiblees: textes,
  dureeMinutes: z.number(),
  modalite: z.enum(MODALITES),
  regime: z.enum(REGIMES_DE_VERROU),
});

const ligneDuDossier = strict({ libelle: z.string(), valeur: z.string() });

const vote = strict({ id: z.string(), enonce: z.string(), options: z.array(optionPublique) });

const parametreCurseur = strict({
  cle: z.string(),
  libelle: z.string(),
  min: z.number(),
  max: z.number(),
  pas: z.number(),
  defaut: z.number(),
});

const prereglages = z.array(strict({ libelle: z.string(), valeurs: valeursParCle }));

const animation = z.array(valeursParCle);

const quiz = strict({
  id: z.string(),
  type: z.literal('quiz'),
  question: z.string(),
  options: textes,
  context: z.string().optional(),
  competency: z.string().optional(),
});

const titre = { title: z.string(), subtitle: z.string().optional() };

const lien = strict({ href: z.string(), label: z.string() });

const ton = z.enum(['teal', 'gold', 'ink']);

const image = {
  ...titre,
  image: z.string(),
  imageAlt: z.string(),
  paragraphs: textes,
  items: textes.optional(),
  sourceLink: lien.optional(),
};

const pointDuNuage = { x: z.number(), y: z.number() };

const lectureDecrite = {
  reading: z.string().optional(),
  source: z.string().optional(),
  description: z.string(),
};

const proprietesParRendu = {
  hero: strict({
    ...titre,
    bullets: textes,
    bgImage: z.string().optional(),
    bgImageAlt: z.string().optional(),
  }),
  'method-path': strict({
    ...titre,
    steps: z.array(
      strict({
        id: z.string(),
        title: z.string(),
        question: z.string(),
        proof: z.string(),
        result: z.string(),
      }),
    ),
  }),
  quiz: strict({ questionData: quiz }),
  chart: strict({
    title: z.string(),
    caption: z.string().optional(),
    context: z.string().optional(),
    labels: textes,
    series: z.array(
      strict({ label: z.string(), values: z.array(z.number()), tone: ton.optional() }),
    ),
    axisRanges: z.array(intervalle).optional(),
    axisLabels: textes.optional(),
    unit: z.string().optional(),
    formula: z.string().optional(),
    reading: z.string().optional(),
    source: z.string().optional(),
    kind: z.enum(['bars', 'line']).optional(),
    description: z.string().optional(),
  }),
  boxplot: strict({
    ...titre,
    unit: z.string().optional(),
    axisRange: intervalle,
    series: z.array(
      strict({
        label: z.string(),
        min: z.number(),
        q1: z.number(),
        median: z.number(),
        q3: z.number(),
        max: z.number(),
        mean: z.number().optional(),
        tone: ton.optional(),
      }),
    ),
    ...lectureDecrite,
  }),
  scatter: strict({
    ...titre,
    xLabel: z.string(),
    yLabel: z.string(),
    xRange: intervalle,
    yRange: intervalle,
    points: z.array(strict({ ...pointDuNuage, label: z.string().optional() })),
    meanPoint: strict(pointDuNuage).optional(),
    line: strict({
      slope: z.number(),
      intercept: z.number(),
      label: z.string().optional(),
    }).optional(),
    ...lectureDecrite,
  }),
  lesson: strict({
    ...titre,
    blocks: z.array(
      strict({
        kind: z.enum(['definition', 'property', 'method', 'example', 'exam']),
        title: z.string(),
        text: z.string(),
        formula: z.string().optional(),
        steps: textes.optional(),
      }),
    ),
  }),
  grid: strict({
    ...titre,
    items: z.array(
      strict({
        title: z.string(),
        description: z.string(),
        back: z.string().optional(),
        href: z.string().optional(),
        external: z.boolean().optional(),
      }),
    ),
    imprimable: z.boolean().optional(),
  }),
  comparison: strict({
    ...titre,
    note: z.string().optional(),
    columns: z.array(
      strict({
        label: z.string(),
        tone: z.enum(['danger', 'warning', 'info', 'neutral', 'success']).optional(),
        items: textes,
      }),
    ),
  }),
  stats: strict({
    ...titre,
    stats: z.array(strict({ value: z.string(), label: z.string() })),
  }),
  reflection: strict({
    promptData: strict({
      id: z.string(),
      type: z.literal('reflection'),
      question: z.string(),
      placeholder: z.string().optional(),
      context: z.string().optional(),
      competency: z.string().optional(),
    }),
  }),
  quote: strict({
    quote: z.string(),
    author: z.string().optional(),
    role: z.string().optional(),
    context: z.string().optional(),
  }),
  table: strict({
    ...titre,
    note: z.string().optional(),
    columns: z.array(strict({ key: z.string(), label: z.string() })),
    rows: z.array(z.record(z.string(), z.string())),
    sourceLink: lien.optional(),
  }),
  'image-left': strict({ ...image, nestedQuiz: quiz.optional() }),
  'image-right': strict(image),
  illustration: strict({ image: z.string(), imageAlt: z.string() }),
  cta: strict({
    title: z.string(),
    description: z.string(),
    ctaLabel: z.string(),
    ctaHref: z.string(),
  }),
  guide: strict({
    ...titre,
    context: z.string().optional(),
    takeaway: z.string().optional(),
    nextAction: z.string().optional(),
    items: z.array(
      strict({ title: z.string(), description: z.string(), detail: z.string().optional() }),
    ),
  }),
  'sort-review': strict({
    ...titre,
    source: strict({ screenId: z.string(), sortId: z.string() }),
    categories: z.array(strict({ id: z.string(), label: z.string() })),
    cards: z.array(
      strict({
        id: z.string(),
        label: z.string(),
        category: z.string(),
        justification: z.string(),
      }),
    ),
  }),
  'answer-review': strict({
    ...titre,
    source: strict({ screenId: z.string() }),
    explications: z.array(strict({ reference: z.string(), texte: z.string() })),
  }),
};

type Rendu = keyof typeof proprietesParRendu;

const presentationRendue = <R extends Rendu>(renderer: R) =>
  strict({
    version: z.literal(2),
    screenId: z.string(),
    renderer: z.literal(renderer),
    props: proprietesParRendu[renderer],
  });

const presentation = z.union([
  strict({
    version: z.literal(1),
    screenId: z.string(),
    renderer: z.string(),
    title: z.string().optional(),
    subtitle: z.string().optional(),
  }),
  z.discriminatedUnion('renderer', [
    presentationRendue('hero'),
    presentationRendue('method-path'),
    presentationRendue('quiz'),
    presentationRendue('chart'),
    presentationRendue('boxplot'),
    presentationRendue('scatter'),
    presentationRendue('lesson'),
    presentationRendue('grid'),
    presentationRendue('comparison'),
    presentationRendue('stats'),
    presentationRendue('reflection'),
    presentationRendue('quote'),
    presentationRendue('table'),
    presentationRendue('image-left'),
    presentationRendue('image-right'),
    presentationRendue('illustration'),
    presentationRendue('cta'),
    presentationRendue('guide'),
    presentationRendue('sort-review'),
    presentationRendue('answer-review'),
  ]),
]);

const recit = strict({
  id: z.string(),
  titre: z.string().optional(),
  paragraphes: textes.optional(),
  presentation: presentation.optional(),
  visuel: strict({
    src: z.string(),
    alt: z.string(),
    legende: z.string().optional(),
    source: z.string().optional(),
  }).optional(),
  video: strict({
    src: z.string(),
    srcPoste: z.string().optional(),
    type: z.enum(['video/webm', 'video/mp4']),
    titre: z.string(),
    poster: z.string().optional(),
    transcript: z.string(),
    source: z.string(),
    licence: z.string(),
    sousTitres: strict({ src: z.string(), srclang: z.string(), libelle: z.string() }).optional(),
    preload: z.enum(['none', 'metadata']).optional(),
  }).optional(),
  metadonnees,
});

const definitionDeMachine = strict({
  id: z.string(),
  parametres: z.array(parametreCurseur),
  formuleLatexSimplifie: z.string(),
  calcul: z.string(),
  phrase: z.string(),
  etapes: z.array(strict({ libelle: z.string(), calcul: z.string() })).optional(),
  prereglages: prereglages.optional(),
  animation: animation.optional(),
  sorties: z.array(sortiesDeMachine).optional(),
  metadonnees,
});

const definitionDeTrace = strict({
  id: z.string(),
  titre: z.string().optional(),
  source: z.string().optional(),
  abscisse: strict({ libelle: z.string(), min: z.number(), max: z.number() }),
  ordonnee: z.string(),
  parametres: z.array(parametreCurseur),
  series: z.array(
    strict({
      id: z.string(),
      libelle: z.string(),
      trait: z.enum(['plein', 'tirets']),
      calcul: z.string(),
    }),
  ),
  bornesOrdonnee: strict({
    min: z.number().optional(),
    max: z.number().optional(),
    minParametre: z.string().optional(),
    maxParametre: z.string().optional(),
  }).optional(),
  sourceUrl: z.string().optional(),
  description: z.string().optional(),
  descriptionPapier: z.string().optional(),
  forme: z.enum(['courbes', 'barres']).optional(),
  unite: z.literal('euros').optional(),
  etiquettes: textes.optional(),
  prereglages: prereglages.optional(),
  reference: z.string().optional(),
  animation: animation.optional(),
  abscisses: z.array(z.number()).optional(),
  positions: z
    .array(
      strict({
        valeurs: valeursParCle,
        ordonnees: z.record(z.string(), z.array(z.number().nullable())),
      }),
    )
    .optional(),
  metadonnees,
});

const planDeFeuille = strict({
  id: z.string(),
  intitule: z.string(),
  lignes: z.number(),
  colonnes: z.number(),
  cellules: z.record(z.string(), z.string()),
  verrouillees: textes,
  consignes: textes,
  lettres: textes.optional(),
  grille: z.array(textes).optional(),
  longueurMaxSaisie: z.number().optional(),
  initiale: strict({
    saisies: z.record(z.string(), z.string()),
    affichages: z.record(z.string(), z.string()),
    natures: z.record(z.string(), z.enum(['texte', 'nombre', 'logique', 'erreur'])),
    formules: textes,
  }).optional(),
  metadonnees,
});

export const tableauEvalue = strict({
  lignes: z.array(
    strict({
      rang: z.number(),
      valeurs: z.record(z.string(), valeurAffichee),
    }),
  ),
  totaux: z.record(z.string(), valeurAffichee),
  synthese: z.array(valeurAffichee),
  soldeFinal: valeurAffichee.nullable(),
});

const planDeTableau = strict({
  id: z.string(),
  intitule: z.string(),
  consignes: textes,
  echeances: z.number(),
  intituleDesLignes: z.string().optional(),
  libellesLignes: textes,
  parametres: valeursParCle,
  colonnes: z.array(
    strict({
      cle: z.string(),
      intitule: z.string(),
      role: z.enum(['donnee', 'saisie', 'deduite']),
      format: z.enum(['nombre', 'booleen']).optional(),
      decimales: z.number(),
      valeurs: z.array(z.number()).optional(),
      formule: z.string().optional(),
      formuleInitiale: z.string().optional(),
      soldeDe: z.string().optional(),
      totalise: z.boolean(),
    }),
  ),
  synthese: z.array(
    strict({
      libelle: z.string(),
      formule: z.string(),
      unite: z.string().nullable(),
      decimales: z.number(),
    }),
  ),
  tableauInitial: tableauEvalue.optional(),
  metadonnees,
});

const questionNumerique = strict({
  id: z.string(),
  enonce: z.string(),
  unite: z.string().nullable(),
  metadonnees,
});

const donneesNumeriques = strict({ question: questionNumerique });

const donneesDeVote = strict({ question: vote, questionJumelle: vote.optional() });

const DONNEES_PAR_BRIQUE = {
  'fp-quote': strict({
    citation: strict({
      id: z.string(),
      texte: z.string(),
      auteur: z.string().nullable(),
      source: z.string().nullable(),
      metadonnees,
    }),
  }),
  'fp-story': strict({ recit }),
  'fp-pro': strict({
    cas: strict({
      id: z.string(),
      metier: z.string(),
      situation: z.string(),
      geste: z.string().nullable(),
      consequence: z.string().nullable(),
      questionsLibres: z
        .array(strict({ id: z.string(), question: z.string(), placeholder: z.string().optional() }))
        .optional(),
      metadonnees,
    }),
  }),
  'fp-worked': strict({
    exemple: strict({
      id: z.string(),
      enonce: z.string(),
      rappel: z.array(ligneDuDossier).optional(),
      etapes: z.array(
        strict({
          id: z.string(),
          intitule: z.string(),
          raisonnement: z.string(),
          invite: z.string(),
        }),
      ),
      metadonnees,
    }),
    etayage: z.number(),
    pilote: z.boolean().optional(),
    corrigeDe: z.string().optional(),
  }),
  'fp-concept4': strict({ definition: definitionDeMachine }),
  'fp-plot': strict({ definition: definitionDeTrace }),
  'fp-challenge': strict({
    probleme: strict({
      id: z.string(),
      enonce: z.string(),
      invite: z.string(),
      rappel: z.array(ligneDuDossier).optional(),
      strategies: z.tuple([]),
      metadonnees,
    }),
  }),
  'fp-cardsort': strict({
    plan: strict({
      id: z.string(),
      intitule: z.string(),
      cartes: z.array(optionPublique),
      categories: z.array(optionPublique),
      dureeJeuMs: z.number().optional(),
      metadonnees,
    }),
  }),
  'fp-sheet': strict({ plan: planDeFeuille }),
  'fp-table-build': strict({ plan: planDeTableau }),
  'fp-escape': strict({
    parcours: strict({
      id: z.string(),
      intitule: z.string(),
      delaiIndiceMs: z.number(),
      budgetEnigmeMs: z.number(),
      tentativesMax: z.number(),
      enigmes: z.array(
        strict({
          id: z.string(),
          intitule: z.string(),
          enonce: z.string(),
          indice: z.string(),
        }),
      ),
      metadonnees,
    }),
  }),
  'fp-pulse': strict({
    sondage: strict({ id: z.string(), invite: z.string(), metadonnees }),
  }),
  'fp-spaced': strict({
    rappel: strict({ id: z.string(), intitule: z.string(), metadonnees }),
  }),
  'fp-numeric': donneesNumeriques,
  'fp-vote': donneesDeVote,
  'fp-recall': strict({
    question: vote.extend({ metadonnees }),
    delaiMs: z.number(),
    consigne: z.string().optional(),
  }),
  'fp-exit': strict({
    billet: strict({
      id: z.string(),
      question: z.string(),
      invite: z.string(),
      options: z.array(optionPublique),
      metadonnees,
    }),
  }),
  questionnaire: strict({
    intitule: z.string(),
    consigne: z.string().optional(),
    regime: z.enum(REGIMES_DE_VERROU),
    ordre: z.enum(['fixe', 'melange']),
    questions: z.array(
      z.discriminatedUnion('brique', [
        strict({ brique: z.literal('fp-numeric'), donnees: donneesNumeriques }),
        strict({ brique: z.literal('fp-vote'), donnees: donneesDeVote }),
      ]),
    ),
  }),
  'ecran-verrouille': strict({}),
};

type TypeDEcranServi = keyof typeof DONNEES_PAR_BRIQUE;

export function ecranServi<F extends z.ZodRawShape>(champs: F) {
  const de = <T extends TypeDEcranServi>(type: T) =>
    strict({ ...champs, type: z.literal(type), donnees: DONNEES_PAR_BRIQUE[type] });
  return z.discriminatedUnion('type', [
    de('fp-quote'),
    de('fp-story'),
    de('fp-pro'),
    de('fp-worked'),
    de('fp-concept4'),
    de('fp-plot'),
    de('fp-challenge'),
    de('fp-cardsort'),
    de('fp-sheet'),
    de('fp-table-build'),
    de('fp-escape'),
    de('fp-pulse'),
    de('fp-spaced'),
    de('fp-numeric'),
    de('fp-vote'),
    de('fp-recall'),
    de('fp-exit'),
    de('questionnaire'),
    de('ecran-verrouille'),
  ]);
}
