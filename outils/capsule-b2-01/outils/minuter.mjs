// Timeline (annexe A.1, étape 4) et sous-titres WebVTT (étape 9) à partir des pistes Piper mesurées.
// Usage : node outils/minuter.mjs <racine medias>
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const racine = process.argv[2];
const IPS = 30;
const ATTAQUE = 0.4;
const PAUSE_MIN = 1.5;
const PAUSE_MAX = 3;
const DUREE_P11 = 6;
const CIBLE = 150;
const TOLERANCE = 5;
const CPS_MAX = 15;
const LIGNE_MAX = 42;
const AFFICHAGE_MIN = 1;
const MAINTIEN_FIN = 0.6;
const PLANS_VOIX = ['P01', 'P02', 'P03', 'P04', 'P05', 'P06', 'P07', 'P08', 'P09', 'P10'];

const lireJson = (chemin) => JSON.parse(readFileSync(chemin, 'utf8'));
const surImage = (s) => Math.ceil(s * IPS - 1e-9) / IPS;

const pistes = PLANS_VOIX.map((id) => lireJson(join(racine, 'build', 'audio', `${id}.json`)));
const sommeVoix = pistes.reduce((s, p) => s + p.duree, 0);
const pauseIdeale =
  (CIBLE - DUREE_P11 - PLANS_VOIX.length * ATTAQUE - sommeVoix) / PLANS_VOIX.length;
const pause = Math.min(PAUSE_MAX, Math.max(PAUSE_MIN, pauseIdeale));

const plans = [];
let debut = 0;
for (const piste of pistes) {
  const duree = surImage(ATTAQUE + piste.duree + pause);
  const voixDebut = debut + ATTAQUE;
  const ancres = Object.fromEntries(
    Object.entries(piste.ancres).map(([cle, a]) => [
      cle,
      { texte: a.texte, debut: voixDebut + a.debut, fin: voixDebut + a.fin },
    ]),
  );
  plans.push({
    id: piste.plan,
    debut,
    fin: debut + duree,
    duree,
    pause: duree - ATTAQUE - piste.duree,
    voix: {
      fichier: `${piste.plan}.wav`,
      debut: voixDebut,
      fin: voixDebut + piste.duree,
      duree: piste.duree,
      sha256: piste.sha256,
    },
    ancres,
  });
  debut += duree;
}
plans.push({
  id: 'P11',
  debut,
  fin: debut + DUREE_P11,
  duree: DUREE_P11,
  pause: DUREE_P11,
  voix: null,
  ancres: {},
});
const total = debut + DUREE_P11;
const images = Math.round(total * IPS);

if (Math.abs(total - CIBLE) > TOLERANCE) {
  throw new Error(`Durée ${total.toFixed(3)} s hors de ${CIBLE} ± ${TOLERANCE} s`);
}

const timeline = {
  ips: IPS,
  attaque: ATTAQUE,
  pause,
  pauseIdeale,
  total,
  images,
  largeur: 1280,
  hauteur: 720,
  plans,
};
mkdirSync(join(racine, 'build'), { recursive: true });
writeFileSync(join(racine, 'build', 'timeline.json'), `${JSON.stringify(timeline, null, 1)}\n`);

// Règle des sous-titres (cours-b2-01-conception.md, annexe A.1, étape 9) : au plus 15 caractères
// par seconde ; une réplique trop dense est prolongée sur la pause du plan.
const NBSP = ' ';
const typographier = (ligne) =>
  ligne
    .replace(/(\d) (?=\d{3}\b)/g, `$1${NBSP}`)
    .replace(/ ([:;!?%€»])/g, `${NBSP}$1`)
    .replace(/« /g, `«${NBSP}`);
const compter = (lignes) => lignes.reduce((n, l) => n + [...l].length, 0);

const repliques = lireJson(join(racine, 'sources', 'repliques.json'));
const ANTICIPATION_MAX = ATTAQUE;
const RETARD_TOLERE = 0.25;
const milli = (s) => Math.round(s * 1000) / 1000;
const milliSup = (s) => Math.ceil(s * 1000 - 1e-6) / 1000;

function minuterPlan(plan, duPlan, premierDebut) {
  const limite = plan.fin - 0.05;
  let finPrecedente = premierDebut;
  return duPlan.map((replique, i) => {
    const rang = i + 1;
    const parole = rang === 1 ? plan.voix.debut : plan.ancres[`cue-${rang}`]?.debut;
    if (parole === undefined) throw new Error(`Ancre cue-${rang} absente pour ${replique.id}`);
    const suivante = duPlan[i + 1] ? plan.ancres[`cue-${rang + 1}`].debut : plan.voix.fin;
    const caracteres = compter(replique.lignes);
    const debutReplique = milli(rang === 1 ? premierDebut : Math.max(parole, finPrecedente));
    let fin = Math.max(
      milli(suivante),
      milliSup(debutReplique + caracteres / CPS_MAX),
      milliSup(debutReplique + AFFICHAGE_MIN),
    );
    if (!duPlan[i + 1]) fin = Math.max(fin, milli(Math.min(plan.voix.fin + MAINTIEN_FIN, limite)));
    if (fin > limite)
      throw new Error(`${replique.id} déborde du plan (${fin.toFixed(3)} > ${limite.toFixed(3)})`);
    for (const ligne of replique.lignes) {
      if ([...ligne].length > LIGNE_MAX)
        throw new Error(`${replique.id} : ligne de plus de ${LIGNE_MAX} caractères`);
    }
    if (replique.lignes.length > 2) throw new Error(`${replique.id} : plus de 2 lignes`);
    finPrecedente = fin;
    return {
      id: replique.id,
      lignes: replique.lignes.map(typographier),
      debut: debutReplique,
      fin,
      parole,
      retard: debutReplique - parole,
      caracteres,
      cps: caracteres / (fin - debutReplique),
    };
  });
}

const minutees = [];
for (const plan of plans.filter((p) => p.voix)) {
  const duPlan = repliques.filter((r) => r.id.startsWith(`${plan.id}-`));
  let retenues = minuterPlan(plan, duPlan, plan.voix.debut);
  const retardMax = (liste) => Math.max(...liste.map((c) => c.retard));
  if (retardMax(retenues) > RETARD_TOLERE) {
    const anticipees = minuterPlan(
      plan,
      duPlan,
      Math.max(plan.debut, plan.voix.debut - ANTICIPATION_MAX),
    );
    if (retardMax(anticipees) < retardMax(retenues)) retenues = anticipees;
  }
  minutees.push(...retenues);
}

const horodater = (s) => {
  const ms = Math.round(s * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  const r = ms % 1000;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(r).padStart(3, '0')}`;
};

const vtt = [
  'WEBVTT',
  '',
  'NOTE',
  'Une formule qui se recopie, un tableau qui se contrôle',
  'Tim Moyence — Asili Design, 2026 — licence CC BY-SA 4.0',
  'Voix de synthèse Piper fr_FR-siwis-medium (modèle MIT ; données SIWIS,',
  'Université d’Édimbourg, CC BY 4.0). Minutage calé sur la narration mesurée.',
  '',
  ...minutees.flatMap((c) => [
    c.id,
    `${horodater(c.debut)} --> ${horodater(c.fin)}`,
    ...c.lignes,
    '',
  ]),
].join('\n');
writeFileSync(join(racine, 'build', 'capsule-formule-recopiable.fr.vtt'), vtt);

const totalCar = minutees.reduce((s, c) => s + c.caracteres, 0);
const totalDuree = minutees.reduce((s, c) => s + (c.fin - c.debut), 0);
const bilan = {
  total,
  images,
  pause,
  pauseIdeale,
  sommeVoix,
  cpsMax: Math.max(...minutees.map((c) => c.cps)),
  cpsMoyen: totalCar / totalDuree,
  retardMax: Math.max(...minutees.map((c) => c.retard)),
  anticipationMax: Math.max(...minutees.map((c) => -c.retard)),
  repliques: minutees,
};
writeFileSync(
  join(racine, 'build', 'repliques-minutees.json'),
  `${JSON.stringify(bilan, null, 1)}\n`,
);
if (bilan.cpsMax > CPS_MAX + 1e-9)
  throw new Error(`Densité maximale ${bilan.cpsMax.toFixed(2)} car/s`);

console.log(
  `total ${total.toFixed(3)} s · ${images} images · pause ${pause.toFixed(3)} s (idéale ${pauseIdeale.toFixed(3)})`,
);
for (const p of plans)
  console.log(`  ${p.id} ${p.debut.toFixed(3)} → ${p.fin.toFixed(3)} (${p.duree.toFixed(3)} s)`);
for (const c of minutees) {
  console.log(
    `  ${c.id} ${horodater(c.debut)} → ${horodater(c.fin)}  ${c.cps.toFixed(1)} car/s  retard ${c.retard.toFixed(2)} s`,
  );
}
console.log(
  `densité max ${bilan.cpsMax.toFixed(2)} · moyenne ${bilan.cpsMoyen.toFixed(2)} car/s · retard max ${bilan.retardMax.toFixed(2)} s · anticipation max ${bilan.anticipationMax.toFixed(2)} s`,
);
