import { expect, test } from '@playwright/test';
import { coursReleve, EN_TETE_JETON, ouvrirLePupitre, URL_API } from './contexte';

const PIEGE = '<img src=x onerror=alert(document.domain)>';

test.describe('Banc — XSS au pupitre', () => {
  test('le pupitre affiche en texte le nom et la réponse piégés, sans balise ni dialogue', async ({
    page,
    request,
  }) => {
    const { reponsesLibres, total } = await coursReleve(request);
    const libre = reponsesLibres[0];
    const dialogues: string[] = [];
    page.on('dialog', async (dialogue) => {
      dialogues.push(dialogue.message());
      await dialogue.dismiss();
    });
    const seance = await ouvrirLePupitre(page);
    const inscription = await request.post(`${URL_API}/formations/sessions/${seance.code}/join`, {
      data: { prenom: PIEGE, nom: PIEGE, email: 'piege.xss@example.test' },
    });
    expect(inscription.status(), await inscription.text()).toBe(201);
    const { jeton } = (await inscription.json()) as { jeton: string };

    await page.getByTestId('presentateur-demarrer').click();
    for (let saut = 0; saut < libre.rang; saut += 1) {
      await page.getByTestId('presentateur-suivant').click();
    }
    await expect(page.getByTestId('presentateur-ecran')).toHaveText(`${libre.rang + 1} / ${total}`);
    const envoyer = async (): Promise<number> => {
      const envoi = await request.post(
        `${URL_API}/formations/sessions/${seance.sessionId}/free-responses`,
        {
          headers: { [EN_TETE_JETON]: jeton },
          data: {
            screenId: libre.id,
            activityId: libre.activiteId,
            response: PIEGE,
            dureeMs: 4000,
          },
        },
      );
      return envoi.status();
    };
    await expect.poll(envoyer).toBe(201);
    await page.getByTestId('presentateur-suivant').click();
    await page.getByTestId('presentateur-precedent').click();
    await page.getByTestId('activite-participants-afficher').click();

    await expect(page.getByTestId('reponse-libre').filter({ hasText: PIEGE })).toHaveCount(1);
    await expect(page.getByTestId('activite-participant').filter({ hasText: PIEGE })).toHaveCount(
      1,
    );
    await expect(page.locator('img[onerror]')).toHaveCount(0);
    expect(dialogues).toEqual([]);
  });
});
