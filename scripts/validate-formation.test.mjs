import assert from 'node:assert/strict';
import test from 'node:test';

import { validateOffer } from './validate-formation.mjs';

const SLUG_INVALIDE = 'slug must be a stable URL-safe identifier';

function erreursDuSlug(slug) {
  return validateOffer({ title: '', description: '', meta: [], slug }).errors.filter(
    (erreur) => erreur === SLUG_INVALIDE,
  );
}

test('validateOffer accepte un slug en kebab-case', () => {
  assert.deepEqual(erreursDuSlug('ia-solopreneurs'), []);
  assert.deepEqual(erreursDuSlug('b2-01-traitement-information-chiffree'), []);
});

test('validateOffer refuse un slug que le poste étudiant refuserait : tiret au bord ou doublé, majuscule, souligné, vide', () => {
  for (const slug of [
    '-ia-solopreneurs',
    'ia-solopreneurs-',
    'ia--solopreneurs',
    'IA-solopreneurs',
    'ia_solopreneurs',
    '',
    42,
  ]) {
    assert.deepEqual(erreursDuSlug(slug), [SLUG_INVALIDE], String(slug));
  }
});
