import { expect, test, type Locator, type Page } from '@playwright/test';
import { ouvrir } from '../ouvrir';
import { opaciteAutour, placer, sansMouvement, surLaToile } from './toile';

surLaToile();
sansMouvement();

const COUCHE = '.ai-method canvas.couche-de-nuit';
const DEMI_PERIODE_DU_POINTILLE = 4;
const NUIT = [10, 14, 18];
const CREME = 'rgb(255, 250, 242)';

const formeDuRond = (rond: Locator) =>
  rond.evaluate((element) => {
    const style = getComputedStyle(element);
    const { width, height } = element.getBoundingClientRect();
    return {
      largeur: width,
      hauteur: height,
      arrondi: style.borderRadius,
      bord: `${style.borderTopWidth} ${style.borderTopStyle}`,
      disposition: `${style.display} ${style.placeItems}`,
      police: style.fontFamily,
      fond: style.backgroundColor,
    };
  });

const sousLeChiffre = async (rond: Locator): Promise<{ x: number; y: number }> => {
  const boite = await rond.boundingBox();
  if (!boite) throw new Error('rond sans boîte');
  return {
    x: Math.round(boite.x + boite.width / 2),
    y: Math.round(boite.y + boite.height / 2 + boite.height * 0.36),
  };
};

const pixelALEcran = async (page: Page, { x, y }: { x: number; y: number }): Promise<number[]> => {
  const capture = await page.screenshot({ clip: { x, y, width: 1, height: 1 } });
  return page.evaluate(
    async (source) => {
      const vignette = new Image();
      vignette.src = source;
      await vignette.decode();
      const toile = document.createElement('canvas');
      toile.width = 1;
      toile.height = 1;
      const contexte = toile.getContext('2d');
      contexte?.drawImage(vignette, 0, 0);
      return [...(contexte?.getImageData(0, 0, 1, 1).data.slice(0, 3) ?? [])];
    },
    `data:image/png;base64,${capture.toString('base64')}`,
  );
};

test('MET-01 · /projets : le rond de Socle & Élan est plein, 60 px, sur le crème', async ({
  page,
}) => {
  await ouvrir(page, '/projets');

  expect(await formeDuRond(page.locator('app-asili-method .num').first())).toEqual(
    expect.objectContaining({ largeur: 60, hauteur: 60, arrondi: '50%', fond: CREME }),
  );
});

test('MET-01 · /presentation : chaque chiffre de la méthode IA est dans le même rond, plein sur la nuit, et le fil passe dessous', async ({
  page,
}) => {
  await ouvrir(page, '/projets');
  const socle = await formeDuRond(page.locator('app-asili-method .num').first());
  await ouvrir(page, '/presentation');
  const ronds = page.locator('.ai-n');
  await placer(page, '.ai-steps', 200);
  await page.clock.runFor(500);

  const tous = await ronds.all();
  expect(tous.length).toBeGreaterThan(1);
  for (const [index, rond] of tous.entries()) {
    expect(await formeDuRond(rond)).toEqual({
      ...socle,
      largeur: 36,
      hauteur: 36,
      fond: `rgb(${NUIT.join(', ')})`,
    });
    const point = await sousLeChiffre(rond);
    if (index < tous.length - 1) {
      expect(
        await opaciteAutour(page, COUCHE, point.x, point.y, DEMI_PERIODE_DU_POINTILLE),
      ).toBeGreaterThan(20);
    }
    const pixel = await pixelALEcran(page, point);
    pixel.forEach((canal, rang) => expect(Math.abs(canal - NUIT[rang])).toBeLessThanOrEqual(2));
  }
});
