import { expect, test } from '@playwright/test';

import { baseSsr, exigerLaPorteSsr } from './porte-ssr';

const REDIRECTIONS_PERMANENTES: ReadonlyArray<readonly [string, string]> = [
  ['/atelier', '/fr/projets'],
  ['/fr/atelier', '/fr/projets'],
  ['/fr/atelier/meteo/app', '/fr/projets'],
  ['/en/atelier/sebastian/app/badges', '/en/projets'],
  ['/fr/commonbudgetTM', '/fr/'],
  ['/en/commonbudgetTM', '/en/'],
  ['/home', '/fr/'],
  ['/fr/home', '/fr/'],
  ['/fr', '/fr/'],
  ['/en', '/en/'],
  ['/fr/contact/', '/fr/contact'],
  ['/fr/formations/automatiser-avec-ia/toolkit', '/fr/formations/automatiser-avec-ia'],
  ['/en/formations/automatiser-avec-ia/toolkit', '/en/formations/automatiser-avec-ia'],
  ['/fr/formations/audit-seo-diy/toolkit', '/fr/formations/audit-seo-diy'],
  ['/en/formations/audit-seo-diy/toolkit', '/en/formations/audit-seo-diy'],
];

test.describe('le serveur refuse les URL que le routeur ne doit pas analyser', () => {
  exigerLaPorteSsr();

  for (const chemin of ['/fr/a;1=1;2=2', '/fr/(secondaire:page)', `/fr/${'a'.repeat(2048)}`]) {
    test(`${chemin.slice(0, 40)} répond 400 sans rendu`, async ({ request }) => {
      const reponse = await request.get(`${baseSsr}${chemin}`, { maxRedirects: 0 });

      expect(reponse.status()).toBe(400);
    });
  }
});

test.describe('les pages retirées répondent un vrai 301', () => {
  exigerLaPorteSsr();

  for (const [ancienne, cible] of REDIRECTIONS_PERMANENTES) {
    test(`${ancienne} redirige en 301 vers ${cible}`, async ({ request }) => {
      const reponse = await request.get(`${baseSsr}${ancienne}`, { maxRedirects: 0 });

      expect(reponse.status()).toBe(301);
      expect(reponse.headers()['location']).toBe(cible);
    });
  }
});
