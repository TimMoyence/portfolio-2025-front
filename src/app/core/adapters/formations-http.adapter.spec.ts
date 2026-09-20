import type { TestRequest } from '@angular/common/http/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  buildAnnotationFormateur,
  buildCoursContent,
  buildDerouleCours,
  buildEtatParticipant,
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
import type { ProblemeHttp } from '../../../testing/factories/probleme-http.factory';
import { buildProblemeHttp } from '../../../testing/factories/probleme-http.factory';
import { setupTestBed } from '../../../testing/setup-test-bed';
import type { CoursContent, DerouleCours } from '../../../cours/content/types';
import type {
  AnnotationFormateur,
  GroupeFormation,
  InscriptionParticipant,
  MotifRefusGroupe,
  MotifRefusRattachement,
  MotifRefusReponse,
  MotifRefusReponseLibre,
  ParticipantDeSeance,
  QuestionsDues,
  RapportSeance,
  Rattachement,
  RegleNotation,
  ReponseLibreFormateur,
  SeanceOuverte,
  VerdictReponse,
} from '../ports/formations.port';
import {
  FORMATIONS_PORT,
  GroupeRefuse,
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
  studentKey: '11111111-1111-4111-8111-111111111111',
  prenom: 'Theo',
  nom: 'Martin',
  email: 'theo.martin@example.com',
};

const RATTACHEMENT: Rattachement = {
  participantId: '8f1c3b2a-5d4e-4f6a-9b8c-7d6e5f4a3b2c',
  sessionId: SESSION_ID,
  ecranCourant: 0,
  modeRythme: 'pilote',
  jeton: JETON,
};

describe('FormationsHttpAdapter', () => {
  let adapter: FormationsHttpAdapter;
  let httpMock: HttpTestingController;

  const attendre = (url: string, methode: string): TestRequest => {
    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe(methode);
    return req;
  };

  beforeEach(() => {
    setupTestBed({
      providers: [
        FormationsHttpAdapter,
        { provide: FORMATIONS_PORT, useExisting: FormationsHttpAdapter },
      ],
    });

    adapter = TestBed.inject(FormationsHttpAdapter);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

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
    const deroule = buildDerouleCours();
    const recus: DerouleCours[] = [];

    adapter.lireDeroule(SESSION_ID).subscribe((valeur) => recus.push(valeur));

    attendre(`${URL_SEANCE}/deroule`, 'GET').flush(deroule);

    expect(recus).toEqual([deroule]);
  });

  it('lireSujet GETe le sujet de l etudiant avec l en-tete de participant', () => {
    const sujet = buildCoursContent();
    const recus: CoursContent[] = [];

    adapter.lireSujet(SESSION_ID, JETON).subscribe((valeur) => recus.push(valeur));

    const req = attendre(`${URL_SEANCE}/sujet`, 'GET');
    expect(req.request.headers.get(ENTETE_JETON)).toBe(JETON);
    req.flush(sujet);

    expect(recus).toEqual([sujet]);
  });

  it('lireSujet transforme un 409 en refus motive par le changement du cours', () => {
    const erreurs: unknown[] = [];

    adapter.lireSujet(SESSION_ID, JETON).subscribe({
      error: (recue: unknown) => erreurs.push(recue),
    });

    httpMock.expectOne(`${URL_SEANCE}/sujet`).flush('', { status: 409, statusText: 'Conflict' });

    expect(erreurs.length).toBe(1);
    expect(erreurs[0]).toBeInstanceOf(SujetRefuse);
    const refus = erreurs[0] as SujetRefuse;
    expect(refus.motif).toBe('cours-modifie');
    expect(refus.statut).toBe(409);
    expect(refus.message).not.toBe('');
  });

  it('lireSujet transforme les autres erreurs en sujet indisponible', () => {
    const erreurs: unknown[] = [];

    adapter.lireSujet(SESSION_ID, JETON).subscribe({
      error: (recue: unknown) => erreurs.push(recue),
    });

    httpMock
      .expectOne(`${URL_SEANCE}/sujet`)
      .flush('', { status: 500, statusText: 'Server Error' });

    expect(erreurs.length).toBe(1);
    expect(erreurs[0]).toBeInstanceOf(SujetRefuse);
    const refus = erreurs[0] as SujetRefuse;
    expect(refus.motif).toBe('sujet-indisponible');
    expect(refus.statut).toBe(500);
  });

  it('demarrer POSTe sur start', () => {
    adapter.demarrer(SESSION_ID).subscribe();

    const req = attendre(`${URL_SEANCE}/start`, 'POST');
    expect(req.request.body).toEqual({});
    req.flush(null);
  });

  it('piloter PATCHe la commande sur control', () => {
    const commande = { ecran: 4, mode: 'libre' as const, intervalle: { premier: 3, dernier: 9 } };

    adapter.piloter(SESSION_ID, commande).subscribe();

    const req = attendre(`${URL_SEANCE}/control`, 'PATCH');
    expect(req.request.body).toEqual(commande);
    req.flush(null);
  });

  it('cloturer POSTe sur close', () => {
    adapter.cloturer(SESSION_ID).subscribe();

    const req = attendre(`${URL_SEANCE}/close`, 'POST');
    expect(req.request.body).toEqual({});
    req.flush(null);
  });

  it('lireResultats GETe le rapport, y compris les resultats agreges, sur results', () => {
    const rapport = buildRapportSeance();
    const recus: RapportSeance[] = [];

    adapter.lireResultats(SESSION_ID).subscribe((valeur) => recus.push(valeur));

    attendre(`${URL_SEANCE}/results`, 'GET').flush(rapport);

    expect(recus).toEqual([rapport]);
  });

  it('exporterBilan GETe le rapport telechargeable sur report', () => {
    const rapport = buildRapportSeance();
    const recus: RapportSeance[] = [];

    adapter.exporterBilan(SESSION_ID).subscribe((valeur) => recus.push(valeur));

    attendre(`${URL_SEANCE}/report`, 'GET').flush(rapport);

    expect(recus).toEqual([rapport]);
  });

  it('lireResultats transmet la regle de notation et les statistiques servies par le serveur', () => {
    const rapport = buildRapportSeance({
      notation: buildRegleNotation(),
      statistiques: buildStatistiquesSeance(),
    });
    const recus: RapportSeance[] = [];

    adapter.lireResultats(SESSION_ID).subscribe((valeur) => recus.push(valeur));
    attendre(`${URL_SEANCE}/results`, 'GET').flush(rapport);

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

  it('lireParticipants GETe les participants et leur groupe sur participants', () => {
    const participants = [
      buildParticipantDeSeance(),
      buildParticipantDeSeance({ id: 'participant-2', prenom: 'Nora', groupId: 'groupe-1' }),
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

    for (const [nom, statut, corps, motif] of cas) {
      it(`classe ${nom} en ${motif}`, () => {
        const erreurs: unknown[] = [];

        adapter
          .enregistrerReponseLibre(SESSION_ID, JETON, {
            screenId: 'screen-1',
            activityId: 'reflect-1',
            response: 'raisonnement',
            dureeMs: 3200,
          })
          .subscribe({ error: (recue: unknown) => erreurs.push(recue) });
        const requete = httpMock.expectOne(`${URL_SEANCE}/free-responses`);
        if (statut === 0) {
          requete.error(new ProgressEvent('error'));
        } else {
          requete.flush(corps, { status: statut, statusText: 'Erreur' });
        }

        expect(erreurs[0]).toBeInstanceOf(ReponseLibreRefusee);
        expect((erreurs[0] as ReponseLibreRefusee).motif).toBe(motif);
        expect((erreurs[0] as ReponseLibreRefusee).statut).toBe(statut);
      });
    }
  });

  describe('refus d une commande de groupe', () => {
    const commandes: readonly (readonly [string, () => Observable<unknown>, string])[] = [
      ['creerGroupe', () => adapter.creerGroupe(SESSION_ID, 'Groupe A'), `${URL_SEANCE}/groups`],
      [
        'renommerGroupe',
        () => adapter.renommerGroupe(SESSION_ID, 'groupe-1', 'Groupe A'),
        `${URL_SEANCE}/groups/groupe-1`,
      ],
      [
        'affecterParticipant',
        () => adapter.affecterParticipant(SESSION_ID, 'participant-1', 'groupe-1'),
        `${URL_SEANCE}/participants/participant-1/group`,
      ],
      [
        'retirerParticipantDuGroupe',
        () => adapter.retirerParticipantDuGroupe(SESSION_ID, 'participant-1'),
        `${URL_SEANCE}/participants/participant-1/group`,
      ],
    ];
    const statuts: readonly (readonly [number, MotifRefusGroupe])[] = [
      [409, 'nom-deja-pris'],
      [404, 'introuvable'],
      [500, 'echec'],
    ];

    for (const [nom, appeler, url] of commandes) {
      for (const [statut, motif] of statuts) {
        it(`${nom} classe un ${statut} en ${motif}`, () => {
          const erreurs: unknown[] = [];

          appeler().subscribe({ error: (recue: unknown) => erreurs.push(recue) });
          httpMock
            .expectOne(url)
            .flush(buildProblemeHttp({ status: statut }), { status: statut, statusText: 'Erreur' });

          expect(erreurs[0]).toBeInstanceOf(GroupeRefuse);
          expect((erreurs[0] as GroupeRefuse).motif).toBe(motif);
        });
      }
    }
  });

  it('persiste les reponses libres et les annotations du formateur', () => {
    const reponse = {
      screenId: 'screen-1',
      activityId: 'reflect-1',
      response: 'raisonnement',
      dureeMs: 3200,
    };
    const annotation = { screenId: 'screen-1', groupName: 'Groupe A', note: 'À reprendre' };

    adapter.enregistrerReponseLibre(SESSION_ID, JETON, reponse).subscribe();
    const reponseRequest = attendre(`${URL_SEANCE}/free-responses`, 'POST');
    expect(reponseRequest.request.headers.get(ENTETE_JETON)).toBe(JETON);
    expect(reponseRequest.request.body).toEqual(reponse);
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

  it('expose les groupes et leurs commandes d affectation', () => {
    const groupe: GroupeFormation = {
      id: 'group-1',
      sessionId: SESSION_ID,
      name: 'Groupe A',
      createdAt: '2026-09-19T00:00:00.000Z',
      updatedAt: '2026-09-19T00:00:00.000Z',
    };
    const groupes: GroupeFormation[] = [];

    adapter.lireGroupes(SESSION_ID).subscribe(({ groups }) => groupes.push(...groups));
    attendre(`${URL_SEANCE}/groups`, 'GET').flush({ groups: [groupe] });
    expect(groupes).toEqual([groupe]);

    adapter.creerGroupe(SESSION_ID, 'Groupe B').subscribe();
    const creation = attendre(`${URL_SEANCE}/groups`, 'POST');
    expect(creation.request.body).toEqual({ name: 'Groupe B' });
    creation.flush(groupe);

    adapter.renommerGroupe(SESSION_ID, groupe.id, 'Groupe renommé').subscribe();
    const renommage = attendre(`${URL_SEANCE}/groups/${groupe.id}`, 'PATCH');
    expect(renommage.request.body).toEqual({ name: 'Groupe renommé' });
    renommage.flush(groupe);

    adapter.affecterParticipant(SESSION_ID, 'participant-1', groupe.id).subscribe();
    const affectation = attendre(`${URL_SEANCE}/participants/participant-1/group`, 'PATCH');
    expect(affectation.request.body).toEqual({ groupId: groupe.id });
    affectation.flush(null);

    adapter.retirerParticipantDuGroupe(SESSION_ID, 'participant-1').subscribe();
    attendre(`${URL_SEANCE}/participants/participant-1/group`, 'DELETE').flush(null);
  });

  it('rejoindre POSTe l inscription sur le code et rend le jeton du participant', () => {
    const recus: Rattachement[] = [];

    adapter.rejoindre(CODE, INSCRIPTION).subscribe((valeur) => recus.push(valeur));

    const req = attendre(`${RACINE}/${CODE}/join`, 'POST');
    expect(req.request.body).toEqual(INSCRIPTION);
    req.flush(RATTACHEMENT);

    expect(recus).toEqual([RATTACHEMENT]);
  });

  it('rejoindre ne garde du rattachement aucune graine, meme si le serveur en envoie encore une', () => {
    const recus: Rattachement[] = [];

    adapter.rejoindre(CODE, INSCRIPTION).subscribe((valeur) => recus.push(valeur));
    attendre(`${RACINE}/${CODE}/join`, 'POST').flush({ ...RATTACHEMENT, seed: 1_234_567 });

    expect(recus).toEqual([RATTACHEMENT]);
    expect(Object.keys(recus[0]).sort((a, b) => a.localeCompare(b))).toEqual([
      'ecranCourant',
      'jeton',
      'modeRythme',
      'participantId',
      'sessionId',
    ]);
  });

  it('rejoindre ne pose pas l en-tete de participant, que l etudiant n a pas encore', () => {
    adapter.rejoindre(CODE, INSCRIPTION).subscribe();

    const req = attendre(`${RACINE}/${CODE}/join`, 'POST');
    expect(req.request.headers.has(ENTETE_JETON)).toBeFalse();
    req.flush(RATTACHEMENT);
  });

  describe('refus de rattachement', () => {
    const refusPour = (
      statut: number,
      statusText: string,
      corps: ProblemeHttp | '' = '',
    ): RattachementRefuse => {
      const erreurs: unknown[] = [];

      adapter.rejoindre(CODE, INSCRIPTION).subscribe({
        error: (recue: unknown) => erreurs.push(recue),
      });

      httpMock.expectOne(`${RACINE}/${CODE}/join`).flush(corps, { status: statut, statusText });

      expect(erreurs.length).toBe(1);
      expect(erreurs[0]).toBeInstanceOf(RattachementRefuse);
      return erreurs[0] as RattachementRefuse;
    };

    const attendreMotif = (refus: RattachementRefuse, motif: MotifRefusRattachement): void => {
      expect(refus.motif).toBe(motif);
      expect(refus.message).not.toBe('');
    };

    it('distingue le 409 SEANCE_COMPLETE servi par le back', () => {
      const refus = refusPour(409, 'Conflict', buildProblemeHttp({ code: 'SEANCE_COMPLETE' }));

      attendreMotif(refus, 'seance-complete');
      expect(refus.statut).toBe(409);
    });

    it('distingue le 409 SEANCE_TERMINEE servi par le back', () => {
      const refus = refusPour(409, 'Conflict', buildProblemeHttp({ code: 'SEANCE_TERMINEE' }));

      attendreMotif(refus, 'seance-terminee');
      expect(refus.statut).toBe(409);
    });

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
  });

  it('repondre POSTe la reponse sur answers avec l en-tete de participant', () => {
    const reponse = { questionId: 'Q-CAP-03', valeur: 1338.23, dureeMs: 42000 };

    adapter.repondre(SESSION_ID, JETON, reponse).subscribe();

    const req = attendre(`${URL_SEANCE}/answers`, 'POST');
    expect(req.request.headers.get(ENTETE_JETON)).toBe(JETON);
    expect(req.request.body).toEqual(reponse);
    req.flush({ correcte: true, misconception: null, libelleConfusion: null });
  });

  it('repondre traduit le correcte du serveur en reussite et ne rend que ca avec le libelle de confusion, meme si le serveur ajoute misconception', () => {
    const recus: VerdictReponse[] = [];

    adapter
      .repondre(SESSION_ID, JETON, { questionId: 'Q-CAP-03', valeur: 1300, dureeMs: 1000 })
      .subscribe((valeur) => recus.push(valeur));

    attendre(`${URL_SEANCE}/answers`, 'POST').flush({
      correcte: false,
      misconception: 'interet-simple',
      libelleConfusion: 'Intérêts simples au lieu de composés',
      solution: 1338.23,
      note: 12,
    });

    expect(recus.length).toBe(1);
    const cles = Object.keys(recus[0]).sort((a, b) => a.localeCompare(b));
    expect(cles).toEqual(['libelleConfusion', 'reussite']);
    expect(recus[0]).toEqual({
      reussite: false,
      libelleConfusion: 'Intérêts simples au lieu de composés',
    });
  });

  it('repondre rend un libelle de confusion nul quand le serveur ne le transmet pas', () => {
    const recus: VerdictReponse[] = [];

    adapter
      .repondre(SESSION_ID, JETON, { questionId: 'Q-CAP-03', valeur: 1480.24, dureeMs: 1000 })
      .subscribe((valeur) => recus.push(valeur));

    attendre(`${URL_SEANCE}/answers`, 'POST').flush({ correcte: true, misconception: null });

    expect(recus).toEqual([{ reussite: true, libelleConfusion: null }]);
  });

  describe('refus d une reponse', () => {
    const DEJA_REPONDUE =
      'Votre réponse à la question Q-CAP-03 est déjà enregistrée : passez à la suivante.';
    const NON_DEMARREE =
      "La séance n'a pas encore commencé : attendez que le formateur la démarre pour envoyer vos réponses.";
    const TERMINEE =
      'La séance est terminée : les réponses ne sont plus acceptées, les résultats restent consultables.';

    const refusPour = (
      statut: number,
      corps: ProblemeHttp | null,
      statusText = 'Erreur',
    ): ReponseRefusee => {
      const erreurs: unknown[] = [];

      adapter
        .repondre(SESSION_ID, JETON, { questionId: 'Q-CAP-03', valeur: 1300, dureeMs: 1000 })
        .subscribe({ error: (recue: unknown) => erreurs.push(recue) });

      httpMock.expectOne(`${URL_SEANCE}/answers`).flush(corps, { status: statut, statusText });

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
        const refus = refusPour(statut, corps);

        expect(refus.motif).toBe(motif);
        expect(refus.statut).toBe(statut);
        expect(refus.message).not.toBe('');
      });
    }

    it('classe une coupure reseau, sans statut, en panne reseau', () => {
      const erreurs: unknown[] = [];

      adapter
        .repondre(SESSION_ID, JETON, { questionId: 'Q-CAP-03', valeur: 1300, dureeMs: 1000 })
        .subscribe({ error: (recue: unknown) => erreurs.push(recue) });
      httpMock.expectOne(`${URL_SEANCE}/answers`).error(new ProgressEvent('error'));

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

  it('lireQuestionsDues GETe les questions sur due-questions avec l en-tete de participant', () => {
    const dues: QuestionsDues = {
      questions: [{ questionId: 'Q-CAP-03', concept: 'capitalisation', boite: 2 }],
    };
    const recus: QuestionsDues[] = [];

    adapter.lireQuestionsDues(SESSION_ID, JETON).subscribe((valeur) => recus.push(valeur));

    const req = attendre(`${URL_SEANCE}/due-questions`, 'GET');
    expect(req.request.headers.get(ENTETE_JETON)).toBe(JETON);
    req.flush(dues);

    expect(recus).toEqual([dues]);
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
        nom: 'ouvrirSeance avec version et capacite',
        appeler: () => adapter.ouvrirSeance('b2-01-x', { version: 3, capacite: 40 }),
        url: RACINE,
        methode: 'POST',
        corps: { courseSlug: 'b2-01-x', version: 3, capacite: 40 },
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
            const erreurs: unknown[] = [];

            ecriture.appeler().subscribe({ error: (recue: unknown) => erreurs.push(recue) });
            httpMock.expectOne(ecriture.url).flush(buildProblemeHttp({ status: statut, code }), {
              status: statut,
              statusText: 'Erreur',
            });

            const refus = erreurs[0] as ReponseRefusee;
            expect(refus).withContext(ecriture.nom).toBeInstanceOf(ReponseRefusee);
            expect([refus.motif, refus.statut]).withContext(ecriture.nom).toEqual([motif, statut]);
            expect(refus.message).withContext(ecriture.nom).not.toBe('');
          }
        });
      }

      it('classe une coupure reseau, sans statut, en panne reseau', () => {
        for (const ecriture of ecritures()) {
          const erreurs: unknown[] = [];

          ecriture.appeler().subscribe({ error: (recue: unknown) => erreurs.push(recue) });
          httpMock.expectOne(ecriture.url).error(new ProgressEvent('error'));

          expect((erreurs[0] as ReponseRefusee).motif)
            .withContext(ecriture.nom)
            .toBe('reseau');
        }
      });

      it('lit un 404 sans code comme une eviction, sauf la ou il designe une enigme absente', () => {
        for (const ecriture of ecritures()) {
          const erreurs: unknown[] = [];

          ecriture.appeler().subscribe({ error: (recue: unknown) => erreurs.push(recue) });
          httpMock
            .expectOne(ecriture.url)
            .flush(buildProblemeHttp({ status: 404, title: 'Not Found' }), {
              status: 404,
              statusText: 'Not Found',
            });

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

    describe('regle de notation servie par un serveur v2', () => {
      const RAPPORT_V2 = (): object => {
        const notation: Partial<RegleNotation> = { ...buildRegleNotation() };
        delete notation.typesNotables;
        delete notation.productionCompteSi;
        delete notation.statistiquesSurQuestionsNotees;
        return { ...buildRapportSeance(), notation };
      };

      it('lireResultats la complete des trois champs du contrat final', () => {
        const recus: RapportSeance[] = [];

        adapter.lireResultats(SESSION_ID).subscribe((valeur) => recus.push(valeur));
        attendre(`${URL_SEANCE}/results`, 'GET').flush(RAPPORT_V2());

        expect(recus[0].notation).toEqual(buildRegleNotation());
      });

      it('exporterBilan rend le rapport tel que le serveur l a servi', () => {
        const recus: RapportSeance[] = [];

        adapter.exporterBilan(SESSION_ID).subscribe((valeur) => recus.push(valeur));
        attendre(`${URL_SEANCE}/report`, 'GET').flush(RAPPORT_V2());

        expect(recus).toEqual([RAPPORT_V2() as RapportSeance]);
      });
    });

    it('laisse sans notation un rapport qui n en porte pas', () => {
      const recus: RapportSeance[] = [];

      adapter.lireResultats(SESSION_ID).subscribe((valeur) => recus.push(valeur));
      attendre(`${URL_SEANCE}/results`, 'GET').flush(buildRapportSeance());

      expect(recus).toEqual([buildRapportSeance()]);
    });
  });
});
