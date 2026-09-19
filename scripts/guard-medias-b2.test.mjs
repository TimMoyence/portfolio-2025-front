import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import {
  CHEMIN_CATALOGUE,
  CHEMIN_INSTANTANE,
  DOSSIER_MEDIAS,
  fichiersLivres,
  formatViolations,
  GATE,
  lireCatalogue,
  referencesDuCours,
  runGuard,
} from './guard-medias-b2.mjs';

const IMAGE = 'image-de-test.webp';
const CAPSULE = 'capsule-de-test.webm';
const MANIFESTE_CAPSULE = 'capsule-de-test.manifest.json';

function empreinte(contenu) {
  return createHash('sha256').update(Buffer.from(contenu)).digest('hex');
}

function ecrire(root, chemin, contenu) {
  const complet = join(root, chemin);
  mkdirSync(dirname(complet), { recursive: true });
  writeFileSync(complet, contenu);
}

function depotDeTest({ contenuImage = 'image', catalogue, instantane } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'guard-medias-b2-'));
  const contenuCapsule = 'capsule';
  ecrire(root, `${DOSSIER_MEDIAS}/${IMAGE}`, contenuImage);
  ecrire(root, `${DOSSIER_MEDIAS}/${CAPSULE}`, contenuCapsule);
  ecrire(
    root,
    `${DOSSIER_MEDIAS}/${MANIFESTE_CAPSULE}`,
    JSON.stringify({
      fichiers: [
        {
          fichier: CAPSULE,
          octets: Buffer.from(contenuCapsule).length,
          sha256: empreinte(contenuCapsule),
        },
      ],
    }),
  );
  ecrire(
    root,
    CHEMIN_CATALOGUE,
    JSON.stringify(
      catalogue ?? {
        medias: [
          {
            id: 'M1',
            fichiers: [
              { fichier: IMAGE, octets: Buffer.from('image').length, sha256: empreinte('image') },
            ],
          },
          { id: 'M5', manifeste: MANIFESTE_CAPSULE },
        ],
      },
    ),
  );
  ecrire(
    root,
    CHEMIN_INSTANTANE,
    JSON.stringify(
      instantane ?? {
        sujet: {
          ecrans: [
            { donnees: { image: `/assets/cours/b2-01/v3/${IMAGE}` } },
            { donnees: { src: `/assets/cours/b2-01/v3/${CAPSULE}` } },
          ],
        },
      },
    ),
  );
  return root;
}

function avecDepot(options, verification) {
  const root = depotDeTest(options);
  try {
    verification(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function reglesDe(resultat) {
  return [...new Set(resultat.violations.map((violation) => violation.regle))].sort();
}

void test(`${GATE} : un depot conforme n a aucune violation et compte ses medias`, () => {
  avecDepot({}, (root) => {
    const resultat = runGuard({ root });
    assert.equal(resultat.code, 0);
    assert.deepEqual(resultat.violations, []);
    assert.equal(resultat.inspectes, 2);
    assert.equal(resultat.references, 2);
  });
});

void test(`${GATE} : le depot reel passe la porte, sur un perimetre non vide`, () => {
  const resultat = runGuard({ root: '.' });
  assert.ok(
    resultat.inspectes > 0 && resultat.references > 0,
    'un perimetre vide rendrait ce vert sans valeur',
  );
  assert.deepEqual(
    resultat.violations,
    [],
    `${GATE}: le depot reel doit passer la porte des medias.`,
  );
});

void test(`${GATE} : une image recompressee est refusee, et le refus nomme le fichier`, () => {
  avecDepot({ contenuImage: 'image-recompressee' }, (root) => {
    const resultat = runGuard({ root });
    assert.equal(resultat.code, 1);
    assert.deepEqual(reglesDe(resultat), ['media-altere']);
    assert.ok(resultat.violations.some((violation) => /sha256/.test(violation.raison)));
    assert.ok(resultat.violations.some((violation) => /octets/.test(violation.raison)));
    const sortie = formatViolations(resultat);
    assert.match(sortie, new RegExp(`${GATE}: REFUS`));
    assert.match(sortie, new RegExp(IMAGE));
    assert.match(sortie, /licence/);
  });
});

void test(`${GATE} : un media catalogue mais non livre est refuse`, () => {
  const catalogue = {
    medias: [
      {
        id: 'M1',
        fichiers: [
          { fichier: IMAGE, octets: 5, sha256: empreinte('image') },
          { fichier: 'jamais-livree.webp', octets: 12, sha256: empreinte('absente') },
        ],
      },
      { id: 'M5', manifeste: MANIFESTE_CAPSULE },
    ],
  };
  avecDepot({ catalogue }, (root) => {
    const resultat = runGuard({ root });
    assert.ok(reglesDe(resultat).includes('media-absent'));
    assert.ok(
      resultat.violations.some((violation) => violation.fichier.endsWith('jamais-livree.webp')),
    );
  });
});

void test(`${GATE} : un fichier livre sans entree au catalogue est refuse`, () => {
  avecDepot({}, (root) => {
    ecrire(root, `${DOSSIER_MEDIAS}/clandestine.webp`, 'sans licence');
    const resultat = runGuard({ root });
    assert.ok(reglesDe(resultat).includes('media-non-catalogue'));
  });
});

void test(`${GATE} : un media catalogue que le cours ne cite pas est refuse`, () => {
  const instantane = {
    sujet: { ecrans: [{ donnees: { image: `/assets/cours/b2-01/v3/${IMAGE}` } }] },
  };
  avecDepot({ instantane }, (root) => {
    const resultat = runGuard({ root });
    assert.ok(reglesDe(resultat).includes('media-non-reference'));
  });
});

void test(`${GATE} : un chemin cite par le cours mais absent du catalogue est refuse`, () => {
  const instantane = {
    sujet: {
      ecrans: [
        { donnees: { image: `/assets/cours/b2-01/v3/${IMAGE}` } },
        { donnees: { src: `/assets/cours/b2-01/v3/${CAPSULE}` } },
        { donnees: { poster: '/assets/cours/b2-01/v3/inventee.jpg' } },
      ],
    },
  };
  avecDepot({ instantane }, (root) => {
    const resultat = runGuard({ root });
    assert.ok(reglesDe(resultat).includes('reference-inconnue'));
  });
});

void test(`PLANCHER ANTI-VACUITE : un catalogue, un dossier ou un cours vide leve en citant le gate`, () => {
  avecDepot({ catalogue: { medias: [] } }, (root) => {
    assert.throws(() => lireCatalogue(root), new RegExp(GATE));
  });
  avecDepot({ instantane: { sujet: { ecrans: [] } } }, (root) => {
    assert.throws(() => referencesDuCours(root), new RegExp(GATE));
  });
  const vide = mkdtempSync(join(tmpdir(), 'guard-medias-b2-vide-'));
  try {
    assert.throws(() => fichiersLivres(vide), new RegExp(GATE));
    assert.throws(() => runGuard({ root: vide }), new RegExp(GATE));
  } finally {
    rmSync(vide, { recursive: true, force: true });
  }
});
