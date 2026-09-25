import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { setupTestBed } from '../../../testing/setup-test-bed';
import { BreakpointService } from './breakpoint.service';

function serviceSur(plateforme: 'browser' | 'server'): BreakpointService {
  setupTestBed({ http: false, providers: [{ provide: PLATFORM_ID, useValue: plateforme }] });
  return TestBed.inject(BreakpointService);
}

describe('BreakpointService', () => {
  describe('en contexte navigateur', () => {
    let service: BreakpointService;

    beforeEach(() => {
      service = serviceSur('browser');
    });

    it('devrait se creer', () => {
      expect(service).toBeTruthy();
    });

    it('devrait exposer un signal isMobile booleen quelle que soit la taille du viewport', () => {
      expect(typeof service.isMobile()).toBe('boolean');
    });

    it('devrait exposer un signal isTabletOrBelow', () => {
      expect(typeof service.isTabletOrBelow()).toBe('boolean');
    });
  });

  describe('en contexte SSR', () => {
    let service: BreakpointService;

    beforeEach(() => {
      service = serviceSur('server');
    });

    it('devrait retourner false pour isMobile en SSR', () => {
      expect(service.isMobile()).toBeFalse();
    });

    it('devrait retourner false pour isTabletOrBelow en SSR', () => {
      expect(service.isTabletOrBelow()).toBeFalse();
    });
  });
});
