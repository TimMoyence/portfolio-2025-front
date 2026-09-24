import { expect, test } from '@playwright/test';
import type { APIRequestContext, Page } from '@playwright/test';
import {
  URL_API,
  URL_FRONT,
  coursReleve,
  inscrireUnPoste,
  jetonDuFormateur,
  repondreDepuisLePoste,
  seanceDemarreeSurLEcran,
  servirLEcran,
} from './contexte';
import type { EcranDuCours, Poste, Seance } from './contexte';

const FENETRE_MS = 5_000;

const POSTES = 4;

const QUESTIONS_PAR_POSTE = 5;

const DELAI_MIN_BILAN_MS = 1_000;

const TOLERANCE_HORLOGE_MS = 50;

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

function apresLInstantaneDOuverture(evenements: readonly EvenementRecu[]): EvenementRecu[] {
  return evenements.slice(1);
}

function estSousSuite(
  extraite: readonly EvenementRecu[],
  complete: readonly EvenementRecu[],
): boolean {
  let rang = 0;
  for (const evenement of complete) {
    if (rang < extraite.length && extraite[rang].data === evenement.data) rang += 1;
  }
  return rang === extraite.length;
}

function ecartMinimal(evenements: readonly EvenementRecu[]): number {
  return Math.min(
    ...evenements.slice(1).map((evenement, rang) => evenement.ts - evenements[rang].ts),
  );
}

async function rafaleDeReponses(
  request: APIRequestContext,
  seance: Seance,
  jeton: string,
  postes: readonly Poste[],
  questions: readonly EcranDuCours[],
): Promise<number> {
  let envoyees = 0;
  let servi = -1;
  for (const question of questions) {
    if (question.rang !== servi) {
      await servirLEcran(request, jeton, seance.sessionId, question.rang);
      servi = question.rang;
    }
    for (const poste of postes) {
      const reponse = await repondreDepuisLePoste(request, seance, poste, {
        questionId: question.activiteId,
        valeur: question.options[0],
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
    const { questions } = await coursReleve(request);
    const rafale = questions.slice(0, QUESTIONS_PAR_POSTE);
    expect(rafale).toHaveLength(QUESTIONS_PAR_POSTE);
    const { seance } = await seanceDemarreeSurLEcran(request, rafale[0].rang);
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

    const envoyees = await rafaleDeReponses(request, seance, jeton, postes, rafale);
    expect(envoyees).toBe(POSTES * QUESTIONS_PAR_POSTE);

    const [gauche, droite] = await collectes;
    await contexte.close();

    const resultatsGauche = gauche.filter((evenement) => evenement.nom === 'resultats');
    const resultatsDroite = droite.filter((evenement) => evenement.nom === 'resultats');

    const [court, long] = [resultatsGauche, resultatsDroite]
      .map(apresLInstantaneDOuverture)
      .sort((gauche, droite) => gauche.length - droite.length);
    expect(court.length).toBeGreaterThan(1);
    expect(court.at(-1)?.data).toBe(long.at(-1)?.data);
    expect(estSousSuite(court, long)).toBe(true);
    expect(ecartMinimal(long)).toBeGreaterThanOrEqual(DELAI_MIN_BILAN_MS - TOLERANCE_HORLOGE_MS);

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
