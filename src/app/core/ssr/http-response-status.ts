import { InjectionToken } from '@angular/core';

export interface HttpResponseStatus {
  set(code: number): void;
}

export const HTTP_RESPONSE_STATUS = new InjectionToken<HttpResponseStatus>('HTTP_RESPONSE_STATUS');
