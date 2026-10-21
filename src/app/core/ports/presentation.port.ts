import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { PresentationInteractionsResponseDto } from '../../../../contrat/types.gen';

export type PresentationInteractionsResponse = PresentationInteractionsResponseDto;

export interface PresentationPort {
  getInteractions(slug: string): Observable<PresentationInteractionsResponse>;
}

export const PRESENTATION_PORT = new InjectionToken<PresentationPort>('PRESENTATION_PORT');
