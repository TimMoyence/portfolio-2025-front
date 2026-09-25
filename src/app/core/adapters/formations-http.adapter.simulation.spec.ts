import type { HttpTestingController } from '@angular/common/http/testing';
import * as fc from 'fast-check';
import type { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { buildProblemeHttp } from '../../../testing/factories/probleme-http.factory';
import { bancAdaptateurHttp } from '../../../testing/http-attendu';
import type { MotifRefusReponse } from '../ports/formations.port';
import { ReponseRefusee } from '../ports/formations.port';
import { FormationsHttpAdapter } from './formations-http.adapter';

const SESSION_ID = '4d0f2a9e-0d7f-4d2f-9a3c-1f6b2a7c8d90';
const JETON = 'jeton-participant';
const URL_SEANCE = `${environment.apiBaseUrl}/formations/sessions/${SESSION_ID}`;
const GRAINE = 20260920;
const TOURS = 60;

const STATUTS_A_RENVOYER: readonly number[] = [0, 429, 500, 502, 503];

interface RefusDuBack {
  readonly statut: number;
  readonly code?: string;
  readonly motif: MotifRefusReponse;
}

const REFUS_DU_BACK: readonly RefusDuBack[] = [
  { statut: 409, code: 'SEANCE_NON_DEMARREE', motif: 'seance-non-demarree' },
  { statut: 409, code: 'SEANCE_TERMINEE', motif: 'seance-terminee' },
  { statut: 404, code: 'ECRAN_NON_SERVI', motif: 'ecran-non-servi' },
  { statut: 409, code: 'PHASE_FERMEE', motif: 'phase-fermee' },
  { statut: 409, code: 'REPONSE_DEJA_ENREGISTREE', motif: 'deja-repondue' },
  { statut: 409, code: 'ENIGME_DEJA_RESOLUE', motif: 'deja-repondue' },
  { statut: 409, code: 'ENIGME_VERROUILLEE', motif: 'enigme-verrouillee' },
  { statut: 409, code: 'TENTATIVES_EPUISEES', motif: 'tentatives-epuisees' },
  { statut: 409, code: 'REPRISES_EPUISEES', motif: 'reprises-epuisees' },
  { statut: 400, code: 'PRODUCTION_VIDE', motif: 'production-vide' },
  { statut: 400, code: 'PRODUCTION_INVALIDE', motif: 'refusee' },
  { statut: 400, code: 'TYPE_DE_QUESTION', motif: 'refusee' },
  { statut: 404, code: 'ACTIVITE_INCONNUE', motif: 'refusee' },
  { statut: 400, motif: 'refusee' },
  { statut: 401, motif: 'refusee' },
  { statut: 429, motif: 'reseau' },
  { statut: 500, motif: 'reseau' },
  { statut: 503, motif: 'reseau' },
];

interface EcritureEtudiante {
  readonly nom: string;
  readonly url: string;
  readonly absence: MotifRefusReponse;
  readonly appeler: (adapter: FormationsHttpAdapter) => Observable<unknown>;
}

const ECRITURES: readonly EcritureEtudiante[] = [
  {
    nom: 'repondre',
    url: `${URL_SEANCE}/answers`,
    absence: 'evince',
    appeler: (adapter) =>
      adapter.repondre(SESSION_ID, JETON, { questionId: 'Q-1', valeur: 12, dureeMs: 900 }),
  },
  {
    nom: 'envoyerProduction',
    url: `${URL_SEANCE}/productions`,
    absence: 'evince',
    appeler: (adapter) =>
      adapter.envoyerProduction(SESSION_ID, JETON, {
        questionId: 'b2-01-a4-feuille-canaux',
        valeur: { type: 'feuille', cellules: { E2: '=C2/$C$5' } },
        dureeMs: 1200,
      }),
  },
  {
    nom: 'declarerJalon',
    url: `${URL_SEANCE}/pulses/b2-01-jalon-1`,
    absence: 'evince',
    appeler: (adapter) => adapter.declarerJalon(SESSION_ID, JETON, 'b2-01-jalon-1', 'ca-va'),
  },
  {
    nom: 'envoyerDefi',
    url: `${URL_SEANCE}/defis/b2-01-defi/tentative`,
    absence: 'evince',
    appeler: (adapter) =>
      adapter.envoyerDefi(SESSION_ID, JETON, 'b2-01-defi', { texte: 'Comparer.', dureeMs: 4000 }),
  },
  {
    nom: 'tenterEnigme',
    url: `${URL_SEANCE}/escape/b2-01-coffre/tentatives`,
    absence: 'refusee',
    appeler: (adapter) =>
      adapter.tenterEnigme(SESSION_ID, JETON, 'b2-01-coffre', {
        enigmeId: 'enigme-1',
        reponse: '142 920',
        dureeMs: 9000,
      }),
  },
];

const ecriture: fc.Arbitrary<EcritureEtudiante> = fc.constantFrom(...ECRITURES);

const refus: fc.Arbitrary<RefusDuBack> = fc.constantFrom(...REFUS_DU_BACK);

const quatreCentQuatreNu: RefusDuBack = { statut: 404, motif: 'refusee' };

describe('simulation : chaque refus du back devient un motif affichable, quel que soit l’enchaînement', () => {
  const banc = bancAdaptateurHttp(FormationsHttpAdapter);
  let adapter: FormationsHttpAdapter;
  let httpMock: HttpTestingController;

  beforeEach(() => ({ adapter, httpMock } = banc));

  function refuser(cible: EcritureEtudiante, servi: RefusDuBack): ReponseRefusee | 'accepte' {
    const recus: unknown[] = [];
    const erreurs: unknown[] = [];

    cible.appeler(adapter).subscribe({
      next: (valeur: unknown) => recus.push(valeur),
      error: (recue: unknown) => erreurs.push(recue),
    });
    const requete = httpMock.expectOne(cible.url);
    if (servi.statut === 0) {
      requete.error(new ProgressEvent('error'));
    } else {
      requete.flush(buildProblemeHttp({ status: servi.statut, code: servi.code }), {
        status: servi.statut,
        statusText: 'Refus',
      });
    }

    return recus.length > 0 || erreurs.length !== 1 ? 'accepte' : (erreurs[0] as ReponseRefusee);
  }

  it('rend le motif attendu sur n’importe quelle suite de refus intercalés entre les routes', () => {
    fc.assert(
      fc.property(fc.array(fc.tuple(ecriture, refus), { minLength: 1, maxLength: 12 }), (suite) => {
        for (const [cible, servi] of suite) {
          const obtenu = refuser(cible, servi);

          expect(obtenu).not.toBe('accepte');
          const donne = obtenu as ReponseRefusee;
          expect(donne instanceof ReponseRefusee)
            .withContext(`${cible.nom} ${servi.statut} ${servi.code ?? 'sans code'}`)
            .toBeTrue();
          expect([donne.motif, donne.statut])
            .withContext(`${cible.nom} ${servi.statut} ${servi.code ?? 'sans code'}`)
            .toEqual([servi.motif, servi.statut]);
          expect(donne.message).not.toBe('');
        }
      }),
      { seed: GRAINE, numRuns: TOURS },
    );
  });

  it('ne garde « reseau » que pour les refus qu’il faut réessayer', () => {
    fc.assert(
      fc.property(ecriture, refus, (cible, servi) => {
        const donne = refuser(cible, servi) as ReponseRefusee;

        expect(donne.motif === 'reseau').toBe(STATUTS_A_RENVOYER.includes(servi.statut));
      }),
      { seed: GRAINE, numRuns: TOURS },
    );
  });

  it('lit un 404 nu comme une éviction, sauf sur la route des énigmes', () => {
    fc.assert(
      fc.property(ecriture, (cible) => {
        const donne = refuser(cible, quatreCentQuatreNu) as ReponseRefusee;

        expect(donne.motif).withContext(cible.nom).toBe(cible.absence);
      }),
      { seed: GRAINE, numRuns: TOURS },
    );
  });
});
