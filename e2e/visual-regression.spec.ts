/**
 * Une capture `fullPage` ne scrolle pas la page et ne déclenche donc ni les
 * `IntersectionObserver` ni le lazy-loading des images. Sans les deux
 * neutralisations appliquées par `preparerCapture`, les références obtenues
 * sont muettes sur l'essentiel du contenu.
 *
 * Le bandeau de consentement cookies est visible sur les captures : c'est
 * l'état réel d'une première visite, et il est déterministe.
 */
import { test, expect, type Page } from '@playwright/test';

async function preparerCapture(page: Page, url: string): Promise<void> {
  // 1. Mouvement réduit — À APPELER AVANT le `goto`. Effet double :
  //
  //    a) `_primitives.scss` force `.anim-ready .reveal { opacity: 1 !important }`.
  //       Sans ça, 18 des 23 sections de l'accueil restent à `opacity: 0` :
  //       `RevealOnScrollDirective` révèle le contenu via un `IntersectionObserver`,
  //       or une capture `fullPage` ne scrolle pas et les sections hors viewport
  //       ne croisent jamais l'observer.
  //
  //    b) `AsiliBackgroundComponent` fige son canvas sur une frame statique au
  //       lieu de faire tourner sa boucle `requestAnimationFrame`.
  //
  //    PIÈGE : `use: { reducedMotion: "reduce" }` dans `playwright.config.ts`
  //    n'a AUCUN effet en Playwright 1.59.1 — l'option est bien résolue dans
  //    `testInfo.project.use`, mais n'est jamais appliquée au contexte
  //    (`matchMedia("(prefers-reduced-motion: reduce)")` reste `false` dans la
  //    page). Seul `page.emulateMedia()` fonctionne : ne pas retenter la voie
  //    config.
  await page.emulateMedia({ reducedMotion: 'reduce' });

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.locator('body').waitFor({ state: 'visible' });

  // 2. Chargement forcé des images `loading="lazy"`. Chromium ne déclenche pas
  //    le lazy-loading pour une capture `fullPage` : les images situées hors du
  //    viewport resteraient des cadres vides. `AsiliProjectsGridComponent` passe
  //    toutes ses images en `lazy` par défaut (`eagerImages = 0`), donc les
  //    cartes projets de l'accueil et de `/projets` sont directement concernées.
  await page.evaluate(() => {
    for (const img of Array.from(document.querySelectorAll('img'))) {
      img.setAttribute('loading', 'eager');
    }
  });
  await page.evaluate(
    () =>
      Promise.all(
        Array.from(document.querySelectorAll('img'))
          .filter((img) => !img.complete)
          .map(
            (img) =>
              new Promise<void>((resolve) => {
                img.onload = (): void => resolve();
                img.onerror = (): void => resolve();
              }),
          ),
      ) as Promise<unknown>,
  );
  await page.waitForLoadState('networkidle');
}

test.describe('Regression visuelle — Pages publiques', () => {
  test("page d'accueil — screenshot full-page", async ({ page }) => {
    await preparerCapture(page, '/');

    await expect(page).toHaveScreenshot('accueil.png', { fullPage: true });
  });

  test('page login — screenshot full-page', async ({ page }) => {
    await preparerCapture(page, '/login');

    await expect(page).toHaveScreenshot('login.png', { fullPage: true });
  });

  test('page contact — screenshot full-page', async ({ page }) => {
    await preparerCapture(page, '/contact');

    await expect(page).toHaveScreenshot('contact.png', { fullPage: true });
  });
});
