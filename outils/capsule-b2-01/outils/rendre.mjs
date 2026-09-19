// Rendu image par image de page/capsule.html (annexe A.1, étape 6).
// Usage : node outils/rendre.mjs <racine medias> [--apercu t1,t2,… <dossier>]
// Variables : PLAYWRIGHT_MODULE (index.mjs de Playwright), CHROMIUM (exécutable, facultatif).
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { pathToFileURL } from 'node:url';

const [racine, option, instants, dossierApercu] = process.argv.slice(2);
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);

const ORIGINE = 'https://capsule.invalid/';
const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
};
const fichiers = (chemin) =>
  chemin === 'timeline.json'
    ? join(racine, 'build', 'timeline.json')
    : join(racine, 'page', normalize(chemin));

const navigateur = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
const page = await navigateur.newPage({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
});
const horsLigne = [];
const erreurs = [];
page.on('pageerror', (e) => erreurs.push(String(e)));
page.on('console', (m) => {
  if (m.type() === 'error') erreurs.push(m.text());
});
await page.route('**/*', async (route) => {
  const url = route.request().url();
  if (!url.startsWith(ORIGINE)) {
    horsLigne.push(url);
    return route.abort();
  }
  const chemin = decodeURIComponent(new URL(url).pathname.slice(1));
  try {
    const corps = readFileSync(fichiers(chemin));
    return route.fulfill({
      status: 200,
      body: corps,
      contentType: TYPES[extname(chemin)] ?? 'application/octet-stream',
    });
  } catch {
    erreurs.push(`introuvable : ${chemin}`);
    return route.fulfill({ status: 404, body: '' });
  }
});

await page.goto(`${ORIGINE}capsule.html`);
await page.waitForFunction(() => window.__pret !== undefined);
const pret = await page.evaluate(() => window.__pret);
const verifications = await page.evaluate(() => window.__verifier());
const bilan = {
  navigateur: navigateur.version(),
  polices: pret.polices,
  mesures: pret.mesures,
  verifications,
  horsLigne,
  erreurs,
};
const echecs = [
  ...Object.entries(pret.polices)
    .filter(([, ok]) => !ok)
    .map(([p]) => `police non chargée : ${p}`),
  ...verifications
    .filter((v) => !v.ok)
    .map((v) => `vérification échouée à ${v.t} s : ${v.libelle}`),
  ...horsLigne.map((u) => `requête réseau refusée : ${u}`),
  ...erreurs,
];

if (option === '--apercu') {
  mkdirSync(dossierApercu, { recursive: true });
  for (const t of instants.split(',').map(Number)) {
    await page.evaluate((x) => window.__seek(x), t);
    await page.screenshot({ path: join(dossierApercu, `apercu-${t.toFixed(2)}.png`) });
  }
  console.log(JSON.stringify(bilan.verifications.filter((v) => !v.ok)));
  console.log(echecs.length ? echecs.join('\n') : 'aperçu sans erreur');
  await navigateur.close();
  process.exit(0);
}

if (echecs.length) {
  await navigateur.close();
  throw new Error(`Rendu refusé :\n${echecs.join('\n')}`);
}

const dossier = join(racine, 'build', 'images');
rmSync(dossier, { recursive: true, force: true });
mkdirSync(dossier, { recursive: true });
let precedent = null;
let captures = 0;
const debut = Date.now();
for (let f = 0; f < pret.images; f += 1) {
  const signature = await page.evaluate((t) => window.__seek(t), f / 30);
  const cible = join(dossier, `${String(f).padStart(5, '0')}.png`);
  if (signature === precedent) {
    copyFileSync(join(dossier, `${String(f - 1).padStart(5, '0')}.png`), cible);
  } else {
    await page.screenshot({ path: cible });
    captures += 1;
  }
  precedent = signature;
  if (f % 500 === 0) console.log(`image ${f}/${pret.images}`);
}
bilan.images = pret.images;
bilan.captures = captures;
bilan.dureeRenduS = (Date.now() - debut) / 1000;
if (horsLigne.length || erreurs.length) {
  await navigateur.close();
  throw new Error(`Erreurs pendant le rendu :\n${[...horsLigne, ...erreurs].join('\n')}`);
}
writeFileSync(join(racine, 'build', 'rendu.json'), `${JSON.stringify(bilan, null, 1)}\n`);
console.log(
  `${pret.images} images (${captures} captures distinctes) en ${bilan.dureeRenduS.toFixed(1)} s`,
);
await navigateur.close();
