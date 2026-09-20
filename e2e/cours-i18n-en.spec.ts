import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const XLF_ANGLAIS = 'src/locale/messages.en.xlf';
const ROUTES_PRERENDUES = 'dist/portfolio-app/prerendered-routes.json';
const LONGUEUR_MIN_LIBELLE = 25;
const LIBELLES_MIN_ATTENDUS = 300;
const SEPARATEUR_DE_CIBLES = ' \u0000 ';

const baseSsr = process.env['SSR_BASE_URL'] ?? '';

const baseAnglaise = process.env['SSR_EN_BASE_URL'] ?? '';

const ROUTES_EN = [
  '/en',
  '/en/atelier',
  '/en/atelier/meteo',
  '/en/atelier/sebastian',
  '/en/client-project',
  '/en/commonbudgetTM',
  '/en/contact',
  '/en/cookie-settings',
  '/en/cours/demo',
  '/en/forgot-password',
  '/en/formations',
  '/en/formations/audit-seo-diy',
  '/en/formations/audit-seo-diy/toolkit',
  '/en/formations/automatiser-avec-ia',
  '/en/formations/automatiser-avec-ia/toolkit',
  '/en/formations/b2-01-traitement-information-chiffree',
  '/en/formations/ia-solopreneurs',
  '/en/formations/ia-solopreneurs/toolkit',
  '/en/growth-audit',
  '/en/home',
  '/en/login',
  '/en/offer',
  '/en/presentation',
  '/en/privacy',
  '/en/projets',
  '/en/register',
  '/en/reset-password',
  '/en/slides/library',
  '/en/terms',
  '/en/verify-email',
];

interface LibelleFrancais {
  readonly id: string;
  readonly source: string;
}

function decoderXml(texte: string): string {
  return texte
    .replaceAll('&apos;', "'")
    .replaceAll('&quot;', '"')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replaceAll('&amp;', '&');
}

function normaliser(texte: string): string {
  return decoderXml(texte).replace(/\s+/g, ' ').trim();
}

function libellesTraduits(): LibelleFrancais[] {
  const xml = readFileSync(XLF_ANGLAIS, 'utf8');
  const unites = [
    ...xml.matchAll(
      /<unit id="([^"]+)">[\s\S]*?<source>([\s\S]*?)<\/source>\s*<target>([\s\S]*?)<\/target>/g,
    ),
  ];
  const traduites = unites.map(([, id, source, cible]) => ({
    id,
    source: normaliser(source),
    cible: normaliser(cible),
  }));
  const anglaisServi = traduites.map(({ cible }) => cible).join(SEPARATEUR_DE_CIBLES);
  const libelles = traduites
    .filter(
      ({ source, cible }) =>
        source !== cible &&
        !source.includes('<') &&
        source.includes(' ') &&
        source.length >= LONGUEUR_MIN_LIBELLE &&
        !anglaisServi.includes(source),
    )
    .map(({ id, source }) => ({ id, source }));
  if (libelles.length < LIBELLES_MIN_ATTENDUS) {
    throw new Error(
      `cours-i18n-en : seulement ${libelles.length} libelle(s) francais traduits retenus dans ${XLF_ANGLAIS} — un detecteur qui ne cherche presque rien rend un vert qui ne prouve rien.`,
    );
  }
  return libelles;
}

const LIBELLES = libellesTraduits();

async function texteVisible(page: Page): Promise<string> {
  return normaliser(await page.locator('body').innerText());
}

function fuitesFrancaises(texte: string): string[] {
  return LIBELLES.filter(({ source }) => texte.includes(source)).map(({ id }) => id);
}

test.describe('la version anglaise ne laisse aucun libelle francais (QA-15)', () => {
  test.skip(
    baseSsr === '' || baseAnglaise === '',
    'hors porte : SSR_BASE_URL ou SSR_EN_BASE_URL absente. La porte les fournit (npm run test:e2e:portail).',
  );

  for (const route of ROUTES_EN) {
    test(`${route} n affiche aucun libelle reste en francais`, async ({ page }) => {
      await page.goto(`${baseAnglaise}${route}`, { waitUntil: 'domcontentloaded' });

      const fuites = fuitesFrancaises(await texteVisible(page));

      expect(fuites, `libelles francais servis sur ${route}`).toEqual([]);
      expect(page.url()).toContain('/en');
    });
  }

  test('le detecteur rougirait sur la meme page servie en francais', async ({ page }) => {
    await page.goto(`${baseSsr}/fr/offer`, { waitUntil: 'domcontentloaded' });

    expect(fuitesFrancaises(await texteVisible(page)).length).toBeGreaterThan(0);
  });

  test('couvre toutes les routes anglaises que le build prerend', () => {
    const prerendues = JSON.parse(readFileSync(ROUTES_PRERENDUES, 'utf8')) as {
      routes: Record<string, unknown>;
    };
    const anglaises = Object.keys(prerendues.routes).filter((route) => route.startsWith('/en'));

    expect(anglaises.length).toBeGreaterThan(0);
    expect(anglaises.filter((route) => !ROUTES_EN.includes(route))).toEqual([]);
  });
});
