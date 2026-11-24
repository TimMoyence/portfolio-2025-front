import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { ouvrir, sansContenu } from './ouvrir';
import { baseAnglaise, exigerLaPorteSsr } from '../porte-ssr';

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

const echapper = (nom: string): string => nom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const OUTIL = new RegExp(
  `(?<![\\p{L}\\p{N}_])(?:${NOMS_D_OUTILS.map(echapper).join('|')})(?![\\p{L}\\p{N}_])`,
  'giu',
);

const outilsDe = (texte: string): string[] => [...new Set(texte.match(OUTIL) ?? [])];

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
      await page.goto(`${baseAnglaise}/en${path === '/' ? '' : path}`, {
        waitUntil: 'domcontentloaded',
      });
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      expect(outilsDe(await texteServi(page))).toEqual([]);
    });
  }
});
