import { TestBed } from '@angular/core/testing';
import { setupTestBed } from '../../../testing/setup-test-bed';
import { AuthErreurComponent } from './auth-erreur.component';

describe('AuthErreurComponent', () => {
  function monter(message: string | undefined): HTMLElement {
    setupTestBed({ imports: [AuthErreurComponent] });
    const fixture = TestBed.createComponent(AuthErreurComponent);
    fixture.componentRef.setInput('message', message);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('annonce l erreur recue aux technologies d assistance', () => {
    const alerte = monter('Lien expiré').querySelector('[role="alert"]');

    expect(alerte?.textContent?.trim()).toBe('Lien expiré');
    expect(alerte?.getAttribute('aria-live')).toBe('assertive');
  });

  it('ne rend rien tant qu aucune erreur n est survenue', () => {
    expect(monter(undefined).querySelector('[role="alert"]')).toBeNull();
  });
});
