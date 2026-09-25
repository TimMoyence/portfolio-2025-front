import { expect, test } from '@playwright/test';
import type { Page, Route } from '@playwright/test';
import { intercepterApi, servirFlux, servirJson, servirSansContenu } from './fixtures';

const SESSION = '33333333-3333-4333-8333-333333333333';
const SLUG = 'b2-01-traitement-information-chiffree';
const PARTICIPANT = '55555555-5555-4555-8555-555555555555';
const REPONSE_ATTENDUE = 'Des milliers d’euros, pas des euros.';
const ENONCE_PROBLEME = 'Le prix monte de 20 %, puis baisse de 20 %. Où arrive-t-il ?';
const NOTE = 'Relancer Léa sur la base de départ.';

const FORMATEUR = {
  id: '1',
  email: 'formateur@example.com',
  firstName: 'Tim',
  lastName: 'Moyence',
  phone: null,
  isActive: true,
  roles: ['teacher'],
  hasPassword: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  updatedOrCreatedBy: null,
};

const QUESTION = {
  id: 'b2-01-a3-vote-hausse-baisse',
  enonce: ENONCE_PROBLEME,
  options: [
    { id: 'a', libelle: 'Plus bas que le départ' },
    { id: 'b', libelle: 'Égal au départ' },
  ],
};

const ECRAN = {
  id: 'B2-01-A3-01-VOTE',
  type: 'fp-vote',
  titre: 'Hausse puis baisse',
  duree: 6,
  interactif: true,
  donnees: { question: QUESTION },
  notes: 'Laisser voter avant de commenter.',
  diffusion: 'seance',
  seuil: 0.7,
  corriges: [{ questionId: QUESTION.id, bonneReponse: 'a', confusions: [] }],
  questions: [{ id: QUESTION.id, enonce: ENONCE_PROBLEME, options: QUESTION.options }],
  corrigeEcran: null,
  guide: {
    aDire: 'Avant de commenter la pente, vérifiez le repère.',
    question: 'Quelle est l’unité de l’axe vertical ?',
    reponse: REPONSE_ATTENDUE,
    relance: 'Qui peut lire la légende à voix haute ?',
  },
};

const DEROULE = {
  id: SLUG,
  titre: 'Lire et contrôler l’information chiffrée',
  niveau: 'B2',
  duree: 210,
  concepts: ['proportions'],
  ecrans: [ECRAN, { ...ECRAN, id: 'B2-01-A3-02-REVELATION', titre: 'La compensation' }],
  remediations: {},
};

const STATISTIQUES = {
  moyenne: 13.5,
  mediane: 14,
  dispersion: 3.25,
  tauxParticipation: 0.92,
  tauxReussite: 0.64,
  questionsProblemes: [QUESTION.id],
};

const NOTATION = {
  noteMax: 20,
  base: 'participation-relative-cohorte',
  partCohorteReference: 0.1,
  ratioSeuilValidation: 0.5,
  neSaitPasCompteCommeReponse: true,
  pointsNonReponse: 0,
  reponsesLibresNotees: false,
  seuilQuestionProbleme: 0.5,
  decimalesStatistiques: 2,
  typesNotables: ['vote', 'numeric'],
  productionCompteSi: 'au-moins-une-saisie',
  statistiquesSurQuestionsNotees: true,
};

const RAPPORT = {
  courseSlug: SLUG,
  code: '4821',
  ouverteLe: '2026-09-20T08:00:00.000Z',
  fermeeLe: '2026-09-20T10:00:00.000Z',
  participants: [],
  conceptsFragiles: ['taux-evolution'],
  resultats: {
    participants: 24,
    questions: [
      {
        questionId: QUESTION.id,
        ecranId: ECRAN.id,
        type: 'vote',
        noteCompte: true,
        total: 24,
        correctes: 9,
        neSaitPas: 1,
        confusions: [],
        parOption: { a: 9, b: 15 },
        scoreMoyen: 0.375,
        parCle: null,
      },
    ],
  },
  statistiques: STATISTIQUES,
  notation: NOTATION,
};

const ETAT_DU_FLUX = {
  etat: 'en_cours',
  modeRythme: 'pilote',
  ecranCourant: 0,
  intervalleLibre: null,
  participants: 24,
};

type Corps = Record<string, unknown>;

interface SaisieAnnotation {
  readonly screenId: string;
  readonly note: string;
}

function annotationServie(saisie: SaisieAnnotation, rang: number): Record<string, unknown> {
  return {
    id: `annotation-${rang + 1}`,
    sessionId: SESSION,
    teacherId: FORMATEUR.id,
    screenId: saisie.screenId,
    note: saisie.note,
    updatedAt: `2026-09-20T09:0${rang + 1}:00.000Z`,
  };
}

interface Journal {
  readonly annotations: () => readonly SaisieAnnotation[];
  readonly bilansExportes: () => number;
}

async function installerLePupitre(page: Page): Promise<Journal> {
  const annotations: SaisieAnnotation[] = [];
  let bilansExportes = 0;
  let ecranPilote = 0;

  const pilotageApplique = async (route: Route, corps: Corps): Promise<void> => {
    if (typeof corps['ecran'] === 'number') {
      ecranPilote = corps['ecran'];
    }
    await servirSansContenu(route);
  };

  const annotationEnregistree = async (route: Route, saisie: SaisieAnnotation): Promise<void> => {
    annotations.push(saisie);
    await servirJson(route, annotationServie(saisie, annotations.length - 1), 201);
  };

  const ecritures = new Map<string, (route: Route, corps: Corps) => Promise<void>>([
    [
      `POST ${SESSION}/annotations`,
      (route, corps) => annotationEnregistree(route, corps as unknown as SaisieAnnotation),
    ],
    [`PATCH ${SESSION}/control`, pilotageApplique],
  ]);

  const lectures = new Map<string, () => unknown>([
    ['/auth/me', () => FORMATEUR],
    [`/sessions/${SESSION}/results`, () => RAPPORT],
    [`/sessions/${SESSION}/deroule`, () => DEROULE],
    [`/sessions/${SESSION}/free-responses`, () => ({ responses: [] })],
    [
      `/sessions/${SESSION}/annotations`,
      () => ({ annotations: annotations.map(annotationServie) }),
    ],
    [
      `/sessions/${SESSION}/participants`,
      () => ({
        participants: [{ id: PARTICIPANT, prenom: 'Léa', nom: 'Dubois' }],
      }),
    ],
  ]);

  await intercepterApi(page, async (route, chemin, methode) => {
    const ecriture = [...ecritures].find(
      ([cle]) => cle.startsWith(`${methode} `) && chemin.endsWith(cle.split(' ')[1] ?? ''),
    );
    const lecture = [...lectures].find(([cle]) => methode === 'GET' && chemin.endsWith(cle));

    if (methode === 'POST' && chemin.endsWith('/auth/refresh')) {
      await servirJson(route, {
        accessToken: 'jeton-formateur',
        expiresIn: 900,
        user: FORMATEUR,
      });
    } else if (ecriture !== undefined) {
      await ecriture[1](route, (route.request().postDataJSON() ?? {}) as Corps);
    } else if (chemin.endsWith(`/sessions/${SESSION}/report`)) {
      bilansExportes += 1;
      await servirJson(route, RAPPORT);
    } else if (chemin.includes(`/sessions/${SESSION}/`) && chemin.endsWith('stream')) {
      await servirFlux(route, { ...ETAT_DU_FLUX, ecranCourant: ecranPilote });
    } else if (lecture !== undefined) {
      await servirJson(route, lecture[1]());
    } else {
      await servirSansContenu(route);
    }
  });

  await page.goto('/');

  return {
    annotations: () => annotations,
    bilansExportes: () => bilansExportes,
  };
}

async function ouvrirLePupitre(page: Page): Promise<void> {
  await page.goto(`/cours/presenter/${SLUG}?seance=${SESSION}`);
  await expect(page.getByTestId('presentateur-guide')).toBeVisible();
}

test.describe('pupitre du formateur (QA-09, QA-10, QA-11)', () => {
  test('la réponse attendue n’entre dans le DOM du pupitre qu’après le clic de révélation', async ({
    page,
  }) => {
    await installerLePupitre(page);
    await ouvrirLePupitre(page);

    await expect(page.getByTestId('panneau-guide-rubrique')).not.toHaveCount(0);
    expect(await page.content()).not.toContain(REPONSE_ATTENDUE);
    await expect(page.getByTestId('panneau-guide-reveler')).toHaveAttribute(
      'aria-expanded',
      'false',
    );

    await page.getByTestId('panneau-guide-reveler').click();

    await expect(page.getByTestId('panneau-guide-reponse')).toHaveText(REPONSE_ATTENDUE);
    expect(await page.content()).toContain(REPONSE_ATTENDUE);

    await page.getByTestId('panneau-guide-reveler').click();

    await expect(page.getByTestId('panneau-guide-reponse')).toHaveCount(0);
    expect(await page.content()).not.toContain(REPONSE_ATTENDUE);
  });

  test('G05 · annote l’écran sans groupe de suivi, relit l’annotation et exporte le bilan', async ({
    page,
  }) => {
    const journal = await installerLePupitre(page);
    await ouvrirLePupitre(page);

    await page.getByTestId('activite-participants-afficher').click();
    const ligne = page.locator(`[data-participant="${PARTICIPANT}"]`);
    await expect(ligne).toContainText('Léa Dubois');
    await expect(page.locator('[data-testid^="groupe-"]')).toHaveCount(0);
    await expect(ligne.getByTestId('participant-groupe')).toHaveCount(0);

    await page.getByTestId('annotation-note').fill(NOTE);
    await expect(page.getByTestId('annotation-etat')).toHaveAttribute('data-etat', 'enregistre');

    await page.getByTestId('presentateur-suivant').click();
    await expect(page.getByTestId('annotation-note')).toHaveValue('');
    await page.getByTestId('presentateur-precedent').click();
    await expect(page.getByTestId('annotation-note')).toHaveValue(NOTE);

    const telechargement = page.waitForEvent('download');
    await page.getByTestId('panneau-exporter-bilan').click();
    const fichier = await telechargement;

    expect(fichier.suggestedFilename()).toBe(`bilan-seance-${SESSION}.json`);
    await expect(page.getByTestId('panneau-export-echec')).toHaveCount(0);
    expect(journal.annotations()).toEqual([{ screenId: ECRAN.id, note: NOTE }]);
    expect(journal.bilansExportes()).toBe(1);
  });

  test('affiche les statistiques du pupitre, les questions problématiques et la règle de notation', async ({
    page,
  }) => {
    await installerLePupitre(page);
    await ouvrirLePupitre(page);

    const statistiques = page.getByTestId('presentateur-statistiques');
    await expect(statistiques).toContainText('13.5');
    await expect(statistiques).toContainText('3.25');
    await expect(statistiques).toContainText(/92\s*%/);
    await expect(statistiques).toContainText(/64\s*%/);
    await expect(statistiques).toContainText(ENONCE_PROBLEME);

    const notationHelp = page.getByTestId('presentateur-notation-help');
    await notationHelp.hover();
    const notation = page.getByTestId('presentateur-notation-tooltip');
    await expect(notation).toContainText('20');
    await expect(notation).not.toContainText('undefined');
    await expect(notation).not.toContainText('NaN');
    await expect(page.getByTestId('presentateur-notation-echec')).toHaveCount(0);
    await expect(page.getByTestId('presentateur-participants-nombre')).toHaveText('24');
  });
});
