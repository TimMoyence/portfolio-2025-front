import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import { chantierApresRendu } from './chantier-apres-rendu';

describe('chantierApresRendu', () => {
  beforeEach(() => {
    setupTestBed({ http: false });
  });

  it('attend le premier rendu avant de lancer le travail', () => {
    const travail = jasmine.createSpy('travail').and.resolveTo();

    TestBed.runInInjectionContext(() => chantierApresRendu(travail));

    expect(travail).not.toHaveBeenCalled();

    TestBed.inject(ApplicationRef).tick();

    expect(travail).toHaveBeenCalledTimes(1);
  });

  it('se resout une fois le travail acheve', async () => {
    let acheve = false;
    const chantier = TestBed.runInInjectionContext(() =>
      chantierApresRendu(async () => {
        acheve = true;
      }),
    );

    TestBed.inject(ApplicationRef).tick();
    await chantier;

    expect(acheve).toBeTrue();
  });
});
