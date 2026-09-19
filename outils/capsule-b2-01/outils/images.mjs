// Images historiques M1 à M4 (§ 8.2) : vérification sur Wikimedia Commons, téléchargement de
// l'original, contrôle SHA-1, dérivé WebP (≤ 1 600 px de large, ≤ 400 000 octets).
// Usage : node outils/images.mjs <racine medias>
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const racine = process.argv[2];
const AGENT = 'AsiliDesignCoursB2/1.0 (https://asilidesign.fr; production de medias pedagogiques)';
const LARGEUR_MAX = 1600;
const POIDS_MAX = 400_000;
const DERIVES = join(racine, 'assets', 'cours', 'b2-01', 'v3');
const ORIGINAUX = join(racine, 'build', 'originaux');

const IMAGES = [
  {
    id: 'M1',
    ecran: 'A1-02',
    fichier:
      'File:1786_Playfair_-_Exports_and_Imports_of_Scotland_to_and_from_different_parts_for_one_Year_from_Christmas_1780_to_Christmas_1781.jpg',
    derive: 'playfair-ecosse-1786.webp',
    auteurAttendu: 'William Playfair',
    attribution: 'William Playfair, 1786 · Wikimedia Commons (domaine public)',
  },
  {
    id: 'M2',
    ecran: 'A2-01',
    fichier: 'File:Playfair_TimeSeries.png',
    derive: 'playfair-series-1786.webp',
    auteurAttendu: 'William Playfair',
    attribution: 'Document original · Wikimedia Commons (domaine public)',
  },
  {
    id: 'M3',
    ecran: 'A5-01',
    fichier: 'File:Nightingale-mortality.jpg',
    derive: 'nightingale-1858.webp',
    auteurAttendu: 'Florence Nightingale',
    attribution: 'Florence Nightingale, 1858 · Wikimedia Commons (domaine public)',
  },
  {
    id: 'M4',
    ecran: 'A6-01',
    fichier: 'File:Pacioli.jpg',
    derive: 'pacioli-1495.webp',
    auteurAttendu: "Jacopo de' Barbari",
    attribution:
      'Portrait attribué à Jacopo de’ Barbari, 1495 · Wikimedia Commons (domaine public)',
  },
];

const nettoyer = (v) =>
  String(v ?? '')
    .replace(/<[^<>]*>/g, '')
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

async function requete(url, type = 'json') {
  for (let essai = 1; essai <= 4; essai += 1) {
    const reponse = await fetch(url, { headers: { 'User-Agent': AGENT } });
    if (reponse.ok)
      return type === 'json' ? reponse.json() : Buffer.from(await reponse.arrayBuffer());
    if (essai === 4) throw new Error(`${url} : HTTP ${reponse.status}`);
    await new Promise((r) => setTimeout(r, 1500 * essai));
  }
  throw new Error('inaccessible');
}

const api = (params) =>
  requete(
    `https://commons.wikimedia.org/w/api.php?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`,
  );

mkdirSync(DERIVES, { recursive: true });
mkdirSync(ORIGINAUX, { recursive: true });
const titres = IMAGES.map((i) => i.fichier).join('|');
const info = await api({
  action: 'query',
  titles: titres,
  prop: 'imageinfo',
  iiprop: 'url|size|sha1|mime|extmetadata|timestamp',
});
const texte = await api({
  action: 'query',
  titles: titres,
  prop: 'revisions',
  rvprop: 'content|ids|timestamp',
  rvslots: 'main',
});
const normaliser = (t) => t.replace(/_/g, ' ');

const resultat = [];
for (const image of IMAGES) {
  const page = info.query.pages.find((p) => p.title === normaliser(image.fichier));
  const revision = texte.query.pages.find((p) => p.title === normaliser(image.fichier))
    .revisions[0];
  const ii = page.imageinfo[0];
  const em = ii.extmetadata;
  const modeles = [...revision.slots.main.content.matchAll(/\{\{\s*((?:PD|Pd)[^{}]*)\}\}/g)].map(
    (m) => m[1].trim(),
  );
  const auteur = nettoyer(em.Artist?.value);
  const licence = nettoyer(em.LicenseShortName?.value);
  if (!auteur.includes(image.auteurAttendu))
    throw new Error(`${image.id} : auteur inattendu « ${auteur} »`);
  if (licence !== 'Public domain' || em.Copyrighted?.value !== 'False')
    throw new Error(`${image.id} : licence « ${licence} »`);
  if (!modeles.length) throw new Error(`${image.id} : aucun modèle de domaine public`);

  const extension = image.fichier.split('.').pop().toLowerCase();
  const original = join(ORIGINAUX, `${image.id}.${extension}`);
  let octets = existsSync(original) ? readFileSync(original) : null;
  // eslint-disable-next-line sonarjs/hashing -- SHA-1 publié par l'API Commons (imageinfo.sha1) : contrôle d'intégrité du téléchargement, aucun usage de sécurité.
  const sha1 = (b) => createHash('sha1').update(b).digest('hex');
  if (!octets || sha1(octets) !== ii.sha1) {
    octets = await requete(ii.url.split('?')[0], 'binaire');
    writeFileSync(original, octets);
  }
  if (sha1(octets) !== ii.sha1) throw new Error(`${image.id} : SHA-1 différent de Commons`);
  if (octets.length !== ii.size) throw new Error(`${image.id} : taille différente de Commons`);

  const largeur = Math.min(LARGEUR_MAX, ii.width);
  let qualite = 90;
  let webp;
  for (;;) {
    webp = await sharp(octets)
      .rotate()
      .resize({ width: largeur, withoutEnlargement: true })
      .webp({ quality: qualite, effort: 6 })
      .toBuffer();
    if (webp.length <= POIDS_MAX || qualite <= 50) break;
    qualite -= 4;
  }
  if (webp.length > POIDS_MAX)
    throw new Error(`${image.id} : ${webp.length} octets > ${POIDS_MAX}`);
  writeFileSync(join(DERIVES, image.derive), webp);
  const meta = await sharp(webp).metadata();
  resultat.push({
    id: image.id,
    ecran: image.ecran,
    page: ii.descriptionurl,
    original: ii.url.split('?')[0],
    originalLargeur: ii.width,
    originalHauteur: ii.height,
    originalOctets: ii.size,
    originalSha1: ii.sha1,
    originalMime: ii.mime,
    revisionCommons: revision.revid,
    revisionDate: revision.timestamp,
    auteur,
    date: nettoyer(em.DateTimeOriginal?.value).replace(/date QS:.*$/, ''),
    credit: nettoyer(em.Credit?.value),
    licence: 'domaine public',
    licenceCommons: licence,
    modelesLicence: modeles,
    derive: image.derive,
    deriveLargeur: meta.width,
    deriveHauteur: meta.height,
    deriveOctets: webp.length,
    deriveSha256: createHash('sha256').update(webp).digest('hex'),
    qualiteWebp: qualite,
    attribution: image.attribution,
  });
  console.log(
    `${image.id} ${image.derive} ${meta.width}×${meta.height} q${qualite} ${webp.length} o · ${auteur} · ${modeles.join(', ')}`,
  );
}
writeFileSync(
  join(racine, 'build', 'images.json'),
  `${JSON.stringify({ sharp: sharp.versions, images: resultat }, null, 1)}\n`,
);
