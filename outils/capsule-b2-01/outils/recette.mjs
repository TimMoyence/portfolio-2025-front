// Recette des médias livrés (annexe A.1, étape 11 ; AC-22 et AC-23) et images de contrôle.
// Usage : node outils/recette.mjs <racine medias>
import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const racine = resolve(process.argv[2]);
const exiger = createRequire(join(racine, 'package.json'));
const FFMPEG = exiger('ffmpeg-static');
const FFPROBE = exiger('ffprobe-static').path;
const V3 = join(racine, 'assets', 'cours', 'b2-01', 'v3');
const T = JSON.parse(readFileSync(join(racine, 'build', 'timeline.json'), 'utf8'));
const rendu = JSON.parse(readFileSync(join(racine, 'build', 'rendu.json'), 'utf8'));
const lancer = (binaire, args) => {
  const r = spawnSync(binaire, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`${binaire} ${args.join(' ')}\n${r.stderr}`);
  return r;
};

const criteres = [];
const noter = (critere, mesure, ok) => criteres.push({ critere, mesure, ok: Boolean(ok) });

const videos = [
  {
    fichier: 'capsule-formule-recopiable-720p.webm',
    largeur: 1280,
    hauteur: 720,
    poidsMax: 25_000_000,
  },
  {
    fichier: 'capsule-formule-recopiable-480p.webm',
    largeur: 854,
    hauteur: 480,
    poidsMax: 8_000_000,
  },
];
const sondes = {};
for (const v of videos) {
  const chemin = join(V3, v.fichier);
  const sonde = JSON.parse(
    lancer(FFPROBE, ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', chemin]).stdout,
  );
  const video = sonde.streams.find((s) => s.codec_type === 'video');
  const audio = sonde.streams.find((s) => s.codec_type === 'audio');
  const duree = Number(sonde.format.duration);
  const octets = statSync(chemin).size;
  const journal = lancer(FFMPEG, [
    '-hide_banner',
    '-nostdin',
    '-i',
    chemin,
    '-af',
    'ebur128=peak=true',
    '-f',
    'null',
    '-',
  ]).stderr;
  const resume = journal.slice(journal.lastIndexOf('Summary:'));
  const integre = Number(/I:\s+(-?[\d.]+) LUFS/.exec(resume)[1]);
  const crete = Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(resume)[1]);
  const lra = Number(/LRA:\s+(-?[\d.]+) LU/.exec(resume)[1]);
  sondes[v.fichier] = {
    video: {
      codec: video.codec_name,
      profil: video.profile,
      largeur: video.width,
      hauteur: video.height,
      pixels: video.pix_fmt,
      images: video.r_frame_rate,
    },
    audio: {
      codec: audio.codec_name,
      frequence: Number(audio.sample_rate),
      canaux: audio.channels,
      langue: audio.tags?.language,
    },
    dureeS: duree,
    octets,
    integreLufs: integre,
    creteVraieDbtp: crete,
    lraLu: lra,
    etiquettes: sonde.format.tags ?? {},
  };
  noter(
    `${v.fichier} : codecs VP9 + Opus`,
    `${video.codec_name} + ${audio.codec_name}`,
    video.codec_name === 'vp9' && audio.codec_name === 'opus',
  );
  noter(
    `${v.fichier} : ${v.largeur} × ${v.hauteur}, 30 images/s`,
    `${video.width} × ${video.height}, ${video.r_frame_rate}`,
    video.width === v.largeur && video.height === v.hauteur && video.r_frame_rate === '30/1',
  );
  noter(
    `${v.fichier} : durée de 145 à 155 s`,
    `${duree.toFixed(3)} s`,
    duree >= 145 && duree <= 155,
  );
  noter(
    `${v.fichier} : poids ≤ ${v.poidsMax / 1e6} Mo`,
    `${(octets / 1e6).toFixed(2)} Mo`,
    octets <= v.poidsMax,
  );
  noter(`${v.fichier} : −16 LUFS ± 1`, `${integre} LUFS`, Math.abs(integre + 16) <= 1);
  noter(`${v.fichier} : crête vraie ≤ −1,5 dBTP`, `${crete} dBTP`, crete <= -1.5);
}

const affiche = JSON.parse(
  lancer(FFPROBE, [
    '-v',
    'error',
    '-show_streams',
    '-of',
    'json',
    join(V3, 'capsule-formule-recopiable.jpg'),
  ]).stdout,
).streams[0];
noter(
  'affiche JPEG 1 280 × 720',
  `${affiche.codec_name} ${affiche.width} × ${affiche.height}`,
  affiche.codec_name === 'mjpeg' && affiche.width === 1280,
);
const instantAffiche = T.plans.find((p) => p.id === 'P09').fin - 0.5;
const verifAffiche = rendu.verifications.find((v) => v.libelle.startsWith('affiche'));
noter(
  'affiche : les deux contrôles à 1 (fin de P09 − 0,5 s)',
  `${instantAffiche.toFixed(3)} s`,
  verifAffiche?.ok,
);

const vtt = readFileSync(join(V3, 'capsule-formule-recopiable.fr.vtt'), 'utf8');
const temps = (s) => {
  const [h, m, r] = s.split(':');
  return Number(h) * 3600 + Number(m) * 60 + Number(r);
};
const repliques = vtt
  .split(/\n\n+/)
  .map((bloc) => bloc.split('\n'))
  .filter((l) => /-->/.test(l[1] ?? ''))
  .map(([id, minutage, ...lignes]) => {
    const [debut, fin] = minutage.split(' --> ').map(temps);
    const caracteres = lignes.reduce((n, l) => n + [...l].length, 0);
    return { id, debut, fin, lignes, caracteres, cps: caracteres / (fin - debut) };
  });
noter(
  'WebVTT : en-tête et 29 répliques',
  `${repliques.length} répliques`,
  vtt.startsWith('WEBVTT') && repliques.length === 29,
);
noter(
  'WebVTT : au plus 2 lignes de 42 caractères',
  `${Math.max(...repliques.map((r) => Math.max(...r.lignes.map((l) => [...l].length))))} car. au plus`,
  repliques.every((r) => r.lignes.length <= 2 && r.lignes.every((l) => [...l].length <= 42)),
);
const cpsMax = Math.max(...repliques.map((r) => r.cps));
const cpsMoyen =
  repliques.reduce((s, r) => s + r.caracteres, 0) /
  repliques.reduce((s, r) => s + r.fin - r.debut, 0);
noter(
  'WebVTT : aucune réplique au-delà de 15 car./s',
  `${cpsMax.toFixed(2)} car./s au plus`,
  cpsMax <= 15.0001,
);
noter('WebVTT : 12 car./s en moyenne', `${cpsMoyen.toFixed(2)} car./s`, cpsMoyen <= 12);
noter(
  'WebVTT : répliques ordonnées, sans chevauchement, dans la durée',
  `dernière fin ${repliques.at(-1).fin} s`,
  repliques.every(
    (r, i) =>
      r.fin > r.debut && (i === 0 || r.debut >= repliques[i - 1].fin - 1e-6) && r.fin <= T.total,
  ),
);

const echecsSync = rendu.verifications.filter((v) => !v.ok);
noter(
  'valeurs prononcées visibles au moment où elles sont dites',
  `${rendu.verifications.length - echecsSync.length}/${rendu.verifications.length}`,
  echecsSync.length === 0,
);
noter(
  'page de rendu sans ressource réseau',
  `${rendu.horsLigne.length} requête(s) externe(s)`,
  rendu.horsLigne.length === 0,
);
noter(
  'polices embarquées chargées',
  Object.values(rendu.polices).every(Boolean) ? 'toutes' : 'manquantes',
  Object.values(rendu.polices).every(Boolean),
);

const scripts = [
  join(racine, 'produire.sh'),
  ...readdirSync(join(racine, 'outils'))
    .map((f) => join(racine, 'outils', f))
    .filter((f) => statSync(f).isFile()),
];
const APPELS_SAY = [
  /^[ \t]*(\/usr\/bin\/)?say\s/m,
  /[;&|`]\s*(\/usr\/bin\/)?say\s/,
  /\$\(\s*(\/usr\/bin\/)?say\s/,
  /(spawn|exec)\w*\(\s*['"`](\/usr\/bin\/)?say['"`]/,
  /subprocess\.\w+\(\s*\[\s*['"](\/usr\/bin\/)?say['"]/,
];
const appelsSay = scripts.filter((f) => {
  const code = readFileSync(f, 'utf8').replace(/^[ \t]*(#|\/\/).*$/gm, '');
  return APPELS_SAY.some((motif) => motif.test(code));
});
noter(
  'aucune voix système macOS (`say`) dans la chaîne',
  appelsSay.length ? appelsSay.join(', ') : 'aucun appel',
  appelsSay.length === 0,
);

const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const navigateur = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
const page = await navigateur.newPage();
const ORIGINE = 'https://lecteur.invalid/';
await page.route('**/*', async (route) => {
  const url = new URL(route.request().url());
  if (url.origin + '/' !== ORIGINE) return route.abort();
  const nom = url.pathname.slice(1);
  if (nom === 'lecteur.html') {
    return route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><meta charset="utf-8"><video id="v" preload="auto" src="capsule-formule-recopiable-720p.webm" poster="capsule-formule-recopiable.jpg"><track id="p" kind="subtitles" srclang="fr" label="Français" src="capsule-formule-recopiable.fr.vtt" default></video><video id="w" preload="metadata" src="capsule-formule-recopiable-480p.webm"></video>`,
    });
  }
  const types = { webm: 'video/webm', vtt: 'text/vtt', jpg: 'image/jpeg' };
  const octets = readFileSync(join(V3, nom));
  const plage = route.request().headers().range;
  if (plage) {
    const [, a, b] = /bytes=(\d+)-(\d*)/.exec(plage);
    const debut = Number(a);
    const fin = b ? Number(b) : octets.length - 1;
    return route.fulfill({
      status: 206,
      headers: {
        'Content-Range': `bytes ${debut}-${fin}/${octets.length}`,
        'Accept-Ranges': 'bytes',
        'Content-Type': types[nom.split('.').pop()],
      },
      body: octets.subarray(debut, fin + 1),
    });
  }
  return route.fulfill({
    contentType: types[nom.split('.').pop()],
    headers: { 'Accept-Ranges': 'bytes' },
    body: octets,
  });
});
await page.goto(`${ORIGINE}lecteur.html`);
const lecture = await page.evaluate(async () => {
  const v = document.getElementById('v');
  const w = document.getElementById('w');
  const pret = (el) =>
    new Promise((ok, ko) => {
      if (el.readyState >= 1) return ok();
      el.addEventListener('loadedmetadata', ok, { once: true });
      el.addEventListener('error', () => ko(new Error(`erreur ${el.error?.code}`)), { once: true });
    });
  await Promise.all([pret(v), pret(w)]);
  const piste = v.textTracks[0];
  const trackEl = document.getElementById('p');
  if (trackEl.readyState !== 2)
    await new Promise((ok) => trackEl.addEventListener('load', ok, { once: true }));
  v.currentTime = 25;
  await new Promise((ok) => v.addEventListener('seeked', ok, { once: true }));
  return {
    duree720: v.duration,
    duree480: w.duration,
    largeur: v.videoWidth,
    hauteur: v.videoHeight,
    mode: piste.mode,
    langue: piste.language,
    repliques: piste.cues.length,
    active: [...piste.activeCues].map((c) => c.text),
    typeLisible: v.canPlayType('video/webm; codecs="vp9, opus"'),
  };
});
await navigateur.close();
noter(
  'Chromium lit les deux WebM',
  `720p ${lecture.duree720.toFixed(3)} s · 480p ${lecture.duree480.toFixed(3)} s`,
  lecture.duree720 > 145 && lecture.duree480 > 145,
);
noter(
  'piste WebVTT lue et activée par défaut',
  `mode ${lecture.mode}, ${lecture.repliques} répliques, langue ${lecture.langue}`,
  lecture.mode === 'showing' && lecture.repliques === 29 && lecture.langue === 'fr',
);
noter(
  'réplique affichée au bon moment (25 s)',
  lecture.active.join(' / '),
  lecture.active.length === 1,
);

const P = Object.fromEntries(T.plans.map((p) => [p.id, p]));
const a = (plan, cle) => P[plan].ancres[cle];
const instants = [
  ['01-titre', 3],
  ['02-total-120000', (a('P02', 'cent-vingt-mille').debut + a('P02', 'cent-vingt-mille').fin) / 2],
  ['03-depart-clignote', a('P03', 'depart').debut + 0.1],
  ['04-recopie', a('P04', 'c2-c3').fin],
  ['05-div0', (a('P05', 'erreur').debut + a('P05', 'erreur').fin) / 2],
  ['06-parts-figees', (a('P06', 'cent-pour-cent').debut + a('P06', 'cent-pour-cent').fin) / 2],
  ['07-accolades', a('P07', 'affiche-1').fin],
  ['08-controle-0', (a('P08', 'passe-0').debut + a('P08', 'passe-0').fin) / 2],
  ['09-affiche', instantAffiche],
  ['10-recapitulatif', P.P10.fin - 0.5],
  ['11-credits', P.P11.fin - 1],
];
const controle = join(racine, 'controle');
rmSync(controle, { recursive: true, force: true });
mkdirSync(controle, { recursive: true });
for (const [nom, t] of instants) {
  lancer(FFMPEG, [
    '-hide_banner',
    '-nostdin',
    '-y',
    '-ss',
    t.toFixed(3),
    '-i',
    join(V3, 'capsule-formule-recopiable-720p.webm'),
    '-frames:v',
    '1',
    join(controle, `${nom}-${t.toFixed(2)}s.png`),
  ]);
}
lancer(FFMPEG, [
  '-hide_banner',
  '-nostdin',
  '-y',
  '-ss',
  a('P05', 'erreur').fin.toFixed(3),
  '-i',
  join(V3, 'capsule-formule-recopiable-480p.webm'),
  '-frames:v',
  '1',
  join(controle, `12-poste-480p-div0.png`),
]);

const bilan = {
  date: new Date().toISOString(),
  criteres,
  sondes,
  lecture,
  sousTitres: { cpsMax, cpsMoyen, repliques: repliques.length },
  imagesControle: readdirSync(controle),
};
writeFileSync(join(racine, 'build', 'recette.json'), `${JSON.stringify(bilan, null, 1)}\n`);
for (const c of criteres) console.log(`${c.ok ? 'OK ' : 'KO '} ${c.critere} — ${c.mesure}`);
const echecs = criteres.filter((c) => !c.ok);
if (echecs.length) throw new Error(`${echecs.length} critère(s) de recette en échec`);
console.log(
  `recette : ${criteres.length} critères satisfaits · ${readdirSync(controle).length} images de contrôle dans controle/`,
);
