import { provideHttpClient, withInterceptors } from '@angular/common/http';
import type { HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { Observable } from 'rxjs';
import { firstValueFrom, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  buildAnnotationFormateur,
  buildEtatParticipant,
  buildFichierTelecharge,
  buildParticipantDeSeance,
  buildRapportSeance,
  buildRegleNotation,
  buildReponseLibreFormateur,
  buildSpacedQuestionPublique,
  buildStatistiquesSeance,
  buildStrategiePublique,
  buildSyntheseConcept,
  buildVerdictProduction,
  buildVerdictTentative,
} from '../../../testing/factories/formations.factory';
import {
  buildFeuilleEvaluee,
  buildSortiesMachine,
  buildTableauEvalue,
} from '../../../testing/factories/cours.factory';
import type { ProblemeHttp } from '../../../testing/factories/probleme-http.factory';
import { buildProblemeHttp } from '../../../testing/factories/probleme-http.factory';
import { bancAdaptateurHttp } from '../../../testing/http-attendu';
import filB201 from '../../../testing/fixtures/b2-01.instantane.json';
import { INSTANTANE_B2_01 } from '../../../testing/fixtures/instantane-b2-01';
import { setupTestBed } from '../../../testing/setup-test-bed';
import type { CoursContent, EcranContent } from '../../../cours/content/types';
import type {
  AnnotationFormateur,
  FichierTelecharge,
  InscriptionParticipant,
  MotifRefusRattachement,
  MotifRefusReponse,
  MotifRefusReponseLibre,
  ParticipantDeSeance,
  RapportSeance,
  Rattachement,
  ReponseLibreFormateur,
  SeanceOuverte,
  VerdictReponse,
} from '../ports/formations.port';
import {
  FORMATIONS_PORT,
  limiteDuRefus,
  PieceJointeRefusee,
  RattachementRefuse,
  ReponseLibreRefusee,
  ReponseRefusee,
  SujetRefuse,
} from '../ports/formations.port';
import { FormationsHttpAdapter } from './formations-http.adapter';

const SESSION_ID = '4d0f2a9e-0d7f-4d2f-9a3c-1f6b2a7c8d90';
const CODE = 'AB12CD';
const JETON = 'jeton-participant';
const ENTETE_JETON = 'x-participant-token';
const RACINE = `${environment.apiBaseUrl}/formations/sessions`;
const URL_SEANCE = `${RACINE}/${SESSION_ID}`;

const INSCRIPTION: InscriptionParticipant = {
  prenom: 'Theo',
  nom: 'Martin',
  email: 'theo.martin@example.com',
};

const REPONSE_LIBRE = {
  screenId: 'screen-1',
  activityId: 'reflect-1',
  response: 'raisonnement',
  dureeMs: 3200,
};

const LIMITE_ATTEINTE = {
  status: 429,
  statusText: 'Too Many Requests',
  headers: { 'Retry-After': '120' },
};

const ATTENTE_COMMUNE = 'Trop de tentatives en peu de temps : réessayez dans 2 min.';

function attendreLAttenteCommune(
  refus: {
    readonly motif: string;
    readonly statut: number;
    readonly message: string;
    readonly limite?: unknown;
  },
  motif: string,
  contexte = motif,
): void {
  expect([refus.motif, refus.statut, refus.message, refus.limite, limiteDuRefus(refus)])
    .withContext(contexte)
    .toEqual([motif, LIMITE_ATTEINTE.status, ATTENTE_COMMUNE, { minutes: 2 }, { minutes: 2 }]);
}

const RATTACHEMENT: Rattachement = {
  participantId: '8f1c3b2a-5d4e-4f6a-9b8c-7d6e5f4a3b2c',
  sessionId: SESSION_ID,
  ecranCourant: 0,
  modeRythme: 'pilote',
  jeton: JETON,
  secretDeReprise: 'secret-de-reprise-du-poste',
};

describe('FormationsHttpAdapter', () => {
  const banc = bancAdaptateurHttp(FormationsHttpAdapter, {
    providers: [
      FormationsHttpAdapter,
      { provide: FORMATIONS_PORT, useExisting: FormationsHttpAdapter },
    ],
  });
  let adapter: FormationsHttpAdapter;
  let httpMock: HttpTestingController;

  const attendre = (url: string, methode: string): TestRequest => {
    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe(methode);
    return req;
  };

  const lus = <T>(appel: Observable<T>, url: string, corps: object): T[] => {
    const recus: T[] = [];
    appel.subscribe((valeur) => recus.push(valeur));
    attendre(url, 'GET').flush(corps);
    return recus;
  };

  const erreursApres = (
    appel: Observable<unknown>,
    url: string,
    repondre: (requete: TestRequest) => void,
  ): unknown[] => {
    const erreurs: unknown[] = [];
    appel.subscribe({ error: (recue: unknown) => erreurs.push(recue) });
    repondre(httpMock.expectOne(url));
    return erreurs;
  };

  const corpsEnvoye = (appel: Observable<unknown>, url: string, methode: string): unknown => {
    appel.subscribe();
    const req = attendre(url, methode);
    req.flush(null);
    return req.request.body;
  };

  const attendreLeRefus = (
    refus: { readonly motif: string; readonly statut: number; readonly message: string },
    motif: string,
    statut: number,
  ): void => {
    expect(refus.motif).toBe(motif);
    expect(refus.statut).toBe(statut);
    expect(refus.message).not.toBe('');
  };

  const rejoindreAvec = (reponse: object): { recus: Rattachement[]; requete: TestRequest } => {
    const recus: Rattachement[] = [];
    adapter.rejoindre(CODE, INSCRIPTION).subscribe((valeur) => recus.push(valeur));
    const requete = attendre(`${RACINE}/${CODE}/join`, 'POST');
    requete.flush(reponse);
    return { recus, requete };
  };

  beforeEach(() => ({ adapter, httpMock } = banc));

  it('expose l adaptateur derriere le jeton FORMATIONS_PORT', () => {
    expect(TestBed.inject(FORMATIONS_PORT)).toBe(adapter);
  });

  it('ouvrirSeance POSTe le slug du cours sur sessions et rend sessionId et code', () => {
    const ouverte = { sessionId: SESSION_ID, code: CODE };
    const recus: SeanceOuverte[] = [];

    adapter
      .ouvrirSeance('b2-01-traitement-information-chiffree')
      .subscribe((valeur) => recus.push(valeur));

    const req = attendre(RACINE, 'POST');
    expect(req.request.body).toEqual({
      courseSlug: 'b2-01-traitement-information-chiffree',
    });
    req.flush(ouverte);

    expect(recus).toEqual([ouverte]);
  });

  it('lireDeroule GETe le deroule du presentateur sur deroule', () => {
    expect(lus(adapter.lireDeroule(SESSION_ID), `${URL_SEANCE}/deroule`, filB201.deroule)).toEqual([
      INSTANTANE_B2_01.deroule,
    ]);
  });

  it('lireSujet GETe le sujet de l etudiant avec l en-tete de participant', () => {
    const recus: CoursContent[] = [];

    adapter.lireSujet(SESSION_ID, JETON).subscribe((valeur) => recus.push(valeur));

    const req = attendre(`${URL_SEANCE}/sujet`, 'GET');
    expect(req.request.headers.get(ENTETE_JETON)).toBe(JETON);
    req.flush(filB201.sujet);

    expect(recus).toEqual([INSTANTANE_B2_01.sujet]);
  });

  describe('pièce jointe réservée à la séance', () => {
    const ECRAN_ID = 'B3-01-A2-01-VOTE-FAMILLE';
    const FICHIER = buildFichierTelecharge();
    const NOM_SERVI = { 'Content-Disposition': `attachment; filename="${FICHIER.nom}"` };

    const telecharge = (appel: Observable<FichierTelecharge>, url: string) => {
      const recus: FichierTelecharge[] = [];
      appel.subscribe((fichier) => recus.push(fichier));
      const req = attendre(url, 'GET');
      const { headers, responseType } = req.request;
      req.flush(FICHIER.contenu, { headers: NOM_SERVI });
      return { recus, jeton: headers.get(ENTETE_JETON), reponse: responseType };
    };

    it('encode l identifiant d écran dans le chemin de la pièce jointe', () => {
      expect(
        telecharge(
          adapter.telechargerPieceJointe(SESSION_ID, JETON, 'A2/../01 ?x'),
          `${URL_SEANCE}/pieces-jointes/A2%2F..%2F01%20%3Fx`,
        ).recus,
      ).toEqual([FICHIER]);
    });

    it('telechargerPieceJointe GETe le classeur de l écran avec l en-tete de participant', () => {
      expect(
        telecharge(
          adapter.telechargerPieceJointe(SESSION_ID, JETON, ECRAN_ID),
          `${URL_SEANCE}/pieces-jointes/${ECRAN_ID}`,
        ),
      ).toEqual({ recus: [FICHIER], jeton: JETON, reponse: 'blob' });
    });

    it('telechargerPieceJointeDuDeroule GETe le classeur depuis le deroule, sans jeton de participant', () => {
      expect(
        telecharge(
          adapter.telechargerPieceJointeDuDeroule(SESSION_ID, ECRAN_ID),
          `${URL_SEANCE}/deroule/pieces-jointes/${ECRAN_ID}`,
        ),
      ).toEqual({ recus: [FICHIER], jeton: null, reponse: 'blob' });
    });

    it('telechargerRapportCsv GETe le csv de la séance tel que le serveur le produit', () => {
      expect(
        telecharge(adapter.telechargerRapportCsv(SESSION_ID), `${URL_SEANCE}/report.csv`),
      ).toEqual({ recus: [FICHIER], jeton: null, reponse: 'blob' });
    });

    it('échoue sur un classeur servi sans nom de fichier, plutôt que d en inventer un', () => {
      const erreurs: unknown[] = [];

      adapter
        .telechargerPieceJointe(SESSION_ID, JETON, ECRAN_ID)
        .subscribe({ error: (erreur: unknown) => erreurs.push(erreur) });
      attendre(`${URL_SEANCE}/pieces-jointes/${ECRAN_ID}`, 'GET').flush(FICHIER.contenu);

      expect(erreurs).toEqual([jasmine.any(Error)]);
    });

    const refusAuPoste = (
      repondre: (requete: TestRequest) => void,
    ): Promise<PieceJointeRefusee> => {
      const refus = new Promise<PieceJointeRefusee>((rendre, echouer) => {
        adapter.telechargerPieceJointe(SESSION_ID, JETON, ECRAN_ID).subscribe({
          error: (erreur: unknown) =>
            erreur instanceof PieceJointeRefusee ? rendre(erreur) : echouer(erreur),
        });
      });
      repondre(attendre(`${URL_SEANCE}/pieces-jointes/${ECRAN_ID}`, 'GET'));
      return refus;
    };

    const probleme = (corps: ProblemeHttp) => (requete: TestRequest) => {
      requete.flush(new Blob([JSON.stringify(corps)], { type: 'application/problem+json' }), {
        status: corps.status,
        statusText: corps.title,
      });
    };

    for (const { cas, repondre, motif, statut } of [
      {
        cas: 'la reprise retenue tant que ses activités ne sont pas corrigées',
        repondre: probleme(buildProblemeHttp({ code: 'PIECE_JOINTE_RETENUE' })),
        motif: 'retenue',
        statut: 409,
      },
      {
        cas: 'un écran pas encore servi comme une pièce indisponible',
        repondre: probleme(buildProblemeHttp({ status: 404, code: 'ECRAN_NON_SERVI' })),
        motif: 'indisponible',
        statut: 404,
      },
      {
        cas: 'un refus au corps JSON illisible comme une pièce indisponible, statut compris',
        repondre: (requete: TestRequest) =>
          requete.flush(new Blob([''], { type: 'application/json' }), {
            status: 502,
            statusText: 'Bad Gateway',
          }),
        motif: 'indisponible',
        statut: 502,
      },
      {
        cas: 'une coupure du réseau comme une pièce indisponible',
        repondre: (requete: TestRequest) => requete.error(new ProgressEvent('error')),
        motif: 'indisponible',
        statut: 0,
      },
    ]) {
      it(`signale au poste ${cas}`, async () => {
        attendreLeRefus(await refusAuPoste(repondre), motif, statut);
      });
    }

    it('signale au poste un 429 par l attente commune lue dans Retry-After', async () => {
      const refus = await refusAuPoste((requete) =>
        requete.flush(new Blob([''], { type: 'application/json' }), LIMITE_ATTEINTE),
      );

      attendreLAttenteCommune(refus, 'indisponible');
    });
  });

  function sujetDontLePremierEcranPorte(fil: (premier: EcranContent) => Record<string, unknown>) {
    const [premierServi, ...resteServi] = filB201.sujet.ecrans;
    const [premier, ...reste] = INSTANTANE_B2_01.sujet.ecrans;
    const recus = lus(adapter.lireSujet(SESSION_ID, JETON), `${URL_SEANCE}/sujet`, {
      ...filB201.sujet,
      ecrans: [{ ...premierServi, ...fil(premier) }, ...resteServi],
    });
    return { premier, reste, recus };
  }

  it('lireSujet traduit l ecran source et la revelation servis par le fil', () => {
    const { premier, reste, recus } = sujetDontLePremierEcranPorte(({ id }) => ({
      ecranCorrige: 'ecran-source',
      correction: {
        ecranId: id,
        questions: [{ questionId: 'Q-CAP-03', bonneReponse: '1 480,24 €', optionId: 'b' }],
        corrige: null,
        reflexion: null,
      },
    }));

    expect(recus[0].ecrans[0]).toEqual({
      ...premier,
      ecranSource: 'ecran-source',
      revelation: {
        ecranId: premier.id,
        questions: [{ questionId: 'Q-CAP-03', cible: '1 480,24 €', optionId: 'b' }],
        annexe: null,
        reflexion: null,
      },
    });
    expect(Object.keys(recus[0].ecrans[0])).not.toContain('correction');
    expect(recus[0].ecrans.slice(1)).toEqual(reste);
  });

  it('S-02 · lireSujet garde dans la revelation les explications corrigees sur place', () => {
    const explications = [{ reference: 'Q-CAP-03', texte: 'Réinvestir les intérêts.' }];

    const { recus } = sujetDontLePremierEcranPorte(({ id }) => ({
      correction: { ecranId: id, questions: [], corrige: null, reflexion: null, explications },
    }));

    expect(recus[0].ecrans[0].revelation?.explications).toEqual(explications);
  });

  it('lireDeroule traduit l ecran source servi par le fil', () => {
    const [premierServi, ...resteServi] = filB201.deroule.ecrans;
    const [premier] = INSTANTANE_B2_01.deroule.ecrans;

    const recus = lus(adapter.lireDeroule(SESSION_ID), `${URL_SEANCE}/deroule`, {
      ...filB201.deroule,
      ecrans: [{ ...premierServi, ecranCorrige: 'ecran-source' }, ...resteServi],
    });

    expect(recus[0].ecrans[0]).toEqual({ ...premier, ecranSource: 'ecran-source' });
  });

  it('lireLivret GETe le livret du cours et traduit le sujet et le corrige servis par le fil', () => {
    const [premierServi, ...resteServi] = filB201.deroule.ecrans;
    const [premier, ...reste] = INSTANTANE_B2_01.deroule.ecrans;

    const recus = lus(
      adapter.lireLivret('b2-01-traitement-information-chiffree'),
      `${environment.apiBaseUrl}/formations/livrets/b2-01-traitement-information-chiffree`,
      {
        version: 3,
        sujet: filB201.sujet,
        corrige: {
          ...filB201.deroule,
          ecrans: [{ ...premierServi, ecranCorrige: 'ecran-source' }, ...resteServi],
        },
      },
    );

    expect(recus).toEqual([
      {
        version: 3,
        sujet: INSTANTANE_B2_01.sujet,
        corrige: {
          ...INSTANTANE_B2_01.deroule,
          ecrans: [{ ...premier, ecranSource: 'ecran-source' }, ...reste],
        },
      },
    ]);
  });

  it('lireLivret encode le slug dans l adresse', () => {
    const recus = lus(
      adapter.lireLivret('a/b'),
      `${environment.apiBaseUrl}/formations/livrets/a%2Fb`,
      { version: 1, sujet: filB201.sujet, corrige: filB201.deroule },
    );

    expect(recus.length).toBe(1);
  });

  const refusDeSujet = [
    { statut: 409, statusText: 'Conflict', motif: 'cours-modifie' },
    { statut: 500, statusText: 'Server Error', motif: 'sujet-indisponible' },
  ] as const;

  for (const { statut, statusText, motif } of refusDeSujet) {
    it(`lireSujet transforme un ${statut} en refus motive ${motif}`, () => {
      const erreurs = erreursApres(
        adapter.lireSujet(SESSION_ID, JETON),
        `${URL_SEANCE}/sujet`,
        (req) => req.flush('', { status: statut, statusText }),
      );

      expect(erreurs.length).toBe(1);
      expect(erreurs[0]).toBeInstanceOf(SujetRefuse);
      const refus = erreurs[0] as SujetRefuse;
      expect([refus.motif, refus.statut]).toEqual([motif, statut]);
      expect(refus.message).not.toBe('');
    });
  }

  it('lireSujet dit un 429 par l attente commune lue dans Retry-After', () => {
    const erreurs = erreursApres(
      adapter.lireSujet(SESSION_ID, JETON),
      `${URL_SEANCE}/sujet`,
      (req) => req.flush('', LIMITE_ATTEINTE),
    );

    attendreLAttenteCommune(erreurs[0] as SujetRefuse, 'sujet-indisponible');
  });

  it('demarrer POSTe sur start', () => {
    expect(corpsEnvoye(adapter.demarrer(SESSION_ID), `${URL_SEANCE}/start`, 'POST')).toEqual({});
  });

  it('piloter PATCHe la commande sur control', () => {
    const commande = { ecran: 4, mode: 'libre' as const, intervalle: { premier: 3, dernier: 9 } };

    expect(
      corpsEnvoye(adapter.piloter(SESSION_ID, commande), `${URL_SEANCE}/control`, 'PATCH'),
    ).toEqual(commande);
  });

  it('cloturer POSTe sur close', () => {
    expect(corpsEnvoye(adapter.cloturer(SESSION_ID), `${URL_SEANCE}/close`, 'POST')).toEqual({});
  });

  it('lireResultats GETe le rapport, y compris les resultats agreges, sur results', () => {
    const rapport = buildRapportSeance();

    expect(lus(adapter.lireResultats(SESSION_ID), `${URL_SEANCE}/results`, rapport)).toEqual([
      rapport,
    ]);
  });

  it('exporterBilan GETe le rapport telechargeable sur report', () => {
    const rapport = buildRapportSeance();

    expect(lus(adapter.exporterBilan(SESSION_ID), `${URL_SEANCE}/report`, rapport)).toEqual([
      rapport,
    ]);
  });

  it('lireResultats transmet la regle de notation et les statistiques servies par le serveur', () => {
    const rapport = buildRapportSeance({
      notation: buildRegleNotation(),
      statistiques: buildStatistiquesSeance(),
    });

    const recus = lus(adapter.lireResultats(SESSION_ID), `${URL_SEANCE}/results`, rapport);

    expect(recus[0].notation).toEqual(buildRegleNotation());
    expect(recus[0].statistiques).toEqual(buildStatistiquesSeance());
  });

  it('lireAnnotations GETe les annotations du formateur sur annotations', () => {
    const annotation = buildAnnotationFormateur({ sessionId: SESSION_ID });
    const recues: AnnotationFormateur[] = [];

    adapter.lireAnnotations(SESSION_ID).subscribe(({ annotations }) => recues.push(...annotations));
    attendre(`${URL_SEANCE}/annotations`, 'GET').flush({ annotations: [annotation] });

    expect(recues).toEqual([annotation]);
  });

  it('lireReponsesLibres GETe les reponses libres de la seance sur free-responses', () => {
    const reponse = buildReponseLibreFormateur({ sessionId: SESSION_ID });
    const recues: ReponseLibreFormateur[] = [];

    adapter.lireReponsesLibres(SESSION_ID).subscribe(({ responses }) => recues.push(...responses));
    attendre(`${URL_SEANCE}/free-responses`, 'GET').flush({ responses: [reponse] });

    expect(recues).toEqual([reponse]);
  });

  it('lireParticipants GETe les participants de la seance', () => {
    const participants = [
      buildParticipantDeSeance(),
      buildParticipantDeSeance({ id: 'participant-2', prenom: 'Nora' }),
    ];
    const recus: ParticipantDeSeance[] = [];

    adapter.lireParticipants(SESSION_ID).subscribe((valeur) => recus.push(...valeur.participants));
    attendre(`${URL_SEANCE}/participants`, 'GET').flush({ participants });

    expect(recus).toEqual(participants);
  });

  describe('refus d une reponse libre', () => {
    const cas: readonly (readonly [string, number, ProblemeHttp | null, MotifRefusReponseLibre])[] =
      [
        ['une coupure reseau', 0, null, 'reseau'],
        ['une panne serveur 503', 503, null, 'reseau'],
        [
          'un 409 SEANCE_NON_DEMARREE',
          409,
          buildProblemeHttp({ code: 'SEANCE_NON_DEMARREE' }),
          'seance-non-demarree',
        ],
        [
          'un 409 SEANCE_TERMINEE',
          409,
          buildProblemeHttp({ code: 'SEANCE_TERMINEE' }),
          'seance-terminee',
        ],
        [
          'un 404 ECRAN_NON_SERVI',
          404,
          buildProblemeHttp({ status: 404, code: 'ECRAN_NON_SERVI' }),
          'ecran-non-servi',
        ],
        [
          'un 404 de seance introuvable, sans code',
          404,
          buildProblemeHttp({ status: 404 }),
          'refusee',
        ],
        ['un 400 reponse vide', 400, buildProblemeHttp({ status: 400 }), 'refusee'],
      ];

    const refusDeReponseLibre = (
      statut: number,
      corps: ProblemeHttp | null,
    ): ReponseLibreRefusee => {
      const erreurs = erreursApres(
        adapter.enregistrerReponseLibre(SESSION_ID, JETON, REPONSE_LIBRE),
        `${URL_SEANCE}/free-responses`,
        (requete) => {
          if (statut === 0) {
            requete.error(new ProgressEvent('error'));
          } else {
            requete.flush(corps, { status: statut, statusText: 'Erreur' });
          }
        },
      );

      expect(erreurs[0]).toBeInstanceOf(ReponseLibreRefusee);
      return erreurs[0] as ReponseLibreRefusee;
    };

    for (const [nom, statut, corps, motif] of cas) {
      it(`classe ${nom} en ${motif}`, () => {
        attendreLeRefus(refusDeReponseLibre(statut, corps), motif, statut);
      });
    }

    it('garde un 429 en panne passagere, dite par l attente commune lue dans Retry-After', () => {
      const erreurs = erreursApres(
        adapter.enregistrerReponseLibre(SESSION_ID, JETON, REPONSE_LIBRE),
        `${URL_SEANCE}/free-responses`,
        (requete) => requete.flush(buildProblemeHttp({ status: 429 }), LIMITE_ATTEINTE),
      );

      attendreLAttenteCommune(erreurs[0] as ReponseLibreRefusee, 'reseau');
    });
  });

  it('persiste les reponses libres et les annotations du formateur', () => {
    const annotation = { screenId: 'screen-1', note: 'À reprendre' };

    adapter.enregistrerReponseLibre(SESSION_ID, JETON, REPONSE_LIBRE).subscribe();
    const reponseRequest = attendre(`${URL_SEANCE}/free-responses`, 'POST');
    expect(reponseRequest.request.headers.get(ENTETE_JETON)).toBe(JETON);
    expect(reponseRequest.request.body).toEqual(REPONSE_LIBRE);
    reponseRequest.flush({ status: 'enregistre' });

    adapter.enregistrerAnnotation(SESSION_ID, annotation).subscribe();
    const annotationRequest = attendre(`${URL_SEANCE}/annotations`, 'POST');
    expect(annotationRequest.request.body).toEqual(annotation);
    annotationRequest.flush({
      id: 'annotation-1',
      sessionId: SESSION_ID,
      teacherId: 'teacher-1',
      ...annotation,
      updatedAt: '2026-09-19T00:00:00.000Z',
    });
  });

  it('rejoindre POSTe l inscription sur le code et rend le jeton du participant', () => {
    const { recus, requete } = rejoindreAvec(RATTACHEMENT);

    expect(requete.request.body).toEqual(INSCRIPTION);
    expect(recus).toEqual([RATTACHEMENT]);
  });

  it('rejoindre refuse un rattachement qui porte une graine, que le back ne sert pas', () => {
    const erreurs = erreursApres(
      adapter.rejoindre(CODE, INSCRIPTION),
      `${RACINE}/${CODE}/join`,
      (requete) => requete.flush({ ...RATTACHEMENT, seed: 1_234_567 }),
    );

    expect(erreurs).toEqual([jasmine.any(Error)]);
    expect(erreurs[0]).toBeInstanceOf(RattachementRefuse);
    const { motif, statut } = erreurs[0] as RattachementRefuse;
    expect([motif, statut]).toEqual(['rattachement-impossible', 0]);
  });

  it('rejoindre presente le secret de reprise du poste quand il en a un', () => {
    adapter.rejoindre(CODE, { ...INSCRIPTION, secretDeReprise: 'secret-precedent' }).subscribe();

    const req = attendre(`${RACINE}/${CODE}/join`, 'POST');
    expect(req.request.body).toEqual({ ...INSCRIPTION, secretDeReprise: 'secret-precedent' });
    req.flush(RATTACHEMENT);
  });

  it('rejoindre ne pose pas l en-tete de participant, que l etudiant n a pas encore', () => {
    const { requete } = rejoindreAvec(RATTACHEMENT);

    expect(requete.request.headers.has(ENTETE_JETON)).toBeFalse();
  });

  describe('refus de rattachement', () => {
    const refusPour = (
      statut: number,
      statusText: string,
      corps: ProblemeHttp | '' = '',
      headers: Record<string, string> = {},
    ): RattachementRefuse => {
      const erreurs: unknown[] = [];

      adapter.rejoindre(CODE, INSCRIPTION).subscribe({
        error: (recue: unknown) => erreurs.push(recue),
      });

      httpMock
        .expectOne(`${RACINE}/${CODE}/join`)
        .flush(corps, { status: statut, statusText, headers });

      expect(erreurs.length).toBe(1);
      expect(erreurs[0]).toBeInstanceOf(RattachementRefuse);
      return erreurs[0] as RattachementRefuse;
    };

    const attendreMotif = (refus: RattachementRefuse, motif: MotifRefusRattachement): void => {
      expect(refus.motif).toBe(motif);
      expect(refus.message).not.toBe('');
    };

    const REFUS_NOMMES: ReadonlyArray<{
      readonly statut: number;
      readonly libelle: string;
      readonly code: string;
      readonly motif: MotifRefusRattachement;
    }> = [
      { statut: 409, libelle: 'Conflict', code: 'SEANCE_COMPLETE', motif: 'seance-complete' },
      { statut: 409, libelle: 'Conflict', code: 'SEANCE_TERMINEE', motif: 'seance-terminee' },
      { statut: 409, libelle: 'Conflict', code: 'PLACE_DEJA_PRISE', motif: 'place-deja-prise' },
      {
        statut: 403,
        libelle: 'Forbidden',
        code: 'PARTICIPANT_EVINCE',
        motif: 'participant-evince',
      },
    ];

    for (const { statut, libelle, code, motif } of REFUS_NOMMES) {
      it(`distingue le ${statut} ${code} servi par le back`, () => {
        const refus = refusPour(statut, libelle, buildProblemeHttp({ code }));

        attendreMotif(refus, motif);
        expect(refus.statut).toBe(statut);
      });
    }

    it('distingue le 404 code inconnu', () => {
      const refus = refusPour(404, 'Not Found');

      attendreMotif(refus, 'code-inconnu');
      expect(refus.statut).toBe(404);
    });

    it('ne confond pas la seance complete et le code inconnu', () => {
      expect(
        refusPour(409, 'Conflict', buildProblemeHttp({ code: 'SEANCE_COMPLETE' })).motif,
      ).not.toBe(refusPour(404, 'Not Found').motif);
    });

    it('rend un motif generique pour un 409 sans code, que le front ne sait pas nommer', () => {
      attendreMotif(refusPour(409, 'Conflict'), 'rattachement-impossible');
    });

    it('rend un motif generique pour les autres statuts', () => {
      attendreMotif(refusPour(500, 'Server Error'), 'rattachement-impossible');
    });

    it('dit un 429 par l attente commune lue dans Retry-After, pas par un echec du rattachement', () => {
      const refus = refusPour(
        LIMITE_ATTEINTE.status,
        LIMITE_ATTEINTE.statusText,
        buildProblemeHttp({ status: 429, title: 'Too Many Requests' }),
        LIMITE_ATTEINTE.headers,
      );

      attendreLAttenteCommune(refus, 'rattachement-impossible');
    });
  });

  it('repondre POSTe la reponse sur answers avec l en-tete de participant', () => {
    const reponse = { questionId: 'Q-CAP-03', valeur: 1338.23, dureeMs: 42000 };

    adapter.repondre(SESSION_ID, JETON, reponse).subscribe();

    const req = attendre(`${URL_SEANCE}/answers`, 'POST');
    expect(req.request.headers.get(ENTETE_JETON)).toBe(JETON);
    expect(req.request.body).toEqual(reponse);
    req.flush({ correcte: true, misconception: null, libelleConfusion: null });
  });

  it('repondre traduit le correcte du serveur en reussite et ne rend que ca avec le libelle de confusion', () => {
    const recus: VerdictReponse[] = [];

    adapter
      .repondre(SESSION_ID, JETON, { questionId: 'Q-CAP-03', valeur: 1300, dureeMs: 1000 })
      .subscribe((valeur) => recus.push(valeur));

    attendre(`${URL_SEANCE}/answers`, 'POST').flush({
      correcte: false,
      misconception: 'interet-simple',
      libelleConfusion: 'Intérêts simples au lieu de composés',
    });

    expect(recus).toEqual([
      { reussite: false, libelleConfusion: 'Intérêts simples au lieu de composés' },
    ]);
  });

  it('repondre refuse un verdict incomplet ou qui porte une cle que le back ne sert pas', () => {
    const verdicts = [
      { correcte: true, misconception: null },
      { correcte: false, misconception: null, libelleConfusion: null, solution: 1338.23 },
    ];

    const erreurs = verdicts.flatMap((verdict) =>
      erreursApres(
        adapter.repondre(SESSION_ID, JETON, { questionId: 'Q-CAP-03', valeur: 1, dureeMs: 1 }),
        `${URL_SEANCE}/answers`,
        (requete) => requete.flush(verdict),
      ),
    );

    expect(erreurs).toEqual([jasmine.any(Error), jasmine.any(Error)]);
  });

  describe('refus d une reponse', () => {
    const DEJA_REPONDUE =
      'Votre réponse à la question Q-CAP-03 est déjà enregistrée : passez à la suivante.';
    const NON_DEMARREE =
      "La séance n'a pas encore commencé : attendez que le formateur la démarre pour envoyer vos réponses.";
    const TERMINEE =
      'La séance est terminée : les réponses ne sont plus acceptées, les résultats restent consultables.';

    const erreursDeReponse = (repondre: (requete: TestRequest) => void): unknown[] =>
      erreursApres(
        adapter.repondre(SESSION_ID, JETON, {
          questionId: 'Q-CAP-03',
          valeur: 1300,
          dureeMs: 1000,
        }),
        `${URL_SEANCE}/answers`,
        repondre,
      );

    const refusPour = (
      statut: number,
      corps: ProblemeHttp | null,
      statusText = 'Erreur',
    ): ReponseRefusee => {
      const erreurs = erreursDeReponse((req) => req.flush(corps, { status: statut, statusText }));

      expect(erreurs.length).toBe(1);
      expect(erreurs[0]).toBeInstanceOf(ReponseRefusee);
      return erreurs[0] as ReponseRefusee;
    };

    const cas: readonly (readonly [string, number, ProblemeHttp | null, MotifRefusReponse])[] = [
      ['une panne serveur 503', 503, null, 'reseau'],
      [
        'une limite de cadence 429',
        429,
        buildProblemeHttp({ status: 429, title: 'Too Many Requests' }),
        'reseau',
      ],
      [
        'une erreur serveur 500',
        500,
        buildProblemeHttp({ status: 500, title: 'Internal Server Error' }),
        'reseau',
      ],
      [
        'un 409 au code REPONSE_DEJA_ENREGISTREE',
        409,
        buildProblemeHttp({ code: 'REPONSE_DEJA_ENREGISTREE' }),
        'deja-repondue',
      ],
      [
        'un 409 au code SEANCE_NON_DEMARREE',
        409,
        buildProblemeHttp({ code: 'SEANCE_NON_DEMARREE' }),
        'seance-non-demarree',
      ],
      [
        'un 409 au texte de reponse deja enregistree mais sans code',
        409,
        buildProblemeHttp({ detail: DEJA_REPONDUE }),
        'refusee',
      ],
      [
        'un 409 au texte de seance non demarree mais sans code',
        409,
        buildProblemeHttp({ detail: NON_DEMARREE }),
        'refusee',
      ],
      [
        'un 409 au code SEANCE_TERMINEE',
        409,
        buildProblemeHttp({ detail: TERMINEE, code: 'SEANCE_TERMINEE' }),
        'seance-terminee',
      ],
      [
        'un 404 au code ECRAN_NON_SERVI',
        404,
        buildProblemeHttp({ status: 404, code: 'ECRAN_NON_SERVI' }),
        'ecran-non-servi',
      ],
      [
        'un 409 au code PHASE_FERMEE',
        409,
        buildProblemeHttp({ code: 'PHASE_FERMEE' }),
        'phase-fermee',
      ],
      [
        'un 400 de validation sans code',
        400,
        buildProblemeHttp({ status: 400, title: 'Bad Request' }),
        'refusee',
      ],
      [
        'un 404 sans code, le poste ne figure plus dans la seance',
        404,
        buildProblemeHttp({ status: 404, title: 'Not Found' }),
        'evince',
      ],
      ['un jeton refuse 401', 401, null, 'refusee'],
    ];

    for (const [nom, statut, corps, motif] of cas) {
      it(`classe ${nom} en ${motif}`, () => {
        attendreLeRefus(refusPour(statut, corps), motif, statut);
      });
    }

    it('classe une coupure reseau, sans statut, en panne reseau', () => {
      const erreurs = erreursDeReponse((req) => req.error(new ProgressEvent('error')));

      expect((erreurs[0] as ReponseRefusee).motif).toBe('reseau');
      expect((erreurs[0] as ReponseRefusee).statut).toBe(0);
    });
  });

  it('signalerIncidents POSTe le journal sur incidents avec l en-tete de participant', () => {
    const incidents = [{ type: 'tab_hidden', horodatage: '2026-09-11T10:00:00.000Z' }];

    adapter.signalerIncidents(SESSION_ID, JETON, incidents).subscribe();

    const req = attendre(`${URL_SEANCE}/incidents`, 'POST');
    expect(req.request.headers.get(ENTETE_JETON)).toBe(JETON);
    expect(req.request.body).toEqual({ incidents });
    req.flush(null);
  });

  describe('routes du contrat V3 (§ 9.5 et § 9.8)', () => {
    const PARCOURS = 'b2-01-a6-coffre';
    const SONDAGE = 'b2-01-jalon-1';
    const DEFI = 'b2-01-a5-defi';
    const PARTICIPANT = '8f1c3b2a-5d4e-4f6a-9b8c-7d6e5f4a3b2c';
    const PRODUCTION = {
      questionId: 'b2-01-a4-feuille-canaux',
      valeur: { type: 'feuille', cellules: { E2: '=C2/$C$5' } },
      dureeMs: 600000,
    } as const;
    const TENTATIVE = { enigmeId: 'enigme-1', reponse: '142 920', dureeMs: 42000 };
    const TEXTE_DE_DEFI = { texte: 'Multiplier les coefficients.', dureeMs: 180000 };
    const MACHINE = 'B2-01-A3-02-MACHINE-COEFFICIENTS';
    const REGLAGES = { tauxUn: 50, tauxDeux: -50 };
    const TABLEAU = 'b2-01-a4-indice-toile';
    const SAISIES = [{ rang: 0, cle: 'prix', saisie: '21,6' }];
    const FEUILLE = 'b2-03-a4-feuille-visa';
    const DEMANDE_DE_FEUILLE = {
      cellules: { I3: '=SI(D3>=5000;"Visa";"Non")' },
      recopie: { de: 'I3' },
    };

    interface AppelAttendu {
      readonly nom: string;
      readonly appeler: () => Observable<unknown>;
      readonly url: string;
      readonly methode: string;
      readonly corps: unknown;
      readonly jeton: string | null;
      readonly reponse: object | null;
      readonly absence?: MotifRefusReponse;
    }

    const appels = (): readonly AppelAttendu[] => [
      {
        nom: 'envoyerProduction',
        appeler: () => adapter.envoyerProduction(SESSION_ID, JETON, PRODUCTION),
        url: `${URL_SEANCE}/productions`,
        methode: 'POST',
        corps: PRODUCTION,
        jeton: JETON,
        reponse: buildVerdictProduction(),
      },
      {
        nom: 'tenterEnigme',
        appeler: () => adapter.tenterEnigme(SESSION_ID, JETON, PARCOURS, TENTATIVE),
        url: `${URL_SEANCE}/escape/${PARCOURS}/tentatives`,
        methode: 'POST',
        corps: TENTATIVE,
        jeton: JETON,
        reponse: buildVerdictTentative(),
        absence: 'refusee',
      },
      {
        nom: 'evaluerMachine',
        appeler: () => adapter.evaluerMachine(SESSION_ID, JETON, MACHINE, REGLAGES),
        url: `${URL_SEANCE}/machines/${MACHINE}/evaluation`,
        methode: 'POST',
        corps: { reglages: REGLAGES },
        jeton: JETON,
        reponse: buildSortiesMachine(),
      },
      {
        nom: 'evaluerTableau',
        appeler: () => adapter.evaluerTableau(SESSION_ID, JETON, TABLEAU, SAISIES),
        url: `${URL_SEANCE}/tableaux/${TABLEAU}/evaluation`,
        methode: 'POST',
        corps: { saisies: SAISIES },
        jeton: JETON,
        reponse: buildTableauEvalue(),
      },
      {
        nom: 'evaluerFeuille',
        appeler: () => adapter.evaluerFeuille(SESSION_ID, JETON, FEUILLE, DEMANDE_DE_FEUILLE),
        url: `${URL_SEANCE}/feuilles/${FEUILLE}/evaluation`,
        methode: 'POST',
        corps: DEMANDE_DE_FEUILLE,
        jeton: JETON,
        reponse: buildFeuilleEvaluee(),
      },
      {
        nom: 'declarerJalon',
        appeler: () => adapter.declarerJalon(SESSION_ID, JETON, SONDAGE, 'clair'),
        url: `${URL_SEANCE}/pulses/${SONDAGE}`,
        methode: 'PUT',
        corps: { etat: 'clair' },
        jeton: JETON,
        reponse: null,
      },
      {
        nom: 'lireRappels',
        appeler: () => adapter.lireRappels(SESSION_ID, JETON),
        url: `${URL_SEANCE}/rappels`,
        methode: 'GET',
        corps: null,
        jeton: JETON,
        reponse: { questions: [buildSpacedQuestionPublique()] },
      },
      {
        nom: 'envoyerDefi',
        appeler: () => adapter.envoyerDefi(SESSION_ID, JETON, DEFI, TEXTE_DE_DEFI),
        url: `${URL_SEANCE}/defis/${DEFI}/tentative`,
        methode: 'POST',
        corps: TEXTE_DE_DEFI,
        jeton: JETON,
        reponse: { strategies: [buildStrategiePublique()] },
      },
      {
        nom: 'lireStrategies',
        appeler: () => adapter.lireStrategies(SESSION_ID, JETON, DEFI),
        url: `${URL_SEANCE}/defis/${DEFI}/strategies`,
        methode: 'GET',
        corps: null,
        jeton: JETON,
        reponse: { strategies: [buildStrategiePublique({ fausse: true })] },
      },
      {
        nom: 'lireMonEtat',
        appeler: () => adapter.lireMonEtat(SESSION_ID, JETON),
        url: `${URL_SEANCE}/moi`,
        methode: 'GET',
        corps: null,
        jeton: JETON,
        reponse: buildEtatParticipant(),
      },
      {
        nom: 'lireSyntheseRappels',
        appeler: () => adapter.lireSyntheseRappels(SESSION_ID),
        url: `${URL_SEANCE}/rappels/synthese`,
        methode: 'GET',
        corps: null,
        jeton: null,
        reponse: { concepts: [buildSyntheseConcept()] },
      },
      {
        nom: 'evincerParticipant',
        appeler: () => adapter.evincerParticipant(SESSION_ID, PARTICIPANT),
        url: `${URL_SEANCE}/participants/${PARTICIPANT}`,
        methode: 'DELETE',
        corps: null,
        jeton: null,
        reponse: null,
      },
      {
        nom: 'readmettreParticipant',
        appeler: () => adapter.readmettreParticipant(SESSION_ID, PARTICIPANT),
        url: `${URL_SEANCE}/participants/${PARTICIPANT}/readmission`,
        methode: 'POST',
        corps: {},
        jeton: null,
        reponse: null,
      },
      {
        nom: 'libererPoste',
        appeler: () => adapter.libererPoste(SESSION_ID, PARTICIPANT),
        url: `${URL_SEANCE}/participants/${PARTICIPANT}/liberation`,
        methode: 'POST',
        corps: {},
        jeton: null,
        reponse: null,
      },
      {
        nom: 'ouvrirSeance avec capacite',
        appeler: () => adapter.ouvrirSeance('b2-01-x', { capacite: 40 }),
        url: RACINE,
        methode: 'POST',
        corps: { courseSlug: 'b2-01-x', capacite: 40 },
        jeton: null,
        reponse: { sessionId: SESSION_ID, code: CODE },
      },
      {
        nom: 'piloter une phase d ecran',
        appeler: () =>
          adapter.piloter(SESSION_ID, { pilotage: { screenId: 'B2-01-A3-01', phase: 'revote' } }),
        url: `${URL_SEANCE}/control`,
        methode: 'PATCH',
        corps: { pilotage: { screenId: 'B2-01-A3-01', phase: 'revote' } },
        jeton: null,
        reponse: null,
      },
    ];

    it('appelle chaque route avec son verbe, son corps et son en-tete, et rend la reponse servie', () => {
      for (const appel of appels()) {
        const recus: unknown[] = [];

        appel.appeler().subscribe((valeur) => recus.push(valeur));
        const req = attendre(appel.url, appel.methode);

        expect(req.request.body).withContext(appel.nom).toEqual(appel.corps);
        expect(req.request.headers.get(ENTETE_JETON)).withContext(appel.nom).toBe(appel.jeton);
        req.flush(appel.reponse);
        expect(recus).withContext(appel.nom).toEqual([appel.reponse]);
      }
    });

    describe('refus d une ecriture etudiante', () => {
      const ecritures = (): readonly AppelAttendu[] =>
        appels().filter((appel) => appel.jeton !== null && appel.methode !== 'GET');

      const cas: readonly (readonly [number, string | undefined, MotifRefusReponse])[] = [
        [409, 'REPONSE_DEJA_ENREGISTREE', 'deja-repondue'],
        [409, 'ENIGME_DEJA_RESOLUE', 'deja-repondue'],
        [409, 'SEANCE_NON_DEMARREE', 'seance-non-demarree'],
        [409, 'SEANCE_TERMINEE', 'seance-terminee'],
        [404, 'ECRAN_NON_SERVI', 'ecran-non-servi'],
        [409, 'PHASE_FERMEE', 'phase-fermee'],
        [409, 'ENIGME_VERROUILLEE', 'enigme-verrouillee'],
        [409, 'TENTATIVES_EPUISEES', 'tentatives-epuisees'],
        [409, 'REPRISES_EPUISEES', 'reprises-epuisees'],
        [400, 'PRODUCTION_VIDE', 'production-vide'],
        [400, 'TYPE_DE_QUESTION', 'refusee'],
        [400, 'PRODUCTION_INVALIDE', 'refusee'],
        [404, 'ACTIVITE_INCONNUE', 'refusee'],
        [401, undefined, 'refusee'],
        [429, undefined, 'reseau'],
        [503, undefined, 'reseau'],
      ];

      for (const [statut, code, motif] of cas) {
        it(`classe un ${statut} ${code ?? 'sans code'} en ${motif} pour chaque ecriture`, () => {
          for (const ecriture of ecritures()) {
            const erreurs = erreursApres(ecriture.appeler(), ecriture.url, (req) =>
              req.flush(buildProblemeHttp({ status: statut, code }), {
                status: statut,
                statusText: 'Erreur',
              }),
            );

            const refus = erreurs[0] as ReponseRefusee;
            expect(refus).withContext(ecriture.nom).toBeInstanceOf(ReponseRefusee);
            expect([refus.motif, refus.statut]).withContext(ecriture.nom).toEqual([motif, statut]);
            expect(refus.message).withContext(ecriture.nom).not.toBe('');
          }
        });
      }

      it('classe une coupure reseau, sans statut, en panne reseau', () => {
        for (const ecriture of ecritures()) {
          const erreurs = erreursApres(ecriture.appeler(), ecriture.url, (req) =>
            req.error(new ProgressEvent('error')),
          );

          expect((erreurs[0] as ReponseRefusee).motif)
            .withContext(ecriture.nom)
            .toBe('reseau');
        }
      });

      it('garde un 429 en panne passagere, renvoyable, dite par l attente commune lue dans Retry-After', () => {
        for (const ecriture of ecritures()) {
          const erreurs = erreursApres(ecriture.appeler(), ecriture.url, (req) =>
            req.flush(buildProblemeHttp({ status: 429 }), LIMITE_ATTEINTE),
          );

          attendreLAttenteCommune(erreurs[0] as ReponseRefusee, 'reseau', ecriture.nom);
        }
      });

      it('lit un 404 sans code comme une eviction, sauf la ou il designe une enigme absente', () => {
        for (const ecriture of ecritures()) {
          const erreurs = erreursApres(ecriture.appeler(), ecriture.url, (req) =>
            req.flush(buildProblemeHttp({ status: 404, title: 'Not Found' }), {
              status: 404,
              statusText: 'Not Found',
            }),
          );

          expect((erreurs[0] as ReponseRefusee).motif)
            .withContext(ecriture.nom)
            .toBe(ecriture.absence ?? 'evince');
        }
      });
    });

    describe('routes du § 9.5 que le back ne sert pas encore (rappels espacés)', () => {
      it('demande les rappels au chemin du contrat, avec le jeton du participant', () => {
        const questions = [buildSpacedQuestionPublique()];
        const recus: unknown[] = [];

        adapter.lireRappels(SESSION_ID, JETON).subscribe((valeur) => recus.push(valeur));
        const req = attendre(`${URL_SEANCE}/rappels`, 'GET');
        expect(req.request.headers.get(ENTETE_JETON)).toBe(JETON);
        req.flush({ questions });

        expect(recus).toEqual([{ questions }]);
      });

      it('traduit en refus affichable le 404 ECRAN_NON_SERVI annonce au contrat', () => {
        const erreurs: unknown[] = [];

        adapter.lireRappels(SESSION_ID, JETON).subscribe({
          error: (recue: unknown) => erreurs.push(recue),
        });
        httpMock
          .expectOne(`${URL_SEANCE}/rappels`)
          .flush(buildProblemeHttp({ status: 404, code: 'ECRAN_NON_SERVI' }), {
            status: 404,
            statusText: 'Not Found',
          });

        expect((erreurs[0] as ReponseRefusee).motif).toBe('ecran-non-servi');
      });

      it('lit la synthese des rappels au chemin du contrat, sans jeton de participant', () => {
        const concepts = [buildSyntheseConcept()];
        const recus: unknown[] = [];

        adapter.lireSyntheseRappels(SESSION_ID).subscribe((valeur) => recus.push(valeur));
        const req = attendre(`${URL_SEANCE}/rappels/synthese`, 'GET');
        expect(req.request.headers.has(ENTETE_JETON)).toBeFalse();
        req.flush({ concepts });

        expect(recus).toEqual([{ concepts }]);
      });
    });

    it('refuse au rapport comme au bilan un champ ou une regle de notation que le back sert toujours', () => {
      const rapport = buildRapportSeance();
      const sans = (objet: object, cle: string): object =>
        Object.fromEntries(Object.entries(objet).filter(([nom]) => nom !== cle));
      const incomplets = [
        ...Object.keys(rapport).map((cle) => sans(rapport, cle)),
        ...Object.keys(rapport.notation).map((cle) => ({
          ...rapport,
          notation: sans(rapport.notation, cle),
        })),
      ];
      const lectures = [
        {
          lire: (): Observable<RapportSeance> => adapter.lireResultats(SESSION_ID),
          route: 'results',
        },
        {
          lire: (): Observable<RapportSeance> => adapter.exporterBilan(SESSION_ID),
          route: 'report',
        },
      ];

      const erreurs = lectures.flatMap(({ lire, route }) =>
        incomplets.flatMap((corps) =>
          erreursApres(lire(), `${URL_SEANCE}/${route}`, (requete) => requete.flush(corps)),
        ),
      );

      expect(erreurs.length).toBe(2 * incomplets.length);
      expect(erreurs.every((erreur) => erreur instanceof Error)).toBeTrue();
    });
  });
});

describe('FormationsHttpAdapter, echec hors HTTP', () => {
  let adapter: FormationsHttpAdapter;

  beforeEach(() => {
    setupTestBed({
      http: false,
      providers: [
        FormationsHttpAdapter,
        provideHttpClient(
          withInterceptors([() => throwError(() => new TypeError('Failed to fetch'))]),
        ),
      ],
    });
    adapter = TestBed.inject(FormationsHttpAdapter);
  });

  const refusDe = (appel: Observable<unknown>): Promise<unknown> =>
    firstValueFrom(appel).then(
      () => {
        throw new Error('appel abouti malgre l echec');
      },
      (refus: unknown) => refus,
    );

  for (const { cas, appel, refus, motif } of [
    {
      cas: 'une reponse en panne reseau',
      appel: () =>
        adapter.repondre(SESSION_ID, JETON, { questionId: 'Q-CAP-03', valeur: 1, dureeMs: 1 }),
      refus: ReponseRefusee,
      motif: 'reseau',
    },
    {
      cas: 'une reponse libre en panne reseau',
      appel: () => adapter.enregistrerReponseLibre(SESSION_ID, JETON, REPONSE_LIBRE),
      refus: ReponseLibreRefusee,
      motif: 'reseau',
    },
    {
      cas: 'un rattachement impossible',
      appel: () => adapter.rejoindre(CODE, INSCRIPTION),
      refus: RattachementRefuse,
      motif: 'rattachement-impossible',
    },
    {
      cas: 'un sujet indisponible',
      appel: () => adapter.lireSujet(SESSION_ID, JETON),
      refus: SujetRefuse,
      motif: 'sujet-indisponible',
    },
    {
      cas: 'une piece jointe indisponible',
      appel: () => adapter.telechargerPieceJointe(SESSION_ID, JETON, 'B3-01-A2-01-VOTE-FAMILLE'),
      refus: PieceJointeRefusee,
      motif: 'indisponible',
    },
  ]) {
    it(`relance un echec qui n est pas une reponse HTTP en ${cas}, sans statut`, async () => {
      const recu = await refusDe(appel());

      expect(recu).toBeInstanceOf(refus);
      const { motif: motifRecu, statut } = recu as { motif: string; statut: number };
      expect([motifRecu, statut]).toEqual([motif, 0]);
    });
  }
});
