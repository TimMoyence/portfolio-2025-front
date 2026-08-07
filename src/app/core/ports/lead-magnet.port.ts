import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { ToolkitPageData } from '../models/toolkit-page.model';
import type { ToolkitRequest, ToolkitResponse } from '../models/toolkit-request.model';

export interface LeadMagnetPort {
  requestToolkit(request: ToolkitRequest): Observable<ToolkitResponse>;
  getToolkitByToken(token: string): Observable<ToolkitPageData>;
}

export const LEAD_MAGNET_PORT = new InjectionToken<LeadMagnetPort>('LEAD_MAGNET_PORT');
