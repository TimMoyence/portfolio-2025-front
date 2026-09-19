import type { TestRequest } from '@angular/common/http/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import {
  buildCoursContent,
  buildDerouleCours,
  buildRapportSeance,
} from '../../../testing/factories/formations.factory';
import type { ProblemeHttp } from '../../../testing/factories/probleme-http.factory';
import { buildProblemeHttp } from '../../../testing/factories/probleme-http.factory';
import { setupTestBed } from '../../../testing/setup-test-bed';
import type { CoursContent, DerouleCours } from '../../../cours/content/types';
import type {
  GroupeFormation,
  InscriptionParticipant,
  MotifRefusRattachement,
  MotifRefusReponse,
  QuestionsDues,
  RapportSeance,
  Rattachement,
  SeanceOuverte,
  VerdictReponse,
} from '../ports/formations.port';
import {
  FORMATIONS_PORT,
  RattachementRefuse,
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
    const refusPour = (statut: number, statusText: string): RattachementRefuse => {
      const erreurs: unknown[] = [];

      adapter.rejoindre(CODE, INSCRIPTION).subscribe({
        error: (recue: unknown) => erreurs.push(recue),
      });

      httpMock.expectOne(`${RACINE}/${CODE}/join`).flush('', { status: statut, statusText });

      expect(erreurs.length).toBe(1);
      expect(erreurs[0]).toBeInstanceOf(RattachementRefuse);
      return erreurs[0] as RattachementRefuse;
    };

    const attendreMotif = (refus: RattachementRefuse, motif: MotifRefusRattachement): void => {
      expect(refus.motif).toBe(motif);
      expect(refus.message).not.toBe('');
    };

    it('distingue le 409 deja inscrit', () => {
      const refus = refusPour(409, 'Conflict');

      attendreMotif(refus, 'deja-inscrit');
      expect(refus.statut).toBe(409);
    });

    it('distingue le 404 code inconnu', () => {
      const refus = refusPour(404, 'Not Found');

      attendreMotif(refus, 'code-inconnu');
      expect(refus.statut).toBe(404);
    });

    it('ne confond pas les deux motifs', () => {
      expect(refusPour(409, 'Conflict').motif).not.toBe(refusPour(404, 'Not Found').motif);
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
        'un 409 au code inconnu',
        409,
        buildProblemeHttp({ detail: TERMINEE, code: 'SEANCE_TERMINEE' }),
        'refusee',
      ],
      [
        'un 400 portant un code de 409',
        400,
        buildProblemeHttp({ status: 400, title: 'Bad Request', code: 'SEANCE_NON_DEMARREE' }),
        'refusee',
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
});
