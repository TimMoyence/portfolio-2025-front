import { classesEmises, classesOrphelines } from '../../../testing/classes-briques';
import {
  attendreLEnvoiVideRefuse,
  attendreLeRefusEffaceALaFrappe,
  attendreLeRenvoiEpuise,
  detailsEmis,
  installerBrique,
} from '../../../testing/banc-de-brique';
import {
  buildFeuilleEvaluee,
  buildSheetPlan,
  buildVerdictDeProduction,
} from '../../../testing/factories/cours.factory';
import { INSTANTANES_DES_COURS_SERVIS } from '../../../testing/fixtures/instantanes-des-cours';
import type { NatureDeCellule } from '../../content/types';
import { FpSheet, type SheetPlanPublic } from './FpSheet';

interface Resultat {
  readonly affichage: string;
  readonly nature: NatureDeCellule;
  readonly formule?: boolean;
}

const PLAN = buildSheetPlan();
const CHARGE_XSS = '<img src=x onerror="alert(1)">';
const CLASSES_ATTENDUES = 26;
const ROLES = ['etudiant', 'presentateur'] as const;
const RENVOYER = 'Renvoyer les cases corrigées';
const EVALUATION = 'fp-sheet-evaluation';
const MONTANT_HT = '=A3*B3';
const MONTANT_TTC = '=C3*(1+$B$1)';
const RECOPIEE = '=A4*B4';
const HT: Resultat = { affichage: '54', nature: 'nombre' };
const TTC: Resultat = { affichage: '64,8', nature: 'nombre' };
const HT_RECOPIE: Resultat = { affichage: '360', nature: 'nombre' };
const DIVISION_PAR_ZERO: Resultat = { affichage: '#DIV/0!', nature: 'erreur' };
const ATTENDU_CACHE = '64,8';
const ATTENDU_CACHE_MACHINE = '64.8';
const CELLULES_DEBORDANTES = 2500;
const ATTENDUS_FORMATEUR = {
  type: 'feuille',
  attendus: [
    { reference: 'D3', formuleReference: '=C3*(1+$B$1)', valeur: 64.8, affichage: '64,8' },
  ],
};

function repere(hote: FpSheet, nom: string): Element | null {
  return hote.shadowRoot?.querySelector(`[data-testid="${nom}"]`) ?? null;
}

function reperes(hote: FpSheet, nom: string): Element[] {
  return [...(hote.shadowRoot?.querySelectorAll(`[data-testid="${nom}"]`) ?? [])];
}

function texteDe(hote: FpSheet, nom: string): string {
  return repere(hote, nom)?.textContent?.trim() ?? '';
}

function cellule(hote: FpSheet, nom: string): HTMLInputElement {
  const trouvee = hote.shadowRoot?.querySelector<HTMLInputElement>(
    `[data-testid="cellule"][data-nom="${nom}"]`,
  );
  if (!(trouvee instanceof HTMLInputElement)) {
    throw new Error(`aucune cellule ${nom} dans la grille`);
  }
  return trouvee;
}

function barre(hote: FpSheet): HTMLInputElement {
  const trouvee = repere(hote, 'barre');
  if (!(trouvee instanceof HTMLInputElement)) {
    throw new Error('aucune barre de formule');
  }
  return trouvee;
}

function bouton(hote: FpSheet, nom: string): HTMLButtonElement {
  const trouve = repere(hote, nom);
  if (!(trouve instanceof HTMLButtonElement)) {
    throw new Error(`aucun bouton ${nom}`);
  }
  return trouve;
}

function selectionner(hote: FpSheet, nom: string): void {
  cellule(hote, nom).dispatchEvent(new FocusEvent('focus', { bubbles: true }));
}

function formuleDe(hote: FpSheet, nom: string): string {
  selectionner(hote, nom);
  return barre(hote).value;
}

function saisir(hote: FpSheet, nom: string, texte: string): void {
  const champ = cellule(hote, nom);
  champ.value = texte;
  champ.dispatchEvent(new Event('input', { bubbles: true }));
}

function cliquer(hote: FpSheet, nom: string): void {
  repere(hote, nom)?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

function entrer(hote: FpSheet, nom: string): void {
  cellule(hote, nom).dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
  );
}

function chiffrer(hote: FpSheet): void {
  saisir(hote, 'C3', MONTANT_HT);
  saisir(hote, 'D3', MONTANT_TTC);
}

function evaluations(hote: FpSheet): Record<string, unknown>[] {
  return detailsEmis(hote, EVALUATION);
}

function demandeDe(cellules: Readonly<Record<string, string>>): Record<string, unknown> {
  return { planId: PLAN.id, rang: jasmine.any(Number), cellules };
}

function diviserParZero(hote: FpSheet): void {
  const demandes = evaluations(hote);
  saisir(hote, 'C3', '=A3/0');
  selectionner(hote, 'D3');
  repondre(hote, demandes.at(-1), { C3: DIVISION_PAR_ZERO });
}

function repondre(
  hote: FpSheet,
  demande: Readonly<Record<string, unknown>> | undefined,
  resultats: Readonly<Record<string, Resultat>>,
  recopiees: Readonly<Record<string, string>> = {},
): void {
  const initiale = hote.plan?.initiale ?? buildFeuilleEvaluee();
  const entrees = Object.entries(resultats);
  hote.evaluation = {
    rang: Number(demande?.['rang']),
    evaluee: buildFeuilleEvaluee({
      saisies: { ...(demande?.['cellules'] as Record<string, string>), ...recopiees },
      affichages: {
        ...initiale.affichages,
        ...Object.fromEntries(entrees.map(([nom, { affichage }]) => [nom, affichage])),
      },
      natures: {
        ...initiale.natures,
        ...Object.fromEntries(entrees.map(([nom, { nature }]) => [nom, nature])),
      },
      formules: entrees.filter(([, { formule }]) => formule !== false).map(([nom]) => nom),
    }),
  };
}

function chiffrerEtEvaluer(hote: FpSheet): void {
  const demandes = evaluations(hote);
  chiffrer(hote);
  entrer(hote, 'D3');
  repondre(hote, demandes.at(-1), { C3: HT, D3: TTC });
}

function recevoirLeVerdict(hote: FpSheet): void {
  chiffrer(hote);
  cliquer(hote, 'valider');
  hote.verdict = buildVerdictDeProduction({ questionId: PLAN.id });
}

function envois(hote: FpSheet): Record<string, unknown>[] {
  return detailsEmis(hote, 'fp-sheet-submit');
}

const FEUILLES_SERVIES = INSTANTANES_DES_COURS_SERVIS.flatMap(([, instantane]) =>
  instantane.sujet.ecrans
    .filter(({ type }) => type === 'fp-sheet')
    .map((ecran) => ({
      id: ecran.id,
      plan: ecran.donnees?.['plan'] as SheetPlanPublic,
      corrige: instantane.deroule.ecrans.find(({ id }) => id === ecran.id)?.corrigeEcran ?? null,
    })),
);

const SAISIES_ET_ALIGNEMENTS: readonly (readonly [string, Resultat, string])[] = [
  ['Relancer', { affichage: 'Relancer', nature: 'texte', formule: false }, 'left'],
  ['12,5', { affichage: '12,5', nature: 'nombre', formule: false }, 'right'],
  ['=2*3', { affichage: '6', nature: 'nombre' }, 'right'],
  ['="Oui"', { affichage: 'Oui', nature: 'texte' }, 'left'],
  ['=2>1', { affichage: 'VRAI', nature: 'logique' }, 'center'],
  ['=1/0', DIVISION_PAR_ZERO, 'center'],
];

function alignementExcel(affiche: string): string | null {
  const texte = affiche.trim();
  if (texte === '') {
    return null;
  }
  if (/^(VRAI|FAUX|#[\p{Lu}\d/!?]+)$/u.test(texte)) {
    return 'center';
  }
  return /^-?\d[\d\s]*(,\d+)?\s?%?$/u.test(texte) ? 'right' : 'left';
}

function fautesDAlignement(hote: FpSheet, id: string): string[] {
  const cases = [...(hote.shadowRoot?.querySelectorAll<HTMLElement>('td.fp-sheet__cellule') ?? [])];
  return cases.flatMap((td) => {
    const champ = td.querySelector('input');
    const correction = td.querySelector<HTMLElement>('.fp-sheet__correction');
    const affiche =
      champ?.value ??
      (correction?.querySelector('.fp-montant') ?? correction?.querySelector('code') ?? td)
        .textContent ??
      '';
    const attendu = alignementExcel(affiche);
    const lu =
      correction === null
        ? getComputedStyle(champ ?? td).textAlign
        : { start: 'left', end: 'right', center: 'center' }[
            getComputedStyle(correction).justifyItems
          ];
    return attendu === null || lu === attendu
      ? []
      : [`${id} ${td.getAttribute('headers')} « ${affiche.trim()} » ${lu} au lieu de ${attendu}`];
  });
}

describe('FpSheet', () => {
  let hote: FpSheet;
  const traces = installerBrique<FpSheet>({
    balise: 'fp-sheet',
    classe: FpSheet,
    poser: (brique) => {
      hote = brique;
      brique.plan = buildSheetPlan();
    },
  });

  it('presente un vrai tableau a entetes de colonne et de ligne portees', () => {
    const racine = hote.shadowRoot;
    expect(racine?.querySelectorAll('table').length).toBe(1);
    expect(racine?.querySelector('caption')?.textContent?.trim()).toBe(PLAN.intitule);
    expect(
      [...(racine?.querySelectorAll('thead th') ?? [])].map((th) => th.getAttribute('scope')),
    ).toEqual(['col', 'col', 'col', 'col', 'col']);
    expect(reperes(hote, 'colonne').map((th) => th.textContent)).toEqual(['A', 'B', 'C', 'D']);
    expect(racine?.querySelectorAll('tbody tr').length).toBe(PLAN.lignes);
    expect(racine?.querySelector('[role="grid"]')).toBeNull();
  });

  it('F-36 · nomme colonnes et cellules par les lettres et la grille que le back sert', () => {
    hote.plan = buildSheetPlan({
      id: 'K-TABLEUR-NOMS',
      lettres: ['P', 'Q', 'R', 'S'],
      grille: [
        ['P1', 'Q1', 'R1', 'S1'],
        ['P2', 'Q2', 'R2', 'S2'],
      ],
      cellules: { P1: 'Libellé' },
    });

    expect(reperes(hote, 'colonne').map((th) => th.textContent)).toEqual(['P', 'Q', 'R', 'S']);
    expect(reperes(hote, 'cellule').map((champ) => champ.getAttribute('data-nom'))).toEqual([
      'P1',
      'Q1',
      'R1',
      'S1',
      'P2',
      'Q2',
      'R2',
      'S2',
    ]);
    expect(cellule(hote, 'P1').value).toBe('Libellé');
  });

  it('F-36 · borne chaque saisie à la longueur maximale que le back sert', () => {
    hote.plan = buildSheetPlan({ id: 'K-TABLEUR-COURT', longueurMaxSaisie: 12 });

    expect(barre(hote).maxLength).toBe(12);
    expect(cellule(hote, 'C3').maxLength).toBe(12);
    saisir(hote, 'C3', '=A3*B3+A4*B4+A5*B5');
    expect(formuleDe(hote, 'C3')).toBe('=A3*B3+A4*B4');
  });

  it('QP-04 · écrit la barre de formule et les cellules en police mono, sans aucune ligature', () => {
    const enMono = [...(hote.shadowRoot?.querySelectorAll<HTMLElement>('*') ?? [])].filter(
      (element) => getComputedStyle(element).fontFamily.startsWith('"Geist Mono"'),
    );

    expect(enMono.map((element) => element.className)).toContain('fp-sheet__saisie');
    expect(
      enMono
        .filter((element) => getComputedStyle(element).fontVariantLigatures !== 'none')
        .map((element) => element.className),
    ).toEqual([]);
  });

  it('resserre la grille au-dela de dix lignes pour tenir dans la toile', () => {
    expect(repere(hote, 'tableau')?.classList).not.toContain('fp-sheet__tableau--dense');

    hote.plan = buildSheetPlan({ lignes: 11 });

    expect(repere(hote, 'tableau')?.classList).toContain('fp-sheet__tableau--dense');
  });

  it('resserre aussi les cellules lues a la projection au-dela de dix lignes', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.plan = buildSheetPlan({ lignes: 11 });
    const lues = [...(hote.shadowRoot?.querySelectorAll('td.fp-sheet__cellule') ?? [])];

    expect(lues.length).toBeGreaterThan(0);
    expect(
      lues.every((lue) => Number.parseFloat(getComputedStyle(lue).paddingBlockStart) === 0),
    ).toBeTrue();
  });

  function poserLaFeuilleAvecCumulSur(largeur: number): void {
    hote.style.cssText = `display:block;width:${String(largeur)}px;`;
    hote.plan = buildSheetPlan({
      colonnes: 5,
      cellules: { ...PLAN.cellules, E1: 'Cumul 2025-2030 (k€)' },
      verrouillees: [...PLAN.verrouillees, 'E1'],
    });
  }

  it('QF-6 · sur une toile assez large, donne à chaque colonne la largeur de son plus long libellé', () => {
    poserLaFeuilleAvecCumulSur(1216);

    for (const nom of ['A1', 'B2', 'C2', 'E1']) {
      const champ = cellule(hote, nom);
      expect(champ.scrollWidth).withContext(nom).toBeLessThanOrEqual(champ.clientWidth);
    }
    expect(cellule(hote, 'E3').clientWidth).toBeGreaterThan(cellule(hote, 'C3').clientWidth);
  });

  it('QF-6 · sur une toile étroite, resserre les colonnes plutôt que de faire défiler la grille', () => {
    poserLaFeuilleAvecCumulSur(700);
    const tableau = repere(hote, 'tableau');

    expect(tableau?.scrollWidth).toBeLessThanOrEqual((tableau?.clientWidth ?? 0) + 1);
  });

  it('enonce les consignes numerotees du plan', () => {
    expect(reperes(hote, 'consignes')[0]?.querySelectorAll('li').length).toBe(2);
    expect(texteDe(hote, 'consignes')).toContain('En C3, calculez le montant HT.');
  });

  it('relie chaque cellule a la lettre de sa colonne et au numero de sa ligne', () => {
    const portes = (cellule(hote, 'C3').closest('td')?.getAttribute('headers') ?? '').split(' ');
    expect(hote.shadowRoot?.querySelector(`#${portes[0]}`)?.textContent).toBe('C');
    expect(hote.shadowRoot?.querySelector(`#${portes[1]}`)?.textContent).toBe('3');
    expect(cellule(hote, 'C3').getAttribute('aria-label')).toBe('Cellule C3');
  });

  it('F-36 · demande au back l évaluation de la feuille à la validation d une cellule, jamais à la frappe', () => {
    const demandes = evaluations(hote);
    saisir(hote, 'C3', '=A3');
    saisir(hote, 'C3', MONTANT_HT);
    expect(demandes).toEqual([]);

    selectionner(hote, 'D3');
    saisir(hote, 'D3', MONTANT_TTC);
    entrer(hote, 'D3');
    selectionner(hote, 'C5');

    expect(demandes).toEqual([
      demandeDe({ C3: MONTANT_HT }),
      demandeDe({ C3: MONTANT_HT, D3: MONTANT_TTC }),
    ]);
    expect(Number(demandes[1]['rang'])).toBeGreaterThan(Number(demandes[0]['rang']));
  });

  it('F-36 · affiche le résultat que le back sert pour chaque formule validée, et la formule dans la cellule sélectionnée', () => {
    const demandes = evaluations(hote);
    chiffrer(hote);
    repondre(hote, demandes.at(-1), { C3: HT });

    expect(cellule(hote, 'C3').value).toBe('54');
    expect(cellule(hote, 'D3').value).toBe(MONTANT_TTC);
    expect(formuleDe(hote, 'C3')).toBe(MONTANT_HT);
  });

  it('F-36 · n affiche que la réponse à la dernière demande, et jamais le résultat d une formule modifiée depuis', () => {
    const demandes = evaluations(hote);
    saisir(hote, 'C3', '=A3');
    selectionner(hote, 'D3');
    saisir(hote, 'C3', MONTANT_HT);
    selectionner(hote, 'D3');

    repondre(hote, demandes[1], { C3: HT });
    repondre(hote, demandes[0], { C3: { affichage: '12', nature: 'nombre' } });
    expect(cellule(hote, 'C3').value).toBe('54');

    saisir(hote, 'C3', '=A3+1');
    selectionner(hote, 'D3');
    expect(demandes.length).toBe(3);
    expect(cellule(hote, 'C3').value).toBe('=A3+1');
    expect(cellule(hote, 'C3').hasAttribute('data-nature')).toBeFalse();
  });

  it('montre la formule de la cellule selectionnee dans la barre de formule', () => {
    chiffrerEtEvaluer(hote);
    selectionner(hote, 'D3');
    expect(texteDe(hote, 'reference')).toBe('D3');
    expect(barre(hote).value).toBe(MONTANT_TTC);
    selectionner(hote, 'C3');
    expect(texteDe(hote, 'reference')).toBe('C3');
    expect(cellule(hote, 'D3').value).toBe('64,8');
  });

  it('ecrit dans la cellule selectionnee depuis la barre de formule', () => {
    const demandes = evaluations(hote);
    selectionner(hote, 'C3');
    const champ = barre(hote);
    champ.value = '=1+1';
    champ.dispatchEvent(new Event('input', { bubbles: true }));
    expect(hote.shadowRoot?.activeElement?.getAttribute('data-testid')).toBe('barre');
    selectionner(hote, 'D3');
    expect(demandes.map((demande) => demande['cellules'])).toEqual([{ C3: '=1+1' }]);
    repondre(hote, demandes.at(-1), { C3: { affichage: '2', nature: 'nombre' } });
    expect(cellule(hote, 'C3').value).toBe('2');
  });

  it('descend d une ligne a la touche Entree et garde le parcours de lecture au Tab', () => {
    selectionner(hote, 'C3');
    entrer(hote, 'C3');
    expect(texteDe(hote, 'reference')).toBe('C4');
    expect(hote.shadowRoot?.activeElement?.getAttribute('data-nom')).toBe('C4');
    entrer(hote, 'C6');
    expect(texteDe(hote, 'reference')).toBe('C6');
    expect(reperes(hote, 'cellule').some((noeud) => noeud.hasAttribute('tabindex'))).toBe(false);
  });

  it('F-36 · confie la recopie au back, puis pose et selectionne la formule recopiee qu il sert', () => {
    const demandes = evaluations(hote);
    saisir(hote, 'C3', MONTANT_HT);
    cliquer(hote, 'recopier');

    expect(demandes).toEqual([{ ...demandeDe({ C3: MONTANT_HT }), recopie: { de: 'C3' } }]);
    expect(bouton(hote, 'recopier').disabled).toBeTrue();
    expect(texteDe(hote, 'reference')).toBe('C3');

    repondre(hote, demandes.at(-1), { C3: HT, C4: HT_RECOPIE }, { C4: RECOPIEE });

    expect(texteDe(hote, 'reference')).toBe('C4');
    expect(barre(hote).value).toBe(RECOPIEE);
    expect(cellule(hote, 'C3').value).toBe('54');
    expect(bouton(hote, 'recopier').disabled).toBeFalse();
  });

  it('F-36 · differe pendant une recopie l evaluation d une autre cellule, sans perdre ni l une ni l autre', () => {
    const demandes = evaluations(hote);
    saisir(hote, 'C3', MONTANT_HT);
    cliquer(hote, 'recopier');
    saisir(hote, 'D3', MONTANT_TTC);
    selectionner(hote, 'D5');
    expect(demandes.length).toBe(1);

    repondre(hote, demandes[0], { C3: HT, C4: HT_RECOPIE }, { C4: RECOPIEE });

    expect(texteDe(hote, 'reference')).toBe('D5');
    expect(demandes.map((demande) => demande['cellules'])).toEqual([
      { C3: MONTANT_HT },
      { C3: MONTANT_HT, D3: MONTANT_TTC, C4: RECOPIEE },
    ]);
  });

  it('refuse de recopier depuis la derniere ligne sans casser la grille', () => {
    const demandes = evaluations(hote);
    saisir(hote, 'C6', '=A3*2');
    cliquer(hote, 'recopier');
    expect(texteDe(hote, 'retour')).toContain('rien où aller');
    expect(barre(hote).value).toBe('=A3*2');
    expect(demandes).toEqual([]);
  });

  it('L4-F21 · confie la recopie au brouillon et efface le refus qui la precedait', () => {
    const brouillons = detailsEmis(hote, 'fp-brouillon');
    const demandes = evaluations(hote);
    saisir(hote, 'C3', MONTANT_HT);
    selectionner(hote, 'C6');
    cliquer(hote, 'recopier');
    expect(texteDe(hote, 'retour')).toContain('rien où aller');
    selectionner(hote, 'C3');
    cliquer(hote, 'recopier');
    expect(texteDe(hote, 'retour')).toBe('');
    repondre(hote, demandes.at(-1), { C3: HT, C4: HT_RECOPIE }, { C4: RECOPIEE });
    expect(brouillons).toEqual([
      { id: PLAN.id, valeur: { C3: MONTANT_HT } },
      { id: PLAN.id, valeur: { C3: MONTANT_HT, C4: RECOPIEE } },
    ]);
  });

  it('F-36 · redemande l evaluation a la validation suivante quand la precedente a ete refusee', () => {
    const demandes = evaluations(hote);
    saisir(hote, 'C3', MONTANT_HT);
    cliquer(hote, 'recopier');
    hote.erreur = 'Calcul impossible : la connexion a été interrompue.';
    expect(bouton(hote, 'recopier').disabled).toBeFalse();
    hote.erreur = null;
    selectionner(hote, 'D4');

    expect(demandes.map((demande) => demande['cellules'])).toEqual([
      { C3: MONTANT_HT },
      { C3: MONTANT_HT },
    ]);
    expect(demandes[1]['recopie']).toBeUndefined();
  });

  it('F-36 · demande l evaluation du brouillon restaure', () => {
    const demandes = evaluations(hote);
    hote.brouillon = { C3: MONTANT_HT };
    expect(demandes).toEqual([demandeDe({ C3: MONTANT_HT })]);
  });

  it('F-36 · ne demande aucune evaluation hors du poste etudiant, en apercu ni a la projection', () => {
    const demandes = evaluations(hote);
    hote.setAttribute('data-apercu', '');
    saisir(hote, 'C3', MONTANT_HT);
    selectionner(hote, 'D3');
    cliquer(hote, 'recopier');
    hote.removeAttribute('data-apercu');
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.brouillon = { D3: MONTANT_TTC };

    expect(demandes).toEqual([]);
  });

  it('signale une cellule que le back evalue en erreur autrement que par la couleur seule', () => {
    diviserParZero(hote);

    const fautive = cellule(hote, 'C3');
    expect(fautive.value).toBe('#DIV/0!');
    expect(fautive.getAttribute('aria-invalid')).toBe('true');
    expect(fautive.getAttribute('data-erreur')).toBe('#DIV/0!');
    expect(fautive.getAttribute('title')).toContain('refusée');
    expect(texteDe(hote, 'erreurs')).toContain('C3');
  });

  it('tient les cellules verrouillees hors de toute saisie', () => {
    const donnee = cellule(hote, 'A3');
    expect(donnee.readOnly).toBe(true);
    donnee.value = '999';
    donnee.dispatchEvent(new Event('input', { bubbles: true }));
    expect(formuleDe(hote, 'A3')).toBe('12');
    expect(cellule(hote, 'C3').hasAttribute('readonly')).toBe(false);
  });

  it('refuse de valider tant qu aucune formule n a ete ecrite, puis envoie les seules saisies', () => {
    const recus = envois(hote);
    attendreLEnvoiVideRefuse(hote);
    expect(recus).toEqual([]);
    chiffrer(hote);
    cliquer(hote, 'valider');
    expect(texteDe(hote, 'retour')).toBe('Réponse enregistrée');
    expect(recus).toEqual([
      {
        planId: PLAN.id,
        cellules: { C3: MONTANT_HT, D3: MONTANT_TTC },
        dureeMs: jasmine.any(Number),
      },
    ]);
  });

  it('L4-F21 · efface le refus des qu une cellule est saisie', () => {
    attendreLeRefusEffaceALaFrappe(hote, () => saisir(hote, 'C3', MONTANT_HT));
  });

  it('envoie je ne sais pas sans cellule', () => {
    const recus = envois(hote);
    cliquer(hote, 'je-ne-sais-pas');
    expect(recus.map((detail) => detail['neSaitPas'])).toEqual([true]);
    expect(recus[0]['cellules']).toBeUndefined();
  });

  it('n ecrit dans aucun stockage et n envoie la validation qu une fois', () => {
    const recus = envois(hote);
    chiffrer(hote);
    cliquer(hote, 'valider');
    cliquer(hote, 'valider');
    expect(recus.length).toBe(1);
    expect(traces.ecritures).toEqual([]);
    expect(cellule(hote, 'C3').hasAttribute('readonly')).toBe(true);
  });

  it('confie les saisies au brouillon de l hote et les restaure sans toucher aux cellules verrouillees', () => {
    const brouillons = detailsEmis(hote, 'fp-brouillon');
    saisir(hote, 'C3', MONTANT_HT);
    expect(brouillons).toEqual([{ id: PLAN.id, valeur: { C3: MONTANT_HT } }]);

    hote.plan = buildSheetPlan({ id: 'K-TABLEUR-RECHARGE' });
    hote.brouillon = { c3: MONTANT_HT, A3: '999', Z99: '=1' };

    expect(formuleDe(hote, 'C3')).toBe(MONTANT_HT);
    expect(formuleDe(hote, 'A3')).toBe('12');
    expect(texteDe(hote, 'brouillon-restaure')).toBe('Brouillon restauré');
  });

  it('marque les cellules selon le verdict recu', () => {
    recevoirLeVerdict(hote);

    const marquees = reperes(hote, 'cellule-verdict');
    expect(marquees.map((td) => td.getAttribute('data-etat'))).toEqual(['confirme', 'a-revoir']);
    expect(marquees[1].getAttribute('title')).toBe('Référence relative non figée');
    expect(texteDe(hote, 'decompte')).toBe('Cellules justes : 1/2');
  });

  it('ne publie pour aucun role une valeur attendue tant que la correction n est pas revelee', () => {
    hote.corrige = ATTENDUS_FORMATEUR;
    for (const role of ROLES) {
      hote.setAttribute('data-cours-role', role);
      expect(hote.shadowRoot?.innerHTML ?? '').not.toContain(ATTENDU_CACHE);
      expect(hote.shadowRoot?.innerHTML ?? '').not.toContain(ATTENDU_CACHE_MACHINE);
      expect(repere(hote, 'correction-feuille')).toBeNull();
      expect(repere(hote, 'attendus')).toBeNull();
    }
  });

  it('RET-31 · sert a l etudiant la formule de reference au niveau 1 puis sa valeur au niveau 2', () => {
    hote.corrige = ATTENDUS_FORMATEUR;
    hote.etayage = 1;
    expect(texteDe(hote, 'attendu')).toBe('D3 =C3*(1+$B$1)');
    hote.etayage = 2;
    expect(texteDe(hote, 'attendu')).toBe('D3 =C3*(1+$B$1) 64,8');
  });

  function attendusAuNiveau2(
    attendus: {
      reference: string;
      formuleReference: string;
      valeur: number | string | boolean;
      affichage?: string;
    }[],
  ): (string | undefined)[] {
    hote.corrige = { type: 'feuille', attendus };
    hote.etayage = 2;
    return reperes(hote, 'attendu').map((attendu) => attendu.textContent?.trim());
  }

  it('F-36 · affiche au niveau 2 la valeur attendue telle que le back la sert, sans la recalculer', () => {
    expect(
      attendusAuNiveau2([
        {
          reference: 'D3',
          formuleReference: '=D2*(1+$G$2)',
          valeur: 1042.805969,
          affichage: '1 042,81',
        },
        { reference: 'D4', formuleReference: '=D3/D2-1', valeur: 0.0600004, affichage: '0,06' },
        {
          reference: 'D5',
          formuleReference: '=SI(C5>60;"Relancer";"")',
          valeur: 'Relancer',
          affichage: 'Relancer',
        },
        { reference: 'D6', formuleReference: '=C6>60', valeur: false, affichage: 'FAUX' },
      ]),
    ).toEqual([
      'D3 =D2*(1+$G$2) 1 042,81',
      'D4 =D3/D2-1 0,06',
      'D5 =SI(C5>60;"Relancer";"") Relancer',
      'D6 =C6>60 FAUX',
    ]);
  });

  it('F-36 · ignore un attendu que le back sert sans son affichage', () => {
    expect(
      attendusAuNiveau2([{ reference: 'D3', formuleReference: '=C3*(1+$B$1)', valeur: 64.8 }]),
    ).toEqual([]);
  });

  it('RET-31 · projette les formules de correction au niveau 1 puis les valeurs au niveau 2', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.corrige = ATTENDUS_FORMATEUR;
    expect(repere(hote, 'correction-feuille')).toBeNull();

    hote.etayage = 1;
    const formule = hote.shadowRoot?.querySelector(
      '[data-testid="correction-feuille"][data-nom="D3"]',
    );
    expect(formule?.textContent?.trim()).toBe('=C3*(1+$B$1)');

    hote.etayage = 2;
    const valeur = hote.shadowRoot?.querySelector(
      '[data-testid="correction-feuille"][data-nom="D3"]',
    );
    expect(valeur?.textContent?.trim()).toBe('=C3*(1+$B$1) 64,8');
  });

  it('QF-18 · a la projection, separe les cellules lues par une marge et garde chaque libelle sur une ligne', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.style.cssText = 'display:block;width:1216px;';
    hote.plan = buildSheetPlan({
      cellules: { ...PLAN.cellules, A1: 'Année', B1: 'Rang n' },
      verrouillees: [...PLAN.verrouillees, 'A1', 'B1'],
    });
    const lues = [...(hote.shadowRoot?.querySelectorAll('td.fp-sheet__cellule') ?? [])];
    const rang = hote.shadowRoot?.querySelector('[data-testid="cellule"][data-nom="B1"]');

    expect(lues.length).toBeGreaterThan(0);
    expect(
      lues.every((lue) => Number.parseFloat(getComputedStyle(lue).paddingInlineStart) >= 4),
    ).toBeTrue();
    expect(rang?.getClientRects().length).toBe(1);
  });

  it('QF-27 · a la projection sur une toile etroite, replie un long intitule de colonne entre ses mots sans jamais couper un nombre', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.style.cssText = 'display:block;width:900px;';
    hote.plan = buildSheetPlan({
      id: 'K-TABLEUR-INTITULES',
      colonnes: 6,
      cellules: {
        ...PLAN.cellules,
        A1: 'Capital dû en début d’année de l’emprunt (€)',
        B1: 'Capital dû en fin d’année de l’emprunt (€)',
        C1: 'Intérêts de l’année sur le capital dû (€)',
        D1: 'Amortissement du capital de l’année (€)',
        E1: 'Coût total du crédit sur la durée (€)',
        F1: 'Annuité constante de l’emprunt (€)',
        A2: '32000',
      },
      verrouillees: [...PLAN.verrouillees, 'A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'A2'],
    });
    const tableau = repere(hote, 'tableau');
    const nombre = hote.shadowRoot?.querySelector('[data-testid="cellule"][data-nom="A2"]');

    expect(tableau?.scrollWidth).toBeLessThanOrEqual((tableau?.clientWidth ?? 0) + 1);
    expect(nombre?.getClientRects().length).toBe(1);
  });

  it('RET-31 · laisse reprendre les seules cases fausses apres verdict', () => {
    recevoirLeVerdict(hote);
    const brouillons = detailsEmis(hote, 'fp-brouillon');

    expect(bouton(hote, 'valider').disabled).toBe(true);
    expect(cellule(hote, 'C3').hasAttribute('readonly')).toBe(true);
    expect(cellule(hote, 'D3').hasAttribute('readonly')).toBe(false);
    saisir(hote, 'D3', '=C3*(1+$B$2)');
    expect(formuleDe(hote, 'D3')).toBe('=C3*(1+$B$2)');
    expect(cellule(hote, 'D3').closest('td')?.getAttribute('data-etat')).toBe('reprise');
    expect(brouillons).toEqual([{ id: PLAN.id, valeur: { C3: MONTANT_HT, D3: '=C3*(1+$B$2)' } }]);
  });

  it('RET-31 · renvoie les cases reprises tant que la correction n est pas revelee, une seule fois', () => {
    const recus = envois(hote);
    recevoirLeVerdict(hote);
    saisir(hote, 'D3', '=C3+C3*$B$1');

    const valider = bouton(hote, 'valider');
    expect(valider.disabled).toBe(false);
    expect(valider.textContent?.trim()).toBe(RENVOYER);
    cliquer(hote, 'valider');

    expect(recus.map((detail) => detail['cellules'])).toEqual([
      { C3: MONTANT_HT, D3: MONTANT_TTC },
      { C3: MONTANT_HT, D3: '=C3+C3*$B$1' },
    ]);
    attendreLeRenvoiEpuise(hote, recus, 2);
  });

  it('RET-31 · ne renvoie plus de reprise des que la correction est revelee', () => {
    const recus = envois(hote);
    recevoirLeVerdict(hote);
    hote.etayage = 1;
    expect(cellule(hote, 'D3').hasAttribute('readonly')).toBe(true);
    saisir(hote, 'D3', '=C3*(1+$B$1)');

    const valider = bouton(hote, 'valider');
    expect(valider.disabled).toBe(true);
    expect(valider.textContent?.trim()).not.toBe(RENVOYER);
    cliquer(hote, 'valider');
    expect(recus.length).toBe(1);
  });

  it('RET-31 · ferme la feuille aux reponses des que sa correction est revelee', () => {
    const recus = envois(hote);
    hote.etayage = 1;

    expect(cellule(hote, 'C3').hasAttribute('readonly')).toBe(true);
    expect(bouton(hote, 'valider').disabled).toBe(true);
    expect(bouton(hote, 'je-ne-sais-pas').disabled).toBe(true);
    cliquer(hote, 'je-ne-sais-pas');
    expect(recus).toEqual([]);
  });

  it('echappe le html de l intitule, de la formule tapee et de l affichage servi', () => {
    const demandes = evaluations(hote);
    hote.plan = buildSheetPlan({ id: 'K-TABLEUR-XSS', intitule: CHARGE_XSS });
    saisir(hote, 'C3', CHARGE_XSS);
    saisir(hote, 'D3', '="<b>"');
    repondre(hote, demandes.at(-1), { C3: { affichage: CHARGE_XSS, nature: 'texte' } });
    selectionner(hote, 'C3');
    repondre(hote, demandes.at(-1), { D3: { affichage: CHARGE_XSS, nature: 'texte' } });

    expect(hote.shadowRoot?.querySelector('img')).toBeNull();
    expect(hote.shadowRoot?.querySelector('caption')?.textContent?.trim()).toBe(CHARGE_XSS);
    expect(cellule(hote, 'C3').value).toBe(CHARGE_XSS);
    expect(cellule(hote, 'D3').value).toBe(CHARGE_XSS);
  });

  it('ne garde du plan servi que les cellules de sa grille, et n en envoie aucune autre au back', () => {
    const demandes = evaluations(hote);
    const debordantes: Record<string, string> = {};
    for (let rang = 1; rang <= CELLULES_DEBORDANTES; rang += 1) {
      debordantes[`Z${rang}`] = '=1+1';
    }

    hote.plan = buildSheetPlan({
      id: 'K-TABLEUR-DEBORDANT',
      cellules: { ...buildSheetPlan().cellules, ...debordantes },
    });
    chiffrer(hote);

    expect(hote.shadowRoot?.querySelector('[data-nom="Z1"]')).toBeNull();
    expect(demandes.map((demande) => demande['cellules'])).toEqual([{ C3: MONTANT_HT }]);
  });

  it('bati une grille sans ligne sans casser le tableau', () => {
    hote.plan = buildSheetPlan({ id: 'K-TABLEUR-VIDE', lignes: 0, cellules: {} });
    expect(hote.shadowRoot?.querySelectorAll('tbody tr').length).toBe(0);
    expect(reperes(hote, 'cellule')).toEqual([]);
    expect(texteDe(hote, 'vide')).toContain('Aucune cellule');
  });

  it('partage la meme grille entre les roles et retire champs et actions au presentateur', () => {
    chiffrerEtEvaluer(hote);
    for (const role of ROLES) {
      hote.setAttribute('data-cours-role', role);
      expect(hote.shadowRoot?.querySelector('caption')?.textContent?.trim()).toBe(PLAN.intitule);
      expect(reperes(hote, 'colonne').map((th) => th.textContent)).toEqual(['A', 'B', 'C', 'D']);
      expect(hote.shadowRoot?.querySelectorAll('tbody tr').length).toBe(PLAN.lignes);
      expect(repere(hote, 'consignes')).not.toBeNull();
    }
    expect(hote.shadowRoot?.querySelectorAll('input').length).toBe(0);
    expect(hote.shadowRoot?.querySelector('[data-nom="C3"]')?.textContent).toBe('54');
    expect(repere(hote, 'valider')).toBeNull();
    expect(repere(hote, 'barre')).toBeNull();
    expect(repere(hote, 'modalite')).toBeNull();
    hote.setAttribute('data-cours-role', 'etudiant');
    expect(hote.shadowRoot?.querySelectorAll('input[data-role="cellule"]').length).toBe(
      PLAN.lignes * PLAN.colonnes,
    );
  });

  it('imprime sur papier la grille entiere de l etudiant, sans champ, barre ni action', () => {
    hote.setAttribute('data-papier', '');

    expect(hote.shadowRoot?.querySelectorAll('input, button').length).toBe(0);
    expect(repere(hote, 'barre')).toBeNull();
    expect(reperes(hote, 'cellule').length).toBe(PLAN.lignes * PLAN.colonnes);
    expect(texteDe(hote, 'consignes')).not.toBe('');
  });

  it('couvre par une regle de la feuille chaque classe fp emise', () => {
    hote.corrige = ATTENDUS_FORMATEUR;
    diviserParZero(hote);
    hote.etayage = 2;
    expect(classesEmises(hote).size).toBeGreaterThanOrEqual(CLASSES_ATTENDUES);
    expect(classesOrphelines(hote, 'sheet')).toEqual([]);
  });

  describe('QP-07 · la feuille aligne comme Excel : texte à gauche, nombres à droite, logiques et erreurs au centre', () => {
    it('QP-07 · au poste étudiant, chaque cellule fixe et chaque saisie de chaque feuille servie, selon la nature que le back sert', () => {
      const demandes = evaluations(hote);
      const fautes = FEUILLES_SERVIES.flatMap(({ id, plan }) => {
        hote.plan = plan;
        const libres = [
          ...(hote.shadowRoot?.querySelectorAll<HTMLInputElement>(
            'input[data-role="cellule"]:not([readonly])',
          ) ?? []),
        ].map((champ) => champ.dataset['nom'] ?? '');
        const [cible = '', ailleurs = ''] = libres;
        const saisies =
          libres.length < 2
            ? [`${id} moins de deux cellules à saisir`]
            : SAISIES_ET_ALIGNEMENTS.flatMap(([texte, resultat, attendu]) => {
                saisir(hote, cible, texte);
                selectionner(hote, ailleurs);
                repondre(hote, demandes.at(-1), { [cible]: resultat });
                const lu = getComputedStyle(cellule(hote, cible)).textAlign;
                return lu === attendu
                  ? []
                  : [`${id} ${cible} « ${texte} » ${lu} au lieu de ${attendu}`];
              });
        return [...fautesDAlignement(hote, id), ...saisies];
      });

      expect(FEUILLES_SERVIES.length).toBeGreaterThan(0);
      expect(fautes).toEqual([]);
    });

    it('QP-07 · en projection, chaque cellule et chaque résultat révélé de chaque feuille servie', () => {
      hote.setAttribute('data-cours-role', 'presentateur');
      const fautes = FEUILLES_SERVIES.flatMap(({ id, plan, corrige }) => {
        hote.plan = plan;
        hote.corrige = corrige;
        hote.etayage = 2;
        const revelees = hote.shadowRoot?.querySelectorAll('.fp-sheet__correction').length ?? 0;
        return [
          ...fautesDAlignement(hote, id),
          ...(revelees > 0 ? [] : [`${id} aucun résultat révélé`]),
        ];
      });

      expect(fautes).toEqual([]);
    });

    it('QP-07 · au livret, chaque cellule imprimée de chaque feuille servie', () => {
      hote.setAttribute('data-papier', '');
      const fautes = FEUILLES_SERVIES.flatMap(({ id, plan }) => {
        hote.plan = plan;
        return fautesDAlignement(hote, id);
      });

      expect(hote.shadowRoot?.querySelectorAll('input').length).toBe(0);
      expect(fautes).toEqual([]);
    });
  });
});
