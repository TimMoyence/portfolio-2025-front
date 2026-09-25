import type { HttpErrorResponse } from '@angular/common/http';
import type { TestRequest } from '@angular/common/http/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import type { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { setupTestBed, type SetupTestBedOptions } from './setup-test-bed';

export interface BancHttp<T> {
  adapter: T;
  httpMock: HttpTestingController;
}

export function bancAdaptateurHttp<T>(
  adaptateur: Type<T>,
  socle: SetupTestBedOptions = { providers: [adaptateur] },
): BancHttp<T> {
  const banc = {} as BancHttp<T>;

  beforeEach(() => {
    setupTestBed(socle);
    banc.adapter = TestBed.inject(adaptateur);
    banc.httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    banc.httpMock.verify();
  });

  return banc;
}

export function verifierPostRelaye<R extends object>(
  appel: Observable<R>,
  httpMock: HttpTestingController,
  chemin: string,
  corps: unknown,
  reponse: R,
): TestRequest {
  const recues: R[] = [];
  appel.subscribe((resultat) => recues.push(resultat));

  const requete = httpMock.expectOne(`${environment.apiBaseUrl}${chemin}`);
  expect(requete.request.method).toBe('POST');
  expect(requete.request.body).toEqual(corps);
  requete.flush(reponse);

  expect(recues).toEqual([reponse]);
  return requete;
}

export function verifierErreurRelayee(
  appel: Observable<unknown>,
  httpMock: HttpTestingController,
  chemin: string,
  echec: { corps: string; status: number; statusText: string },
): void {
  const statuts: number[] = [];
  appel.subscribe({
    next: () => fail('should have failed'),
    error: (error: HttpErrorResponse) => statuts.push(error.status),
  });

  const requete = httpMock.expectOne(`${environment.apiBaseUrl}${chemin}`);
  requete.flush(echec.corps, { status: echec.status, statusText: echec.statusText });

  expect(statuts).toEqual([echec.status]);
}
