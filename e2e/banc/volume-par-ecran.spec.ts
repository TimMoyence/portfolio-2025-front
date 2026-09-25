import { expect, test } from '@playwright/test';
import type { Browser, Page, Response } from '@playwright/test';
import {
  URL_API,
  coursReleve,
  identiteDuPoste,
  jetonDuFormateur,
  lireLesResultats,
  ouvrirLePupitre,
  posteDansSonNavigateur,
  rejoindreDansLeNavigateur,
} from './contexte';
import type { Seance } from './contexte';
import {
  aUneJumelle,
  attendreLaRevelation,
  interagirAvecLEcran,
  natureDeLEcran,
  passerALaPhase,
  preparerDepuisLePupitre,
  reponsesAffichees,
  revelerDepuisLePupitre,
} from './interactions';
import type { NatureDEcran, Revelation } from './interactions';

const ETUDIANTS = 30;

const PREMIER_RANG = 400;

const DELAI_DE_BASCULE_MS = 10_000;

const DELAI_DE_RATTRAPAGE_MS = 8_000;

const POSTES_EN_VEILLE = [3, 11, 19, 27] as const;

const POSTES_RECHARGES = [5, 23] as const;

const TIRAGES_INDIVIDUELS: ReadonlySet<NatureDEcran> = new Set(['fp-spaced', 'fp-escape']);

interface Anomalie {
  readonly ecran: number;
  readonly poste: string;
  readonly etape: string;
  readonly detail: string;
}

interface Mesure {
  readonly ecran: number;
  readonly nature: NatureDEcran;
  readonly revelation: Revelation;
  readonly basculeMs: number;
  readonly gestesMs: number;
}

class Journal {
  readonly anomalies: Anomalie[] = [];
  ecran = -1;

  consigner(poste: string, etape: string, detail: string): void {
    const lignes = detail
      .replace(/\u001b\[[0-9;]*m/g, '')
      .split('\n')
      .filter((ligne) => /failed|Locator|Expected|Received|Error|waiting for/.test(ligne));
    this.anomalies.push({
      ecran: this.ecran,
      poste,
      etape,
      detail: lignes.slice(0, 5).join(' ⏎ '),
    });
  }

  async surChaquePoste(
    postes: readonly Page[],
    etape: string,
    geste: (page: Page, numero: number) => Promise<unknown>,
  ): Promise<void> {
    await Promise.all(
      postes.map((page, numero) =>
        geste(page, numero).then(
          () => undefined,
          (erreur: unknown) =>
            this.consigner(
              `poste ${numero}`,
              etape,
              erreur instanceof Error ? erreur.message : String(erreur),
            ),
        ),
      ),
    );
  }

  surveiller(page: Page, poste: string): void {
    const prefixe = new URL(URL_API).pathname;
    page.on('response', (reponse: Response) => {
      const statut = reponse.status();
      if (statut >= 400 && new URL(reponse.url()).pathname.startsWith(prefixe)) {
        this.consigner(poste, 'réseau', `${statut} ${reponse.request().method()} ${reponse.url()}`);
      }
    });
    page.on('pageerror', (erreur) => this.consigner(poste, 'pageerror', erreur.message));
  }
}

function surLEcran(page: Page, ecran: number, total: number, delai: number): Promise<void> {
  return expect(page.getByTestId('etudiant-progression')).toHaveText(`${ecran + 1} / ${total}`, {
    timeout: delai,
  });
}

async function avancer(pupitre: Page, ecran: number, total: number): Promise<void> {
  await pupitre.getByTestId(ecran > 0 ? 'presentateur-suivant' : 'presentateur-demarrer').click();
  await expect(pupitre.getByTestId('presentateur-ecran')).toHaveText(`${ecran + 1} / ${total}`);
}

async function reculer(pupitre: Page, ecran: number, total: number): Promise<void> {
  await pupitre.getByTestId('presentateur-precedent').click();
  await expect(pupitre.getByTestId('presentateur-ecran')).toHaveText(`${ecran + 1} / ${total}`);
}

async function mettreEnVeille(page: Page): Promise<() => Promise<void>> {
  const cdp = await page.context().newCDPSession(page);
  await page.context().setOffline(true);
  await cdp.send('Page.setWebLifecycleState', { state: 'frozen' });
  return async () => {
    await cdp.send('Page.setWebLifecycleState', { state: 'active' });
    await page.context().setOffline(false);
    await cdp.detach();
  };
}

async function ouvrirLaClasse(browser: Browser, seance: Seance, journal: Journal) {
  return Promise.all(
    Array.from({ length: ETUDIANTS }, async (_, numero) => {
      const poste = await posteDansSonNavigateur(browser, seance, PREMIER_RANG + numero);
      journal.surveiller(poste, `poste ${numero}`);
      return poste;
    }),
  );
}

async function voteJumele(pupitre: Page, postes: readonly Page[], journal: Journal) {
  await passerALaPhase(pupitre, 'Discussion entre voisins');
  await passerALaPhase(pupitre, 'Vote sur le cas jumeau');
  await journal.surChaquePoste(postes, 'second vote', (page, numero) =>
    interagirAvecLEcran(page, 'fp-vote', numero + 1),
  );
  await passerALaPhase(pupitre, 'Révélation');
}

async function veilleEtReprise(
  pupitre: Page,
  postes: Page[],
  seance: Seance,
  ecran: number,
  total: number,
  journal: Journal,
): Promise<void> {
  const endormis = POSTES_EN_VEILLE.map((numero) => postes[numero]);
  const reveils = await Promise.all(endormis.map(mettreEnVeille));
  await avancer(pupitre, ecran + 1, total);
  await reculer(pupitre, ecran, total);
  await Promise.all(reveils.map((reveiller) => reveiller()));
  await journal.surChaquePoste(endormis, 'réveil', (page) =>
    surLEcran(page, ecran, total, DELAI_DE_RATTRAPAGE_MS),
  );

  await Promise.all(
    POSTES_RECHARGES.map(async (numero) => {
      const page = postes[numero];
      await page.reload();
      await rejoindreDansLeNavigateur(page, seance, identiteDuPoste(PREMIER_RANG + numero));
    }),
  );
  await journal.surChaquePoste(
    POSTES_RECHARGES.map((numero) => postes[numero]),
    'réinscription',
    (page) => surLEcran(page, ecran, total, DELAI_DE_RATTRAPAGE_MS),
  );
}

test.describe('Banc — chaque écran du B2-01 tenu par trente postes simultanés', () => {
  test('bascule, gestes, révélations, veille et reprise sans perte', async ({
    browser,
    page,
    request,
  }) => {
    test.setTimeout(3_600_000);
    const journal = new Journal();
    const mesures: Mesure[] = [];
    journal.surveiller(page, 'formateur');
    const { total, ecrans } = await coursReleve(request);
    const tirages = new Map<string, number>();

    const seance = await ouvrirLePupitre(page);
    const postes = await ouvrirLaClasse(browser, seance, journal);
    await expect(page.getByTestId('presentateur-participants-nombre')).toHaveText(
      String(ETUDIANTS),
    );
    const milieu = Math.floor(total / 2);

    for (let ecran = 0; ecran < total; ecran += 1) {
      journal.ecran = ecran;
      const debut = Date.now();
      await avancer(page, ecran, total);
      await journal.surChaquePoste(postes, 'bascule', (poste) =>
        surLEcran(poste, ecran, total, DELAI_DE_BASCULE_MS),
      );
      const basculeMs = Date.now() - debut;

      const natures = await Promise.all(postes.map(natureDeLEcran));
      const nature = natures[0];
      natures.forEach((vue, numero) => {
        if (vue !== nature) journal.consigner(`poste ${numero}`, 'nature', `${vue} ≠ ${nature}`);
        if (vue === 'verrouille')
          journal.consigner(`poste ${numero}`, 'verrou', 'écran verrouillé');
      });

      await preparerDepuisLePupitre(page);
      const debutGestes = Date.now();
      await journal.surChaquePoste(postes, `gestes ${nature}`, (poste, numero) =>
        interagirAvecLEcran(poste, nature, numero),
      );
      const gestesMs = Date.now() - debutGestes;
      if (TIRAGES_INDIVIDUELS.has(nature)) {
        const lignes = await Promise.all(postes.map((poste) => reponsesAffichees(poste, nature)));
        tirages.set(
          ecrans[ecran],
          lignes.reduce((somme, nombre) => somme + nombre, 0),
        );
      }

      let revelation: Revelation;
      if (await aUneJumelle(page)) {
        await voteJumele(page, postes, journal);
        revelation = 'jumelle';
      } else {
        revelation = await revelerDepuisLePupitre(page);
      }
      await journal.surChaquePoste(postes, `révélation ${revelation}`, (poste) =>
        attendreLaRevelation(poste, nature, revelation),
      );
      mesures.push({ ecran, nature, revelation, basculeMs, gestesMs });

      if (ecran === milieu) {
        await veilleEtReprise(page, postes, seance, ecran, total, journal);
      }
    }

    await page.getByTestId('presentateur-cloturer').click();
    await page.getByTestId('presentateur-cloture-confirmer').click();
    await journal.surChaquePoste(postes, 'clôture', (poste) =>
      expect(poste.getByTestId('etudiant-fin')).toBeVisible(),
    );
    await expect(page.getByTestId('synthese-ligne')).toHaveCount(ETUDIANTS);

    const bilan = (await lireLesResultats(
      request,
      await jetonDuFormateur(request),
      seance.sessionId,
    )) as unknown as {
      resultats: {
        participants: number;
        questions: readonly { questionId: string; ecranId: string; total: number }[];
      };
    };
    const pertes = bilan.resultats.questions
      .filter((question) => !tirages.has(question.ecranId) && question.total < ETUDIANTS)
      .map((question) => `${question.ecranId} ${question.questionId} : ${question.total}`);
    for (const [ecranId, affichees] of tirages) {
      const enregistrees = bilan.resultats.questions
        .filter((question) => question.ecranId === ecranId)
        .reduce((somme, question) => somme + question.total, 0);
      if (enregistrees !== affichees) {
        pertes.push(`${ecranId} : ${enregistrees} enregistrées pour ${affichees} affichées`);
      }
    }

    test.info().annotations.push({ type: 'mesures', description: JSON.stringify(mesures) });
    test
      .info()
      .annotations.push({ type: 'anomalies', description: JSON.stringify(journal.anomalies) });
    console.log(JSON.stringify({ mesures, pertes, anomalies: journal.anomalies }, null, 1));

    expect(bilan.resultats.participants).toBe(ETUDIANTS);
    expect(pertes).toEqual([]);
    expect(journal.anomalies).toEqual([]);

    await Promise.all(postes.map((poste) => poste.context().close()));
  });
});
