import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { PleinEcranSimule } from '../../../../testing/plein-ecran-simule';
import { simulerLePleinEcran } from '../../../../testing/plein-ecran-simule';
import { FullscreenAdapter } from './fullscreen.adapter';

describe('FullscreenAdapter', () => {
  describe('en environnement browser', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [FullscreenAdapter, { provide: PLATFORM_ID, useValue: 'browser' }],
      });
    });

    it("appelle requestFullscreen sur l'élément fourni", async () => {
      const adapter = TestBed.inject(FullscreenAdapter);
      const el = document.createElement('div');
      const spy = spyOn(el, 'requestFullscreen').and.resolveTo();
      await adapter.enter(el);
      expect(spy).toHaveBeenCalled();
    });

    it('ne lance pas si requestFullscreen indisponible', async () => {
      const adapter = TestBed.inject(FullscreenAdapter);
      const el = { requestFullscreen: undefined } as unknown as HTMLElement;
      expect(await adapter.enter(el)).toBeUndefined();
    });

    it('appelle document.exitFullscreen quand sorti', async () => {
      const adapter = TestBed.inject(FullscreenAdapter);
      const spy = spyOn(document, 'exitFullscreen').and.resolveTo();
      Object.defineProperty(document, 'fullscreenElement', {
        configurable: true,
        get: () => document.body,
      });
      await adapter.exit();
      expect(spy).toHaveBeenCalled();
    });

    describe('basculer', () => {
      let ecran: PleinEcranSimule;

      beforeEach(() => {
        ecran = simulerLePleinEcran();
      });

      afterEach(() => ecran.restaurer());

      it("passe l'element en plein ecran et rend l'etat obtenu", async () => {
        const adapter = TestBed.inject(FullscreenAdapter);
        const el = document.createElement('div');
        spyOn(el, 'requestFullscreen').and.callFake(async () => ecran.activer(el));

        expect(await adapter.basculer(el)).toBeTrue();
      });

      it('sort du plein ecran quand il est actif', async () => {
        const adapter = TestBed.inject(FullscreenAdapter);
        ecran.activer(document.body);
        spyOn(document, 'exitFullscreen').and.callFake(async () => ecran.activer(null));

        expect(await adapter.basculer(document.documentElement)).toBeFalse();
      });

      it("rend l'etat inchange quand le navigateur refuse", async () => {
        const adapter = TestBed.inject(FullscreenAdapter);
        const el = document.createElement('div');
        spyOn(el, 'requestFullscreen').and.rejectWith(new TypeError('refus'));

        expect(await adapter.basculer(el)).toBeFalse();
      });
    });
  });

  describe('en environnement SSR', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [FullscreenAdapter, { provide: PLATFORM_ID, useValue: 'server' }],
      });
    });

    it('enter() est un no-op en SSR', async () => {
      const adapter = TestBed.inject(FullscreenAdapter);
      const el = document.createElement('div');
      const spy = spyOn(el, 'requestFullscreen');
      await adapter.enter(el);
      expect(spy).not.toHaveBeenCalled();
    });

    it('loadSwiperElement() est un no-op en SSR', async () => {
      const adapter = TestBed.inject(FullscreenAdapter);
      expect(await adapter.loadSwiperElement()).toBeUndefined();
    });
  });
});
