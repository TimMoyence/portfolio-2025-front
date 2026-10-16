import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import { CLE_DE_LA_FENETRE } from './app/core/services/fenetre-de-renouvellement';
import { chargerLesPolicesDeLApplication } from './testing/polices';

getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting(), {
  errorOnUnknownElements: true,
  errorOnUnknownProperties: true,
});

beforeAll(async () => {
  await chargerLesPolicesDeLApplication();
});

afterEach(() => {
  localStorage.removeItem(CLE_DE_LA_FENETRE);
});
