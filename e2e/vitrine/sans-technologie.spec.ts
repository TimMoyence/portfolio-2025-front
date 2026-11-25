import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { ouvrir, sansContenu } from './ouvrir';
import { baseAnglaise, baseSsr, exigerLaPorteSsr } from '../porte-ssr';
import { MOTS_TECHNIQUES_DU_DIAGNOSTIC, motsTrouves } from '../../src/testing/texte/mots-entiers';

interface PageDuSeo {
  readonly id: string;
  readonly path: string;
  readonly locales: Record<string, Record<string, unknown>>;
}

interface Seo {
  readonly pages: readonly PageDuSeo[];
  readonly global: { readonly textes: Record<string, unknown> };
}

const NOMS_D_OUTILS = [
  'Angular',
  'NestJS',
  '.NET',
  'C#',
  'React Native',
  'PostgreSQL',
  'Docker',
  'LangChain',
  'Raspberry Pi',
  'SSE',
  'TDD',
  'DDD',
  'Clean Archi',
  'Multi-LLM',
  'Claude Code',
  'Telegram',
  'TypeScript',
];

const outilsDe = (texte: string): string[] => motsTrouves(texte, NOMS_D_OUTILS);

const seo = JSON.parse(readFileSync('src/assets/seo/seo-metadata.json', 'utf8')) as Seo;

const PAGES_DE_VENTE = seo.pages.filter(
  ({ id }) => ['home', 'offer', 'projets', 'presentation'].includes(id) || id.startsWith('projet-'),
);

const CHAMPS_DU_SEO = ['title', 'description', 'ogTitle', 'ogDescription'] as const;

const texteServi = (page: Page): Promise<string> =>
  page.evaluate(() => {
    const attributs = Array.from(document.querySelectorAll('[alt], [aria-label], [title]')).flatMap(
      (element) => ['alt', 'aria-label', 'title'].map((nom) => element.getAttribute(nom) ?? ''),
    );
    const metas = Array.from(
      document.querySelectorAll(
        'meta[name="description"], meta[property="og:title"], meta[property="og:description"]',
      ),
    ).map((meta) => meta.getAttribute('content') ?? '');
    return [document.body.innerText, document.title, ...attributs, ...metas].join('\n');
  });

test.describe('REC-09 · les pages de vente parlent du client, pas des outils', () => {
  test('REC-09 · la liste couvre l accueil, Créer mon site, les réalisations, leurs fiches et l à-propos', () => {
    expect(PAGES_DE_VENTE.map(({ id }) => id)).toEqual(
      expect.arrayContaining(['home', 'offer', 'projets', 'presentation', 'projet-zenfirst-renta']),
    );
  });

  test('REC-09 · la comparaison se fait en mot entier, sans la casse, version comprise', () => {
    expect(outilsDe('NestJS 11 · angular · progresse · référencement Google & IA')).toEqual([
      'NestJS',
      'angular',
    ]);
  });

  for (const { id, locales } of PAGES_DE_VENTE) {
    test(`REC-09 · le SEO de ${id} ne nomme aucun outil, en français comme en anglais`, () => {
      const champs = Object.entries(locales).flatMap(([langue, contenu]) =>
        CHAMPS_DU_SEO.map((champ) => `${langue}.${champ} ${String(contenu[champ] ?? '')}`),
      );

      expect(champs.filter((champ) => outilsDe(champ).length > 0)).toEqual([]);
    });
  }

  test('REC-09 · la personne et l entreprise du SEO ne nomment aucun outil, en français comme en anglais', () => {
    expect(Object.keys(seo.global.textes)).toEqual(['fr', 'en']);
    expect(outilsDe(JSON.stringify(seo.global))).toEqual([]);
  });

  for (const { path } of PAGES_DE_VENTE) {
    test(`REC-09 · ${path} en français ne nomme aucun outil`, async ({ page }) => {
      await sansContenu(page);
      await ouvrir(page, path);

      expect(outilsDe(await texteServi(page))).toEqual([]);
    });

    test(`REC-09 · ${path} en anglais ne nomme aucun outil`, async ({ page }) => {
      exigerLaPorteSsr({ anglaise: true });
      await ouvrir(page, `${baseAnglaise}/en${path === '/' ? '' : path}`);

      expect(outilsDe(await texteServi(page))).toEqual([]);
    });
  }
});

const DOSSIER_DU_DIAGNOSTIC = 'src/app/features/growth-audit/';

const unitesDuDiagnostic = (): string[] =>
  [
    ...readFileSync('src/locale/messages.xlf', 'utf8').matchAll(
      /<trans-unit id="([^"]+)"[^>]*>([\s\S]*?)<\/trans-unit>/g,
    ),
  ]
    .filter(([, , corps]) =>
      corps.includes(`<context context-type="sourcefile">${DOSSIER_DU_DIAGNOSTIC}`),
    )
    .map(([, id]) => id);

const ciblesAnglaises = (): Map<string, string> =>
  new Map(
    [
      ...readFileSync('src/locale/messages.en.xlf', 'utf8').matchAll(
        /<unit id="([^"]+)">[\s\S]*?<target>([\s\S]*?)<\/target>[\s\S]*?<\/unit>/g,
      ),
    ].map(([, id, cible]) => [id, cible]),
  );

const interditsDe = (texte: string): string[] => motsTrouves(texte, MOTS_TECHNIQUES_DU_DIAGNOSTIC);

test.describe('DIAG-02 · le diagnostic gratuit parle sans mot technique, en anglais aussi', () => {
  test('DIAG-02 · chaque texte anglais de la page et du rapport est sans mot technique', () => {
    const cibles = ciblesAnglaises();
    const unites = unitesDuDiagnostic();

    expect(unites).toEqual(expect.arrayContaining(['auditHighlightsWins', 'auditPillarSeoTitle']));
    expect(
      unites.flatMap((id) => {
        const trouves = interditsDe(cibles.get(id) ?? '');
        return trouves.length === 0 ? [] : [`${id} : ${trouves.join(', ')}`];
      }),
    ).toEqual([]);
  });

  test('DIAG-02 · les textes sans lecteur et l ancienne table des points ont quitté la traduction', () => {
    const cibles = ciblesAnglaises();

    expect(cibles.has('auditPillarSeoTitle')).toBe(true);
    expect(
      [
        'auditStepOneDesc',
        'auditStepTwoDesc',
        'auditStepThreeDesc',
        'auditEngineAiVisibility',
        'auditPillarPerformance',
        'auditPillarTechnical',
        'auditPillarTrust',
        'auditPillarConversion',
        'auditPillarAiVisibility',
        'auditPillarCitationWorthiness',
      ].filter((id) => cibles.has(id)),
    ).toEqual([]);
  });

  for (const { langue, base } of [
    { langue: 'français', base: '' },
    { langue: 'anglais', base: '/en' },
  ]) {
    test(`DIAG-02 · /growth-audit servi en ${langue} ne lit aucun mot technique`, async ({
      page,
    }) => {
      exigerLaPorteSsr({ anglaise: base === '/en' });
      await sansContenu(page);
      await ouvrir(page, `${base === '' ? baseSsr : baseAnglaise}${base}/growth-audit`);

      expect(interditsDe(await texteServi(page))).toEqual([]);
    });
  }
});
