// Manifestes : capsule-formule-recopiable.manifest.json (annexe A.1, étape 10), versionné avec les
// médias, et MANIFESTE.md (livrables, provenance, licences, commandes, versions, écarts).
// Usage : node outils/manifeste.mjs <racine medias>
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, dirname, join, resolve } from 'node:path';

const racine = resolve(process.argv[2]);
const exiger = createRequire(join(racine, 'package.json'));
const lire = (...p) => JSON.parse(readFileSync(join(racine, ...p), 'utf8'));
const sha256 = (chemin) => createHash('sha256').update(readFileSync(chemin)).digest('hex');
const sortie = (binaire, args) => spawnSync(binaire, args, { encoding: 'utf8' });
const V3 = join(racine, 'assets', 'cours', 'b2-01', 'v3');
const CIBLE = 'src/assets/cours/b2-01/v3';
const KIT = 'outils/capsule-b2-01';
const DOCUMENT = '../portfolio-2025-back/docs/cours-b2-01-conception.md';

const T = lire('build', 'timeline.json');
const audio = lire('build', 'audio.json');
const soustitres = lire('build', 'repliques-minutees.json');
const rendu = lire('build', 'rendu.json');
const recette = lire('build', 'recette.json');
const images = lire('build', 'images.json');
const licences = lire('build', 'licences.json');
const contrastes = lire('build', 'contrastes.json');
const prononciation = lire('sources', 'prononciation.json');
const pistes = T.plans.filter((p) => p.voix).map((p) => lire('build', 'audio', `${p.id}.json`));

const FFMPEG = exiger('ffmpeg-static');
const FFPROBE = exiger('ffprobe-static').path;
const python = join(racine, '.venv', 'bin', 'python');
const versionsPython = JSON.parse(
  sortie(python, [
    '-c',
    'import json,sys,importlib.metadata as m;print(json.dumps({"python":sys.version.split()[0],**{p:m.version(p) for p in ["piper-tts","onnxruntime","onnx","numpy"]}}))',
  ]).stdout,
);
const playwright = JSON.parse(
  readFileSync(join(dirname(process.env.PLAYWRIGHT_MODULE), 'package.json'), 'utf8'),
);
const versionPaquet = (nom) => exiger(`${nom}/package.json`).version;
const outils = {
  node: process.version,
  ffmpeg: `${sortie(FFMPEG, ['-version']).stdout.split('\n')[0]} (paquet npm ffmpeg-static ${versionPaquet('ffmpeg-static')})`,
  ffprobe: `${sortie(FFPROBE, ['-version']).stdout.split('\n')[0]} (paquet npm ffprobe-static ${versionPaquet('ffprobe-static')})`,
  piper: `piper-tts ${versionsPython['piper-tts']} (Python ${versionsPython.python}, onnxruntime ${versionsPython.onnxruntime}, onnx ${versionsPython.onnx})`,
  playwright: `playwright ${playwright.version} (dépôt front, ${process.env.PLAYWRIGHT_MODULE})`,
  chromium: `Chrome for Testing ${rendu.navigateur}, chrome-headless-shell (${basename(dirname(dirname(process.env.CHROMIUM)))})`,
  sharp: `sharp ${images.sharp.sharp} (libvips ${images.sharp.vips}, libwebp ${images.sharp.webp})`,
  polices: `@fontsource/atkinson-hyperlegible ${versionPaquet('@fontsource/atkinson-hyperlegible')}, @fontsource/jetbrains-mono ${versionPaquet('@fontsource/jetbrains-mono')}`,
  systeme: sortie('uname', ['-srm']).stdout.trim(),
};

const modele = join(racine, 'modele', 'fr_FR-siwis-medium.onnx');
const webm720 = recette.sondes['capsule-formule-recopiable-720p.webm'];
const webm480 = recette.sondes['capsule-formule-recopiable-480p.webm'];

const CREDITS_CAPSULE =
  'Une formule qui se recopie, un tableau qui se contrôle · Tim Moyence — Asili Design, 2026 · Licence CC BY-SA 4.0 · Voix de synthèse : Piper, modèle fr_FR-siwis-medium (licence MIT) ; données SIWIS : J. Yamagishi, P.-E. Honnet, P. Garner, A. Lazaridis, Université d’Édimbourg, CC BY 4.0 (https://doi.org/10.7488/ds/1705) · Polices Atkinson Hyperlegible et JetBrains Mono (SIL OFL 1.1) · Données fictives · Transcription et sous-titres disponibles';

const MEDIAS_CAPSULE = {
  'capsule-formule-recopiable-720p.webm': 'vidéo de projection (VP9/Opus, 1 280 × 720)',
  'capsule-formule-recopiable-480p.webm': 'vidéo des postes étudiants (VP9/Opus, 854 × 480)',
  'capsule-formule-recopiable.jpg': 'affiche (dernière image de P09, les deux contrôles à 1)',
  'capsule-formule-recopiable.fr.vtt': 'sous-titres français (WebVTT)',
};
const fichiersCapsule = Object.entries(MEDIAS_CAPSULE).map(([fichier, role]) => {
  const chemin = join(V3, fichier);
  return {
    fichier,
    role,
    chemin: `/assets/cours/b2-01/v3/${fichier}`,
    octets: statSync(chemin).size,
    sha256: sha256(chemin),
  };
});

const manifeste = {
  titre: 'Une formule qui se recopie, un tableau qui se contrôle',
  cours: 'B2-01 V3 · écran A4-01 (média M5)',
  auteur: 'Tim Moyence — Asili Design',
  annee: 2026,
  licence: 'CC BY-SA 4.0',
  licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/deed.fr',
  credits: {
    texte: CREDITS_CAPSULE,
    voix: {
      moteur: 'Piper',
      modele: 'fr_FR-siwis-medium',
      licenceModele: 'MIT',
      sourcesLicenceModele: licences.modele.preuveLicence,
      carteModele: licences.modele.carte,
    },
    donneesVocales: {
      titre: licences.donnees.titre,
      auteurs: licences.donnees.auteurs,
      editeur: licences.donnees.editeur,
      licence: 'CC BY 4.0',
      licenceUrl: licences.donnees.licenceUrl,
      doi: 'https://doi.org/10.7488/ds/1705',
      notice: licences.donnees.notice,
      citation: licences.donnees.citation,
    },
    polices: [
      {
        nom: 'Atkinson Hyperlegible',
        auteur: 'Braille Institute of America',
        licence: 'SIL OFL 1.1',
      },
      {
        nom: 'JetBrains Mono',
        auteur: 'The JetBrains Mono Project Authors',
        licence: 'SIL OFL 1.1',
      },
    ],
    donnees: 'fictives (annexe A.3)',
  },
  production: {
    date: new Date().toISOString(),
    chaine: 'produire.sh (page HTML/SVG rendue image par image, Piper, FFmpeg)',
    outils,
    voixSysteme: 'aucune (la voix macOS « say » n’intervient à aucune étape)',
  },
  voix: {
    modele: {
      fichier: 'fr_FR-siwis-medium.onnx',
      sha256: sha256(modele),
      configSha256: sha256(`${modele}.json`),
      depot: 'https://huggingface.co/rhasspy/piper-voices (fr/fr_FR/siwis/medium/)',
      commit: licences.modele.commitDepot,
    },
    lengthScale: pistes[0].length_scale,
    graineOnnxRuntime: pistes[0].graine,
    prononciation: prononciation,
    pistes: pistes.map((p) => ({
      plan: p.plan,
      dureeS: Math.round(p.duree * 1000) / 1000,
      sha256: p.sha256,
      texte: p.texte,
    })),
  },
  minutage: {
    imagesParSeconde: T.ips,
    attaqueS: T.attaque,
    pauseS: T.pause,
    pauseCalculeeS: Math.round(T.pauseIdeale * 1000) / 1000,
    totalS: Math.round(T.total * 1000) / 1000,
    images: T.images,
    plans: T.plans.map((p) => ({
      id: p.id,
      debutS: Math.round(p.debut * 1000) / 1000,
      dureeS: Math.round(p.duree * 1000) / 1000,
      voixS: p.voix ? Math.round(p.voix.duree * 1000) / 1000 : 0,
      pauseS: Math.round(p.pause * 1000) / 1000,
    })),
  },
  audio: {
    normalisation: {
      filtre: `${audio.limiteur},loudnorm=I=-16:TP=-1.5:LRA=11 (deux passes, linear=true)`,
      mode: audio.typeNormalisation,
      narrationBrute: {
        integreLufs: Number(audio.narrationBrute.input_i),
        creteVraieDbtp: Number(audio.narrationBrute.input_tp),
      },
      passe1: {
        integreLufs: Number(audio.passe1.input_i),
        creteVraieDbtp: Number(audio.passe1.input_tp),
        lraLu: Number(audio.passe1.input_lra),
        seuil: Number(audio.passe1.input_thresh),
        decalage: Number(audio.passe1.target_offset),
      },
      sortieWav: audio.narrationNorm,
    },
    mesureWebm720p: {
      integreLufs: webm720.integreLufs,
      creteVraieDbtp: webm720.creteVraieDbtp,
      lraLu: webm720.lraLu,
    },
    mesureWebm480p: {
      integreLufs: webm480.integreLufs,
      creteVraieDbtp: webm480.creteVraieDbtp,
      lraLu: webm480.lraLu,
    },
  },
  sousTitres: {
    repliques: soustitres.repliques.length,
    densiteMaxCps: Math.round(soustitres.cpsMax * 100) / 100,
    densiteMoyenneCps: Math.round(soustitres.cpsMoyen * 100) / 100,
    retardMaxS: Math.round(soustitres.retardMax * 100) / 100,
    anticipationMaxS: Math.round(soustitres.anticipationMax * 100) / 100,
  },
  videos: {
    '720p': webm720,
    '480p': webm480,
  },
  recette: recette.criteres,
  synchronisation: rendu.verifications,
  fichiers: fichiersCapsule,
};
const cheminManifeste = join(V3, 'capsule-formule-recopiable.manifest.json');
writeFileSync(cheminManifeste, `${JSON.stringify(manifeste, null, 2)}\n`);

// ------------------------------------------------------------------ MANIFESTE.md
const ko = (o) => `${(o / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} ko`;
const lignesLivrables = [];
for (const f of fichiersCapsule) {
  lignesLivrables.push(
    `| \`${CIBLE}/${f.fichier}\` | ${f.role} | ${ko(f.octets)} (${f.octets} o) | \`${f.sha256}\` | capsule produite (annexe A) — Tim Moyence — Asili Design, 2026 | CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/deed.fr) ; voix Piper fr_FR-siwis-medium (MIT) ; données SIWIS CC BY 4.0 (https://doi.org/10.7488/ds/1705) ; polices SIL OFL 1.1 |`,
  );
}
lignesLivrables.push(
  `| \`${CIBLE}/capsule-formule-recopiable.manifest.json\` | manifeste de production (A.1, étape 10) | ${ko(statSync(cheminManifeste).size)} (${statSync(cheminManifeste).size} o) | \`${sha256(cheminManifeste)}\` | généré par \`outils/manifeste.mjs\` | CC BY-SA 4.0 |`,
);
for (const i of images.images) {
  const modeles = i.modelesLicence.map((m) => `{{${m}}}`).join(', ');
  lignesLivrables.push(
    `| \`${CIBLE}/${i.derive}\` | ${i.id} (écran ${i.ecran}), WebP ${i.deriveLargeur} × ${i.deriveHauteur}, qualité ${i.qualiteWebp} | ${ko(i.deriveOctets)} (${i.deriveOctets} o) | \`${i.deriveSha256}\` | ${i.auteur}, ${i.date} — page ${i.page} — original ${i.original} (${i.originalLargeur} × ${i.originalHauteur}, ${i.originalOctets} o, SHA-1 \`${i.originalSha1}\`, révision ${i.revisionCommons}) | domaine public (Commons : ${modeles}) — attribution affichée : « ${i.attribution} » |`,
  );
}

const ecartsMd = readFileSync(join(racine, 'sources', 'ecarts.md'), 'utf8');
const criteresMd = recette.criteres
  .map(
    (c) => `| ${c.ok ? 'OK' : 'KO'} | ${c.critere} | ${String(c.mesure).replace(/\n/g, ' / ')} |`,
  )
  .join('\n');
const syncMd = rendu.verifications
  .map((v) => `| ${v.ok ? 'OK' : 'KO'} | ${v.t.toFixed(3)} s | ${v.libelle} |`)
  .join('\n');
const contrastesMd = contrastes
  .map((c) => `| ${c.ok ? 'OK' : 'KO'} | ${c.rapport.toFixed(2)}:1 (≥ ${c.seuil}) | ${c.libelle} |`)
  .join('\n');
const plansMd = manifeste.minutage.plans
  .map(
    (p) =>
      `| ${p.id} | ${p.debutS.toFixed(3)} | ${p.dureeS.toFixed(3)} | ${p.voixS.toFixed(3)} | ${p.pauseS.toFixed(3)} |`,
  )
  .join('\n');
const controles = readdirSync(join(racine, 'controle'))
  .map((f) => `- \`${KIT}/controle/${f}\``)
  .join('\n');

const md = `# Manifeste — médias du cours B2-01 V3 (lot 5)

Produit le ${manifeste.production.date} par \`${KIT}/produire.sh\`, qui refait toute la chaîne
depuis zéro. Tous les chemins de ce manifeste sont relatifs à la racine du dépôt front.
Cahier des charges : \`${DOCUMENT}\` (annexe A, § 7.3, § 8.2, § 8.3).

La chaîne écrit ses livrables dans \`${KIT}/assets/cours/b2-01/v3/\` (dossier non versionné) :
copier ce dossier dans \`${CIBLE}/\` (servi à \`/assets/cours/b2-01/v3/\`).

## Livrables

| Chemin cible (dépôt front) | Rôle | Poids | SHA-256 | Source, auteur | Licence, URL |
| --- | --- | --- | --- | --- | --- |
${lignesLivrables.join('\n')}

## Capsule : mesures

| Mesure | 720p (projection) | 480p (postes) |
| --- | --- | --- |
| Codecs | ${webm720.video.codec} ${webm720.video.profil ?? ''} + ${webm720.audio.codec} ${webm720.audio.frequence} Hz ${webm720.audio.canaux === 1 ? 'mono' : 'stéréo'} | ${webm480.video.codec} ${webm480.video.profil ?? ''} + ${webm480.audio.codec} ${webm480.audio.frequence} Hz |
| Définition, cadence | ${webm720.video.largeur} × ${webm720.video.hauteur}, ${webm720.video.images} | ${webm480.video.largeur} × ${webm480.video.hauteur}, ${webm480.video.images} |
| Durée | ${webm720.dureeS.toFixed(3)} s (cible 150 ± 5) | ${webm480.dureeS.toFixed(3)} s |
| Poids | ${ko(webm720.octets)} (plafond 25 Mo) | ${ko(webm480.octets)} (plafond 8 Mo) |
| Intensité intégrée (ebur128) | ${webm720.integreLufs} LUFS | ${webm480.integreLufs} LUFS |
| Crête vraie | ${webm720.creteVraieDbtp} dBTP | ${webm480.creteVraieDbtp} dBTP |
| Plage de variation (LRA) | ${webm720.lraLu} LU | ${webm480.lraLu} LU |

Sous-titres : ${manifeste.sousTitres.repliques} répliques, densité maximale ${manifeste.sousTitres.densiteMaxCps} car./s,
moyenne ${manifeste.sousTitres.densiteMoyenneCps} car./s, retard maximal sur la parole ${manifeste.sousTitres.retardMaxS} s,
anticipation maximale ${manifeste.sousTitres.anticipationMaxS} s.

### Minutage réel (secondes)

| Plan | Début | Durée | Voix | Pause |
| --- | --- | --- | --- | --- |
${plansMd}

Total : ${manifeste.minutage.totalS} s, ${manifeste.minutage.images} images à ${manifeste.minutage.imagesParSeconde} i/s.

## Crédits de la capsule (carton final P11 et métadonnées WebM)

${CREDITS_CAPSULE}

## Licences vérifiées à la source (${licences.verifieLe})

- **Voix Piper \`fr_FR-siwis-medium\`, modèle sous licence MIT** : en-tête \`license: mit\` du dépôt
  https://huggingface.co/rhasspy/piper-voices (README.md et API \`cardData.license\`), commit
  \`${licences.modele.commitDepot}\`. Fiche du modèle : ${licences.modele.carte}
  (« Dataset … License: CC-BY 4.0 », jeu https://datashare.is.ed.ac.uk/handle/10283/2353).
  Modèle : \`fr_FR-siwis-medium.onnx\`, SHA-256 \`${manifeste.voix.modele.sha256}\` (identique à l’ETag LFS publié).
- **Données SIWIS, CC BY 4.0** : ${licences.donnees.citation}
  Notice : ${licences.donnees.notice} ; licence : ${licences.donnees.licenceUrl}.
- **Logiciel Piper** : ${licences.logicielPiper.paquet}, ${licences.logicielPiper.licence}.
- **Polices** : Atkinson Hyperlegible (© 2020 Braille Institute of America) et JetBrains Mono
  (© 2020 The JetBrains Mono Project Authors), SIL OFL 1.1 (fichiers \`LICENSE\` des paquets @fontsource).
- **Images historiques** : pages Commons ci-dessus, auteur, date et modèle de licence relus par l’API
  (\`extmetadata\` et wikitexte) ; originaux contrôlés par leur SHA-1 publié.
- **Capsule** : CC BY-SA 4.0, Tim Moyence — Asili Design (https://creativecommons.org/licenses/by-sa/4.0/deed.fr).

## Outils et versions

${Object.entries(outils)
  .map(([k, v]) => `- **${k}** : ${v}`)
  .join('\n')}
- **modèle** : fr_FR-siwis-medium, commit \`${licences.modele.commitDepot}\`, ONNX SHA-256 \`${manifeste.voix.modele.sha256}\`, JSON SHA-256 \`${manifeste.voix.modele.configSha256}\`

## Commandes (extraites de \`produire.sh\`, lancées depuis \`${KIT}/\`)

\`\`\`sh
# Voix (une piste par plan, texte du § A.4) — API Python de Piper, équivalente à
#   piper --model fr_FR-siwis-medium.onnx --length_scale 1.15 --output_file audio/Pnn.wav < voix/Pnn.txt
# plus une graine ONNX Runtime fixe (${manifeste.voix.graineOnnxRuntime}) et les alignements par phonème.
.venv/bin/python outils/synthetiser.py .
node outils/minuter.mjs .            # timeline.json et capsule-formule-recopiable.fr.vtt
node outils/rendre.mjs .             # images/%05d.png via window.__seek(f / 30), 1 280 × 720, DSF 1
node outils/audio.mjs .              # placement, concaténation, loudnorm 2 passes
"$FFMPEG" -framerate 30 -i build/images/%05d.png -i build/narration-norm.wav -c:v libvpx-vp9 -b:v 0 -crf 33 -row-mt 1 -pix_fmt yuv420p -c:a libopus -b:a 96k -shortest <métadonnées> -fflags +bitexact capsule-formule-recopiable-720p.webm
"$FFMPEG" -i capsule-formule-recopiable-720p.webm -vf scale=854:480 -c:v libvpx-vp9 -b:v 0 -crf 36 -row-mt 1 -pix_fmt yuv420p -c:a copy -fflags +bitexact capsule-formule-recopiable-480p.webm
"$FFMPEG" -ss ${(T.plans.find((p) => p.id === 'P09').fin - 0.5).toFixed(3)} -i capsule-formule-recopiable-720p.webm -frames:v 1 -q:v 3 capsule-formule-recopiable.jpg
node outils/images.mjs .             # M1 à M4 : Commons → WebP ≤ 1 600 px, ≤ 400 000 o
node outils/recette.mjs .            # ffprobe, ebur128, lecture Chromium, images de contrôle
\`\`\`

Reproductibilité constatée : trois productions complètes, dont une depuis zéro
(\`./produire.sh --propre\`) et la dernière depuis le kit versionné \`${KIT}/\` recopié dans un
dossier temporaire, donnent des pistes Piper, une narration normalisée, 4 550 images, un WebVTT,
une affiche et des WebP identiques à l’octet ; les flux VP9 et Opus sont identiques
(\`-f streamhash\`) et, avec \`-fflags +bitexact\`, un réencodage redonne des WebM identiques à
l’octet. Seul le manifeste JSON change d’une production à l’autre (date de production).

Placement de chaque piste : \`aresample=48000,adelay=400:all=1,apad=whole_len=N,atrim=end_sample=N\`
(N = durée du plan × 48 000). Normalisation : \`${manifeste.audio.normalisation.filtre}\`, mode ${manifeste.audio.normalisation.mode}.

## Recette

| État | Critère | Mesure |
| --- | --- | --- |
${criteresMd}

### Valeurs prononcées visibles au moment où elles sont dites

| État | Instant | Vérification |
| --- | --- | --- |
${syncMd}

### Contrastes de la charte (WCAG 2.2)

| État | Rapport | Couple |
| --- | --- | --- |
${contrastesMd}

### Images de contrôle (extraites des WebM livrés)

${controles}

${ecartsMd}
`;
writeFileSync(join(racine, 'MANIFESTE.md'), md);
console.log(
  `manifestes écrits : ${basename(cheminManifeste)} (${statSync(cheminManifeste).size} o), MANIFESTE.md`,
);
