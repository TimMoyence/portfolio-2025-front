import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { getApiBaseUrl } from '../http/api-config';
import type { NewsletterPort } from '../ports/newsletter.port';
import { luPar } from './formations/lu-par';
import {
  zAbonnementNewsletterResponseDto as abonnementServi,
  zConfirmationNewsletterResponseDto as confirmationServie,
  zDesabonnementNewsletterResponseDto as desabonnementServi,
} from '../../../../contrat/zod.gen';

@Injectable()
export class NewsletterHttpAdapter implements NewsletterPort {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = getApiBaseUrl();

  readonly sAbonner: NewsletterPort['sAbonner'] = (demande) =>
    this.http
      .post<unknown>(`${this.baseUrl}/newsletter/subscribe`, demande)
      .pipe(luPar(abonnementServi));

  readonly confirmer: NewsletterPort['confirmer'] = (jeton) =>
    this.http
      .post<unknown>(`${this.baseUrl}/newsletter/confirm`, null, { params: { token: jeton } })
      .pipe(luPar(confirmationServie));

  readonly seDesabonner: NewsletterPort['seDesabonner'] = (jeton) =>
    this.http
      .post<unknown>(`${this.baseUrl}/newsletter/unsubscribe`, null, { params: { token: jeton } })
      .pipe(luPar(desabonnementServi));
}
