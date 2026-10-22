import { HttpClient } from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
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
  describe('confirmation d une demande par le lien recu', () => {
    it('poste le jeton en parametre et lit l identifiant de l audit au contrat', async () => {
      const adapter = injecterAdapter('browser');
      const http = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
      http.post.and.returnValue(of({ auditId: 'audit-confirme' }));

      const reponse = await firstValueFrom(adapter.confirmer('jeton-du-lien'));

      expect(reponse).toEqual({ auditId: 'audit-confirme' });
      expect(http.post).toHaveBeenCalledOnceWith(
        jasmine.stringMatching(/\/audits\/confirmation$/),
        null,
        {
          params: { token: 'jeton-du-lien' },
        },
      );
    });

    it('refuse une reponse hors contrat', async () => {
      const adapter = injecterAdapter('browser');
      const http = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
      http.post.and.returnValue(of({ id: 'audit-confirme' }));

      const issue = await firstValueFrom(adapter.confirmer('jeton-du-lien')).then(
        () => 'acceptee',
        () => 'refusee',
      );

      expect(issue).toBe('refusee');
    });
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
      source.diffuser(evenement.event, JSON.stringify(evenement.data));

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

    for (const echec of [buildAuditFailedEvent(), buildAuditTimeoutEvent()]) {
      it(`${echec.event} : ne relaie jamais un texte d erreur du serveur jusqu à l écran`, () => {
        source.diffuser(
          echec.event,
          JSON.stringify({ ...echec.data, error: 'connect ECONNREFUSED 10.0.0.5:5432' }),
        );

        verifierLeFlux([echec], true);
      });
    }

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
