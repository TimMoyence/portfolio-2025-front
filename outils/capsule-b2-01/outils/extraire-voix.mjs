import { readFileSync, writeFileSync } from 'node:fs';
const [doc, dest] = process.argv.slice(2);
const lignes = readFileSync(doc, 'utf8').split('\n');
const debut = lignes.findIndex((l) => l.startsWith('### A.4 '));
const fin = lignes.findIndex((l, i) => i > debut && l.startsWith('### A.5 '));
let n = 0;
for (const ligne of lignes.slice(debut, fin)) {
  const m = /^\| (P\d{2}) · [^|]+\| [^|]+\| (.+?) \| .+\|$/.exec(ligne);
  if (!m) continue;
  const brut = m[2].trim();
  if (brut === '(sans voix)') continue;
  if (!brut.startsWith('« ') || !brut.endsWith(' »'))
    throw new Error(`Voix mal délimitée : ${m[1]}`);
  writeFileSync(`${dest}/${m[1]}.txt`, `${brut.slice(2, -2)}\n`);
  n += 1;
}
if (n !== 10) throw new Error(`10 textes attendus, ${n} trouvés`);
console.log(`${n} textes de voix extraits`);
