import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { environment } from '../environments/environnement';
import { routes } from './app.routes';
import { APP_CONFIG } from './core/config/app-config.token';
import { errorInterceptor } from './core/http/interceptors/error.interceptor';
import { requestIdInterceptor } from './core/http/interceptors/request-id.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' })
    ),
    provideClientHydration(),
    provideAnimations(),
    provideHttpClient(
      withInterceptors([
        requestIdInterceptor,
        errorInterceptor
      ])
    ),

    {
      provide: APP_CONFIG,
      useValue: environment
    }
  ]
};
