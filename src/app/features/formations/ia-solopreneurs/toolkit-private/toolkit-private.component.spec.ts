import type { ComponentFixture } from '@angular/core/testing';
import { TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { NEVER, of, throwError } from 'rxjs';
import { LEAD_MAGNET_PORT } from '../../../../core/ports/lead-magnet.port';
import {
  HTTP_RESPONSE_STATUS,
  type HttpResponseStatus,
} from '../../../../core/ssr/http-response-status';
import {
  buildToolkitPageData,
  createLeadMagnetPortStub,
} from '../../../../../testing/factories/lead-magnet.factory';
import { fournirLaRoute } from '../../../../../testing/factories/serveur/route.factory';
import {
  poserLePressePapiers,
  rendreLePressePapiers,
} from '../../../../../testing/dom/presse-papiers';
import { ToolkitPrivateComponent } from './toolkit-private.component';

interface SetupOptions {
  token?: string | null;
  behaviour?: 'success' | 'error' | 'pending';
  platform?: 'browser' | 'server';
  statut?: HttpResponseStatus;
}

function setup(opts: SetupOptions = {}): {
  fixture: ComponentFixture<ToolkitPrivateComponent>;
  component: ToolkitPrivateComponent;
  port: ReturnType<typeof createLeadMagnetPortStub>;
} {
  const { token = 'valid-token', behaviour = 'success', platform = 'browser', statut } = opts;

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
      fournirLaRoute({ parametres: token ? { token } : {} }),
      ...(statut === undefined ? [] : [{ provide: HTTP_RESPONSE_STATUS, useValue: statut }]),
    ],
  });

  const fixture = TestBed.createComponent(ToolkitPrivateComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, port };
}

describe('ToolkitPrivateComponent', () => {
  afterEach(() => {
    document.documentElement.classList.remove('anim-ready');
    rendreLePressePapiers();
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
    const statut = jasmine.createSpyObj<HttpResponseStatus>('statut', ['set']);
    const { component, fixture } = setup({ behaviour: 'error', statut });
    expect(statut.set).toHaveBeenCalledOnceWith(404);
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
    expect(compiled.querySelector('.tkp-table')).not.toBeNull();
    expect(compiled.textContent).toContain('Email de relance');
  });

  it('copie le prompt affiché au clic, puis l annonce sur son bouton', fakeAsync(() => {
    const { fixture } = setup({ behaviour: 'success' });
    const writeText = jasmine.createSpy('writeText').and.resolveTo();
    poserLePressePapiers(writeText);
    const compiled = fixture.nativeElement as HTMLElement;
    const bouton = compiled.querySelector<HTMLButtonElement>('.tkp-copy');
    const prompt = bouton?.parentElement?.querySelector('pre')?.textContent;

    expect(bouton?.textContent?.trim()).toBe('Copier');
    bouton?.click();
    flushMicrotasks();
    fixture.detectChanges();

    expect(prompt).toBeTruthy();
    expect(writeText).toHaveBeenCalledOnceWith(prompt);
    expect(bouton?.textContent?.trim()).toBe('Copié !');
    tick(2000);
  }));
});
