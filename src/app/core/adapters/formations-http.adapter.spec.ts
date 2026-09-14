import type { TestRequest } from '@angular/common/http/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { setupTestBed } from '../../../testing/setup-test-bed';
import type {
  Bareme,
  InscriptionParticipant,
  MotifRefusRattachement,
  QuestionsDues,
  RapportSeance,
  Rattachement,
  SeanceOuverte,
  VerdictReponse,
} from '../ports/formations.port';
import { FORMATIONS_PORT, RattachementRefuse } from '../ports/formations.port';
import { FormationsHttpAdapter } from './formations-http.adapter';

const SESSION_ID = '4d0f2a9e-0d7f-4d2f-9a3c-1f6b2a7c8d90';
const CODE = 'AB12CD';
const JETON = 'jeton-participant';
const ENTETE_JETON = 'x-participant-token';
const RACINE = `${environment.apiBaseUrl}/formations/sessions`;
const URL_SEANCE = `${RACINE}/${SESSION_ID}`;

const BAREME: Bareme = {
  version: 1,
  questions: [{ id: 'Q-CAP-03', type: 'numeric', concept: 'capitalisation', noteCompte: true }],
  tirages: [{ seed: 7, solutions: { 'Q-CAP-03': { valeur: 1338.23, pieges: [] } } }],
};

const INSCRIPTION: InscriptionParticipant = {
  studentKey: '11111111-1111-4111-8111-111111111111',
  prenom: 'Theo',
  nom: 'Martin',
  email: 'theo.martin@example.com',
};

const RATTACHEMENT: Rattachement = {
  participantId: '8f1c3b2a-5d4e-4f6a-9b8c-7d6e5f4a3b2c',
  sessionId: SESSION_ID,
  seed: 7,
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

  it('ouvrirSeance POSTe le bareme sur sessions et rend sessionId et code', () => {
    const ouverte = { sessionId: SESSION_ID, code: CODE };
    const recus: SeanceOuverte[] = [];

    adapter
      .ouvrirSeance({ courseSlug: 'maths-bts-suites', bareme: BAREME })
      .subscribe((valeur) => recus.push(valeur));

    const req = attendre(RACINE, 'POST');
    expect(req.request.body).toEqual({ courseSlug: 'maths-bts-suites', bareme: BAREME });
    req.flush(ouverte);

    expect(recus).toEqual([ouverte]);
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

  it('lireResultats GETe le rapport sur results', () => {
    const rapport = {
      courseSlug: 'maths-bts-suites',
      code: CODE,
      ouverteLe: '2026-09-11T08:00:00.000Z',
      fermeeLe: '2026-09-11T10:00:00.000Z',
      participants: [],
      conceptsFragiles: ['capitalisation'],
    };
    const recus: RapportSeance[] = [];

    adapter.lireResultats(SESSION_ID).subscribe((valeur) => recus.push(valeur));

    attendre(`${URL_SEANCE}/results`, 'GET').flush(rapport);

    expect(recus).toEqual([rapport]);
  });

  it('rejoindre POSTe l inscription sur le code et rend le jeton du participant', () => {
    const recus: Rattachement[] = [];

    adapter.rejoindre(CODE, INSCRIPTION).subscribe((valeur) => recus.push(valeur));

    const req = attendre(`${RACINE}/${CODE}/join`, 'POST');
    expect(req.request.body).toEqual(INSCRIPTION);
    req.flush(RATTACHEMENT);

    expect(recus).toEqual([RATTACHEMENT]);
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
    req.flush({ correcte: true, misconception: null });
  });

  it('repondre ne rend que le verdict et l etiquette de confusion', () => {
    const recus: VerdictReponse[] = [];

    adapter
      .repondre(SESSION_ID, JETON, { questionId: 'Q-CAP-03', valeur: 1300, dureeMs: 1000 })
      .subscribe((valeur) => recus.push(valeur));

    attendre(`${URL_SEANCE}/answers`, 'POST').flush({
      correcte: false,
      misconception: 'interet-simple',
      solution: 1338.23,
      note: 12,
      pieges: [{ valeur: 1400, misconception: 'interet-simple' }],
    });

    expect(recus.length).toBe(1);
    const cles = Object.keys(recus[0]).sort((a, b) => a.localeCompare(b));
    expect(cles).toEqual(['correcte', 'misconception']);
    expect(recus[0]).toEqual({ correcte: false, misconception: 'interet-simple' });
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
