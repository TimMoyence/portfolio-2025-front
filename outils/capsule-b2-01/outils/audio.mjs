// Piste audio (annexe A.1, étapes 4 et 5) : mesure des pistes Piper, placement de chaque voix
// dans son plan, concaténation, normalisation loudnorm en deux passes (−16 LUFS, −1,5 dBTP).
// Usage : node outils/audio.mjs <racine medias>
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';

const racine = resolve(process.argv[2]);
const FFMPEG = createRequire(join(racine, 'package.json'))('ffmpeg-static');
const FREQUENCE = 48000;
const T = JSON.parse(readFileSync(join(racine, 'build', 'timeline.json'), 'utf8'));
const pistes = join(racine, 'build', 'pistes');
rmSync(pistes, { recursive: true, force: true });
mkdirSync(pistes, { recursive: true });

const ffmpeg = (args) => {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-nostdin', '-y', ...args], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (r.status !== 0) throw new Error(`ffmpeg ${args.join(' ')}\n${r.stderr}`);
  return r.stderr;
};

const mesures = [];
const liste = [];
for (const plan of T.plans) {
  const echantillons = Math.round(plan.duree * FREQUENCE);
  const sortie = join(pistes, `${plan.id.toLowerCase()}.wav`);
  if (plan.voix) {
    const source = join(racine, 'build', 'audio', plan.voix.fichier);
    const journal = ffmpeg(['-i', source, '-f', 'null', '-']);
    const duree = /Duration: (\d+):(\d+):([\d.]+)/.exec(journal);
    const dureeLue = Number(duree[1]) * 3600 + Number(duree[2]) * 60 + Number(duree[3]);
    if (Math.abs(dureeLue - plan.voix.duree) > 0.011) {
      throw new Error(`${plan.id} : durée lue ${dureeLue} ≠ durée mesurée ${plan.voix.duree}`);
    }
    ffmpeg([
      '-i',
      source,
      '-af',
      `aresample=${FREQUENCE},adelay=${Math.round(T.attaque * 1000)}:all=1,apad=whole_len=${echantillons},atrim=end_sample=${echantillons}`,
      '-ar',
      String(FREQUENCE),
      '-ac',
      '1',
      '-c:a',
      'pcm_s16le',
      sortie,
    ]);
    mesures.push({
      plan: plan.id,
      voixS: plan.voix.duree,
      dureeLueFfmpeg: dureeLue,
      planS: plan.duree,
      pauseS: plan.pause,
    });
  } else {
    ffmpeg([
      '-f',
      'lavfi',
      '-i',
      `anullsrc=r=${FREQUENCE}:cl=mono`,
      '-t',
      String(plan.duree),
      '-c:a',
      'pcm_s16le',
      sortie,
    ]);
    mesures.push({ plan: plan.id, voixS: 0, planS: plan.duree, pauseS: plan.duree });
  }
  liste.push(`file '${sortie}'`);
}
writeFileSync(join(pistes, 'liste.txt'), `${liste.join('\n')}\n`);
const narration = join(racine, 'build', 'narration.wav');
ffmpeg([
  '-f',
  'concat',
  '-safe',
  '0',
  '-i',
  join(pistes, 'liste.txt'),
  '-c',
  'pcm_s16le',
  narration,
]);

// piper-tts 1.8.0 normalise chaque phrase à 0 dBFS de crête : la narration brute mesure −16 LUFS
// et +0,06 dBTP, donc loudnorm linear=true ne tient −1,5 dBTP qu'avec ce limiteur en amont.
const LIMITEUR = 'alimiter=limit=0.708:attack=5:release=50:level=disabled';
const extraireJson = (journal) =>
  JSON.parse(journal.slice(journal.lastIndexOf('{'), journal.lastIndexOf('}') + 1));
const cible = 'I=-16:TP=-1.5:LRA=11';
const brute = extraireJson(
  ffmpeg(['-i', narration, '-af', `loudnorm=${cible}:print_format=json`, '-f', 'null', '-']),
);
const passe1 = extraireJson(
  ffmpeg([
    '-i',
    narration,
    '-af',
    `${LIMITEUR},loudnorm=${cible}:print_format=json`,
    '-f',
    'null',
    '-',
  ]),
);
const normalisee = join(racine, 'build', 'narration-norm.wav');
const passe2 = extraireJson(
  ffmpeg([
    '-i',
    narration,
    '-af',
    `${LIMITEUR},loudnorm=${cible}:measured_I=${passe1.input_i}:measured_TP=${passe1.input_tp}:measured_LRA=${passe1.input_lra}:measured_thresh=${passe1.input_thresh}:offset=${passe1.target_offset}:linear=true:print_format=json`,
    '-ar',
    String(FREQUENCE),
    '-ac',
    '1',
    '-c:a',
    'pcm_s16le',
    normalisee,
  ]),
);
if (passe2.normalization_type !== 'linear')
  throw new Error(`loudnorm en mode ${passe2.normalization_type}`);

const ebur = (fichier) => {
  const journal = ffmpeg(['-i', fichier, '-af', 'ebur128=peak=true', '-f', 'null', '-']);
  const resume = journal.slice(journal.lastIndexOf('Summary:'));
  return {
    integreLufs: Number(/I:\s+(-?[\d.]+) LUFS/.exec(resume)[1]),
    lraLu: Number(/LRA:\s+(-?[\d.]+) LU/.exec(resume)[1]),
    cretevraieDbtp: Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(resume)[1]),
  };
};
const echantillonsWav = (fichier) => {
  const octets = readFileSync(fichier);
  const donnees = octets.indexOf('data');
  return octets.readUInt32LE(donnees + 4) / 2;
};
const attendus = Math.round(T.total * FREQUENCE);
for (const fichier of [narration, normalisee]) {
  const n = echantillonsWav(fichier);
  if (Math.abs(n - attendus) > 2)
    throw new Error(`${fichier} : ${n} échantillons, ${attendus} attendus`);
}
const bilan = {
  frequence: FREQUENCE,
  plans: mesures,
  totalS: T.total,
  echantillons: echantillonsWav(normalisee),
  limiteur: LIMITEUR,
  narrationBrute: brute,
  passe1,
  passe2,
  typeNormalisation: passe2.normalization_type,
  narrationNorm: ebur(normalisee),
};
writeFileSync(join(racine, 'build', 'audio.json'), `${JSON.stringify(bilan, null, 1)}\n`);
console.log(
  `passe 1 : ${passe1.input_i} LUFS, crête ${passe1.input_tp} dBTP · passe 2 (${passe2.normalization_type}) : ${bilan.narrationNorm.integreLufs} LUFS, crête vraie ${bilan.narrationNorm.cretevraieDbtp} dBTP`,
);
