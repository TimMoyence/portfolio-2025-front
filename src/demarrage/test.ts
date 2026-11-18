import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import { CLE_DE_LA_FENETRE } from '../app/core/services/fenetre-de-renouvellement';
import { chargerLesPolicesDeLApplication } from '../testing/rendu/polices';
import { jouerLaTranche } from '../testing/environnement/tranche-de-la-suite';

interface ClientKarma {
  readonly __karma__?: { readonly config?: { readonly tranche?: string } };
}

jouerLaTranche(jasmine.getEnv(), (window as ClientKarma).__karma__?.config?.tranche);

getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting(), {
  errorOnUnknownElements: true,
  errorOnUnknownProperties: true,
});

const DELAI_DE_CHARGEMENT_DES_POLICES_MS = 60_000;

beforeAll(async () => {
  await chargerLesPolicesDeLApplication();
}, DELAI_DE_CHARGEMENT_DES_POLICES_MS);

afterEach(() => {
  localStorage.removeItem(CLE_DE_LA_FENETRE);
});
