import type { HttpTestingController } from '@angular/common/http/testing';
import type { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export function verifierPostRelaye<R extends object>(
  appel: Observable<R>,
  httpMock: HttpTestingController,
  chemin: string,
  corps: unknown,
  reponse: R,
): void {
  const recues: R[] = [];
  appel.subscribe((resultat) => recues.push(resultat));

  const requete = httpMock.expectOne(`${environment.apiBaseUrl}${chemin}`);
  expect(requete.request.method).toBe('POST');
  expect(requete.request.body).toEqual(corps);
  requete.flush(reponse);

  expect(recues).toEqual([reponse]);
}
