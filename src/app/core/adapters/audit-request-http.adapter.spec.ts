import { HttpClient } from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { z } from 'zod';
import type { AuditStreamEvent } from '../models/audit-request.model';
import {
  type EventSourceFactice,
  installerEventSourceFactice,
} from '../../../testing/event-source-factice';
import {
  buildAuditCompletedEvent,
  buildAuditFailedEvent,
  buildAuditProgressEvent,
  buildAuditStreamHeartbeat,
  buildAuditTimeoutEvent,
  buildClientReport,
} from '../../../testing/factories/audit-request.factory';
import { reponsesServiesPar } from '../../../testing/fixtures/reponses-servies';
import { bancAdaptateurHttp } from '../../../testing/http-attendu';
import { avecUneCleHorsContrat, lecturesStrictes } from '../../../testing/lecture-stricte';
import { setupTestBed } from '../../../testing/setup-test-bed';
import { AuditRequestHttpAdapter } from './audit-request-http.adapter';

function injecterAdapter(plateforme: 'server' | 'browser'): AuditRequestHttpAdapter {
  setupTestBed({
    http: false,
    providers: [
      AuditRequestHttpAdapter,
      {
        provide: HttpClient,
        useValue: jasmine.createSpyObj<HttpClient>('HttpClient', ['get', 'post']),
      },
      { provide: PLATFORM_ID, useValue: plateforme },
    ],
  });
  return TestBed.inject(AuditRequestHttpAdapter);
}

describe('AuditRequestHttpAdapter', () => {
  describe('lecture des réponses servies par le back', () => {
    const banc = bancAdaptateurHttp(AuditRequestHttpAdapter);
    lecturesStrictes(banc, [
      {
        route: 'POST /api/audits',
        chemin: '/audits',
        appel: (a) =>
          a.submit({ websiteName: 'Exemple', contactMethod: 'EMAIL', contactValue: 'a@b.fr' }),
      },
      {
        route: 'GET /api/audits/:id/summary',
        chemin: '/audits/audit-1/summary',
        appel: (a) => a.getSummary('audit-1'),
      },
    ]);
  });

  describe('lecture du flux servi par le back', () => {
    let source: EventSourceFactice;

    beforeEach(() => {
      source = installerEventSourceFactice();
    });

    afterEach(() => source.restaurer());

    function ecouter(adapter: AuditRequestHttpAdapter): { recus: unknown[]; erreurs: unknown[] } {
      const flux = { recus: [] as unknown[], erreurs: [] as unknown[] };
      adapter.stream('audit-99').subscribe({
        next: (evenement) => flux.recus.push(evenement),
        error: (erreur: unknown) => flux.erreurs.push(erreur),
      });
      return flux;
    }

    for (const type of ['progress', 'heartbeat', 'completed', 'failed', 'timeout'] as const) {
      it(`${type} : relaie chaque événement servi et refuse une clé hors contrat`, () => {
        const adapter = injecterAdapter('browser');
        const servis = reponsesServiesPar(`GET /api/audits/:id/stream ${type}`);
        expect(servis.length).toBeGreaterThan(0);
        for (const data of servis) {
          const lu = ecouter(adapter);
          source.diffuser(type, JSON.stringify(data));
          expect(lu).toEqual({ recus: [{ type, data }], erreurs: [] });

          const refuse = ecouter(adapter);
          source.diffuser(type, JSON.stringify(avecUneCleHorsContrat(data)));
          expect(refuse.recus).toEqual([]);
          expect(refuse.erreurs).toEqual([jasmine.any(z.ZodError)]);
        }
      });
    }

    for (const type of ['failed', 'timeout'] as const) {
      it(`${type} : ne relaie jamais un texte d erreur du serveur jusqu à l écran`, () => {
        const adapter = injecterAdapter('browser');
        for (const data of reponsesServiesPar(`GET /api/audits/:id/stream ${type}`)) {
          const lu = ecouter(adapter);
          source.diffuser(
            type,
            JSON.stringify({ ...Object(data), error: 'connect ECONNREFUSED 10.0.0.5:5432' }),
          );
          expect(lu.recus).toEqual([]);
          expect(lu.erreurs).toEqual([jasmine.any(z.ZodError)]);
        }
      });
    }
  });

  describe('en contexte serveur (SSR)', () => {
    let adapter: AuditRequestHttpAdapter;

    beforeEach(() => {
      adapter = injecterAdapter('server');
    });

    it('devrait etre cree en SSR', () => {
      expect(adapter).toBeTruthy();
    });

    it('stream() devrait retourner EMPTY en SSR sans creer EventSource', (done) => {
      const result = adapter.stream('test-audit-id');
      const emissions: unknown[] = [];

      result.subscribe({
        next: (val) => emissions.push(val),
        complete: () => {
          expect(emissions.length).toBe(0);
          done();
        },
        error: () => {
          fail("stream() ne devrait pas emettre d'erreur en SSR");
        },
      });
    });
  });

  describe('en contexte navigateur', () => {
    let adapter: AuditRequestHttpAdapter;
    let source: EventSourceFactice;
    let recus: AuditStreamEvent[];
    let termine: boolean;
    let erreur: unknown;

    const diffuser = (evenement: AuditStreamEvent): void =>
      source.diffuser(evenement.type, JSON.stringify(evenement.data));

    const verifierLeFlux = (attendus: readonly AuditStreamEvent[], clos: boolean): void => {
      expect(recus).toEqual([...attendus]);
      expect(termine).toBe(clos);
      expect(erreur).toBeUndefined();
      expect(source.ferme).toHaveBeenCalledTimes(clos ? 1 : 0);
    };

    beforeEach(() => {
      adapter = injecterAdapter('browser');
      source = installerEventSourceFactice();
      recus = [];
      termine = false;
      erreur = undefined;
      adapter.stream('audit-99').subscribe({
        next: (evenement) => recus.push(evenement),
        complete: () => {
          termine = true;
        },
        error: (recue: unknown) => {
          erreur = recue;
        },
      });
    });

    afterEach(() => source.restaurer());

    it('devrait etre cree', () => {
      expect(adapter).toBeTruthy();
    });

    it('relaie progression et battement sans clore le flux', () => {
      const progression = buildAuditProgressEvent();
      const battement = buildAuditStreamHeartbeat();

      diffuser(progression);
      diffuser(battement);

      verifierLeFlux([progression, battement], false);
    });

    it("transmet clientReport dans l'evenement completed puis clot le flux", () => {
      const fin = buildAuditCompletedEvent({
        auditId: 'audit-99',
        clientReport: buildClientReport(),
      });

      diffuser(fin);

      verifierLeFlux([fin], true);
    });

    it('ignore une charge illisible sans clore le flux tant que l audit court', () => {
      for (const nom of ['progress', 'heartbeat', 'completed']) {
        source.diffuser(nom, '{illisible');
      }

      verifierLeFlux([], false);
    });

    it('clot le flux sur un echec meme quand sa charge est illisible', () => {
      source.diffuser('failed', '{illisible');

      verifierLeFlux([], true);
    });

    it("relaie l'echec lisible puis clot le flux", () => {
      const echec = buildAuditFailedEvent();

      diffuser(echec);

      verifierLeFlux([echec], true);
    });

    it('relaie le délai dépassé puis clôt le flux, sans le prendre pour une coupure', () => {
      const delai = buildAuditTimeoutEvent({ auditId: 'audit-99' });

      diffuser(delai);
      source.couper();

      verifierLeFlux([delai], true);
    });

    it('clôt le flux sur un délai dépassé même quand sa charge est illisible', () => {
      source.diffuser('timeout', '{illisible');

      verifierLeFlux([], true);
    });

    it('signale une coupure du flux et ferme la source une seule fois', () => {
      source.couper();

      expect(erreur).toEqual(new Error('Audit stream disconnected'));
      expect(termine).toBeFalse();
      expect(source.ferme).toHaveBeenCalledTimes(1);
    });
  });
});
