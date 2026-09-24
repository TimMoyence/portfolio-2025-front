import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import type { ApplicationConfig } from '@angular/core';
import {
  provideClientHydration,
  withEventReplay,
  withHttpTransferCacheOptions,
} from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { AuthHttpAdapter } from './core/adapters/auth-http.adapter';
import { AuditRequestHttpAdapter } from './core/adapters/audit-request-http.adapter';
import { ContactHttpAdapter } from './core/adapters/contact-http.adapter';
import { LeadMagnetHttpAdapter } from './core/adapters/lead-magnet-http.adapter';
import { PresentationHttpAdapter } from './core/adapters/presentation-http.adapter';
import { CookieConsentHttpAdapter } from './core/adapters/cookie-consent-http.adapter';
import { FormationsHttpAdapter } from './core/adapters/formations-http.adapter';
import { FormationCatalogueHttpAdapter } from './core/adapters/formation-catalogue-http.adapter';
import { APP_CONFIG } from './core/config/app-config.token';
import { authInterceptor } from './core/http/interceptors/auth.interceptor';
import { requestIdInterceptor } from './core/http/interceptors/request-id.interceptor';
import { AUTH_PORT } from './core/ports/auth.port';
import { AUDIT_REQUEST_PORT } from './core/ports/audit-request.port';
import { CONTACT_PORT } from './core/ports/contact.port';
import { FORMATIONS_PORT } from './core/ports/formations.port';
import { FORMATION_CATALOGUE_PORT } from './core/ports/formation-catalogue.port';
import { LEAD_MAGNET_PORT } from './core/ports/lead-magnet.port';
import { PRESENTATION_PORT } from './core/ports/presentation.port';
import { COOKIE_CONSENT_PORT } from './core/ports/cookie-consent.port';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
    ),
    provideClientHydration(
      withEventReplay(),
      withHttpTransferCacheOptions({
        includePostRequests: false,
        filter: (req) => !req.url.includes('/auth/'),
      }),
    ),
    provideAnimations(),
    provideHttpClient(withInterceptors([authInterceptor, requestIdInterceptor]), withFetch()),

    {
      provide: APP_CONFIG,
      useValue: environment,
    },
    {
      provide: AUTH_PORT,
      useClass: AuthHttpAdapter,
    },
    {
      provide: CONTACT_PORT,
      useClass: ContactHttpAdapter,
    },
    {
      provide: AUDIT_REQUEST_PORT,
      useClass: AuditRequestHttpAdapter,
    },
    {
      provide: COOKIE_CONSENT_PORT,
      useClass: CookieConsentHttpAdapter,
    },
    {
      provide: LEAD_MAGNET_PORT,
      useClass: LeadMagnetHttpAdapter,
    },
    {
      provide: PRESENTATION_PORT,
      useClass: PresentationHttpAdapter,
    },
    {
      provide: FORMATIONS_PORT,
      useClass: FormationsHttpAdapter,
    },
    {
      provide: FORMATION_CATALOGUE_PORT,
      useClass: FormationCatalogueHttpAdapter,
    },
  ],
};
