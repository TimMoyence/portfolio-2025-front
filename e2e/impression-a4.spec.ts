import { expect, test } from '@playwright/test';
import { hauteursDesEcrans } from './impression-a4';

const LIVRET_SYNTHETIQUE = `
<style>
  body { margin: 0; }
  .livret__page + .livret__page { margin-block-start: 16px; }
  .livret__page,
  .livret__page--scindable > app-slide-activity,
  .livret__page--scindable > .livret__formateur > * {
    display: inline-grid;
    grid-template-columns: minmax(0, 1fr);
    inline-size: 100%;
    vertical-align: top;
  }
  .livret__page--scindable,
  .livret__page--scindable > .livret__formateur { display: block; }
  .livret__page--scindable > * + * { margin-block-start: 8px; }
  .livret__page--scindable > .livret__formateur > * + * { margin-block-start: 12px; }
  .livret__page--scindable > .livret__formateur > :last-child { margin-block-end: 4px; }
  h2 { margin: 0; height: 100px; }
</style>
<section class="livret__page" data-ecran="PREMIER"><div style="height: 50px"></div></section>
<section class="livret__page" data-ecran="SUJET">
  <h2>Titre</h2>
  <app-slide-activity style="display: block; height: 500px"></app-slide-activity>
</section>
<section class="livret__page livret__page--scindable" data-ecran="CORRIGE">
  <app-slide-activity style="height: 300px"></app-slide-activity>
  <div class="livret__formateur">
    <div style="height: 200px"></div>
    <div style="height: 400px"></div>
  </div>
</section>
`;

test('mesure chaque bloc que l impression ne coupe pas, marges comprises : la section entière du sujet, chaque bloc d une section scindable', async ({
  page,
}) => {
  await page.setContent(LIVRET_SYNTHETIQUE);

  expect(await hauteursDesEcrans(page.locator('[data-ecran]'))).toEqual([
    { ecran: 'PREMIER', hauteur: 50 },
    { ecran: 'SUJET', hauteur: 616 },
    { ecran: 'CORRIGE', hauteur: 416 },
  ]);
});
