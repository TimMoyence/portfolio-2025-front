import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { cheminDuDepot, lireTexte } from './lib/depot.mjs';

const DOSSIER_DES_COURS = cheminDuDepot('src/assets/cours');
const DOSSIER_DES_FIXTURES = cheminDuDepot('src/testing/fixtures');
const SUFFIXE_DU_MANIFESTE = '.classeurs.manifest.json';
const PREFIXE_PUBLIC = '/assets/cours';

const POURQUOI =
  'les classeurs servis aux étudiants sont écrits et vérifiés par le back (test/fixtures/formations) ; la copie du front doit rester identique octet pour octet, sinon les valeurs corrigées en séance ne correspondent plus au fichier ouvert.';

const empreinteDe = (chemin) => createHash('sha256').update(readFileSync(chemin)).digest('hex');

const coursAClasseurs = () =>
  readdirSync(DOSSIER_DES_FIXTURES)
    .filter((fichier) => fichier.endsWith(SUFFIXE_DU_MANIFESTE))
    .map((fichier) => fichier.slice(0, -SUFFIXE_DU_MANIFESTE.length));

const manifesteDe = (cours) =>
  JSON.parse(lireTexte(join(DOSSIER_DES_FIXTURES, `${cours}${SUFFIXE_DU_MANIFESTE}`)));

const instantaneDe = (cours) =>
  JSON.parse(lireTexte(join(DOSSIER_DES_FIXTURES, `${cours}.instantane.json`)));

const fichiersSous = (dossier) =>
  readdirSync(dossier, { recursive: true, withFileTypes: true })
    .filter((entree) => entree.isFile())
    .map((entree) => entree.name);

test('le B3-01 garde le manifeste de ses classeurs parmi les fixtures de test', () => {
  assert.ok(
    coursAClasseurs().includes('b3-01'),
    `src/testing/fixtures/b3-01${SUFFIXE_DU_MANIFESTE} absent : la garde ne garde rien.`,
  );
});

test('ne sert aucun manifeste de classeurs, qui nommerait les reprises réservées à la séance', () => {
  assert.deepEqual(
    fichiersSous(DOSSIER_DES_COURS).filter((fichier) =>
      fichier.endsWith('classeurs.manifest.json'),
    ),
    [],
  );
});

for (const cours of coursAClasseurs()) {
  test(`${cours} : chaque classeur du manifeste est servi avec l empreinte du back`, () => {
    for (const { fichier, empreinte } of manifesteDe(cours).classeurs) {
      const chemin = join(DOSSIER_DES_COURS, cours, fichier);
      assert.ok(existsSync(chemin), `${cours}/${fichier} absent. ${POURQUOI}`);
      assert.equal(empreinteDe(chemin), empreinte, `${cours}/${fichier} diffère. ${POURQUOI}`);
    }
  });

  test(`${cours} : aucun fichier servi hors du manifeste`, () => {
    const declares = manifesteDe(cours).classeurs.map(({ fichier }) => fichier);
    const servis = readdirSync(join(DOSSIER_DES_COURS, cours));

    assert.deepEqual([...servis].sort(), [...declares].sort());
  });

  test(`${cours} : chaque classeur servi porte dans son nom le début de son empreinte`, () => {
    for (const { fichier, empreinte } of manifesteDe(cours).classeurs) {
      assert.match(fichier, /^[A-Za-z0-9_-]+\.[0-9a-f]{8}\.(xlsx|csv|pdf)$/);
      assert.ok(
        fichier.includes(`.${empreinte.slice(0, 8)}.`),
        `${cours}/${fichier} ne porte pas le début de son empreinte ${empreinte.slice(0, 8)} : un classeur corrigé garderait le nom de l ancien.`,
      );
    }
  });

  test(`${cours} : chaque pièce jointe de l instantané pointe un classeur du manifeste`, () => {
    const declares = manifesteDe(cours).classeurs.map(
      ({ fichier }) => `${PREFIXE_PUBLIC}/${cours}/${fichier}`,
    );
    const pieces = instantaneDe(cours)
      .deroule.ecrans.filter((ecran) => ecran.pieceJointe !== undefined)
      .map((ecran) => ecran.pieceJointe.fichier);

    assert.ok(pieces.length > 0, `aucune pièce jointe dans l instantané du ${cours}`);
    assert.deepEqual(
      pieces.filter((fichier) => !declares.includes(fichier)),
      [],
      `pièce jointe hors du manifeste du ${cours}`,
    );
  });
}
