import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { SlideInteractions } from '../models/presentation-interactions.model';

export interface PresentationInteractionsResponse {
  slug: string;
  interactions: Record<string, SlideInteractions>;
}

export interface PresentationPort {
  getInteractions(slug: string): Observable<PresentationInteractionsResponse>;
}

export const PRESENTATION_PORT = new InjectionToken<PresentationPort>('PRESENTATION_PORT');
