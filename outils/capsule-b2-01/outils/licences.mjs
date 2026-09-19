// Vérification des licences de la voix à leur source : fiche du modèle Piper (MODEL_CARD),
// métadonnées du dépôt rhasspy/piper-voices (licence MIT), notice DataShare du corpus SIWIS.
// Usage : node outils/licences.mjs <racine medias>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const racine = process.argv[2];
const AGENT = 'AsiliDesignCoursB2/1.0 (https://asilidesign.fr; production de medias pedagogiques)';
const obtenir = async (url, type = 'text') => {
  const r = await fetch(url, { headers: { 'User-Agent': AGENT } });
  if (!r.ok) throw new Error(`${url} : HTTP ${r.status}`);
  return type === 'json' ? r.json() : r.text();
};
const exiger = (condition, message) => {
  if (!condition) throw new Error(message);
};

const HF = 'https://huggingface.co/rhasspy/piper-voices';
const carte = await obtenir(`${HF}/resolve/main/fr/fr_FR/siwis/medium/MODEL_CARD`);
exiger(
  carte === readFileSync(join(racine, 'modele', 'MODEL_CARD'), 'utf8'),
  'MODEL_CARD distant différent de la copie locale',
);
exiger(/License:\s*CC-BY 4\.0/.test(carte), 'MODEL_CARD : licence des données absente');
exiger(
  /datashare\.is\.ed\.ac\.uk\/handle\/10283\/2353/.test(carte),
  'MODEL_CARD : jeu de données SIWIS absent',
);

const lisezmoi = await obtenir(`${HF}/raw/main/README.md`);
const entete = lisezmoi.slice(0, lisezmoi.indexOf('\n---', 3));
exiger(/^license:\s*mit\s*$/m.test(entete), 'README piper-voices : licence MIT absente');
const depot = await obtenir('https://huggingface.co/api/models/rhasspy/piper-voices', 'json');
exiger(depot.cardData?.license === 'mit', 'API Hugging Face : licence MIT absente');

const notice = await obtenir(
  'https://datashare.ed.ac.uk/server/api/core/items/1de74991-eede-4b48-8fbe-6c2abaed88d8',
  'json',
);
const valeurs = (cle) => (notice.metadata[cle] ?? []).map((v) => v.value);
exiger(
  valeurs('dc.rights').includes('Creative Commons Attribution 4.0 International Public License'),
  'DataShare : licence CC BY 4.0 absente',
);
exiger(
  valeurs('dc.identifier.uri').includes('https://doi.org/10.7488/ds/1705'),
  'DataShare : DOI absent',
);
const auteurs = valeurs('dc.creator');
exiger(auteurs.length === 4, 'DataShare : quatre auteurs attendus');

const bilan = {
  verifieLe: new Date().toISOString(),
  modele: {
    nom: 'fr_FR-siwis-medium',
    licence: 'MIT',
    preuveLicence: [
      `${HF} (README.md, en-tête « license: mit »)`,
      'https://huggingface.co/api/models/rhasspy/piper-voices (cardData.license = mit)',
    ],
    commitDepot: depot.sha,
    carte: `${HF}/blob/main/fr/fr_FR/siwis/medium/MODEL_CARD`,
    texteCarte: carte,
  },
  donnees: {
    titre: valeurs('dc.title')[0],
    auteurs,
    editeur: valeurs('dc.publisher')[0],
    annee: 2017,
    licence: valeurs('dc.rights')[0],
    licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
    identifiants: valeurs('dc.identifier.uri'),
    citation: valeurs('dc.identifier.citation')[0],
    notice: 'https://datashare.ed.ac.uk/handle/10283/2353',
  },
  logicielPiper: {
    paquet: 'piper-tts 1.8.0 (https://github.com/OHF-Voice/piper1-gpl)',
    licence: 'GPL-3.0-or-later (outil de synthèse ; la licence ne s’étend pas au son produit)',
  },
};
writeFileSync(join(racine, 'build', 'licences.json'), `${JSON.stringify(bilan, null, 1)}\n`);
console.log(
  `licences vérifiées : modèle MIT (commit ${depot.sha.slice(0, 8)}), données SIWIS CC BY 4.0 (${auteurs.join(' ; ')})`,
);
