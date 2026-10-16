import type { z } from 'zod';
import { reponsesServiesPar } from '../../../testing/fixtures/reponses-servies';
import {
  lireLesReponsesServies,
  routesServiesSansSchema,
} from '../../../testing/reponses-servies-lues';
import { cheminsServis } from '../../../testing/tolerances-des-schemas';
import * as schemasDuSite from './site-schemas';
import {
  accuseServi,
  articleServi,
  auditCreeServi,
  auditEchoueServi,
  auditExpireServi,
  auditTermineServi,
  battementServi,
  guideDemandeServi,
  guideServi,
  interactionsServies,
  messageServi,
  pageDArticlesServie,
  progressionDAuditServie,
  resumeDAuditServi,
  sessionServie,
  utilisateurServi,
} from './site-schemas';

const MODULES_LUS = [
  '/articles',
  '/audits',
  '/auth',
  '/contacts',
  '/cookie-consents',
  '/lead-magnets',
  '/presentations',
] as const;

const PREFIXES_DE_L_API = /^\/api(\/v1\/portfolio25)?/;

const ROUTES_LUES: readonly (readonly [string, z.ZodType])[] = [
  ['GET /api/articles', pageDArticlesServie],
  ['GET /api/v1/portfolio25/articles', pageDArticlesServie],
  ['GET /api/articles/:slug', articleServi],
  ['POST /api/audits', auditCreeServi],
  ['GET /api/audits/:id/summary', resumeDAuditServi],
  ['GET /api/audits/:id/stream progress', progressionDAuditServie],
  ['GET /api/audits/:id/stream completed', auditTermineServi],
  ['GET /api/audits/:id/stream failed', auditEchoueServi],
  ['GET /api/audits/:id/stream timeout', auditExpireServi],
  ['GET /api/audits/:id/stream heartbeat', battementServi],
  ['POST /api/auth/login', sessionServie],
  ['POST /api/auth/google', sessionServie],
  ['POST /api/auth/refresh', sessionServie],
  ['POST /api/auth/register', messageServi],
  ['POST /api/auth/forgot-password', messageServi],
  ['POST /api/auth/reset-password', messageServi],
  ['POST /api/auth/logout', messageServi],
  ['GET /api/auth/verify-email', messageServi],
  ['POST /api/auth/resend-verification', messageServi],
  ['GET /api/auth/me', utilisateurServi],
  ['POST /api/auth/set-password', utilisateurServi],
  ['PATCH /api/auth/change-password', utilisateurServi],
  ['PATCH /api/auth/profile', utilisateurServi],
  ['POST /api/contacts', accuseServi],
  ['POST /api/cookie-consents', accuseServi],
  ['POST /api/lead-magnets/formations-toolkit', guideDemandeServi],
  ['GET /api/lead-magnets/toolkit/:token', guideServi],
  ['GET /api/presentations/:slug/interactions', interactionsServies],
];

const SERVIES_SANS_LECTEUR: Readonly<Record<string, string>> = {
  'GET /api/v1/portfolio25/articles/admin/articles': '@Roles(admin), aucun client dans le front',
  'POST /api/v1/portfolio25/articles/admin/:articleId/broadcast/approve':
    '@Roles(admin), aucun client dans le front',
  'POST /api/v1/portfolio25/articles/admin/:articleId/broadcast/cancel':
    '@Roles(admin), aucun client dans le front',
  'POST /api/v1/portfolio25/articles/admin/:articleId/restore':
    '@Roles(admin), aucun client dans le front',
  'POST /api/v1/portfolio25/articles/admin/:articleId/withdraw':
    '@Roles(admin), aucun client dans le front',
};

const PERSONNALISATION_DU_GUIDE = {
  $: ['generatedPrompt'],
  '$.recap': ['aiLevel', 'budgetTier', 'sector'],
  '$.cheatsheet[]': ['alreadyUsed'],
} as const;

const OPTIONNELLES_AU_CONTRAT_DU_BACK: Readonly<Partial<Record<string, readonly string[]>>> =
  PERSONNALISATION_DU_GUIDE;

function sansLaPersonnalisation(page: unknown): unknown {
  const copie = structuredClone(page) as {
    recap: Record<string, unknown>;
    cheatsheet: Record<string, unknown>[];
  } & Record<string, unknown>;
  const objetsDe = {
    $: [copie],
    '$.recap': [copie.recap],
    '$.cheatsheet[]': copie.cheatsheet,
  };
  for (const [chemin, cles] of Object.entries(PERSONNALISATION_DU_GUIDE)) {
    for (const objet of objetsDe[chemin as keyof typeof objetsDe]) {
      for (const cle of cles) {
        delete objet[cle];
      }
    }
  }
  return copie;
}

const OUVERT_AU_CONTRAT_DU_BACK = '$.keyChecks';

function ouvertAuContrat(chemin: string): boolean {
  return chemin === OUVERT_AU_CONTRAT_DU_BACK || chemin.startsWith(`${OUVERT_AU_CONTRAT_DU_BACK}.`);
}

function duModuleLu(servie: string): boolean {
  const chemin = servie.split(' ')[1].replace(PREFIXES_DE_L_API, '');
  return MODULES_LUS.some((module) => chemin === module || chemin.startsWith(`${module}/`));
}

describe('Réponses réellement servies par le back hors des formations, lues par les schémas du site (L2b-SCHEMAS-HORS-COURS)', () => {
  lireLesReponsesServies({
    nom: 'du site',
    routes: ROUTES_LUES,
    schemas: schemasDuSite,
    documentsDe: reponsesServiesPar,
    optionnelles: OPTIONNELLES_AU_CONTRAT_DU_BACK,
    ouvert: ouvertAuContrat,
  });

  it('lit chaque route servie des modules lus, ou dit pourquoi aucun lecteur ne la lit', () => {
    expect(routesServiesSansSchema(ROUTES_LUES, duModuleLu, SERVIES_SANS_LECTEUR)).toEqual({
      nonLues: [],
      declareesNonServies: [],
    });
  });

  it('lit la page du guide que le back sert sans personnalisation, avant qu il cesse de la servir (LEG-06)', () => {
    const pages = reponsesServiesPar('GET /api/lead-magnets/toolkit/:token').map(
      sansLaPersonnalisation,
    );

    const lecteur: z.ZodType = guideServi;

    expect(pages.length).toBeGreaterThan(0);
    for (const page of pages) {
      const lue = lecteur.safeParse(page);

      expect(lue.success ? [] : lue.error.issues).toEqual([]);
      expect(lue.data).toEqual(page);
    }
  });

  it('ne déclare ouvert au contrat qu’un chemin réellement servi', () => {
    const servis = ROUTES_LUES.flatMap(([lue, schema]) => [
      ...cheminsServis(schema, reponsesServiesPar(lue)).servis.keys(),
    ]);

    expect(servis).toContain(OUVERT_AU_CONTRAT_DU_BACK);
  });
});
