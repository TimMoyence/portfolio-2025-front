import type { EnvironmentProviders, Provider } from '@angular/core';
import { AUTH_PORT } from '../../app/core/ports/auth.port';
import { NavbarComponent } from '../../app/shared/components/cadre/navbar/navbar.component';
import { createAuthPortStub } from '../factories/auth.factory';
import { pageMontee, type PageMontee } from './montage-page';

export const navbarMontee = (
  ...providers: (Provider | EnvironmentProviders)[]
): PageMontee<NavbarComponent> =>
  pageMontee(NavbarComponent, {
    providers: [{ provide: AUTH_PORT, useValue: createAuthPortStub() }, ...providers],
  });
