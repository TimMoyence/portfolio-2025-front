import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const RACINE = 'src/cours/runtime';
const INTERDITS = [/from ['"]@angular\//, /from ['"]rxjs/, /from ['"]zone\.js/];

function fichiersTs(dossier) {
  return readdirSync(dossier).flatMap((entree) => {
    const chemin = join(dossier, entree);
    if (statSync(chemin).isDirectory()) return fichiersTs(chemin);
    return chemin.endsWith('.ts') ? [chemin] : [];
  });
}

const fautifs = fichiersTs(RACINE).filter((chemin) => {
  const contenu = readFileSync(chemin, 'utf8');
  return INTERDITS.some((motif) => motif.test(contenu));
});

if (fautifs.length > 0) {
  console.error('Import de framework interdit dans le runtime de cours:');
  for (const fautif of fautifs) console.error(`  ${fautif}`);
  process.exit(1);
}
