import { HttpClient } from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
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
  buildClientReport,
} from '../../../testing/factories/audit-request.factory';
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

    it('signale une coupure du flux et ferme la source une seule fois', () => {
      source.couper();

      expect(erreur).toEqual(new Error('Audit stream disconnected'));
      expect(termine).toBeFalse();
      expect(source.ferme).toHaveBeenCalledTimes(1);
    });
  });
});
