import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const GATE = 'guard-medias-b2';

export const DOSSIER_MEDIAS = 'src/assets/cours/b2-01/v3';

export const CHEMIN_CATALOGUE = `${DOSSIER_MEDIAS}/medias.manifest.json`;

export const CHEMIN_INSTANTANE = 'src/testing/fixtures/b2-01-v3.instantane.json';

const PREFIXE_SERVI = '/assets/cours/b2-01/v3/';

const SUFFIXE_MANIFESTE = '.manifest.json';

const POURQUOI = {
  'media-absent': `${GATE}: un media catalogue et absent du disque donne un ecran noir en seance, decouvert devant la classe.`,
  'media-altere': `${GATE}: une recompression ou un remplacement silencieux invalide l attribution de licence inscrite au manifeste.`,
  'media-non-catalogue': `${GATE}: un fichier livre sans entree au catalogue voyage sans licence ni attribution.`,
  'media-non-reference': `${GATE}: un media catalogue que le cours ne cite pas est du poids mort servi au navigateur.`,
  'reference-inconnue': `${GATE}: le cours cite un chemin que le catalogue ignore - rien ne garantit alors qu il soit livre.`,
};

function lireJson(root, chemin) {
  return JSON.parse(readFileSync(join(root, chemin), 'utf8'));
}

function entreesDuManifesteCapsule(root, media) {
  const capsule = lireJson(root, `${DOSSIER_MEDIAS}/${media.manifeste}`);
  const fichiers = Array.isArray(capsule.fichiers) ? capsule.fichiers : [];
  return fichiers.map((fichier) => ({
    id: media.id,
    fichier: fichier.fichier,
    octets: fichier.octets,
    sha256: fichier.sha256,
  }));
}

export function lireCatalogue(root) {
  const catalogue = lireJson(root, CHEMIN_CATALOGUE);
  const medias = Array.isArray(catalogue.medias) ? catalogue.medias : [];
  const entrees = medias.flatMap((media) =>
    typeof media.manifeste === 'string'
      ? entreesDuManifesteCapsule(root, media)
      : (media.fichiers ?? []).map((fichier) => ({ id: media.id, ...fichier })),
  );
  if (entrees.length === 0) {
    throw new Error(
      `${GATE}: le catalogue des medias est vide - une porte qui compare zero empreinte a zero fichier rend un vert qui ne prouve rien.`,
    );
  }
  return entrees;
}

export function referencesDuCours(root) {
  const chemins = new Set();
  const collecter = (valeur) => {
    if (typeof valeur === 'string') {
      if (valeur.startsWith(PREFIXE_SERVI)) {
        chemins.add(valeur.slice(PREFIXE_SERVI.length));
      }
      return;
    }
    if (Array.isArray(valeur)) {
      valeur.forEach(collecter);
      return;
    }
    if (valeur !== null && typeof valeur === 'object') {
      Object.values(valeur).forEach(collecter);
    }
  };
  collecter(lireJson(root, CHEMIN_INSTANTANE));
  if (chemins.size === 0) {
    throw new Error(
      `${GATE}: l instantane du cours ne cite aucun media - la verification du referencement porterait sur un ensemble vide.`,
    );
  }
  return chemins;
}

export function fichiersLivres(root) {
  const dossier = join(root, DOSSIER_MEDIAS);
  const noms = existsSync(dossier) ? readdirSync(dossier) : [];
  const livres = noms.filter((nom) => !nom.endsWith(SUFFIXE_MANIFESTE));
  if (livres.length === 0) {
    throw new Error(
      `${GATE}: aucun media n a ete trouve dans ${DOSSIER_MEDIAS} - le perimetre est vide, et un perimetre vide ne garde rien.`,
    );
  }
  return livres;
}

function violationsDUneEntree(root, entree) {
  const chemin = `${DOSSIER_MEDIAS}/${entree.fichier}`;
  if (!existsSync(join(root, chemin))) {
    return [{ regle: 'media-absent', fichier: chemin, raison: `catalogue sous ${entree.id}` }];
  }
  const octets = statSync(join(root, chemin)).size;
  const empreinte = createHash('sha256')
    .update(readFileSync(join(root, chemin)))
    .digest('hex');
  const violations = [];
  if (octets !== entree.octets) {
    violations.push({
      regle: 'media-altere',
      fichier: chemin,
      raison: `${octets} octets sur le disque, ${entree.octets} au manifeste`,
    });
  }
  if (empreinte !== entree.sha256) {
    violations.push({
      regle: 'media-altere',
      fichier: chemin,
      raison: `sha256 ${empreinte}, manifeste ${entree.sha256}`,
    });
  }
  return violations;
}

export function runGuard({ root = '.' } = {}) {
  const entrees = lireCatalogue(root);
  const livres = fichiersLivres(root);
  const references = referencesDuCours(root);
  const catalogues = new Set(entrees.map((entree) => entree.fichier));

  const violations = [
    ...entrees.flatMap((entree) => violationsDUneEntree(root, entree)),
    ...livres
      .filter((nom) => !catalogues.has(nom))
      .map((nom) => ({
        regle: 'media-non-catalogue',
        fichier: `${DOSSIER_MEDIAS}/${nom}`,
        raison: 'livre sans entree dans medias.manifest.json',
      })),
    ...[...catalogues]
      .filter((nom) => !references.has(nom))
      .map((nom) => ({
        regle: 'media-non-reference',
        fichier: `${DOSSIER_MEDIAS}/${nom}`,
        raison: `aucune reference ${PREFIXE_SERVI}${nom} dans ${CHEMIN_INSTANTANE}`,
      })),
    ...[...references]
      .filter((nom) => !catalogues.has(nom))
      .map((nom) => ({
        regle: 'reference-inconnue',
        fichier: `${PREFIXE_SERVI}${nom}`,
        raison: `cite par le cours, absent de ${CHEMIN_CATALOGUE}`,
      })),
  ];

  return {
    violations,
    inspectes: entrees.length,
    references: references.size,
    code: violations.length > 0 ? 1 : 0,
  };
}

export function formatViolations({ violations, inspectes, references }) {
  const attestation = `${GATE}: ${inspectes} media(s) catalogue(s), ${references} reference(s) du cours, ${violations.length} violation(s).`;
  if (violations.length === 0) {
    return attestation;
  }
  const lignes = violations.map(
    (violation) => `  ${violation.fichier} — [${violation.regle}] ${violation.raison}`,
  );
  const regles = [...new Set(violations.map((violation) => violation.regle))].sort();
  return [`${GATE}: REFUS`, ...lignes, ...regles.map((regle) => POURQUOI[regle]), attestation].join(
    '\n',
  );
}

export function main() {
  const resultat = runGuard({ root: '.' });
  const sortie = formatViolations(resultat);
  if (resultat.code === 0) {
    console.log(sortie);
  } else {
    console.error(sortie);
  }
  return resultat.code;
}
