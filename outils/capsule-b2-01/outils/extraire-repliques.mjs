import { readFileSync, writeFileSync } from 'node:fs';
const [doc, dest] = process.argv.slice(2);
const texte = readFileSync(doc, 'utf8');
const section = texte.slice(texte.indexOf('### A.5 '), texte.indexOf('### A.6 '));
const bloc = section.slice(section.indexOf('```') + 3, section.lastIndexOf('```'));
const repliques = [];
for (const paragraphe of bloc.split(/\n\s*\n/)) {
  const lignes = paragraphe.trim().split('\n');
  if (!/^P\d{2}-\d$/.test(lignes[0] ?? '')) continue;
  if (!/-->/.test(lignes[1])) throw new Error(`Minutage absent : ${lignes[0]}`);
  repliques.push({ id: lignes[0], gabarit: lignes[1], lignes: lignes.slice(2) });
}
if (repliques.length !== 29)
  throw new Error(`29 répliques attendues, ${repliques.length} trouvées`);
writeFileSync(dest, `${JSON.stringify(repliques, null, 1)}\n`);
console.log(`${repliques.length} répliques extraites`);
