import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { setupTestBed } from '../../../testing/setup-test-bed';
import { BreakpointService } from './breakpoint.service';

function serviceSur(plateforme: 'browser' | 'server'): BreakpointService {
  setupTestBed({ http: false, providers: [{ provide: PLATFORM_ID, useValue: plateforme }] });
  return TestBed.inject(BreakpointService);
}

describe('BreakpointService', () => {
  it('le menu bascule quand la fenêtre franchit 1024 px, dans un sens puis dans l autre', () => {
    const ecouteurs: ((evenement: { matches: boolean }) => void)[] = [];
    const changer = (matches: boolean) => ecouteurs.forEach((ecouteur) => ecouteur({ matches }));
    const requete = spyOn(window, 'matchMedia').and.returnValue({
      matches: false,
      addEventListener: (_type: string, ecouteur: (typeof ecouteurs)[number]) =>
        ecouteurs.push(ecouteur),
    } as unknown as MediaQueryList);
    const service = serviceSur('browser');

    expect(requete).toHaveBeenCalledWith('(max-width: 1024px)');
    expect(service.isTabletOrBelow()).toBeFalse();
    changer(true);
    expect(service.isTabletOrBelow()).toBeTrue();
    changer(false);
    expect(service.isTabletOrBelow()).toBeFalse();
  });

  it('au rendu serveur, le menu n est pas en tablette et l écran n est pas interrogé', () => {
    const requete = spyOn(window, 'matchMedia');

    expect(serviceSur('server').isTabletOrBelow()).toBeFalse();
    expect(requete).not.toHaveBeenCalled();
  });
});
