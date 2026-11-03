import assert from 'node:assert/strict';
import { test } from 'node:test';

import { datePortee, revsIgnorees } from './lastmod.mjs';

const RANGEMENT = 'a'.repeat(40);
const CONTENU = 'b'.repeat(40);
const JOURNAL = `${RANGEMENT} 2026-11-03\n${CONTENU} 2026-10-16\n`;

test('LMD-01 · un commit listé n’avance pas le lastmod : la page prend la date du dernier commit non listé', () => {
  const ignorees = revsIgnorees(`# rangement par sujet\n\n  ${RANGEMENT}  \r\n`);

  assert.deepEqual(
    {
      avecLeRangementListe: datePortee(JOURNAL, ignorees),
      seulementLeRangement: datePortee(`${RANGEMENT} 2026-11-03\n`, ignorees),
      shaAbrege: datePortee(JOURNAL, revsIgnorees(RANGEMENT.slice(0, 8))),
      commentaireEnFinDeLigne: datePortee(
        JOURNAL,
        revsIgnorees(`${RANGEMENT.toUpperCase()} # rangement\n`),
      ),
      listeVide: datePortee(JOURNAL, revsIgnorees('')),
      journalVide: datePortee('', ignorees),
    },
    {
      avecLeRangementListe: '2026-10-16',
      seulementLeRangement: null,
      shaAbrege: '2026-11-03',
      commentaireEnFinDeLigne: '2026-10-16',
      listeVide: '2026-11-03',
      journalVide: null,
    },
  );
});
