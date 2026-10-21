import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { ContactRequestDto, ContactResponseDto } from '../../../../contrat/types.gen';
import { zContactResponseDto } from '../../../../contrat/zod.gen';
import { getApiBaseUrl } from '../http/api-config';
import type { ContactPort } from '../ports/contact.port';
import { luPar } from './lu-par';

@Injectable()
export class ContactHttpAdapter implements ContactPort {
  private readonly baseUrl = getApiBaseUrl();

  constructor(private readonly http: HttpClient) {}

  contact(credentials: ContactRequestDto): Observable<ContactResponseDto> {
    return this.http
      .post<unknown>(`${this.baseUrl}/contacts`, credentials)
      .pipe(luPar(zContactResponseDto));
  }
}
