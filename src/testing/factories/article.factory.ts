import type {
  ArticleSummary,
  ItemDeSection,
  PublishedArticle,
  SectionDeLArticle,
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
      item_count: 0,
      source_count: 0,
      content_sha256: '0'.repeat(64),
    },
    ...overrides,
  };
}

export function buildItemDeSection(overrides: Partial<ItemDeSection> = {}): ItemDeSection {
  return {
    entity: 'Vercel',
    text: 'Le fait, en deux phrases sourcées.',
    source: 'Vercel Blog',
    url: 'https://vercel.com/changelog/fait',
    published_at: '2026-11-07T18:00:00.000Z',
    retrieved_at: '2026-11-07T20:05:00.000Z',
    ...overrides,
  };
}

export function buildSectionDeLArticle(
  overrides: Partial<SectionDeLArticle> = {},
): SectionDeLArticle {
  return {
    id: 'modeles-ia',
    kind: 'rubric',
    title: 'Modèles IA & Recherche',
    intro: '',
    body: '',
    items: [],
    ...overrides,
  };
}

function sectionsDeLEdition(): SectionDeLArticle[] {
  return [
    buildSectionDeLArticle({
      id: 'essential',
      kind: 'essential',
      title: 'L’essentiel',
      intro: 'Les faits qui méritent votre attention.',
      body: [
        'Le fil rouge de la nuit : la bataille se joue dans le **routage** et le cache.',
        '',
        '- Les scores bougent de 23 points selon la consigne.',
        '- Mercor passe ses lots de 12 à 2 heures.',
        '- Chrome 136 gagne 630 ms au chargement.',
      ].join('\n'),
    }),
    buildSectionDeLArticle({
      id: 'deep-dive',
      kind: 'deep_dive',
      title: 'V8 travaille désormais pour le temps réel',
      intro: 'Le mécanisme, puis ses conséquences concrètes.',
      body: 'Le moteur compile d’abord ce que la page utilise.\n\nLes gains viennent des chemins coûteux.',
      items: [
        buildItemDeSection({
          entity: 'Ce que ça change',
          text: 'Les applications web démarrent plus vite sans réécriture.',
          source: 'V8 Blog',
          url: 'https://v8.dev/blog/indices-de-compilation',
          published_at: '2026-11-07T22:00:00.000Z',
        }),
      ],
    }),
    buildSectionDeLArticle({
      intro: 'Les modèles gagnent en portée et en vitesse.',
      items: [
        buildItemDeSection({ entity: 'Vercel / DeepSeek V4.1' }),
        buildItemDeSection({
          entity: 'OpenAI',
          source: 'OpenAI Blog',
          url: 'https://openai.com/index/annonce',
          published_at: '2026-11-06T09:00:00.000Z',
        }),
      ],
    }),
    buildSectionDeLArticle({
      id: 'outils-ia',
      title: 'Outils IA & Agents',
      intro: 'Les agents entrent dans le travail quotidien.',
      items: [
        buildItemDeSection({
          entity: 'GitHub Copilot',
          source: 'GitHub Changelog',
          url: 'https://github.blog/changelog/copilot-agents',
          published_at: '2026-11-08T02:00:00.000Z',
        }),
      ],
    }),
    buildSectionDeLArticle({
      id: 'radar-modeles-ia',
      kind: 'radar',
      title: 'Radar — Modèles IA & Recherche',
      items: [
        buildItemDeSection({
          entity: 'Ling 3.1 Flash',
          text: 'Gratuit sur AI Gateway jusqu’au 3 novembre.',
          url: 'https://vercel.com/changelog/ling-3-1',
          published_at: '2026-11-07T10:00:00.000Z',
        }),
        buildItemDeSection({
          entity: 'SmolLM 4',
          text: 'Un petit modèle ouvert pour l’appareil.',
          source: 'Hugging Face Blog',
          url: 'https://huggingface.co/blog/smollm4',
          published_at: undefined,
        }),
      ],
    }),
    buildSectionDeLArticle({
      id: 'radar',
      kind: 'radar',
      title: 'Radar',
      items: [
        buildItemDeSection({
          entity: 'Show HN',
          text: 'Un tableur qui tient dans un fichier.',
          source: 'Hacker News',
          url: 'https://news.ycombinator.com/item?id=1',
          published_at: '2026-11-08T05:00:00.000Z',
        }),
      ],
    }),
  ];
}

function buildInfoDuJour(overrides: Partial<ItemDeSection> = {}): ItemDeSection {
  return buildItemDeSection({
    entity: 'Apiiro',
    title: 'Claude Code laisse fuiter des secrets',
    text: 'Des mots de passe ont fuité sur GitHub, enregistrés par l’outil.',
    for_business: 'Vos équipes vérifient leurs dépôts publics cette semaine.',
    under_the_hood: 'Le fichier settings.local.json garde les commandes autorisées.',
    audience: 'dirigeants',
    horizon: 'trimestre',
    rubric: 'outils-ia',
    source: 'Apiiro',
    url: 'https://apiiro.com/blog/fuite',
    ...overrides,
  });
}

function sectionsDeLEditionRefondue(): SectionDeLArticle[] {
  return [
    buildSectionDeLArticle({
      id: 'brief',
      kind: 'brief',
      title: 'Le brief en 30 s',
      items: [
        buildItemDeSection({
          entity: '',
          figure: '23 points',
          text: 'd’écart en reformulant la consigne',
          source: 'DeepSWE',
          url: 'https://deepswe.ai/consignes',
        }),
        buildItemDeSection({
          entity: '',
          text: 'Une IA mal briefée se trompe autant qu’un stagiaire.',
          source: 'DeepSWE',
          url: 'https://deepswe.ai/consignes',
        }),
      ],
    }),
    buildSectionDeLArticle({
      id: 'infos',
      kind: 'infos',
      title: 'Les infos du jour',
      items: [
        buildInfoDuJour({ episode: 3, recap: 'Claude Code range ses réglages en clair.' }),
        buildInfoDuJour({
          entity: 'Vercel',
          title: 'Vercel accélère les réponses',
          text: 'Un modèle répond à plus de 1 000 mots par seconde.',
          for_business: undefined,
          under_the_hood: undefined,
          audience: 'developpeurs',
          horizon: 'aujourdhui',
          rubric: 'modeles-ia',
          source: 'Vercel Blog',
          url: 'https://vercel.com/changelog/rapide',
        }),
      ],
    }),
    buildSectionDeLArticle({
      id: 'radar-outils-ia',
      kind: 'radar',
      title: 'Radar — Outils IA & Agents',
      items: [
        buildItemDeSection({
          entity: 'Hoist',
          text: 'Hoist publie une app Node en une commande.',
          url: 'https://hoist.dev/lancement',
        }),
      ],
    }),
  ];
}

export function buildEditionRefondue(overrides: Partial<PublishedArticle> = {}): PublishedArticle {
  return buildEditionMorningBrief({
    slug: 'morning-brief-2026-11-10',
    reading_time_minutes: 3,
    sections: sectionsDeLEditionRefondue(),
    ...overrides,
  });
}

export function buildEditionMorningBrief(
  overrides: Partial<PublishedArticle> = {},
): PublishedArticle {
  const sections = overrides.sections ?? sectionsDeLEdition();
  const items = sections.flatMap((section) => section.items);
  return buildPublishedArticle({
    slug: 'morning-brief-2026-11-08',
    title: 'Morning Brief — 8 novembre 2026',
    excerpt: 'Le fil rouge de la nuit : la bataille se joue dans le routage et le cache.',
    tags: ['morning-brief', 'modeles-ia', 'outils-ia'],
    published_at: '2026-11-08T04:15:00.000Z',
    updated_at: '2026-11-08T04:15:00.000Z',
    reading_time_minutes: 9,
    sections,
    sources: items.map((item) => ({
      name: item.source,
      url: item.url,
      published_at: item.published_at ?? null,
      retrieved_at: item.retrieved_at ?? null,
    })),
    ...overrides,
  });
}
