import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { cheminDuDepot, lireTexte } from './lib/depot.mjs';

const DOSSIER_DES_COURS = cheminDuDepot('src/assets/cours');
const DOSSIER_DES_FIXTURES = cheminDuDepot('src/testing/fixtures');
const SUFFIXE_DU_MANIFESTE = '.classeurs.manifest.json';
const PREFIXE_PUBLIC = '/assets/cours';

const POURQUOI =
  'les classeurs sont écrits et vérifiés par le back (src/modules/formations/infrastructure/classeurs) ; la copie du front doit rester identique octet pour octet, sinon les valeurs corrigées en séance ne correspondent plus au fichier ouvert.';

const RESERVEE_A_LA_SEANCE =
  'un classeur réservé à la séance ne doit pas être un asset public : le back ne le sert qu à un poste dont l écran est déjà projeté.';

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

const piecesJointesDe = (cours) =>
  instantaneDe(cours).deroule.ecrans.flatMap((ecran) =>
    ecran.pieceJointe === undefined ? [] : [ecran.pieceJointe],
  );

const servisDe = (cours) => readdirSync(join(DOSSIER_DES_COURS, cours));

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
  test(`${cours} : chaque classeur servi figure au manifeste avec l empreinte du back`, () => {
    const empreintes = new Map(
      manifesteDe(cours).classeurs.map(({ fichier, empreinte }) => [fichier, empreinte]),
    );

    for (const fichier of servisDe(cours)) {
      assert.ok(empreintes.has(fichier), `${cours}/${fichier} hors du manifeste. ${POURQUOI}`);
      assert.equal(
        empreinteDe(join(DOSSIER_DES_COURS, cours, fichier)),
        empreintes.get(fichier),
        `${cours}/${fichier} diffère. ${POURQUOI}`,
      );
    }
  });

  test(`${cours} : le front ne sert que les pièces jointes publiques de l instantané`, () => {
    const publiques = piecesJointesDe(cours)
      .filter((piece) => piece.reservee !== true)
      .map((piece) => piece.fichier);
    const servis = servisDe(cours).map((fichier) => `${PREFIXE_PUBLIC}/${cours}/${fichier}`);

    assert.ok(publiques.length > 0, `aucune pièce jointe publique dans l instantané du ${cours}`);
    assert.deepEqual([...servis].sort(), [...new Set(publiques)].sort(), RESERVEE_A_LA_SEANCE);
  });

  test(`${cours} : l instantané sert chaque pièce réservée sans nommer son classeur`, () => {
    const reservees = piecesJointesDe(cours).filter((piece) => piece.reservee === true);

    assert.ok(reservees.length > 0, `aucune pièce réservée dans l instantané du ${cours}`);
    assert.deepEqual(
      reservees.filter((piece) => Object.keys(piece).sort().join() !== 'libelle,reservee'),
      [],
      RESERVEE_A_LA_SEANCE,
    );
  });

  test(`${cours} : chaque classeur du manifeste porte dans son nom le début de son empreinte`, () => {
    for (const { fichier, empreinte } of manifesteDe(cours).classeurs) {
      assert.match(fichier, /^[A-Za-z0-9_-]+\.[0-9a-f]{8}\.(xlsx|csv|pdf)$/);
      assert.ok(
        fichier.includes(`.${empreinte.slice(0, 8)}.`),
        `${cours}/${fichier} ne porte pas le début de son empreinte ${empreinte.slice(0, 8)} : un classeur corrigé garderait le nom de l ancien.`,
      );
    }
  });
}
