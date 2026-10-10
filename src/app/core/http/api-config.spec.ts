import { TestBed } from '@angular/core/testing';
import { setupTestBed } from '../../../testing/setup-test-bed';
import { getApiFormationsUrl } from './api-config';

describe('getApiFormationsUrl', () => {
  it('rattache la ressource formations a la base de l API configuree', () => {
    setupTestBed({ http: false, appConfig: { apiBaseUrl: 'https://api.exemple.fr/v1' } });

    expect(TestBed.runInInjectionContext(getApiFormationsUrl)).toBe(
      'https://api.exemple.fr/v1/formations',
    );
  });
});
