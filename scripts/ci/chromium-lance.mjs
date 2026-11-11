import { chromium } from '@playwright/test';

const navigateur = await chromium.launch();
const page = await navigateur.newPage();
await page.setContent('<p>chromium</p>');
const texte = await page.textContent('p');
await navigateur.close();

if (texte !== 'chromium') {
  throw new Error(`chromium a rendu « ${texte} » au lieu de « chromium »`);
}
console.log(`chromium ${navigateur.version()} se lance et rend une page`);
