import { expect, test, type Page } from '@playwright/test';
import { ouvrir } from '../ouvrir';
import {
  TOILE_DE_FOND,
  journalDe,
  journaliserLesToiles,
  placer,
  sansMouvement,
  surLaToile,
} from './toile';

surLaToile();
journaliserLesToiles();

const premiereImage = async (page: Page) => {
  const [appels] = await journalDe(page, TOILE_DE_FOND);
  const traits = appels.findIndex(({ type }) => type === 'fill');
  const etoiles = appels.slice(traits).findIndex(({ type }) => type === 'stroke');
  return {
    traits: appels.slice(0, traits).map(({ alpha }) => alpha),
    etoiles: appels.slice(traits, traits + etoiles).map(({ alpha }) => alpha),
  };
};

const placerLeProbleme = (page: Page): Promise<void> => placer(page, 'section.probleme', 300);

test('CIEL-04 · CIEL-05 · Cassiopée posée : 4 traits à 0,2 avant le réseau, 5 étoiles qui scintillent entre 0,4 et 0,6', async ({
  page,
}) => {
  await ouvrir(page, '/');
  await page.clock.runFor(3000);
  const avant = await premiereImage(page);
  await page.clock.runFor(700);
  const apres = await premiereImage(page);

  expect(avant.traits).toEqual([0.2, 0.2, 0.2, 0.2]);
  expect(avant.etoiles).toHaveLength(5);
  for (const alpha of [...avant.etoiles, ...apres.etoiles]) {
    expect(alpha).toBeGreaterThanOrEqual(0.4 - 1e-6);
    expect(alpha).toBeLessThanOrEqual(0.6 + 1e-6);
  }
  expect(apres.etoiles).not.toEqual(avant.etoiles);
});

test('CIEL-05 · du héros au problème, Persée se forme : 50 ms après, ni tracée ni allumée ; 2,5 s après, entière', async ({
  page,
}) => {
  await ouvrir(page, '/');
  await page.clock.runFor(3000);
  await placerLeProbleme(page);

  await page.clock.runFor(50);
  const naissante = await premiereImage(page);
  expect(naissante.traits.length).toBeLessThan(23);
  expect(naissante.etoiles.filter((alpha) => alpha >= 0.4 - 1e-6).length).toBeLessThan(23);

  await page.clock.runFor(2500);
  const formee = await premiereImage(page);
  expect(formee.traits).toEqual(Array.from({ length: 23 }, () => 0.2));
  expect(formee.etoiles.filter((alpha) => alpha >= 0.4 - 1e-6)).toHaveLength(23);
});

test.describe('sans mouvement', () => {
  sansMouvement();

  test('CIEL-05 · avec « réduire », Persée est posée d emblée, entière, sans scintillement', async ({
    page,
  }) => {
    await ouvrir(page, '/');
    await page.clock.runFor(200);
    await placerLeProbleme(page);
    await page.clock.runFor(100);
    const posee = await premiereImage(page);
    await page.clock.runFor(1000);

    expect(posee.traits).toEqual(Array.from({ length: 23 }, () => 0.2));
    expect(posee.etoiles).toEqual(Array.from({ length: 23 }, () => 0.5));
    expect(await premiereImage(page)).toEqual(posee);
  });
});
