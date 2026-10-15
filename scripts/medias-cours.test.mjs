import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { cheminDuDepot, lireTexte } from './lib/depot.mjs';

const DOSSIER_DES_FIXTURES = cheminDuDepot('src/testing/fixtures');
const DOSSIER_DES_COURS = cheminDuDepot('src/assets/cours');
const SUFFIXE_DE_L_INSTANTANE = '.instantane.json';
const CATALOGUE = 'medias.manifest.json';
const MEDIA_DE_COURS = /^\/assets\/cours\/[^/]+\/[^/]+\/[^/]+\.(webp|webm|jpg|png|vtt)$/;

const POURQUOI =
  'un média qu un cours sert doit exister sous src/assets et figurer au catalogue de son dossier avec son poids et son empreinte, sinon la séance affiche une image cassée.';

const empreinteDe = (chemin) => createHash('sha256').update(readFileSync(chemin)).digest('hex');

const lireJson = (chemin) => JSON.parse(lireTexte(chemin));

const chaines = (valeur) => {
  if (typeof valeur === 'string') {
    return [valeur];
  }
  if (typeof valeur !== 'object' || valeur === null) {
    return [];
  }
  return Object.values(valeur).flatMap(chaines);
};

const mediasServis = () =>
  readdirSync(DOSSIER_DES_FIXTURES)
    .filter((fichier) => fichier.endsWith(SUFFIXE_DE_L_INSTANTANE))
    .flatMap((fichier) => {
      const cours = fichier.slice(0, -SUFFIXE_DE_L_INSTANTANE.length);
      const chemins = chaines(lireJson(join(DOSSIER_DES_FIXTURES, fichier))).filter((chaine) =>
        MEDIA_DE_COURS.test(chaine),
      );
      return [...new Set(chemins)].map((chemin) => ({ cours, chemin }));
    });

const cataloguesDesCours = () =>
  readdirSync(DOSSIER_DES_COURS, { recursive: true })
    .filter((relatif) => relatif.endsWith(`/${CATALOGUE}`))
    .map((relatif) => join(DOSSIER_DES_COURS, relatif));

const fichiersDuMedia = (dossier, media) =>
  typeof media.manifeste === 'string'
    ? (lireJson(join(dossier, media.manifeste)).fichiers ?? [])
    : (media.fichiers ?? []);

const mediasCatalogues = () =>
  cataloguesDesCours().flatMap((catalogue) => {
    const dossier = dirname(catalogue);
    const prefixe = `/${dossier.slice(cheminDuDepot('src').length + 1)}`;
    return (lireJson(catalogue).medias ?? []).flatMap((media) =>
      fichiersDuMedia(dossier, media).map(({ fichier, octets, sha256 }) => ({
        chemin: `${prefixe}/${fichier}`,
        octets,
        sha256,
      })),
    );
  });

test('trouve des médias servis par les cours et des médias catalogués', () => {
  assert.ok(
    mediasServis().length > 0,
    'aucun média dans les instantanés : la garde ne garde rien.',
  );
  assert.ok(mediasCatalogues().length > 0, 'aucun média catalogué : la garde ne garde rien.');
});

test('chaque média qu un cours sert existe, catalogué avec son poids et son empreinte', () => {
  const catalogues = new Map(mediasCatalogues().map((media) => [media.chemin, media]));
  const ecarts = mediasServis().flatMap(({ cours, chemin }) => {
    const fichier = cheminDuDepot(`src${chemin}`);
    const catalogue = catalogues.get(chemin);
    if (!existsSync(fichier)) {
      return [`${cours} : ${chemin} absent de src/assets`];
    }
    if (catalogue === undefined) {
      return [`${cours} : ${chemin} hors de tout ${CATALOGUE}`];
    }
    return [
      ...(statSync(fichier).size === catalogue.octets
        ? []
        : [
            `${cours} : ${chemin} pèse ${statSync(fichier).size} octets, ${catalogue.octets} au catalogue`,
          ]),
      ...(empreinteDe(fichier) === catalogue.sha256
        ? []
        : [`${cours} : ${chemin} n a pas l empreinte du catalogue`]),
    ];
  });

  assert.deepEqual(ecarts, [], POURQUOI);
});
