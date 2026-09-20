import { expect, test } from '@playwright/test';
import type { APIRequestContext, Page } from '@playwright/test';
import {
  URL_API,
  URL_FRONT,
  ecransDuRenderer,
  inscrireUnPoste,
  jetonDuFormateur,
  lireLeCatalogue,
  repondreDepuisLePoste,
  seanceDemarreeSurLEcran,
} from './contexte';
import type { Poste, Seance } from './contexte';

const FENETRE_MS = 5_000;

const POSTES = 4;

const QUESTIONS_PAR_POSTE = 5;

interface EvenementRecu {
  readonly nom: string;
  readonly ts: number;
  readonly data: string;
}

function collecterLeFlux(page: Page, url: string, jeton: string): Promise<EvenementRecu[]> {
  return page.evaluate(
    async ([adresse, autorisation, duree]) => {
      const arret = new AbortController();
      setTimeout(() => arret.abort(), Number(duree));
      const debut = performance.now();
      const recus: { nom: string; ts: number; data: string }[] = [];
      try {
        const reponse = await fetch(adresse, {
          headers: { authorization: `Bearer ${autorisation}` },
          signal: arret.signal,
        });
        const lecteur = reponse.body?.getReader();
        if (lecteur === undefined) return recus;
        const decodeur = new TextDecoder();
        let tampon = '';
        for (;;) {
          const { value, done } = await lecteur.read();
          if (done) break;
          tampon += decodeur.decode(value, { stream: true });
          const blocs = tampon.split('\n\n');
          tampon = blocs.pop() ?? '';
          for (const bloc of blocs) {
            const nom = /^event: (.+)$/m.exec(bloc)?.[1] ?? '';
            const data = /^data: (.+)$/m.exec(bloc)?.[1] ?? '';
            recus.push({ nom, ts: performance.now() - debut, data });
          }
        }
      } catch {
        return recus;
      }
      return recus;
    },
    [url, jeton, String(FENETRE_MS)] as const,
  );
}

async function rafaleDeReponses(
  request: APIRequestContext,
  seance: Seance,
  postes: readonly Poste[],
  questions: readonly string[],
): Promise<number> {
  let envoyees = 0;
  for (let rang = 0; rang < QUESTIONS_PAR_POSTE; rang += 1) {
    for (const poste of postes) {
      const reponse = await repondreDepuisLePoste(request, seance, poste, {
        questionId: questions[rang],
        valeur: 'o1',
      });
      if (reponse.status() === 201) envoyees += 1;
    }
    await new Promise((tenir) => setTimeout(tenir, 700));
  }
  return envoyees;
}

test.describe('Banc — cadence du flux du pupitre', () => {
  test('deux onglets formateur reçoivent les mêmes résultats, au plus une fois par seconde', async ({
    browser,
    request,
  }) => {
    const quiz = ecransDuRenderer(await lireLeCatalogue(request), 'quiz');
    const { seance } = await seanceDemarreeSurLEcran(request, quiz[0].rang);
    const jeton = await jetonDuFormateur(request);
    const postes = await Promise.all(
      Array.from({ length: POSTES }, (_, rang) => inscrireUnPoste(request, seance, 20 + rang)),
    );

    const contexte = await browser.newContext({ baseURL: URL_FRONT, locale: 'fr-FR' });
    const premier = await contexte.newPage();
    const second = await contexte.newPage();
    await Promise.all([premier.goto('/fr/cours/rejoindre'), second.goto('/fr/cours/rejoindre')]);

    const adresse = `${URL_API}/formations/sessions/${seance.sessionId}/presenter-stream`;
    const collectes = Promise.all([
      collecterLeFlux(premier, adresse, jeton),
      collecterLeFlux(second, adresse, jeton),
    ]);

    const envoyees = await rafaleDeReponses(
      request,
      seance,
      postes,
      quiz.slice(0, QUESTIONS_PAR_POSTE).map((ecran) => ecran.activiteId),
    );
    expect(envoyees).toBe(POSTES * QUESTIONS_PAR_POSTE);

    const [gauche, droite] = await collectes;
    await contexte.close();

    const resultatsGauche = gauche.filter((evenement) => evenement.nom === 'resultats');
    const resultatsDroite = droite.filter((evenement) => evenement.nom === 'resultats');

    expect(resultatsGauche.length).toBeGreaterThan(1);
    expect(resultatsGauche.length).toBeLessThanOrEqual(Math.ceil(FENETRE_MS / 1000) + 1);
    expect(resultatsDroite.map((evenement) => evenement.data)).toEqual(
      resultatsGauche.map((evenement) => evenement.data),
    );

    const dernier = JSON.parse(resultatsGauche[resultatsGauche.length - 1].data) as {
      questions: readonly unknown[];
      bareme: Readonly<Record<string, unknown>>;
      jalons: Readonly<Record<string, unknown>>;
      enigmes: readonly unknown[];
      participants: number;
    };
    expect(dernier.participants).toBe(POSTES);
    expect(dernier.questions.length).toBeGreaterThan(0);
    expect(Object.keys(dernier.bareme).length).toBeGreaterThan(0);
    expect(dernier.jalons).toEqual({});
    expect(dernier.enigmes).toEqual([]);
  });
});
