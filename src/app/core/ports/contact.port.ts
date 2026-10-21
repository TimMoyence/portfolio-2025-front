import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { ContactRequestDto, ContactResponseDto } from '../../../../contrat/types.gen';

export interface ContactPort {
  contact(credentials: ContactRequestDto): Observable<ContactResponseDto>;
}

export const CONTACT_PORT = new InjectionToken<ContactPort>('CONTACT_PORT');
