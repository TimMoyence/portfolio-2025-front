import assert from 'node:assert/strict';
import test from 'node:test';
import { textesDuDossier } from '../../lib/depot.mjs';

const CCF = /\bCCF\b/;

const POURQUOI =
  'les étudiants ne passent pas le diplôme en CCF : aucun texte du front, du catalogue, du SEO ni des traductions ne le nomme.';

const textesDuFront = () => textesDuDossier('src', /\.(ts|html|scss|json|xlf)$/);

test('trouve des textes à garder', () => {
  assert.ok(textesDuFront().length > 100, 'aucun texte sous src : la garde ne garde rien.');
});

test('RET-07 · aucun texte servi par le front ne parle de CCF', () => {
  const lignes = textesDuFront().flatMap(({ fichier, texte }) =>
    texte.split('\n').flatMap((ligne, rang) => (CCF.test(ligne) ? [`${fichier}:${rang + 1}`] : [])),
  );

  assert.deepEqual(lignes, [], POURQUOI);
});
