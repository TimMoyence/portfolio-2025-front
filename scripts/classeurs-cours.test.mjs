import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { cheminDuDepot, lireTexte } from './lib/depot.mjs';

const DOSSIER_DES_COURS = cheminDuDepot('src/assets/cours');
const MANIFESTE = 'classeurs.manifest.json';
const PREFIXE_PUBLIC = '/assets/cours';

const POURQUOI =
  'les classeurs servis aux étudiants sont écrits et vérifiés par le back (test/fixtures/formations) ; la copie du front doit rester identique octet pour octet, sinon les valeurs corrigées en séance ne correspondent plus au fichier ouvert.';

const empreinteDe = (chemin) => createHash('sha256').update(readFileSync(chemin)).digest('hex');

const coursAClasseurs = () =>
  readdirSync(DOSSIER_DES_COURS).filter((cours) =>
    existsSync(join(DOSSIER_DES_COURS, cours, MANIFESTE)),
  );

const manifesteDe = (cours) => JSON.parse(lireTexte(join(DOSSIER_DES_COURS, cours, MANIFESTE)));

const instantaneDe = (cours) =>
  JSON.parse(lireTexte(cheminDuDepot(`src/testing/fixtures/${cours}.instantane.json`)));

test('le B3-01 sert ses classeurs avec leur manifeste', () => {
  assert.ok(
    coursAClasseurs().includes('b3-01'),
    `src/assets/cours/b3-01/${MANIFESTE} absent : la garde ne garde rien.`,
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
    const servis = readdirSync(join(DOSSIER_DES_COURS, cours)).filter(
      (fichier) => fichier !== MANIFESTE,
    );

    assert.deepEqual([...servis].sort(), [...declares].sort());
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
