import type { Provider, Type } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import type { NgForm } from '@angular/forms';
import { AUTH_PORT } from '../app/core/ports/auth.port';
import { createAuthPortStub } from './factories/auth.factory';
import { setupTestBed } from './setup-test-bed';

export interface PageAuthMontee<T> {
  fixture: ComponentFixture<T>;
  component: T;
  authService: ReturnType<typeof createAuthPortStub>;
}

export async function monterPageAuth<T>(
  composant: Type<T>,
  providers: Provider[] = [],
): Promise<PageAuthMontee<T>> {
  const authService = createAuthPortStub();

  await setupTestBed({
    router: true,
    imports: [composant],
    providers: [{ provide: AUTH_PORT, useValue: authService }, ...providers],
  }).compileComponents();

  const fixture = TestBed.createComponent(composant);
  return { fixture, component: fixture.componentInstance, authService };
}

export function formulaireSoumis(invalid = false): NgForm {
  return jasmine.createSpyObj<NgForm>('NgForm', ['resetForm'], { invalid, valid: !invalid });
}
