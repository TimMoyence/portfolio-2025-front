import type { z } from 'zod';
import { etatServi, finServie, resultatsServis } from '../../../cours/runtime/core/sync';
import { estObjet } from '../../../cours/runtime/core/valeurs';
import { INSTANTANES_DES_COURS_SERVIS } from '../../../testing/fixtures/instantanes-des-cours';
import { reponsesServiesPar } from '../../../testing/fixtures/reponses-servies';
import {
  lireLesReponsesServies,
  routesServiesSansSchema,
} from '../../../testing/reponses-servies-lues';
import { tolerancesDe, type ContratDuBack } from '../../../testing/tolerances-des-schemas';
import * as schemasDesFormations from './formations-schemas';
import {
  annotationServie,
  annotationsServies,
  catalogueServi,
  coursPublicServi,
  derouleServi,
  etatParticipantServi,
  feuilleEvalueeServie,
  livretServi,
  machineEvalueeServie,
  participantsServis,
  rappelsServis,
  rapportServi,
  rattachementServi,
  reponseLibreEnregistreeServie,
  reponsesLibresServies,
  seanceOuverteServie,
  strategiesServies,
  sujetServi,
  syntheseServie,
  tableauEvalueServi,
  verdictProductionServi,
  verdictReponseServi,
  verdictTentativeServi,
} from './formations-schemas';

const PREFIXE_DES_FORMATIONS = '/api/v1/portfolio25/formations/';

const route = (methode: 'GET' | 'POST', chemin: string): string =>
  `${methode} ${PREFIXE_DES_FORMATIONS}${chemin}`;

const desFormations = (servie: string): boolean =>
  servie.split(' ')[1].startsWith(PREFIXE_DES_FORMATIONS);

const DEROULE = route('GET', 'sessions/:id/deroule');

const ROUTES_LUES: readonly (readonly [string, z.ZodType])[] = [
  [route('GET', 'catalogue/:slug'), catalogueServi],
  [route('GET', 'livrets/:slug'), livretServi],
  [route('POST', 'sessions'), seanceOuverteServie],
  [route('POST', 'sessions/:code/join'), rattachementServi],
  [DEROULE, derouleServi],
  [route('GET', 'sessions/:id/sujet'), sujetServi],
  [route('GET', 'sessions/:id/results'), rapportServi],
  [route('GET', 'sessions/:id/report'), rapportServi],
  [route('GET', 'sessions/:id/annotations'), annotationsServies],
  [route('POST', 'sessions/:id/annotations'), annotationServie],
  [route('GET', 'sessions/:id/free-responses'), reponsesLibresServies],
  [route('POST', 'sessions/:id/free-responses'), reponseLibreEnregistreeServie],
  [route('GET', 'sessions/:id/participants'), participantsServis],
  [route('POST', 'sessions/:id/answers'), verdictReponseServi],
  [route('POST', 'sessions/:id/productions'), verdictProductionServi],
  [route('POST', 'sessions/:id/escape/:parcoursId/tentatives'), verdictTentativeServi],
  [route('POST', 'sessions/:id/machines/:ecranId/evaluation'), machineEvalueeServie],
  [route('POST', 'sessions/:id/tableaux/:planId/evaluation'), tableauEvalueServi],
  [route('POST', 'sessions/:id/feuilles/:planId/evaluation'), feuilleEvalueeServie],
  [route('GET', 'sessions/:id/rappels'), rappelsServis],
  [route('GET', 'sessions/:id/rappels/synthese'), syntheseServie],
  [route('POST', 'sessions/:id/defis/:defiId/tentative'), strategiesServies],
  [route('GET', 'sessions/:id/defis/:defiId/strategies'), strategiesServies],
  [route('GET', 'sessions/:id/moi'), etatParticipantServi],
  [route('GET', 'sessions/:id/stream etat'), etatServi],
  [route('GET', 'sessions/:id/stream fin'), finServie],
  [route('GET', 'sessions/:id/presenter-stream etat'), etatServi],
  [route('GET', 'sessions/:id/presenter-stream resultats'), resultatsServis],
  [route('GET', 'sessions/:id/presenter-stream fin'), finServie],
];

const SERVIES_SANS_LECTEUR: Readonly<Record<string, string>> = {};

const PARTIES_DES_INSTANTANES: Readonly<Partial<Record<string, string>>> = {
  [DEROULE]: 'deroule',
  [route('GET', 'sessions/:id/sujet')]: 'sujet',
};

const SCHEMAS_LUS_HORS_ROUTE: readonly z.ZodType[] = [coursPublicServi];

const PRESENTATION = '.donnees.recit.presentation';

const OPTIONNELLES_AU_CONTRAT_DU_BACK: Readonly<Partial<Record<string, readonly string[]>>> = {
  '': ['explications'],
  '.correction': ['explications'],
  '.cadrageDuRenvoi': ['extrait'],
  '.cadrageDuRenvoi.extrait': ['lignes', 'champs'],
  '.donnees': ['consigne'],
  '.donnees.cas': ['questionsLibres'],
  '.donnees.cas.questionsLibres[]': ['placeholder'],
  '.donnees.definition': [
    'titre',
    'source',
    'bornesOrdonnee',
    'description',
    'descriptionPapier',
    'forme',
    'unite',
    'etiquettes',
    'prereglages',
    'reference',
  ],
  '.donnees.definition.bornesOrdonnee': ['max', 'minParametre'],
  '.donnees.definition.series[]': ['calcul'],
  '.donnees.recit': ['presentation'],
  '.donnees.recit.video': ['srcPoste', 'poster', 'sousTitres', 'preload'],
  [`${PRESENTATION}<renderer=chart>.props`]: ['caption', 'unit', 'source', 'description'],
  [`${PRESENTATION}<renderer=chart>.props.series[]`]: ['tone'],
  [`${PRESENTATION}<renderer=comparison>.props`]: ['subtitle', 'note'],
  [`${PRESENTATION}<renderer=comparison>.props.columns[]`]: ['tone'],
  [`${PRESENTATION}<renderer=guide>.props`]: ['subtitle', 'context', 'takeaway', 'nextAction'],
  [`${PRESENTATION}<renderer=guide>.props.items[]`]: ['detail'],
  [`${PRESENTATION}<renderer=hero>.props`]: ['subtitle'],
  [`${PRESENTATION}<renderer=image-left>.props`]: ['subtitle', 'items', 'sourceLink'],
  [`${PRESENTATION}<renderer=image-right>.props`]: ['sourceLink'],
  [`${PRESENTATION}<renderer=lesson>.props`]: ['subtitle'],
  [`${PRESENTATION}<renderer=reflection>.props.promptData`]: ['placeholder', 'competency'],
  [`${PRESENTATION}<renderer=scatter>.props`]: ['subtitle', 'reading', 'source'],
  [`${PRESENTATION}<renderer=scatter>.props.points[]`]: ['label'],
  [`${PRESENTATION}<renderer=sort-review>.props`]: ['subtitle'],
  [`${PRESENTATION}<renderer=stats>.props`]: ['subtitle'],
  [`${PRESENTATION}<renderer=table>.props`]: ['subtitle', 'note'],
};

const TOLEREES_ABSENTES_JUSQU_AU_RETRAIT_DU_BACK: Readonly<
  Partial<Record<string, readonly string[]>>
> = {
  $: ['remediations'],
  '$.corrige': ['remediations'],
};

const OPTIONNELLES_OU_TOLEREES = Object.fromEntries(
  [
    ...new Set([
      ...Object.keys(OPTIONNELLES_AU_CONTRAT_DU_BACK),
      ...Object.keys(TOLEREES_ABSENTES_JUSQU_AU_RETRAIT_DU_BACK),
    ]),
  ].map((chemin) => [
    chemin,
    [
      ...(OPTIONNELLES_AU_CONTRAT_DU_BACK[chemin] ?? []),
      ...(TOLEREES_ABSENTES_JUSQU_AU_RETRAIT_DU_BACK[chemin] ?? []),
    ],
  ]),
);

const TOLEREE_ABSENTE = /^(.*)\.([^.]+) toujours servie, mais tolérée absente$/;

const VARIANTE_DE_TYPE = /<type=[^>]*>/g;

function dansLEcran(chemin: string): string {
  return chemin.replace(VARIANTE_DE_TYPE, '').split('ecrans[]').at(-1) ?? chemin;
}

function documentsDe(lue: string): readonly unknown[] {
  const partie = PARTIES_DES_INSTANTANES[lue];
  const desInstantanes =
    partie === undefined
      ? []
      : INSTANTANES_DES_COURS_SERVIS.map(([, , fil]) => (estObjet(fil) ? fil[partie] : undefined));
  return [...reponsesServiesPar(lue), ...desInstantanes];
}

describe('Réponses réellement servies par le back, lues par les schémas du front (L2b-REPONSES-SERVIES)', () => {
  lireLesReponsesServies({
    nom: 'des formations',
    routes: ROUTES_LUES,
    schemas: schemasDesFormations,
    horsRoute: SCHEMAS_LUS_HORS_ROUTE,
    documentsDe,
    optionnelles: OPTIONNELLES_OU_TOLEREES,
    normaliser: dansLEcran,
  });

  it('lit chaque route du back : seules les remédiations du déroulé, que le back cessera de servir, y restent tolérées absentes', () => {
    const contratDuBack: ContratDuBack = {
      optionnelle: (chemin, cle) =>
        OPTIONNELLES_AU_CONTRAT_DU_BACK[dansLEcran(chemin)]?.includes(cle) ?? false,
    };
    const tolerees = ROUTES_LUES.flatMap(([lue, schema]) =>
      tolerancesDe(schema, documentsDe(lue), contratDuBack),
    ).map((faute) => {
      const [, chemin, cle] = TOLEREE_ABSENTE.exec(faute) ?? [faute, faute, ''];
      return `${dansLEcran(chemin)} ${cle}`;
    });
    const attendues = Object.entries(TOLEREES_ABSENTES_JUSQU_AU_RETRAIT_DU_BACK).flatMap(
      ([chemin, cles]) => (cles ?? []).map((cle) => `${chemin} ${cle}`),
    );

    expect([...new Set(tolerees)]).toEqual(jasmine.arrayWithExactContents(attendues));
  });

  it('lit chaque route servie des formations par un schéma du front, ou dit pourquoi aucun lecteur ne la lit', () => {
    expect(routesServiesSansSchema(ROUTES_LUES, desFormations, SERVIES_SANS_LECTEUR)).toEqual({
      nonLues: [],
      declareesNonServies: [],
    });
  });
});
