import assert from 'node:assert/strict';
import test from 'node:test';
import { cheminDuDepot, lireTexte, textesDuDossier } from '../../lib/depot.mjs';

const EXTENSIONS = /\.(scss|css|ts|html)$/;
const HORS_PRODUIT = /(\.spec\.ts$|^src\/testing\/)/;
const LUES_PAR_UNE_BIBLIOTHEQUE = /^--swiper-/;

const DECLARATIONS = [
  /(?<![\w-])(--[a-z][\w-]*)\s*:/g,
  /\[style\.(--[a-z][\w-]*)\]/g,
  /(?:setProperty|setStyle)\([^)]*?['"`](--[a-z][\w-]*)['"`]/g,
];
const LECTURES = [/var\(\s*(--[a-z][\w-]*)/g, /getPropertyValue\(\s*['"`](--[a-z][\w-]*)['"`]/g];

const POURQUOI =
  'une propriété personnalisée que rien ne lit est du code mort : elle laisse croire qu un style en dépend. Supprimez-la, ou lisez-la par var().';

const textesDuProduit = () => [
  ...textesDuDossier('src', EXTENSIONS).filter(({ fichier }) => !HORS_PRODUIT.test(fichier)),
  { fichier: 'tailwind.config.js', texte: lireTexte(cheminDuDepot('tailwind.config.js')) },
];

const noms = (texte, motifs) =>
  motifs.flatMap((motif) => [...texte.matchAll(motif)].map(([, nom]) => nom));

test('chaque propriété personnalisée déclarée par le produit est lue par le produit', () => {
  const textes = textesDuProduit();
  const lues = new Set(textes.flatMap(({ texte }) => noms(texte, LECTURES)));
  const declarees = textes.flatMap(({ fichier, texte }) =>
    noms(texte, DECLARATIONS).map((nom) => ({ fichier, nom })),
  );

  assert.ok(
    declarees.length > 0,
    'aucune propriété personnalisée trouvée : la garde ne garde rien.',
  );
  assert.deepEqual(
    [
      ...new Set(
        declarees
          .filter(({ nom }) => !lues.has(nom) && !LUES_PAR_UNE_BIBLIOTHEQUE.test(nom))
          .map(({ fichier, nom }) => `${fichier} : ${nom}`),
      ),
    ],
    [],
    POURQUOI,
  );
});
