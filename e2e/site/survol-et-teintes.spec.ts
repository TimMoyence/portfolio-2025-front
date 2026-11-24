import { expect, test, type Page, type Route } from '@playwright/test';
import {
  zAuthResponseDto,
  zPublishedArticleResponseDto,
  zToolkitPageResponseDto,
} from '../../contrat/zod.gen';
import { buildRecitDuMatin } from '../../src/testing/factories/article.factory';
import { buildToolkitPageData } from '../../src/testing/factories/lead-magnet.factory';
import { contrastesInsuffisants } from '../../src/testing/texte/contrastes-insuffisants';
import { intercepterApi, MOCK_SESSION, servirJson, servirSansContenu } from '../fixtures';
import { parcourir, survolsHorsHover, violationsAxe } from '../sondes-de-style';

const ARTICLE = buildRecitDuMatin({ slug: 'morning-brief-2026-11-10' });

const servir = (route: Route, chemin: string): Promise<void> => {
  if (chemin.endsWith('/auth/refresh')) return servirJson(route, zAuthResponseDto, MOCK_SESSION);
  if (chemin.endsWith(`/articles/${ARTICLE.slug}`))
    return servirJson(route, zPublishedArticleResponseDto, ARTICLE);
  if (chemin.includes('/lead-magnets/toolkit/'))
    return servirJson(route, zToolkitPageResponseDto, buildToolkitPageData());
  return servirSansContenu(route);
};

const PAGES_HORS_VITRINE = [
  '/articles',
  `/articles/${ARTICLE.slug}`,
  '/terms',
  '/privacy',
  '/login',
  '/register',
  '/forgot-password',
  '/growth-audit',
  '/profil',
  '/formations/ia-solopreneurs',
  '/formations/ia-solopreneurs/toolkit/jeton-de-test',
  '/formations/automatiser-avec-ia',
  '/formations/audit-seo-diy',
];

test.use({ contextOptions: { reducedMotion: 'reduce' } });

const ouvrir = async (page: Page, chemin: string): Promise<void> => {
  await intercepterApi(page, servir);
  await page.goto(chemin);
  await expect(page.locator('main h1, main h2').first()).toBeVisible();
  await parcourir(page);
};

test.describe('REC-16 · hors vitrine, le survol attend (hover: hover) et l accent tient 4,5:1', () => {
  for (const chemin of PAGES_HORS_VITRINE) {
    test(`REC-16 · ${chemin} : survol sous (hover: hover), chaque texte à son contraste`, async ({
      page,
    }) => {
      await ouvrir(page, chemin);

      expect(await survolsHorsHover(page)).toEqual([]);
      expect(await page.locator('body').evaluate(contrastesInsuffisants)).toEqual([]);
      expect(await violationsAxe(page)).toEqual([]);
    });
  }

  test('REC-16 · le bouton Copier de la boîte à outils tient 4,5:1 au survol', async ({ page }) => {
    await ouvrir(page, '/formations/ia-solopreneurs/toolkit/jeton-de-test');
    const copier = page.locator('.tkp-copy').first();
    await copier.hover();

    expect(await copier.evaluate(contrastesInsuffisants)).toEqual([]);
  });
});

test.describe('VIT2-05 · hors vitrine non plus, aucune carte ne se soulève au survol', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } });

  for (const { chemin, carte } of [
    { chemin: '/formations/automatiser-avec-ia', carte: '.slide-grid__card' },
    { chemin: '/formations/ia-solopreneurs/toolkit/jeton-de-test', carte: '.tkp-card--link' },
  ]) {
    test(`VIT2-05 · ${chemin} ${carte} : rien ne monte au survol`, async ({ page }) => {
      await ouvrir(page, chemin);
      const cible = page.locator(carte).first();
      await cible.scrollIntoViewIfNeeded();
      const haut = () =>
        cible.evaluate(async (element) => {
          await new Promise((suite) => requestAnimationFrame(() => requestAnimationFrame(suite)));
          await Promise.all(element.getAnimations().map((animation) => animation.finished));
          return Math.round(element.getBoundingClientRect().top);
        });
      const repos = await haut();

      await cible.hover();

      expect(await haut()).toBe(repos);
    });
  }
});

test.describe('REC-16 · la navigation se lit à 4,5:1 dans chacun de ses états', () => {
  test.beforeEach(async ({ page }) => {
    await intercepterApi(page, servir);
  });

  test('REC-16 · la navbar défilée au-dessus de la bande d appel', async ({ page }) => {
    await page.goto('/');
    await parcourir(page);
    await page
      .locator('.cta')
      .first()
      .evaluate((bande) => {
        window.scrollTo(0, bande.getBoundingClientRect().top + window.scrollY - 10);
      });
    await expect(page.locator('app-navbar header, app-navbar nav').first()).toBeVisible();

    expect(await violationsAxe(page, 'app-navbar')).toEqual([]);
  });

  test('REC-16 · le menu Formation ouvert', async ({ page }) => {
    await page.goto('/');
    const declencheur = page.locator('.asili-nav__links .asili-nav__trigger');
    await declencheur.focus();
    await page.keyboard.press('Enter');
    await expect(declencheur).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.asili-nav__links .asili-dropdown')).toHaveCSS('opacity', '1');

    expect(await page.locator('app-navbar').evaluate(contrastesInsuffisants)).toEqual([]);
    expect(await violationsAxe(page, 'app-navbar')).toEqual([]);
  });

  test.describe('sur un téléphone de 390 px', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('REC-16 · le tiroir ouvert', async ({ page }) => {
      await page.goto('/');
      await page.locator('.asili-burger').click();
      await expect(page.locator('.asili-drawer')).toBeVisible();

      expect(await page.locator('.asili-drawer').evaluate(contrastesInsuffisants)).toEqual([]);
      expect(await violationsAxe(page, '.asili-drawer')).toEqual([]);
    });
  });
});
