import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { CoursContent } from '../../../cours/content/types';

export interface FormationCataloguePort {
  lire(slug: string): Observable<CoursContent>;
}

export const FORMATION_CATALOGUE_PORT = new InjectionToken<FormationCataloguePort>(
  'FORMATION_CATALOGUE_PORT',
);
