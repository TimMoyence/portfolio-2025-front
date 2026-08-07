import type { ComponentFixture } from '@angular/core/testing';
import { TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { NEVER, of, throwError } from 'rxjs';
import { LEAD_MAGNET_PORT } from '../../../../core/ports/lead-magnet.port';
import {
  buildToolkitPageData,
  createLeadMagnetPortStub,
} from '../../../../../testing/factories/lead-magnet.factory';
import { ToolkitPrivateComponent } from './toolkit-private.component';

/** Options de configuration d'un cas de test. */
interface SetupOptions {
  /** Token present dans la route (`null` = absent). */
  token?: string | null;
  /** Comportement du port : succes, erreur, ou jamais resolu (loading). */
  behaviour?: 'success' | 'error' | 'pending';
  /** Plateforme simulee pour le guard SSR. */
  platform?: 'browser' | 'server';
}

/**
 * Configure le TestBed et instancie le composant. La logique vit dans le
 * constructeur : on construit donc le composant APRES avoir fixe le token et le
 * comportement du port.
 */
function setup(opts: SetupOptions = {}): {
  fixture: ComponentFixture<ToolkitPrivateComponent>;
  component: ToolkitPrivateComponent;
  port: ReturnType<typeof createLeadMagnetPortStub>;
} {
  const { token = 'valid-token', behaviour = 'success', platform = 'browser' } = opts;

  const port = createLeadMagnetPortStub();
  if (behaviour === 'success') {
    port.getToolkitByToken.and.returnValue(of(buildToolkitPageData()));
  } else if (behaviour === 'error') {
    port.getToolkitByToken.and.returnValue(throwError(() => new Error('token invalide')));
  } else {
    port.getToolkitByToken.and.returnValue(NEVER);
  }

  TestBed.configureTestingModule({
    imports: [ToolkitPrivateComponent],
    providers: [
      provideRouter([]),
      { provide: LEAD_MAGNET_PORT, useValue: port },
      { provide: PLATFORM_ID, useValue: platform },
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            paramMap: convertToParamMap(token ? { token } : {}),
          },
        },
      },
    ],
  });

  const fixture = TestBed.createComponent(ToolkitPrivateComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, port };
}

/** Remplace `navigator.clipboard` par un spy controlable (robuste headless). */
function stubClipboard(writeText: jasmine.Spy): void {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
}

describe('ToolkitPrivateComponent', () => {
  // `appReveal`/animations posent `anim-ready` sur <html> (singleton partage).
  afterEach(() => {
    document.documentElement.classList.remove('anim-ready');
  });

  it("devrait afficher l'etat de chargement tant que le toolkit n'est pas resolu", () => {
    const { component, fixture } = setup({ behaviour: 'pending' });
    expect(component.state()).toBe('loading');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.tkp-spinner')).not.toBeNull();
  });

  it('devrait passer en erreur (sans appeler le port) quand le token est absent', () => {
    const { component, port, fixture } = setup({ token: null });
    expect(component.state()).toBe('error');
    expect(port.getToolkitByToken).not.toHaveBeenCalled();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.tkp-state__inner--error')).not.toBeNull();
  });

  it('devrait resoudre le token via le port', () => {
    const { port } = setup({ token: 'abc-123' });
    expect(port.getToolkitByToken).toHaveBeenCalledWith('abc-123');
  });

  it('devrait passer en erreur quand la resolution du token echoue', () => {
    const { component, fixture } = setup({ behaviour: 'error' });
    expect(component.state()).toBe('error');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Impossible de charger');
  });

  it('devrait afficher le toolkit resolu (etat debloque)', () => {
    const { component, fixture } = setup({ behaviour: 'success' });
    expect(component.state()).toBe('loaded');
    expect(component.isLoaded()).toBeTrue();

    const compiled = fixture.nativeElement as HTMLElement;
    const headings = compiled.querySelectorAll('h1');
    expect(headings.length).toBe(1);
    expect(headings[0]?.textContent).toContain('Accès');
    expect(headings[0]?.querySelector('em')?.textContent).toContain('débloqué');
    // Sections personnalisees reellement rendues depuis les donnees du token.
    expect(compiled.querySelector('.tkp-table')).not.toBeNull();
    expect(compiled.textContent).toContain('Email de relance');
  });

  it('devrait copier un texte et afficher le feedback de succes', fakeAsync(() => {
    const { component } = setup({ behaviour: 'success' });
    const writeText = jasmine.createSpy('writeText').and.returnValue(Promise.resolve());
    stubClipboard(writeText);

    component.copyToClipboard('mon-prompt');
    flushMicrotasks();

    expect(writeText).toHaveBeenCalledWith('mon-prompt');
    expect(component.copiedText()).toBe('mon-prompt');
    expect(component.copyErrorText()).toBeNull();
    expect(component['copyButtonLabel']('mon-prompt')).toBe(component['copiedLabel']);

    // Le feedback est temporaire : il disparait apres le delai.
    tick(2000);
    expect(component.copiedText()).toBeNull();
  }));

  it("ne devrait PAS marquer comme copie et devrait signaler l'echec si le presse-papier rejette", fakeAsync(() => {
    const { component } = setup({ behaviour: 'success' });
    const consoleError = spyOn(console, 'error');
    const writeText = jasmine
      .createSpy('writeText')
      .and.returnValue(Promise.reject(new Error('permission refusee')));
    stubClipboard(writeText);

    component.copyToClipboard('texte-ko');
    flushMicrotasks();

    expect(component.copiedText()).toBeNull();
    expect(component.copyErrorText()).toBe('texte-ko');
    expect(component['copyButtonLabel']('texte-ko')).toBe(component['copyErrorLabel']);
    expect(consoleError).toHaveBeenCalled();

    tick(2500);
    expect(component.copyErrorText()).toBeNull();
  }));

  it('ne devrait PAS acceder au presse-papier cote serveur (guard SSR)', () => {
    const { component } = setup({ behaviour: 'success', platform: 'server' });
    const writeText = jasmine.createSpy('writeText');
    stubClipboard(writeText);

    component.copyToClipboard('rien-cote-serveur');

    expect(writeText).not.toHaveBeenCalled();
    expect(component.copiedText()).toBeNull();
    expect(component.copyErrorText()).toBeNull();
  });
});
