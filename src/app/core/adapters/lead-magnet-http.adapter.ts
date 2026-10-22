import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { getApiBaseUrl } from '../http/api-config';
import type { ToolkitPageData } from '../models/toolkit-page.model';
import type { ToolkitRequest, ToolkitResponse } from '../models/toolkit-request.model';
import type { LeadMagnetPort } from '../ports/lead-magnet.port';
import { luPar } from './lu-par';
import {
  zLeadMagnetResponseDto as guideDemandeServi,
  zToolkitPageResponseDto as guideServi,
} from '../../../../contrat/zod.gen';

@Injectable()
export class LeadMagnetHttpAdapter implements LeadMagnetPort {
  private readonly baseUrl = getApiBaseUrl();

  constructor(private readonly http: HttpClient) {}

  requestToolkit(request: ToolkitRequest): Observable<ToolkitResponse> {
    return this.http
      .post<unknown>(`${this.baseUrl}/lead-magnets/formations-toolkit`, request)
      .pipe(luPar(guideDemandeServi));
  }

  getToolkitByToken(token: string): Observable<ToolkitPageData> {
    return this.http
      .get<unknown>(`${this.baseUrl}/lead-magnets/toolkit/${encodeURIComponent(token)}`)
      .pipe(luPar(guideServi));
  }
}
