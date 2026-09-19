// Capsule B2-01 « Une formule qui se recopie, un tableau qui se contrôle ».
// window.__seek(t) met la scène dans l'état exact du temps t (secondes) : aucune animation libre,
// tout est fonction de t et de timeline.json (durées mesurées des pistes Piper).

const FRAPPE = 0.06;
const DEPLACEMENT = 0.4;
const ANNEAU = 0.3;
const FONDU = 0.25;
const COLONNES = ['A', 'B', 'C', 'D', 'E'];
const X0 = 40;
const Y_ENTETE = 110;
const Y0 = 138;
const LARGEUR = 148;
const HAUTEUR = 48;
const NBSP = ' ';
const BOUTON = { x: 40 + 118, y: 582 + 21 };

const T = await (await fetch('timeline.json')).json();

const plan = (id) => {
  const trouve = T.plans.find((p) => p.id === id);
  if (!trouve) throw new Error(`Plan inconnu ${id}`);
  return trouve;
};
const ancre = (id, cle) => {
  const a = plan(id).ancres[cle];
  if (!a) throw new Error(`Ancre inconnue ${id}.${cle}`);
  return a;
};
const A = (id, cle) => ancre(id, cle).debut;
const milieu = (id, cle) => (ancre(id, cle).debut + ancre(id, cle).fin) / 2;
const finAncre = (id, cle) => ancre(id, cle).fin;
const D = (id) => plan(id).debut;
const F = (id) => plan(id).fin;
const V0 = (id) => plan(id).voix.debut;

const borner = (v) => Math.min(1, Math.max(0, v));
const lisser = (v) => {
  const x = borner(v);
  return x * x * (3 - 2 * x);
};
const apparition = (t, debut, duree = FONDU) => (t < debut ? 0 : lisser((t - debut) / duree));

const colonne = (ref) => COLONNES.indexOf(ref[0]);
const ligne = (ref) => Number(ref.slice(1));
const cadre = (ref) => ({
  x: X0 + colonne(ref) * LARGEUR,
  y: Y0 + (ligne(ref) - 1) * HAUTEUR,
  l: LARGEUR,
  h: HAUTEUR,
});
const cadrePlage = (a, b) => {
  const r1 = cadre(a);
  const r2 = cadre(b);
  const x = Math.min(r1.x, r2.x);
  const y = Math.min(r1.y, r2.y);
  return { x, y, l: Math.max(r1.x, r2.x) + LARGEUR - x, h: Math.max(r1.y, r2.y) + HAUTEUR - y };
};
const pointeCellule = (ref) => {
  const r = cadre(ref);
  return { x: r.x + 34, y: r.y + 30 };
};

const ERREUR_DIV0 = { erreur: '#DIV/0!' };
const estErreur = (v) => typeof v === 'object' && v !== null && 'erreur' in v;

const JETON_REFERENCE = '\\$?[A-E]\\$?\\d+';
const JETON_FONCTION = '[A-Z]{2,}(?=\\()';
const JETON_NOMBRE = '\\d+(?:,\\d+)?';
const JETON_SIGNE = '[()+\\-*/=;:]';
const JETONS = [JETON_REFERENCE, JETON_FONCTION, JETON_NOMBRE, JETON_SIGNE].join('|');

function jetons(source) {
  const motif = new RegExp(`\\s*(${JETONS})`, 'y');
  const liste = [];
  let m;
  while (motif.lastIndex < source.length && (m = motif.exec(source))) liste.push(m[1]);
  if (motif.lastIndex !== source.length) throw new Error(`Formule illisible : ${source}`);
  return liste;
}

const nomRef = (ref) => ref.replaceAll('$', '');

function evaluer(ref, entrees, pile = new Set()) {
  const entree = entrees.get(ref);
  if (entree === undefined || entree === '') return null;
  if (typeof entree === 'number') return entree;
  if (/^-?\d+(,\d+)?$/.test(entree)) return Number(entree.replace(',', '.'));
  if (!entree.startsWith('=')) return entree;
  if (pile.has(ref)) throw new Error(`Référence circulaire ${ref}`);
  pile.add(ref);
  const liste = jetons(entree.slice(1));
  let i = 0;
  const voir = () => liste[i];
  const prendre = (attendu) => {
    const j = liste[i++];
    if (attendu !== undefined && j !== attendu)
      throw new Error(`« ${attendu} » attendu dans ${entree}`);
    return j;
  };
  const nombre = (v) => (v === null ? 0 : v);
  const arith = (op, g, d) => {
    if (estErreur(g)) return g;
    if (estErreur(d)) return d;
    const a = nombre(g);
    const b = nombre(d);
    if (op === '+') return a + b;
    if (op === '-') return a - b;
    if (op === '*') return a * b;
    if (b === 0) return ERREUR_DIV0;
    return a / b;
  };
  const valeurRef = (r) => evaluer(nomRef(r), entrees, pile);
  const cellulesPlage = (debut, fin) => {
    const refs = [];
    for (let c = colonne(nomRef(debut)); c <= colonne(nomRef(fin)); c += 1) {
      for (let l = ligne(nomRef(debut)); l <= ligne(nomRef(fin)); l += 1)
        refs.push(`${COLONNES[c]}${l}`);
    }
    return refs;
  };
  const valeursDArgument = (arg) =>
    arg.plage ? cellulesPlage(...arg.plage).map(valeurRef) : [arg];
  const additionner = (args) => {
    let s = 0;
    for (const v of args.flatMap(valeursDArgument)) {
      if (estErreur(v)) return v;
      if (typeof v === 'number') s += v;
    }
    return s;
  };
  const arrondirA = ([x, n]) => {
    if (estErreur(x)) return x;
    const f = 10 ** n;
    return Math.round((nombre(x) + Number.EPSILON) * f) / f;
  };
  const choisir = ([condition, alors, sinon]) => {
    if (estErreur(condition)) return condition;
    return condition ? alors : sinon;
  };
  const FONCTIONS = { SOMME: additionner, ARRONDI: arrondirA, SI: choisir };
  const fonction = (nom, args) => {
    const calcul = FONCTIONS[nom];
    if (calcul === undefined) throw new Error(`Fonction inconnue ${nom}`);
    return calcul(args);
  };
  function comparaison() {
    const g = somme();
    if (voir() === '=') {
      prendre();
      const d = somme();
      if (estErreur(g)) return g;
      if (estErreur(d)) return d;
      return nombre(g) === nombre(d);
    }
    return g;
  }
  function somme() {
    let g = produit();
    while (voir() === '+' || voir() === '-') g = arith(prendre(), g, produit());
    return g;
  }
  function produit() {
    let g = unaire();
    while (voir() === '*' || voir() === '/') g = arith(prendre(), g, unaire());
    return g;
  }
  function unaire() {
    if (voir() === '-') {
      prendre();
      return arith('-', 0, unaire());
    }
    return primaire();
  }
  function primaire() {
    const j = prendre();
    if (j === '(') {
      const v = comparaison();
      prendre(')');
      return v;
    }
    if (/^\d/.test(j)) return Number(j.replace(',', '.'));
    if (/^\$?[A-E]\$?\d+$/.test(j)) {
      if (voir() === ':') {
        prendre();
        return { plage: [j, prendre()] };
      }
      return valeurRef(j);
    }
    if (/^[A-Z]{2,}$/.test(j)) {
      prendre('(');
      const args = [comparaison()];
      while (voir() === ';') {
        prendre();
        args.push(comparaison());
      }
      prendre(')');
      return fonction(j, args);
    }
    throw new Error(`Jeton inattendu ${j} dans ${entree}`);
  }
  const resultat = comparaison();
  if (i !== liste.length) throw new Error(`Formule incomplète : ${entree}`);
  pile.delete(ref);
  return typeof resultat === 'boolean' ? Number(resultat) : resultat;
}

const decaler = (formule, lignes) =>
  formule.replace(
    /(\$?)([A-E])(\$?)(\d+)/g,
    (_, dc, c, dl, l) => `${dc}${c}${dl}${dl ? l : Number(l) + lignes}`,
  );

function parMilliers(chiffres) {
  let groupes = '';
  for (let fin = chiffres.length; fin > 0; fin -= 3) {
    const tranche = chiffres.slice(Math.max(0, fin - 3), fin);
    groupes = groupes ? `${tranche}${NBSP}${groupes}` : tranche;
  }
  return groupes;
}

function formater(v) {
  if (v === null) return '';
  if (estErreur(v)) return v.erreur;
  if (typeof v === 'string') return v;
  const arrondi = Math.round(v * 1e4) / 1e4;
  if (Number.isInteger(arrondi)) {
    return (arrondi < 0 ? '−' : '') + parMilliers(String(Math.abs(arrondi)));
  }
  return arrondi
    .toFixed(4)
    .replace(/0{1,4}$/, '')
    .replace('.', ',');
}

const brut = (entree) => {
  if (entree === undefined) return '';
  if (typeof entree === 'number') return String(entree).replace('.', ',');
  return entree.replace('\n', ' ');
};

const INITIAL = new Map([
  ['A1', 'Trimestre'],
  ['B1', 'Ventes 2024\n(€ HT)'],
  ['C1', 'Ventes 2025\n(€ HT)'],
  ['A2', 'T1'],
  ['A3', 'T2'],
  ['A4', 'T3'],
  ['A5', 'T4'],
  ['B2', 16000],
  ['B3', 40000],
  ['B4', 45000],
  ['B5', 9000],
  ['C2', 18000],
  ['C3', 42000],
  ['C4', 51000],
  ['C5', 9000],
  ['A6', 'Total'],
]);

const actions = [];
const sessions = [];
const marques = [];
const curseur = [];
const clics = [];
const panneaux = {};
const colorations = [];
const clignotements = [];
const verifications = [];

const agir = (t, type, details = {}) => actions.push({ t, type, ...details });

function deplacer(t, point) {
  const precedent = curseur.at(-1);
  const arrivee = precedent ? Math.max(t, precedent.t + DEPLACEMENT) : t;
  curseur.push({ t: arrivee, x: point.x, y: point.y });
  return arrivee;
}

function selectionnerAvecCurseur(t, ref) {
  const arrivee = deplacer(t, pointeCellule(ref));
  agir(arrivee, 'selection', { cellule: ref });
  return arrivee;
}

function cliquerRecopier(t) {
  clics.push({ t, x: BOUTON.x, y: BOUTON.y });
  agir(t, 'recopier');
}

function frapper(cellule, segments, { validation, base = '', debut } = {}) {
  const images = [];
  let texte = base;
  let fin = -Infinity;
  const fins = [];
  for (const segment of segments) {
    let instant = Math.max(segment.t, fin);
    for (const caractere of segment.texte) {
      texte += caractere;
      images.push({ t: instant, texte });
      instant += FRAPPE;
    }
    fin = instant;
    fins.push(fin);
  }
  const ouverture = debut ?? images[0].t;
  const valide = Math.max(validation ?? fin + 0.2, fin + FRAPPE);
  sessions.push({ cellule, debut: ouverture, validation: valide, base, images });
  agir(valide, 'saisir', { cellule, entree: texte });
  return { fins, fin, validation: valide, texte };
}

function editer(cellule, images, validation) {
  sessions.push({ cellule, debut: images[0].t, validation, base: images[0].texte, images });
  agir(validation, 'saisir', { cellule, entree: images.at(-1).texte });
}

const marquer = (debut, fin, type, cellules, puce) =>
  marques.push({ debut, fin, type, cellules, puce });
const verifier = (t, libelle, test) => verifications.push({ t, libelle, test });
const item = (debut, html, style = '') => ({ debut, html, style });

const FIN_TITRE = A('P01', 'titre-fin');

{
  curseur.push({ t: D('P02'), x: 610, y: 560 });
  selectionnerAvecCurseur(A('P02', 'en-c6'), 'C6');
  const c6 = frapper(
    'C6',
    [
      { t: A('P02', 'egal'), texte: '=' },
      { t: A('P02', 'somme'), texte: 'SOMME(' },
      { t: A('P02', 'plage'), texte: 'C2:C5)' },
    ],
    { validation: A('P02', 'cue-2') },
  );
  marquer(A('P02', 'plage'), A('P02', 'en-b6') - DEPLACEMENT, 'plage', ['C2', 'C5']);
  const arrivee = selectionnerAvecCurseur(A('P02', 'en-b6'), 'B6');
  const b6 = frapper('B6', [{ t: arrivee + 0.15, texte: '=SOMME(B2:B5)' }]);
  marquer(b6.fin - 6 * FRAPPE, F('P02'), 'plage', ['B2', 'B5']);
  panneaux.P02 = {
    titre: 'Geste 1 · Le total',
    items: [
      item(
        A('P02', 'somme'),
        '<span class="mono">SOMME(plage)</span> : additionne la plage',
        'carte',
      ),
    ],
  };
  verifier(
    milieu('P02', 'cent-vingt-mille'),
    'C6 affiche 120 000',
    (e) => e.affichage.C6 === `120${NBSP}000`,
  );
  verifier(
    milieu('P02', 'cent-dix-mille'),
    'B6 affiche 110 000',
    (e) => e.affichage.B6 === `110${NBSP}000`,
  );
  verifier(
    c6.validation,
    'C6 validée avant « cent vingt mille »',
    () => c6.validation < A('P02', 'cent-vingt-mille'),
  );
}

{
  agir(A('P03', 'evolution'), 'saisir', { cellule: 'D1', entree: 'Évolution' });
  selectionnerAvecCurseur(A('P03', 'en-d2'), 'D2');
  const d2 = frapper(
    'D2',
    [
      { t: A('P03', 'egal'), texte: '=(' },
      { t: A('P03', 'c2-moins-b2'), texte: 'C2-B2' },
      { t: A('P03', 'fermee'), texte: ')' },
      { t: A('P03', 'divise'), texte: '/B2' },
    ],
    { validation: A('P03', 'cue-3') },
  );
  const debutRefs = d2.fins[0] > A('P03', 'c2-moins-b2') ? d2.fins[0] : A('P03', 'c2-moins-b2');
  marquer(debutRefs + FRAPPE, F('P03'), 'arrivee', ['C2'], { texte: 'arrivée', classe: 'arrivee' });
  marquer(debutRefs + 4 * FRAPPE, F('P03'), 'depart', ['B2'], {
    texte: 'départ',
    classe: 'depart',
  });
  colorations.push({
    debut: D('P03'),
    fin: F('P03'),
    cellule: 'D2',
    regles: [
      ['C2', 'ref-arrivee'],
      ['B2', 'ref-depart'],
    ],
  });
  clignotements.push({
    debut: A('P03', 'depart'),
    cellule: 'D2',
    motif: 'B2',
    occurrence: 'derniere',
  });
  panneaux.P03 = {
    titre: 'Geste 2 · Le taux d’évolution',
    items: [
      item(
        A('P03', 'cue-2'),
        `t = (<span class="mot-arrivee">arrivée</span> − <span class="mot-depart">départ</span>) / <span class="mot-depart">départ</span>`,
        'carte',
      ),
      item(A('P03', 'douze-5') - 0.3, `<span class="mono">0,125 × 100 = 12,5${NBSP}%</span>`),
    ],
  };
  verifier(milieu('P03', 'zero-125'), 'D2 affiche 0,125', (e) => e.affichage.D2 === '0,125');
  verifier(milieu('P03', 'douze-5'), 'le panneau affiche 12,5 %', (e) =>
    e.panneauTexte.includes(`12,5${NBSP}%`),
  );
  verifier(milieu('P03', 'depart'), 'B2 marquée « départ »', (e) => e.puces.includes('départ'));
}

{
  const lignesRecopie = [
    item(D('P04') + 0.3, '<span class="mono">D2 =(C2-B2)/B2</span>', 'formule'),
  ];
  const premier = A('P04', 'recopier');
  deplacer(premier - 0.05, BOUTON);
  for (let k = 0; k < 4; k += 1) {
    const t = premier + 1.2 * k;
    cliquerRecopier(t);
    const l = 3 + k;
    lignesRecopie.push(
      item(
        t,
        `<span class="mono">D<b>${l}</b> =(C<b>${l}</b>-B<b>${l}</b>)/B<b>${l}</b></span>`,
        'formule',
      ),
    );
  }
  panneaux.P04 = { titre: 'La recopie', items: lignesRecopie };
  verifier(milieu('P04', 'c2-c3'), 'le panneau montre =(C3-B3)/B3', (e) =>
    e.panneauTexte.includes('D3 =(C3-B3)/B3'),
  );
  verifier(premier + 3.7, 'D3 à D6 remplies', (e) =>
    ['0,05', '0,1333', '0', '0,0909'].every((v, i) => e.affichage[`D${3 + i}`] === v),
  );
}

{
  agir(A('P05', 'part'), 'saisir', { cellule: 'E1', entree: 'Part 2025' });
  selectionnerAvecCurseur(A('P05', 'en-e2'), 'E2');
  const e2 = frapper('E2', [
    { t: A('P05', 'divise-c2'), texte: '=C2' },
    { t: A('P05', 'c6'), texte: '/C6' },
  ]);
  deplacer(A('P05', 'recopiee') - 0.05, BOUTON);
  const clic = A('P05', 'recopiee') + 0.05;
  cliquerRecopier(clic);
  marquer(A('P05', 'vide'), F('P05'), 'vide', ['C7'], {
    texte: 'vide',
    classe: 'vide',
    dedans: true,
  });
  panneaux.P05 = {
    titre: 'Geste 3 · La part du total',
    items: [
      item(e2.validation, '<span class="mono">E2 =C2/C6</span>', 'formule'),
      item(
        clic,
        '<span class="mono">E<b>3</b> =C<b>3</b>/C<b class="faux">7</b></span>',
        'formule',
      ),
      item(A('P05', 'c3-c7'), 'C6 a glissé en C7', 'carte'),
    ],
  };
  verifier(
    milieu('P05', 'c3-c7'),
    'la barre affiche E3 =C3/C7',
    (e) => e.barre.nom === 'E3' && e.barre.texte === '=C3/C7',
  );
  verifier(milieu('P05', 'erreur'), 'E3 affiche #DIV/0!', (e) => e.affichage.E3 === '#DIV/0!');
  verifier(milieu('P05', 'vide'), 'C7 marquée « vide »', (e) => e.puces.includes('vide'));
}

{
  agir(V0('P06') + 0.2, 'effacer', { cellule: 'E3' });
  const arrivee = selectionnerAvecCurseur(V0('P06') + 1.0, 'E2');
  const ouverture = Math.max(A('P06', 'ecrit'), arrivee + 0.1);
  editer(
    'E2',
    [
      { t: ouverture, texte: '=C2/C6' },
      { t: A('P06', 'dollar-c') + 0.05, texte: '=C2/$C6' },
      { t: A('P06', 'dollar-6') + 0.05, texte: '=C2/$C$6' },
    ],
    A('P06', 'cue-2'),
  );
  const premier = A('P06', 'cue-3');
  deplacer(premier - 0.05, BOUTON);
  for (let k = 0; k < 4; k += 1) cliquerRecopier(premier + 0.9 * k);
  panneaux.P06 = {
    titre: 'Le dollar',
    items: [
      item(
        A('P06', 'cue-2'),
        '<span class="mono"><b>$</b>C</span> : colonne figée<br><span class="mono"><b>$</b>6</span> : ligne figée',
        'carte',
      ),
    ],
  };
  verifier(
    finAncre('P06', 'dollar-6'),
    'la barre affiche =C2/$C$6',
    (e) => e.barre.texte === '=C2/$C$6',
  );
  verifier(milieu('P06', 'vaut-1'), 'E6 affiche 1', (e) => e.affichage.E6 === '1');
  verifier(milieu('P06', 'parts'), 'E3 affiche 0,35', (e) => e.affichage.E3 === '0,35');
  verifier(milieu('P06', 'cent-pour-cent'), 'E3 à E6 : 0,35 ; 0,425 ; 0,075 ; 1', (e) =>
    ['0,35', '0,425', '0,075', '1'].every((v, i) => e.affichage[`E${3 + i}`] === v),
  );
}

const ACCOLADES = [
  { rang: 1, libelle: 'SOMME(E2:E5)', debut: 12, fin: 23, niveau: 1 },
  { rang: 2, libelle: 'ARRONDI(… ; 6)', debut: 4, fin: 26, niveau: 2 },
  { rang: 3, libelle: '= 1 ?', debut: 27, fin: 28, niveau: 1 },
  { rang: 4, libelle: 'alors 1', debut: 30, fin: 30, niveau: 1 },
  { rang: 5, libelle: 'sinon 0', debut: 32, fin: 32, niveau: 1 },
];
{
  agir(V0('P07'), 'saisir', { cellule: 'D8', entree: 'Contrôle 1\n(formules)' });
  marquer(A('P07', 'quatre-parts'), A('P07', 'cue-2'), 'plage', ['E2', 'E5']);
  selectionnerAvecCurseur(A('P07', 'cue-2'), 'E8');
  const e8 = frapper(
    'E8',
    [
      { t: A('P07', 'si'), texte: '=SI(' },
      { t: A('P07', 'arrondi'), texte: 'ARRONDI(' },
      { t: A('P07', 'somme'), texte: 'SOMME(E2:E5)' },
      { t: A('P07', 'somme'), texte: ';6)' },
      { t: A('P07', 'egal-1'), texte: '=1' },
      { t: A('P07', 'egal-1'), texte: ';' },
      { t: A('P07', 'alors-1'), texte: '1' },
      { t: A('P07', 'alors-1'), texte: ';' },
      { t: A('P07', 'sinon-0'), texte: '0' },
      { t: A('P07', 'sinon-0'), texte: ')' },
    ],
    { validation: A('P07', 'cue-3') },
  );
  const allumage = [e8.fins[2], e8.fins[3], e8.fins[4], e8.fins[6], e8.fins[8]];
  ACCOLADES.forEach((a, i) => {
    a.t = allumage[i];
  });
  marquer(e8.fins[2] - 6 * FRAPPE, e8.validation, 'plage', ['E2', 'E5']);
  panneaux.P07 = {
    titre: 'Geste 4 · Le contrôle',
    items: [],
    accolades: { debut: A('P07', 'cue-2') },
  };
  verifier(
    finAncre('P07', 'sinon-0'),
    'la formule de E8 est complète',
    (e) => e.barre.texte === '=SI(ARRONDI(SOMME(E2:E5);6)=1;1;0)',
  );
  verifier(
    milieu('P07', 'affiche-1'),
    'E8 affiche 1 (OK)',
    (e) => e.affichage.E8 === '1' && e.etats.E8 === 'ok',
  );
  verifier(finAncre('P07', 'sinon-0') + 0.2, 'accolades allumées dans l’ordre de la liste', () =>
    ACCOLADES.every((a, i) => i === 0 || a.t >= ACCOLADES[i - 1].t),
  );
}

{
  selectionnerAvecCurseur(A('P08', 'tape'), 'E3');
  const tape = frapper('E3', [{ t: A('P08', 'zero-4'), texte: '0,4' }], {
    validation: A('P08', 'place'),
  });
  const retablie = frapper('E3', [{ t: A('P08', 'cue-3'), texte: '=C3/$C$6' }]);
  marquer(tape.validation, retablie.validation, 'tapee', ['E3'], {
    texte: 'valeur tapée, plus de formule',
    classe: 'neutre',
    lateral: true,
  });
  marquer(A('P08', 'passe-0'), A('P08', 'passe-0') + 0.9, 'impulsion', ['E8']);
  marquer(A('P08', 'revient-1'), A('P08', 'revient-1') + 0.9, 'impulsion', ['E8']);
  panneaux.P08 = {
    titre: 'L’épreuve du contrôle',
    items: [
      item(
        A('P08', 'cue-2'),
        '<span class="mono">0,15 + 0,4 + 0,425 + 0,075<br>= 1,05</span>',
        'carte bas',
      ),
    ],
  };
  verifier(finAncre('P08', 'zero-4'), 'la barre affiche 0,4', (e) => e.barre.texte === '0,4');
  verifier(
    milieu('P08', 'passe-0'),
    'E8 affiche 0 (À vérifier)',
    (e) => e.affichage.E8 === '0' && e.etats.E8 === 'ko',
  );
  verifier(milieu('P08', 'cue-2'), 'le panneau affiche 1,05', (e) =>
    e.panneauTexte.includes('= 1,05'),
  );
  verifier(
    milieu('P08', 'revient-1'),
    'E8 revient à 1 (OK)',
    (e) => e.affichage.E8 === '1' && e.etats.E8 === 'ok',
  );
  verifier(milieu('P08', 'revient-1'), 'E3 revient à 0,35', (e) => e.affichage.E3 === '0,35');
}

{
  agir(A('P09', 'source'), 'saisir', {
    cellule: 'A9',
    entree: 'Compte de résultat\n2025 : ventes de sacs',
  });
  agir(A('P09', 'source'), 'saisir', { cellule: 'C9', entree: 120000 });
  agir(A('P09', 'source'), 'saisir', { cellule: 'D9', entree: 'Contrôle 2\n(données)' });
  marquer(A('P09', 'source'), F('P09'), 'externe', ['C9'], {
    texte: 'source externe',
    classe: 'externe',
    haut: true,
  });
  const debutFrappe = A('P09', 'ventes');
  selectionnerAvecCurseur(debutFrappe - 0.1, 'E9');
  const e9 = frapper('E9', [{ t: debutFrappe, texte: '=SI(ARRONDI(C6-C9;0)=0;1;0)' }]);
  deplacer(e9.validation + 0.6, { x: 560, y: 596 });
  marquer(debutFrappe + 12 * FRAPPE, e9.validation + 1, 'plage', ['C6', 'C6']);
  marquer(debutFrappe + 15 * FRAPPE, e9.validation + 1, 'plage', ['C9', 'C9']);
  panneaux.P09 = {
    titre: 'La source indépendante',
    items: [
      item(
        V0('P09'),
        '<span class="controle-ligne"><span class="puce-cellule ok">OK</span><span>Contrôle 1 : les formules tiennent</span></span>',
        'carte',
      ),
      item(
        A('P09', 'cue-4'),
        '<span class="controle-ligne"><span class="puce-cellule ok">OK</span><span>Contrôle 2 : le total concorde avec une source indépendante</span></span>',
        'carte',
      ),
    ],
  };
  verifier(
    milieu('P09', 'cent-vingt-mille'),
    'C9 affiche 120 000',
    (e) => e.affichage.C9 === `120${NBSP}000`,
  );
  verifier(
    milieu('P09', 'affiche-1'),
    'E9 affiche 1 (OK)',
    (e) => e.affichage.E9 === '1' && e.etats.E9 === 'ok',
  );
  verifier(
    F('P09') - 0.5,
    'affiche : les deux contrôles à 1',
    (e) => e.affichage.E8 === '1' && e.affichage.E9 === '1',
  );
}

const CARTES = [
  { t: V0('P10'), numero: 1, titre: 'Total', texte: '<span class="mono">=SOMME(plage)</span>' },
  { t: A('P10', 'evolution'), numero: 2, titre: 'Évolution', texte: '(arrivée − départ) / départ' },
  {
    t: A('P10', 'part'),
    numero: 3,
    titre: 'Part',
    texte: 'total figé, <span class="mono">$C$6</span>',
  },
  {
    t: A('P10', 'controles'),
    numero: 4,
    titre: 'Contrôles',
    texte: 'formules + source indépendante',
  },
];
const A_VOUS = A('P10', 'a-vous');
verifier(milieu('P10', 'part'), 'carte 3 visible', (e) => e.cartes >= 3);

actions.sort((a, b) => a.t - b.t);

function rejouerLesActions(t) {
  const entrees = new Map(INITIAL);
  let selection = null;
  for (const action of actions) {
    if (action.t > t) break;
    if (action.type === 'selection') selection = action.cellule;
    if (action.type === 'saisir') entrees.set(action.cellule, action.entree);
    if (action.type === 'effacer') entrees.delete(action.cellule);
    if (action.type === 'recopier') {
      const cible = `${selection[0]}${ligne(selection) + 1}`;
      entrees.set(cible, decaler(entrees.get(selection), 1));
      selection = cible;
    }
  }
  return { entrees, selection };
}

function etatDeCellule(ref, valeur) {
  if (estErreur(valeur)) return 'erreur';
  if ((ref === 'E8' || ref === 'E9') && typeof valeur === 'number')
    return valeur === 1 ? 'ok' : 'ko';
  if (typeof valeur === 'number') return 'nombre';
  return valeur === null ? undefined : 'texte';
}

function calculerLaGrille(entrees) {
  const affichage = {};
  const etats = {};
  for (let l = 1; l <= 9; l += 1) {
    for (const c of COLONNES) {
      const ref = `${c}${l}`;
      const valeur = evaluer(ref, entrees);
      affichage[ref] = formater(valeur);
      const etat = etatDeCellule(ref, valeur);
      if (etat !== undefined) etats[ref] = etat;
    }
  }
  return { affichage, etats };
}

function etatDeLaBarre(t, { selection, entrees, session }) {
  if (!session) {
    return {
      nom: selection ?? '',
      texte: selection ? brut(entrees.get(selection)) : '',
      edition: false,
    };
  }
  const images = session.images.filter((i) => i.t <= t);
  return {
    nom: session.cellule,
    texte: images.length ? images.at(-1).texte : session.base,
    edition: true,
  };
}

function etatTableur(t) {
  const { entrees, selection } = rejouerLesActions(t);
  const session = sessions.find((s) => s.debut <= t && t < s.validation) ?? null;
  const { affichage, etats } = calculerLaGrille(entrees);
  const barre = etatDeLaBarre(t, { selection, entrees, session });
  return { entrees, selection, session, affichage, etats, barre };
}

function positionCurseur(t) {
  if (!curseur.length || t < curseur[0].t) return null;
  let position = { x: curseur[0].x, y: curseur[0].y };
  for (const cle of curseur.slice(1)) {
    if (t >= cle.t) {
      position = { x: cle.x, y: cle.y };
      continue;
    }
    if (t > cle.t - DEPLACEMENT) {
      const k = lisser((t - (cle.t - DEPLACEMENT)) / DEPLACEMENT);
      position = {
        x: position.x + (cle.x - position.x) * k,
        y: position.y + (cle.y - position.y) * k,
      };
    }
    break;
  }
  return position;
}

const echapper = (s) =>
  String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const px = (v) => `${Math.round(v * 100) / 100}px`;
const ICONE_ALERTE =
  '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1.5 19 18H1z" fill="currentColor"/><rect x="9" y="7" width="2" height="6" fill="#fff"/><rect x="9" y="14.5" width="2" height="2" fill="#fff"/></svg>';
const ICONE_ALERTE_BLANCHE =
  '<svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1.5 19 18H1z" fill="#fff"/><rect x="9" y="7" width="2" height="6" fill="currentColor"/><rect x="9" y="14.5" width="2" height="2" fill="currentColor"/></svg>';

function marquerToutesLesOccurrences(texte, classes, motif, classe) {
  let i = texte.indexOf(motif);
  while (i >= 0) {
    for (let k = i; k < i + motif.length; k += 1) classes[k] = classe;
    i = texte.indexOf(motif, i + 1);
  }
}

function colorerLaBarre(t, barre, texte, classes) {
  for (const c of colorations) {
    if (t < c.debut || t >= c.fin || barre.nom !== c.cellule) continue;
    for (const [motif, classe] of c.regles)
      marquerToutesLesOccurrences(texte, classes, motif, classe);
  }
}

function clignoterDansLaBarre(t, barre, texte, classes) {
  for (const c of clignotements) {
    const phase = t - c.debut;
    if (barre.nom !== c.cellule || phase < 0 || phase >= 1) continue;
    if (phase % 0.5 >= 0.25) continue;
    const i = texte.lastIndexOf(c.motif);
    if (i >= 0) for (let k = i; k < i + c.motif.length; k += 1) classes[k] = 'clignote';
  }
}

function htmlBarre(t, barre) {
  const texte = barre.texte;
  const classes = Array.from(texte, (ch) => (ch === '$' ? 'dollar' : ''));
  colorerLaBarre(t, barre, texte, classes);
  clignoterDansLaBarre(t, barre, texte, classes);
  let html = '';
  let courant = null;
  let tampon = '';
  const vider = () => {
    if (!tampon) return;
    html += courant ? `<span class="${courant}">${echapper(tampon)}</span>` : echapper(tampon);
    tampon = '';
  };
  Array.from(texte).forEach((ch, i) => {
    if (classes[i] !== courant) {
      vider();
      courant = classes[i];
    }
    tampon += ch;
  });
  vider();
  if (barre.edition) html += '<span class="caret"></span>';
  return html;
}

function htmlCellule(ref, etat) {
  const r = cadre(ref);
  const valeur = etat.affichage[ref];
  const type = etat.etats[ref];
  const classes = ['cellule'];
  let contenu = echapper(valeur).replaceAll('\n', '<br>');
  let largeur = r.l - 2;
  if (ligne(ref) === 1 && valeur) classes.push('entete-donnees');
  if (ref === 'A9' && valeur) {
    classes.push('large');
    largeur = 2 * LARGEUR - 2;
  }
  if (ref === 'C9' && valeur) classes.push('externe');
  if (type === 'nombre') classes.push('nombre');
  if (type === 'erreur') {
    classes.push('erreur');
    contenu = `${ICONE_ALERTE}<span>${echapper(valeur)}</span>`;
  }
  if (type === 'ok') {
    classes.push('nombre', 'controle-ok');
    contenu = `<span class="puce-cellule ok etiquette-cellule">OK</span><span>${valeur}</span>`;
  }
  if (type === 'ko') {
    classes.push('nombre', 'controle-ko');
    contenu = `<span class="puce-cellule erreur etiquette-cellule">À vérifier</span><span>${valeur}</span>`;
  }
  if (etat.session && etat.session.cellule === ref) {
    classes.push('en-edition');
    contenu = '';
  }
  return `<div class="${classes.join(' ')}" style="left:${px(r.x + 1)};top:${px(r.y + 1)};width:${px(largeur)};height:${px(r.h - 2)}">${contenu}</div>`;
}

function htmlCadreDeMarque(r, classe) {
  return `<div class="marque ${classe}" style="left:${px(r.x - 1)};top:${px(r.y - 1)};width:${px(r.l + 2)};height:${px(r.h + 2)}"></div>`;
}

function positionDePuce(puce, r) {
  if (puce.lateral) return { x: X0 + 5 * LARGEUR + 14, y: r.y + 5 };
  if (puce.haut) return { x: r.x + 6, y: r.y - 13 };
  if (puce.dedans) return { x: r.x + 6, y: r.y + 11 };
  return { x: r.x + 6, y: r.y + r.h - 13 };
}

function htmlPuce(puce, r) {
  const { x, y } = positionDePuce(puce, r);
  const grande = puce.lateral ? ' grande' : '';
  const icone = puce.lateral ? ICONE_ALERTE_BLANCHE : '';
  return `<div class="puce ${puce.classe}${grande}" style="left:${px(x)};top:${px(y)}">${icone}${echapper(puce.texte)}</div>`;
}

function htmlMarquesDeclarees(t) {
  let html = '';
  const puces = [];
  for (const m of marques) {
    if (t < m.debut || t >= m.fin) continue;
    const r = m.cellules.length === 2 ? cadrePlage(...m.cellules) : cadre(m.cellules[0]);
    if (m.type !== 'tapee' && m.type !== 'externe') html += htmlCadreDeMarque(r, m.type);
    if (m.puce) {
      html += htmlPuce(m.puce, r);
      puces.push(m.puce.texte);
    }
  }
  return { html, puces };
}

function htmlPucesDErreur(etat) {
  let html = '';
  const puces = [];
  for (const [ref, type] of Object.entries(etat.etats)) {
    if (type !== 'erreur') continue;
    const r = cadre(ref);
    html += `<div class="puce erreur" style="left:${px(r.x + 6)};top:${px(r.y + r.h - 13)}">${ICONE_ALERTE_BLANCHE}erreur</div>`;
    puces.push('erreur');
  }
  return { html, puces };
}

function htmlMarques(t, etat) {
  const declarees = htmlMarquesDeclarees(t);
  const erreurs = htmlPucesDErreur(etat);
  let html = declarees.html + erreurs.html;
  if (etat.selection && !etat.session)
    html += htmlCadreDeMarque(cadre(etat.selection), 'selection');
  if (etat.session) html += htmlCadreDeMarque(cadre(etat.session.cellule), 'selection');
  return { html, puces: [...declarees.puces, ...erreurs.puces] };
}

let mesures = null;

function htmlAccolades(t, texteFormule, debut) {
  if (t < debut) return '';
  const cw = mesures.mono20;
  const x0 = (430 - 34 * cw) / 2;
  const yTexte = 70;
  let svg = `<svg id="accolades" width="430" height="190" viewBox="0 0 430 190" style="top:${yTexte - 44}px">`;
  svg += `<text x="${x0}" y="44" font-family="JetBrains Mono" font-size="20" fill="#1f2a30" xml:space="preserve">${echapper(texteFormule)}</text>`;
  let legendes = '';
  for (const a of ACCOLADES) {
    if (t < a.t) continue;
    const opacite = apparition(t, a.t, 0.2);
    const xa = x0 + a.debut * cw + 1;
    const xb = x0 + (a.fin + 1) * cw - 1;
    const largeur = Math.max(xb - xa, 16);
    const x1 = (xa + xb) / 2 - largeur / 2;
    const x2 = x1 + largeur;
    const xm = (x1 + x2) / 2;
    const y = a.niveau === 1 ? 54 : 102;
    const h = 12;
    const d = `M${x1} ${y} Q${x1} ${y + h / 2} ${x1 + 5} ${y + h / 2} L${xm - 5} ${y + h / 2} Q${xm} ${y + h / 2} ${xm} ${y + h} Q${xm} ${y + h / 2} ${xm + 5} ${y + h / 2} L${x2 - 5} ${y + h / 2} Q${x2} ${y + h / 2} ${x2} ${y}`;
    const yp = y + h + 13;
    svg += `<g opacity="${opacite.toFixed(3)}"><path d="${d}" fill="none" stroke="#0f6e6e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
    svg += `<circle cx="${xm}" cy="${yp}" r="11" fill="#0f6e6e"/><text x="${xm}" y="${yp + 5.5}" text-anchor="middle" font-family="Atkinson Hyperlegible" font-weight="700" font-size="15" fill="#ffffff">${a.rang}</text></g>`;
    legendes += `<div class="legende" style="top:${215 + (a.rang - 1) * 58}px;opacity:${opacite.toFixed(3)}"><span class="pastille">${a.rang}</span><span class="mono">${echapper(a.libelle)}</span></div>`;
  }
  svg += '</svg>';
  return svg + legendes;
}

function panneauActif(t) {
  for (const p of T.plans) {
    if (t >= p.debut && t < p.fin && panneaux[p.id]) return { id: p.id, ...panneaux[p.id] };
  }
  return null;
}

function htmlPanneau(t, etat) {
  const p = panneauActif(t);
  if (!p) return { html: '', texte: '' };
  let html = `<div class="panneau-plan"><h2 class="panneau-titre">${echapper(p.titre)}</h2>`;
  let texte = `${p.titre}\n`;
  for (const it of p.items) {
    if (t < it.debut) continue;
    const opacite = apparition(t, it.debut);
    const classe = it.style.includes('formule') ? 'ligne-formule' : `item ${it.style}`;
    const style = it.style.includes('bas') ? 'position:absolute;left:0;right:0;top:215px;' : '';
    html += `<div class="${classe.replace(' bas', '')}" style="${style}opacity:${opacite.toFixed(3)}">${it.html}</div>`;
    texte += `${it.html.replace(/<br>/g, '\n').replace(/<[^<>]*>/g, '')}\n`;
  }
  if (p.accolades) {
    const formule =
      etat.session?.cellule === 'E8' ? etat.barre.texte : brut(etat.entrees.get('E8'));
    html += htmlAccolades(t, formule, p.accolades.debut);
  }
  html += '</div>';
  return { html, texte };
}

let GRILLE_FIXE = '';
function construireGrilleFixe() {
  let html = `<div style="position:absolute;left:${X0}px;top:${Y0}px;width:${5 * LARGEUR}px;height:${9 * HAUTEUR}px;background:var(--trait)"></div>`;
  COLONNES.forEach((c, i) => {
    html += `<div class="entete-col" style="left:${X0 + i * LARGEUR + 1}px;top:${Y_ENTETE}px;width:${LARGEUR - 2}px;height:${Y0 - Y_ENTETE - 2}px">${c}</div>`;
  });
  for (let l = 1; l <= 9; l += 1) {
    html += `<div class="entete-ligne" style="left:8px;top:${Y0 + (l - 1) * HAUTEUR + 1}px;width:30px;height:${HAUTEUR - 2}px">${l}</div>`;
  }
  GRILLE_FIXE = html;
}

function htmlTableur(t) {
  const etat = etatTableur(t);
  let html = GRILLE_FIXE;
  for (let l = 1; l <= 9; l += 1) {
    for (const c of COLONNES) {
      if (c === 'B' && l === 9 && etat.affichage.A9) continue;
      html += htmlCellule(`${c}${l}`, etat);
    }
  }
  const marquesHtml = htmlMarques(t, etat);
  html += marquesHtml.html;
  html += `<div id="barre"><div id="barre-nom" class="mono">${echapper(etat.barre.nom)}</div><div id="barre-formule" class="mono">${htmlBarre(t, etat.barre)}</div></div>`;
  html += '<div id="fictives">données fictives</div>';
  const presse = clics.some((c) => t >= c.t && t < c.t + ANNEAU);
  html += `<div id="bouton"${presse ? ' class="presse"' : ''}>Recopier vers le bas</div>`;
  const panneau = htmlPanneau(t, etat);
  html += `<div id="panneau">${panneau.html}</div>`;
  for (const c of clics) {
    if (t < c.t || t >= c.t + ANNEAU) continue;
    const k = (t - c.t) / ANNEAU;
    const rayon = 10 + 22 * k;
    html += `<div class="anneau" style="left:${px(c.x - rayon)};top:${px(c.y - rayon)};width:${px(2 * rayon)};height:${px(2 * rayon)};opacity:${(1 - 0.7 * k).toFixed(3)}"></div>`;
  }
  const position = t >= D('P02') && t < F('P09') ? positionCurseur(t) : null;
  if (position) {
    html += `<svg id="curseur" width="26" height="38" viewBox="0 0 26 38" style="left:${px(position.x - 2)};top:${px(position.y - 2)}"><path d="M2 2 L2 30 L9 23.5 L14 35 L19 32.8 L14 21.6 L23.5 21.6 Z" fill="#1f2a30" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/></svg>`;
  }
  return { html, etat, panneauTexte: panneau.texte, puces: marquesHtml.puces };
}

function htmlRecap(t) {
  let html = '<h2 id="recap-titre">Récapitulatif</h2>';
  let visibles = 0;
  CARTES.forEach((c, i) => {
    if (t < c.t) return;
    visibles += 1;
    const x = i % 2 === 0 ? 40 : 650;
    const y = i < 2 ? 100 : 325;
    html += `<div class="carte-recap" style="left:${x}px;top:${y}px;opacity:${apparition(t, c.t, 0.3).toFixed(3)}"><div class="numero">${c.numero}</div><h2>${c.titre}</h2><p>${c.texte}</p></div>`;
  });
  if (t >= A_VOUS) {
    html += `<div id="a-vous" style="opacity:${apparition(t, A_VOUS, 0.3).toFixed(3)}">À vous : tâche de tableur 1 — Atelier Rivage</div>`;
  }
  return { html, visibles };
}

const HTML_TITRE =
  '<h1>Une formule qui se recopie,<br>un tableau qui se contrôle</h1><div class="filet"></div><p>B2-01 · 4 gestes de tableur</p>';
const HTML_CREDITS = [
  '<h2>Une formule qui se recopie, un tableau qui se contrôle</h2>',
  '<p class="licence">Tim Moyence — Asili Design, 2026 · Licence CC BY-SA 4.0</p>',
  '<p>Voix de synthèse : Piper, modèle fr_FR-siwis-medium (licence MIT)</p>',
  '<p>Données SIWIS : J. Yamagishi, P.-E. Honnet, P. Garner, A. Lazaridis,<br>Université d’Édimbourg, CC BY 4.0 (https://doi.org/10.7488/ds/1705)</p>',
  '<p>Polices Atkinson Hyperlegible et JetBrains Mono (SIL OFL 1.1)</p>',
  '<p>Données fictives · Transcription et sous-titres disponibles</p>',
].join('');

const scene = document.getElementById('scene');

function opaciteDuRecapitulatif(t, debutRecap, debutCredits) {
  if (t < debutRecap) return 0;
  if (t < debutCredits) return apparition(t, debutRecap, 0.5);
  return 1 - apparition(t, debutCredits, 0.5);
}

function composer(t) {
  const debutRecap = D('P10');
  const debutCredits = D('P11');
  const fonduTableur = apparition(t, FIN_TITRE, 0.8);
  const opaciteTitre = 1 - fonduTableur;
  const opaciteTableur = t < debutRecap ? fonduTableur : 1 - apparition(t, debutRecap, 0.5);
  const opaciteRecap = opaciteDuRecapitulatif(t, debutRecap, debutCredits);
  const opaciteCredits = apparition(t, debutCredits, 0.5);
  let html = '';
  let details = { etat: null, panneauTexte: '', puces: [], cartes: 0 };
  if (opaciteTitre > 0)
    html += `<div id="titre" class="vue" style="opacity:${opaciteTitre.toFixed(3)}">${HTML_TITRE}</div>`;
  if (opaciteTableur > 0) {
    const tableur = htmlTableur(t);
    details = {
      ...details,
      etat: tableur.etat,
      panneauTexte: tableur.panneauTexte,
      puces: tableur.puces,
    };
    html += `<div id="tableur" class="vue" style="opacity:${opaciteTableur.toFixed(3)}">${tableur.html}</div>`;
  }
  if (opaciteRecap > 0) {
    const recap = htmlRecap(t);
    details.cartes = recap.visibles;
    html += `<div id="recap" class="vue" style="opacity:${opaciteRecap.toFixed(3)}">${recap.html}</div>`;
  }
  if (opaciteCredits > 0)
    html += `<div id="credits" class="vue" style="opacity:${opaciteCredits.toFixed(3)}">${HTML_CREDITS}</div>`;
  return { html, details };
}

let dernier = '';
window.__seek = (t) => {
  const { html } = composer(t);
  if (html !== dernier) {
    scene.innerHTML = html;
    dernier = html;
  }
  return html;
};

window.__verifier = () =>
  verifications.map((v) => {
    const { details } = composer(v.t);
    const etat = details.etat ?? { affichage: {}, etats: {}, barre: { nom: '', texte: '' } };
    let ok = false;
    try {
      ok = Boolean(
        v.test({
          ...etat,
          panneauTexte: details.panneauTexte,
          puces: details.puces,
          cartes: details.cartes,
        }),
      );
    } catch {
      ok = false;
    }
    return { t: Math.round(v.t * 1000) / 1000, libelle: v.libelle, ok };
  });

window.__timeline = T;

async function preparer() {
  const polices = [
    '400 22px "Atkinson Hyperlegible"',
    '700 22px "Atkinson Hyperlegible"',
    'italic 400 22px "Atkinson Hyperlegible"',
    '400 28px "JetBrains Mono"',
    '700 28px "JetBrains Mono"',
  ];
  await Promise.all(polices.map((p) => document.fonts.load(p, 'Aé€0$')));
  await document.fonts.ready;
  const sonde = document.createElement('span');
  sonde.className = 'mono';
  sonde.style.cssText = 'position:absolute;visibility:hidden;font-size:20px;white-space:pre';
  sonde.textContent = '0123456789';
  document.body.append(sonde);
  mesures = { mono20: sonde.getBoundingClientRect().width / 10 };
  sonde.remove();
  construireGrilleFixe();
  return {
    polices: Object.fromEntries(polices.map((p) => [p, document.fonts.check(p, 'Aé€0$')])),
    mesures,
    total: T.total,
    images: T.images,
  };
}

window.__pret = preparer();
