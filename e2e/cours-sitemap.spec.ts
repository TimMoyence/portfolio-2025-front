import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const CHEMIN_DU_COURS = '/formations/b2-01-traitement-information-chiffree';
const JOUR = /^\d{4}-\d{2}-\d{2}$/;

const baseSsr = process.env['SSR_BASE_URL'] ?? '';
const publieLeAttendu = process.env['SITEMAP_PUBLIE_LE'];

function lastmodDuFichierSeo(): string {
  const fichier = JSON.parse(readFileSync('src/assets/seo/seo-metadata.json', 'utf8')) as {
    pages: { path: string; lastmod?: string }[];
  };
  const page = fichier.pages.find(({ path }) => path === CHEMIN_DU_COURS);
  if (page?.lastmod === undefined) {
    throw new Error(`Aucun lastmod pour ${CHEMIN_DU_COURS} dans seo-metadata.json`);
  }
  return page.lastmod;
}

function lastmodDuCours(xml: string): string | null {
  const entree = new RegExp(
    `<loc>[^<]*${CHEMIN_DU_COURS}</loc>[\\s\\S]*?<lastmod>([^<]+)</lastmod>`,
  ).exec(xml);
  return entree === null ? null : entree[1];
}

test.describe('sitemap du cours B2-01 servi par l API (H1)', () => {
  test.skip(
    baseSsr === '',
    'hors porte : SSR_BASE_URL absente. La porte la fournit (npm run test:e2e:portail).',
  );

  test('date la page du cours au moins par le dernier commit front', async ({ request }) => {
    const reponse = await request.get(`${baseSsr}/sitemap.xml`);
    expect(reponse.status()).toBe(200);

    const lastmod = lastmodDuCours(await reponse.text());
    expect(lastmod).not.toBeNull();
    expect(lastmod).toMatch(JOUR);
    expect(lastmod! >= lastmodDuFichierSeo()).toBeTruthy();
    if (publieLeAttendu !== undefined) {
      expect(lastmod).toBe(publieLeAttendu.slice(0, 10));
    }
  });
});
