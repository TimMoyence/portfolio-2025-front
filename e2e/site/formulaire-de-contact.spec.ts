import { expect, test } from '@playwright/test';

const ECART_DES_CHAMPS = 12;

for (const largeur of [1440, 1024]) {
  test(`VIT2-02 · /contact en ${largeur} px : les quatre champs d identité se suivent sans trou à côté du message`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: largeur, height: 900 });
    await page.goto('/contact');
    const bas = async (id: string) => {
      const boite = await page.locator(`#${id}`).boundingBox();
      return boite ? Math.round(boite.y + boite.height) : Number.NaN;
    };
    const haut = async (id: string) =>
      Math.round((await page.locator(`#${id}`).boundingBox())?.y ?? Number.NaN);

    expect([await haut('email'), await haut('phone')]).toEqual([
      (await bas('firstName')) + ECART_DES_CHAMPS,
      (await bas('lastName')) + ECART_DES_CHAMPS,
    ]);
  });
}
