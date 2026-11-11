import type {
  ArticleSummary,
  PublishedArticle,
  SectionDuRecit,
  SourceDuRecit,
} from '../../app/core/models/article.model';

function buildArticleSummary(overrides: Partial<ArticleSummary> = {}): ArticleSummary {
  const slug = overrides.slug ?? 'morning-brief-2026-09-23';
  return {
    article_id: `${slug}-fr`,
    slug,
    locale: 'fr',
    title: 'Veille IA',
    excerpt: 'Les faits IA du jour.',
    tags: [],
    published_at: '2026-09-23T04:15:00.000Z',
    updated_at: '2026-09-23T04:15:00.000Z',
    seo: {
      description: 'Les faits IA du jour, sourcés.',
      canonical_path: `/articles/${slug}`,
      keywords: [],
      image_url: null,
      image_alt: null,
    },
    ...overrides,
  };
}

export function buildPublishedArticle(overrides: Partial<PublishedArticle> = {}): PublishedArticle {
  return {
    ...buildArticleSummary(overrides),
    content_markdown: '# Veille',
    reading_time_minutes: 5,
    sections: [],
    sources: [],
    provenance: {
      run_id: 'run-2026-09-23',
      edition_date: '2026-09-23',
      content_sha256: '0'.repeat(64),
    },
    ...overrides,
  };
}

function source(nom: string, url: string): SourceDuRecit {
  return { nom, url, publie_le: '2026-11-10T18:00:00.000Z' };
}

export const SOURCES_DU_RECIT = {
  sujet: source('Anthropic', 'https://www.anthropic.com/news/claude-chantiers'),
  shot: source('TechCrunch', 'https://techcrunch.com/2026/11/10/gemini-agents'),
  outil: source('GitHub Blog', 'https://github.blog/changelog/copilot-review'),
  sortie: source('Bun', 'https://bun.sh/blog/bun-v1.3'),
  chiffre: source('The Verge', 'https://www.theverge.com/ai-levee'),
  citation: source('Wired', 'https://www.wired.com/story/entretien'),
  breve: source('Ars Technica', 'https://arstechnica.com/ai/breve'),
} as const;

function sectionsDuRecit(): SectionDuRecit[] {
  return [
    {
      kind: 'edito',
      texte: 'Une semaine où les agents quittent la démo pour le chantier.',
      signature: 'Tim',
    },
    {
      kind: 'sujet',
      titre: 'Claude vise les gros chantiers',
      accroche: 'Anthropic pousse ses agents sur des tâches de plusieurs heures.',
      pourquoi: 'Parce que le coût d’un agent se juge sur la durée.',
      contexte: 'Les agents tenaient jusqu’ici quelques minutes.',
      faits: 'Le modèle garde le fil sur 30 heures de travail.',
      et_maintenant: 'Tester sur un vrai ticket, pas sur une démo.',
      bref: 'Les agents changent d’échelle.',
      source: SOURCES_DU_RECIT.sujet,
      image: { url: 'https://cdn.anthropic.com/une.jpg', credit: 'Anthropic' },
      graphique: {
        titre: 'Score sur la tâche longue',
        unite: '%',
        barres: [
          { libelle: 'Claude', valeur: 82, affichage: '82 %', largeur: 100 },
          { libelle: 'Gemini', valeur: 61, affichage: '61 %', largeur: 74 },
          { libelle: 'GPT', valeur: 41, affichage: '41 %', largeur: 50 },
        ],
      },
      feuilleton: { date: '2026-11-08', rappel: 'Anthropic annonçait ses agents.' },
    },
    {
      kind: 'shot',
      histoires: [
        {
          accroche: 'Google répond :',
          texte: 'Gemini lance ses agents dans Workspace.',
          rubrique: 'outils_ia',
          source: SOURCES_DU_RECIT.shot,
          image: { url: 'https://techcrunch.com/gemini.jpg', credit: 'TechCrunch' },
          feuilleton: null,
        },
      ],
    },
    {
      kind: 'decodeur',
      terme: 'Fenêtre de contexte',
      explication: 'Ce que le modèle garde en tête d’un coup.',
    },
    {
      kind: 'a_tester',
      nom: 'Copilot Review',
      texte: 'Une relecture de PR qui commente ligne à ligne.',
      source: SOURCES_DU_RECIT.outil,
    },
    {
      kind: 'sorties',
      lignes: [
        {
          produit: 'Bun',
          version: '1.3',
          changement: 'Un serveur SQL intégré.',
          source: SOURCES_DU_RECIT.sortie,
        },
      ],
    },
    {
      kind: 'chiffre',
      valeur: '500 millions de dollars',
      texte: 'La levée annoncée hier.',
      source: SOURCES_DU_RECIT.chiffre,
    },
    {
      kind: 'citation',
      texte: 'Un agent se juge sur son pire jour.',
      auteur: 'Dario Amodei',
      traduite_de: "l'anglais",
      contexte: 'Dans un entretien.',
      source: SOURCES_DU_RECIT.citation,
    },
    {
      kind: 'a_part_ca',
      breves: [{ texte: 'Un robot plie le linge.', source: SOURCES_DU_RECIT.breve }],
    },
  ];
}

export function buildRecitDuMatin(overrides: Partial<PublishedArticle> = {}): PublishedArticle {
  return buildPublishedArticle({
    slug: 'morning-brief-2026-11-11',
    title: 'Claude vise les gros chantiers',
    excerpt: 'Anthropic pousse ses agents sur des tâches de plusieurs heures.',
    tags: ['morning-brief'],
    published_at: '2026-11-11T05:15:00.000Z',
    updated_at: '2026-11-11T05:15:00.000Z',
    reading_time_minutes: 4,
    sections: sectionsDuRecit(),
    sources: Object.values(SOURCES_DU_RECIT),
    ...overrides,
  });
}
