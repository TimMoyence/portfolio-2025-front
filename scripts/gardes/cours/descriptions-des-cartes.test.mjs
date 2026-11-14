import assert from 'node:assert/strict';
import test from 'node:test';
import { cheminDuDepot, lireTexte } from '../../lib/depot.mjs';

const CARTES = cheminDuDepot('src/app/features/formations/formations-list.data.ts');
const TRADUCTION_EN = cheminDuDepot('src/locale/messages.en.xlf');
const COURS_SERVIS = cheminDuDepot('contrat/cours-servis.gen.json');
const DESCRIPTION_FRANCAISE = /:@@formations-list\.(b\d(?:-\d\d)?)\.description:([^`]*)`/g;
const DESCRIPTION_ANGLAISE =
  /<unit id="formations-list\.(b\d(?:-\d\d)?)\.description">[\s\S]*?<target>([\s\S]*?)<\/target>/g;
const CHIFFRE = /\p{N}/u;
const HEURE_MINUTE_OU_PAUSE_EN_LETTRES =
  /(?<!\p{L})(?:heures?|hours?|hrs?|minutes?|mins|pauses?|breaks?)(?!\p{L})/iu;
const ABREVIATION_D_HEURE_OU_DE_MINUTE = /(?<!\p{L})(?:h|min|mn)(?!\p{L})/u;

const citeUnChiffreUneHeureUneMinuteOuUnePause = (texte) =>
  [CHIFFRE, HEURE_MINUTE_OU_PAUSE_EN_LETTRES, ABREVIATION_D_HEURE_OU_DE_MINUTE].some((forme) =>
    forme.test(texte),
  );

const descriptions = (fichier, motif) =>
  [...lireTexte(fichier).matchAll(motif)].map(([, carte, texte]) => [carte, texte]);

test('PUB-01 · aucune description de carte de cours, telle que la carte la rend en français et en anglais, ne contient de chiffre ni ne cite une heure, une minute ou une pause, que seule la méta annonce', () => {
  const parLangue = {
    fr: descriptions(CARTES, DESCRIPTION_FRANCAISE),
    en: descriptions(TRADUCTION_EN, DESCRIPTION_ANGLAISE),
  };
  const coursServis = JSON.parse(lireTexte(COURS_SERVIS)).length;

  assert.deepEqual(
    Object.values(parLangue).map(({ length }) => length),
    [coursServis, coursServis],
  );
  assert.deepEqual(
    Object.entries(parLangue).flatMap(([langue, cartes]) =>
      cartes
        .filter(([, texte]) => citeUnChiffreUneHeureUneMinuteOuUnePause(texte))
        .map(([carte, texte]) => `${carte} ${langue} : ${texte}`),
    ),
    [],
  );
});

test('PUB-01 · la garde refuse tout chiffre et toute heure, minute ou pause en lettres, et laisse passer les mots du métier qui leur ressemblent', () => {
  const refuses = [
    '10-15’ par exercice',
    '3 graphiques',
    'deux annales du BTS 2025',
    'the ‘B1-03’ module',
    'the break-even point',
    'les heures supplémentaires',
    'a few mins',
    'dix à quinze min par exercice',
    'trente mn',
    'ten to fifteen min per exercise',
    'trois h de cours',
    'Une heure enfin',
    'une demi-heure',
    'en 2h',
    '1h30 de cours',
    'durée : 2 h.',
    '120 mn',
    '90 min',
    'A final hour',
    'an hour-long session',
    '90-minute',
    'a short pause',
    'after the break',
    'une pause-café',
    'une pause-déjeuner',
    'a coffee-break',
    '90 mins',
    '2 hrs',
    '1 hr',
    '2 heures supplémentaires de cours',
    'durée : 2 h',
    '120 min',
    '1 h 30',
    'a 30-min session',
    '½ h de cours',
    "30' de cours",
    '45’ d’exercices',
    '120‑min',
    '2–h',
    '6 MIN',
  ];
  const motsDuMetier = [
    'le minimum, la moyenne, le TCD',
    'MIN, MAX et MOYENNE',
    'compter les jours ouvrés',
    'un échantillon hétérogène',
    'le chiffre d’affaires d’un hôtel',
    'un gisement minéral',
    'the course code given by your teacher',
  ];

  assert.deepEqual(
    refuses.filter((texte) => !citeUnChiffreUneHeureUneMinuteOuUnePause(texte)),
    [],
  );
  assert.deepEqual(motsDuMetier.filter(citeUnChiffreUneHeureUneMinuteOuUnePause), []);
});
