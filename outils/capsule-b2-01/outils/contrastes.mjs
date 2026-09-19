// Contrastes WCAG 2.2 de la charte de la capsule (annexe A.2), calculés sur les couleurs
// réellement employées par page/capsule.html, fonds teintés compris.
// Usage : node outils/contrastes.mjs <racine medias>
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const melanger = (dessus, alpha, dessous) =>
  dessus.map((c, i) => Math.round(c * alpha + dessous[i] * (1 - alpha)));
const lin = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const rapport = (a, b) => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

const C = {
  fond: hex('#FBF7EF'),
  texte: hex('#1F2A30'),
  accent: hex('#0F6E6E'),
  arrivee: hex('#1F5FBF'),
  depart: hex('#B4400B'),
  erreur: hex('#B3261E'),
  ok: hex('#1E6B3A'),
  gris: hex('#545D63'),
  blanc: hex('#FFFFFF'),
  entete: hex('#ECE5D6'),
  carte: hex('#F1EBDF'),
  edition: hex('#E3F0EF'),
  fondOk: hex('#E1EFE5'),
  fondErreur: hex('#FBECEB'),
  trait: hex('#8F887C'),
  boutonPresse: hex('#D9ECEA'),
};
const teinteArrivee = melanger(C.arrivee, 0.1, C.blanc);
const teinteDepart = melanger(C.depart, 0.1, C.blanc);
const teintePlage = melanger(C.accent, 0.12, C.blanc);

const paires = [
  ['texte', 'texte courant sur le fond crème', C.texte, C.fond, 4.5],
  ['texte', 'texte des cellules (fond blanc)', C.texte, C.blanc, 4.5],
  ['texte', 'en-têtes de lignes et colonnes', C.texte, C.entete, 4.5],
  ['texte', 'texte des cartes du panneau', C.texte, C.carte, 4.5],
  ['texte', 'cellule en édition', C.texte, C.edition, 4.5],
  ['texte', 'cellule « arrivée » (teinte 10 %)', C.texte, teinteArrivee, 4.5],
  ['texte', 'cellule « départ » (teinte 10 %)', C.texte, teinteDepart, 4.5],
  ['texte', 'plage surlignée (teinte 12 %)', C.texte, teintePlage, 4.5],
  ['texte', 'accent sur le fond crème (titres du panneau)', C.accent, C.fond, 4.5],
  ['texte', 'accent sur blanc (bouton, $ de la barre)', C.accent, C.blanc, 4.5],
  ['texte', 'accent sur bouton pressé', C.accent, C.boutonPresse, 4.5],
  ['texte', 'blanc sur accent (pastilles, « À vous »)', C.blanc, C.accent, 4.5],
  ['texte', '« arrivée » sur le fond crème (charte)', C.arrivee, C.fond, 4.5],
  ['texte', '« arrivée » dans la barre (blanc)', C.arrivee, C.blanc, 4.5],
  ['texte', '« arrivée » dans une carte du panneau', C.arrivee, C.carte, 4.5],
  ['texte', 'puce « arrivée » (blanc sur bleu)', C.blanc, C.arrivee, 4.5],
  ['texte', '« départ » sur le fond crème (charte)', C.depart, C.fond, 4.5],
  ['texte', '« départ » dans la barre (blanc)', C.depart, C.blanc, 4.5],
  ['texte', '« départ » dans une carte du panneau', C.depart, C.carte, 4.5],
  ['texte', 'puce « départ » et clignotement (blanc sur orange)', C.blanc, C.depart, 4.5],
  ['texte', 'erreur sur le fond crème (charte)', C.erreur, C.fond, 4.5],
  ['texte', '#DIV/0! et 0 (rouge sur fond d’erreur)', C.erreur, C.fondErreur, 4.5],
  ['texte', 'puces « erreur » et « À vérifier »', C.blanc, C.erreur, 4.5],
  ['texte', 'contrôle réussi sur le fond crème (charte)', C.ok, C.fond, 4.5],
  ['texte', '1 du contrôle (vert sur fond vert clair)', C.ok, C.fondOk, 4.5],
  ['texte', 'puce « OK »', C.blanc, C.ok, 4.5],
  ['texte', 'source externe, gris italique sur blanc', C.gris, C.blanc, 4.5],
  ['texte', 'puce « source externe »', C.blanc, C.gris, 4.5],
  ['texte', 'badge « valeur tapée »', C.blanc, C.texte, 4.5],
  ['texte', 'puce « vide »', C.texte, C.fond, 4.5],
  ['trait', 'traits de la grille sur blanc', C.trait, C.blanc, 3],
  ['trait', 'traits de la grille sur le fond crème', C.trait, C.fond, 3],
  ['trait', 'bordure « arrivée » sur blanc', C.arrivee, C.blanc, 3],
  ['trait', 'bordure « départ » sur blanc', C.depart, C.blanc, 3],
  ['trait', 'sélection et plage (accent) sur blanc', C.accent, C.blanc, 3],
  ['trait', 'accolades (accent) sur le fond crème', C.accent, C.fond, 3],
];

const resultats = paires.map(([nature, libelle, avant, arriere, seuil]) => {
  const r = rapport(avant, arriere);
  return { nature, libelle, rapport: Math.round(r * 100) / 100, seuil, ok: r >= seuil };
});
writeFileSync(
  join(process.argv[2], 'build', 'contrastes.json'),
  `${JSON.stringify(resultats, null, 1)}\n`,
);
for (const r of resultats)
  console.log(
    `${r.ok ? 'OK ' : 'KO '} ${r.rapport.toFixed(2).padStart(5)}:1 (≥ ${r.seuil}) ${r.libelle}`,
  );
const echecs = resultats.filter((r) => !r.ok);
if (echecs.length) throw new Error(`${echecs.length} contraste(s) insuffisant(s)`);
