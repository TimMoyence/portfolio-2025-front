import { expect, test, type Page } from '@playwright/test';
import { ouvrir, sansContenu } from './ouvrir';

const textesTransparents = (page: Page): Promise<string[]> =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>('main *'))
      .filter((element) =>
        Array.from(element.childNodes).some(
          (noeud) => noeud.nodeType === Node.TEXT_NODE && (noeud.textContent ?? '').trim() !== '',
        ),
      )
      .filter((element) => {
        for (let ancetre: HTMLElement | null = element; ancetre; ancetre = ancetre.parentElement) {
          if (Number(getComputedStyle(ancetre).opacity) < 1) return true;
        }
        return false;
      })
      .map((element) => (element.textContent ?? '').trim().slice(0, 40)),
  );

for (const chemin of ['/', '/offer', '/projets', '/presentation']) {
  test(`REC-15 · aucun texte de ${chemin} n est à opacité 0, en haut comme sous le pli`, async ({
    page,
  }) => {
    await sansContenu(page);
    await ouvrir(page, chemin);

    expect(await textesTransparents(page)).toEqual([]);
  });
}
