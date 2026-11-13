import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  AbonnementNewsletterResponseDto,
  ConfirmationNewsletterResponseDto,
  DesabonnementNewsletterResponseDto,
  SubscribeNewsletterRequestDto,
} from '../../../../contrat/types.gen';

export interface NewsletterPort {
  sAbonner(demande: SubscribeNewsletterRequestDto): Observable<AbonnementNewsletterResponseDto>;
  confirmer(jeton: string): Observable<ConfirmationNewsletterResponseDto>;
  seDesabonner(jeton: string): Observable<DesabonnementNewsletterResponseDto>;
}

export const NEWSLETTER_PORT = new InjectionToken<NewsletterPort>('NEWSLETTER_PORT');
