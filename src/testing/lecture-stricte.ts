import type { Observable } from 'rxjs';
import { z } from 'zod';
import { environment } from '../environments/environment';
import { reponsesServiesPar } from './fixtures/reponses-servies';
import type { BancHttp } from './http-attendu';
import { CLE_INCONNUE } from './tolerances-des-schemas';

export interface LectureDuSite<T> {
  readonly route: string;
  readonly chemin: string;
  readonly appel: (adapter: T) => Observable<unknown>;
}

interface Relais {
  readonly recues: unknown[];
  readonly erreurs: unknown[];
}

function relayer<T>(banc: BancHttp<T>, lecture: LectureDuSite<T>, corps: unknown): Relais {
  const relais: Relais = { recues: [], erreurs: [] };
  lecture.appel(banc.adapter).subscribe({
    next: (lu) => relais.recues.push(lu),
    error: (erreur: unknown) => relais.erreurs.push(erreur),
  });
  banc.httpMock
    .expectOne((requete) => requete.url === `${environment.apiBaseUrl}${lecture.chemin}`)
    .flush(corps as object);
  return relais;
}

export function avecUneCleHorsContrat(corps: unknown): unknown {
  return { ...(corps as object), [CLE_INCONNUE]: true };
}

export function lecturesStrictes<T>(
  banc: BancHttp<T>,
  lectures: readonly LectureDuSite<T>[],
): void {
  for (const lecture of lectures) {
    const servies = reponsesServiesPar(lecture.route);

    it(`${lecture.route} : relaie chaque réponse servie et refuse une clé hors contrat`, () => {
      expect(servies.length)
        .withContext(`aucune réponse servie pour ${lecture.route}`)
        .toBeGreaterThan(0);
      for (const corps of servies) {
        expect(relayer(banc, lecture, corps)).toEqual({ recues: [corps], erreurs: [] });

        const refusee = relayer(banc, lecture, avecUneCleHorsContrat(corps));
        expect(refusee.recues).toEqual([]);
        expect(refusee.erreurs).toEqual([jasmine.any(z.ZodError)]);
      }
    });
  }
}
