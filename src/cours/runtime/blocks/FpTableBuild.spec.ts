import type { TableauEvalue, ValeurAffichee } from '../../content/types';
import { classesEmises, classesOrphelines } from '../../../testing/classes-briques';
import {
  attendreLEnvoiVideRefuse,
  attendreLeRefusEffaceALaFrappe,
  attendreLeRenvoiEpuise,
  creerBrique,
  detailsEmis,
  enregistrerBrique,
  installerBrique,
} from '../../../testing/banc-de-brique';
import {
  buildTableauEvalue,
  buildTableBuildPlan,
  buildTableDeVeritePlan,
  buildVerdictDeProduction,
} from '../../../testing/factories/cours.factory';
import { ecransDuPupitreDe, ecransPublicsDe } from '../../../testing/fixtures/instantane-de-cours';
import { INSTANTANES_DES_COURS_SERVIS } from '../../../testing/fixtures/instantanes-des-cours';
import { FpTableBuild, type TableBuildPlanPublic } from './FpTableBuild';

const PLAN = buildTableBuildPlan();
const ESPACE_FINE = String.fromCharCode(0x202f);
const ESPACE_INSECABLE = String.fromCharCode(0x00a0);
const CHARGE_XSS = '<img src=x onerror="alert(1)">';
const CLASSES_ATTENDUES = 14;
const ROLES = ['etudiant', 'presentateur'] as const;
const RENVOYER = 'Renvoyer les cases corrigées';
const EVALUATIONS = 'fp-table-build-evaluation';
const VERDICT_PARTIEL = buildVerdictDeProduction({
  questionId: PLAN.id,
  details: [
    { cle: '0:prix', juste: true, libelleConfusion: null },
    { cle: '0:indice', juste: true, libelleConfusion: null },
    { cle: '1:prix', juste: false, libelleConfusion: 'Taux appliqué au prix initial' },
  ],
});
const PRIX_SAISIS = ['21,60', '20,52', '21,34', '20,70'];
const INDICES_SAISIS = ['108', '102,6', '106,7', '103,5'];
const COEFFICIENTS_DEDUITS = ['1,0800', '0,9500', '1,0400', '0,9700'];
const EVOLUTIONS_DEDUITES = ['8,00', '2,60', '6,70', '3,50'];

type CorrigeDeTableau = Extract<
  NonNullable<ReturnType<typeof ecransDuPupitreDe>[number]['corrigeEcran']>,
  { type: 'tableau' }
>;

function corrigeServi(planId: string): CorrigeDeTableau {
  for (const [, instantane] of INSTANTANES_DES_COURS_SERVIS) {
    for (const ecran of ecransDuPupitreDe(instantane)) {
      const plan = ecran.donnees?.['plan'] as TableBuildPlanPublic | undefined;
      if (ecran.corrigeEcran?.type === 'tableau' && plan?.id === planId) {
        return ecran.corrigeEcran;
      }
    }
  }
  throw new Error(`aucun corrige servi pour ${planId}`);
}

const CORRIGE_DE_LA_TOILE = corrigeServi(PLAN.id);
const TOILE_EVALUEE = CORRIGE_DE_LA_TOILE.tableauCorrige;

function repere(hote: FpTableBuild, nom: string): Element | null {
  return hote.shadowRoot?.querySelector(`[data-testid="${nom}"]`) ?? null;
}

function reperes(hote: FpTableBuild, nom: string): Element[] {
  return [...(hote.shadowRoot?.querySelectorAll(`[data-testid="${nom}"]`) ?? [])];
}

function texteDe(hote: FpTableBuild, nom: string): string {
  return repere(hote, nom)?.textContent?.trim().replace(/\s+/g, ' ') ?? '';
}

function cellule(hote: FpTableBuild, rang: number, cle: string): HTMLInputElement {
  const trouvee = hote.shadowRoot?.querySelector<HTMLInputElement>(
    `[data-testid="cellule"][data-rang="${rang}"][data-cle="${cle}"]`,
  );
  if (!(trouvee instanceof HTMLInputElement)) {
    throw new Error(`aucune cellule ${cle} a la ligne ${rang}`);
  }
  return trouvee;
}

function colonneAffichee(hote: FpTableBuild, cle: string): string[] {
  return reperes(hote, 'cellule')
    .filter((noeud) => noeud.getAttribute('data-cle') === cle)
    .map((noeud) => (noeud instanceof HTMLInputElement ? noeud.value : (noeud.textContent ?? '')));
}

function colonneCorrigee(hote: FpTableBuild, cle: string): string[] {
  return [
    ...(hote.shadowRoot?.querySelectorAll(
      `[data-testid="tableau-corrige"] [data-testid="cellule"][data-cle="${cle}"]`,
    ) ?? []),
  ].map((noeud) => noeud.textContent ?? '');
}

function boutonValider(hote: FpTableBuild): HTMLButtonElement {
  const bouton = repere(hote, 'valider');
  if (!(bouton instanceof HTMLButtonElement)) {
    throw new Error('aucun bouton valider');
  }
  return bouton;
}

function saisir(hote: FpTableBuild, rang: number, cle: string, texte: string): void {
  const champ = cellule(hote, rang, cle);
  champ.value = texte;
  champ.dispatchEvent(new Event('input', { bubbles: true }));
}

function valider(hote: FpTableBuild, rang: number, cle: string): void {
  cellule(hote, rang, cle).dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
  );
}

function rejoindre(hote: FpTableBuild, rang: number, cle: string): void {
  cellule(hote, rang, cle).dispatchEvent(new FocusEvent('focus'));
}

function toutSaisir(hote: FpTableBuild): void {
  PRIX_SAISIS.forEach((prix, rang) => saisir(hote, rang, 'prix', prix));
  INDICES_SAISIS.forEach((indice, rang) => saisir(hote, rang, 'indice', indice));
}

function cliquer(hote: FpTableBuild, nom: string): void {
  repere(hote, nom)?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

function demandesDEvaluation(hote: FpTableBuild): Record<string, unknown>[] {
  return detailsEmis(hote, EVALUATIONS);
}

function servirLaDerniere(
  hote: FpTableBuild,
  demandes: readonly Record<string, unknown>[],
  evalue: TableauEvalue,
): void {
  const derniere = demandes.at(-1);
  if (derniere === undefined) {
    throw new Error('aucune demande d evaluation');
  }
  hote.evaluation = { rang: derniere['rang'] as number, evalue };
}

function toutSaisirEtServir(hote: FpTableBuild): void {
  const demandes = demandesDEvaluation(hote);
  toutSaisir(hote);
  valider(hote, 3, 'indice');
  servirLaDerniere(hote, demandes, TOILE_EVALUEE);
}

function recevoirLeVerdictPartiel(hote: FpTableBuild): void {
  const demandes = demandesDEvaluation(hote);
  toutSaisir(hote);
  cliquer(hote, 'valider');
  servirLaDerniere(hote, demandes, TOILE_EVALUEE);
  hote.verdict = VERDICT_PARTIEL;
}

function projeterAuPresentateur(hote: FpTableBuild, corrige: unknown, etayage: number): void {
  hote.setAttribute('data-cours-role', 'presentateur');
  hote.corrige = corrige;
  hote.etayage = etayage;
}

function envois(hote: FpTableBuild): Record<string, unknown>[] {
  return detailsEmis(hote, 'fp-table-build-submit');
}

describe('FpTableBuild', () => {
  let hote: FpTableBuild;
  const traces = installerBrique<FpTableBuild>({
    balise: 'fp-table-build',
    classe: FpTableBuild,
    poser: (brique) => {
      hote = brique;
      brique.plan = buildTableBuildPlan();
    },
  });

  it('intitule la colonne des lignes par le plan, et par defaut « Révision »', () => {
    expect(texteDe(hote, 'entete-rang')).toBe('Révision');

    hote.plan = buildTableBuildPlan({ intituleDesLignes: 'Année' });

    expect(texteDe(hote, 'entete-rang')).toBe('Année');
  });

  it('QF-21 · ecrit le libelle d une ligne dans la police de texte, pas en chasse fixe', () => {
    const rang = hote.shadowRoot?.querySelector('.fp-table-build__rang');

    expect(rang).not.toBeNull();
    expect(getComputedStyle(rang as Element).fontFamily).not.toContain('Mono');
  });

  it('pose un tableau a entetes portees, une ligne par revision nommee', () => {
    expect(hote.shadowRoot?.querySelector('caption')?.textContent?.trim()).toBe(PLAN.intitule);
    expect(reperes(hote, 'entete').map((th) => th.textContent?.trim())).toEqual([
      'Taux annoncé (%)',
      'Prix du m² après révision (€ HT) à saisir',
      'Coefficient appliqué déduite',
      'Indice (base 100 au 1er janvier) à saisir',
      'Évolution depuis le 1er janvier (%) déduite',
    ]);
    expect(
      [...(hote.shadowRoot?.querySelectorAll('tbody th[scope="row"]') ?? [])].map((th) =>
        th.textContent?.trim(),
      ),
    ).toEqual([...PLAN.libellesLignes]);
    expect(texteDe(hote, 'consignes')).toContain('calculez le nouveau prix');
  });

  it('affiche les donnees du tableau initial servi en lecture seule et ne laisse saisir que les colonnes a saisir', () => {
    expect(colonneAffichee(hote, 'taux')).toEqual(['8', '-5', '4', '-3']);
    expect(colonneAffichee(hote, 'coef')).toEqual(['—', '—', '—', '—']);
    expect(cellule(hote, 0, 'taux').readOnly).toBeTrue();
    expect(cellule(hote, 0, 'coef').readOnly).toBeTrue();
    expect(cellule(hote, 0, 'prix').readOnly).toBeFalse();
    expect(cellule(hote, 0, 'indice').readOnly).toBeFalse();
  });

  it('F-37 · ne calcule rien au poste : valider une cellule demande au back l evaluation des saisies brutes, puis affiche le tableau servi', () => {
    const demandes = demandesDEvaluation(hote);
    saisir(hote, 0, 'prix', '21,6');

    expect(demandes).toEqual([]);
    expect(cellule(hote, 0, 'coef').value).toBe('—');

    valider(hote, 0, 'prix');

    expect(demandes).toEqual([
      {
        planId: PLAN.id,
        rang: jasmine.any(Number),
        saisies: [{ rang: 0, cle: 'prix', saisie: '21,6' }],
      },
    ]);
    servirLaDerniere(hote, demandes, TOILE_EVALUEE);
    expect(colonneAffichee(hote, 'coef')).toEqual(COEFFICIENTS_DEDUITS);
    expect(colonneAffichee(hote, 'evolution')).toEqual(EVOLUTIONS_DEDUITES);
    expect(cellule(hote, 0, 'prix').value).toBe('21,6');
  });

  it('F-37 · demande l evaluation quand le foyer rejoint une autre cellule, une seule fois pour les memes saisies', () => {
    const demandes = demandesDEvaluation(hote);
    saisir(hote, 0, 'prix', '21,6');
    rejoindre(hote, 0, 'indice');
    rejoindre(hote, 0, 'prix');

    expect(demandes.map((demande) => demande['saisies'])).toEqual([
      [{ rang: 0, cle: 'prix', saisie: '21,6' }],
    ]);
  });

  it('F-37 · n affiche que la reponse a la derniere demande', () => {
    const demandes = demandesDEvaluation(hote);
    saisir(hote, 0, 'prix', '21,6');
    valider(hote, 0, 'prix');
    saisir(hote, 0, 'prix', '21,60');
    valider(hote, 0, 'prix');

    hote.evaluation = { rang: demandes[0]['rang'] as number, evalue: TOILE_EVALUEE };
    expect(cellule(hote, 0, 'coef').value).toBe('—');

    servirLaDerniere(hote, demandes, TOILE_EVALUEE);
    expect(cellule(hote, 0, 'coef').value).toBe(COEFFICIENTS_DEDUITS[0]);
  });

  it('F-37 · redemande l evaluation a la validation suivante quand la precedente a ete refusee', () => {
    const demandes = demandesDEvaluation(hote);
    saisir(hote, 0, 'prix', '21,6');
    valider(hote, 0, 'prix');
    hote.erreur = 'Calcul non reçu : vérifiez la connexion et validez de nouveau la cellule';
    hote.erreur = null;
    valider(hote, 0, 'prix');

    expect(demandes.length).toBe(2);
  });

  it('F-37 · ne demande aucune evaluation hors du poste etudiant, en apercu ni a la projection', () => {
    const demandes = demandesDEvaluation(hote);
    hote.setAttribute('data-apercu', '');
    saisir(hote, 0, 'prix', '21,6');
    valider(hote, 0, 'prix');
    cliquer(hote, 'valider');
    expect(texteDe(hote, 'retour')).toBe('Aperçu : les réponses s’envoient pendant la séance');
    hote.removeAttribute('data-apercu');
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.brouillon = { '0:prix': '21,6' };

    expect(demandes).toEqual([]);
  });

  it('F-37 · affiche la synthese servie, sans ligne de totaux a cote', () => {
    toutSaisirEtServir(hote);
    expect(hote.shadowRoot?.querySelector('[data-testid="total"]')).toBeNull();
    expect(
      reperes(hote, 'synthese-ligne').map((ligne) => ligne.querySelector('dd')?.textContent),
    ).toEqual([`4,00${ESPACE_INSECABLE}%`, `3,50${ESPACE_INSECABLE}%`]);
  });

  it('L4-F11 · ecrit cellules, total et solde tels que le back les sert, milliers en espace fine', () => {
    const ecrit = (valeur: number, affichage: string): ValeurAffichee => ({ valeur, affichage });
    hote.plan = buildTableBuildPlan({
      echeances: 2,
      libellesLignes: ['Année 1', 'Année 2'],
      colonnes: [
        {
          cle: 'capital',
          intitule: 'Capital (€)',
          role: 'donnee',
          valeurs: [25001, 25001],
          decimales: 2,
          totalise: false,
        },
        {
          cle: 'rembourse',
          intitule: 'Remboursé (€)',
          role: 'deduite',
          formule: 'capital / 2',
          decimales: 2,
          totalise: true,
          soldeDe: 'capital',
        },
      ],
      synthese: [],
      tableauInitial: buildTableauEvalue({
        lignes: [0, 1].map((rang) => ({
          rang,
          valeurs: {
            capital: ecrit(25001, `25${ESPACE_FINE}001,00`),
            rembourse: ecrit(12500.5, `12${ESPACE_FINE}500,50`),
          },
        })),
        totaux: { rembourse: ecrit(25001, `25${ESPACE_FINE}001,00`) },
        synthese: [],
        soldeFinal: ecrit(12500.5, `12${ESPACE_FINE}500,50`),
      }),
    });

    expect(colonneAffichee(hote, 'capital')).toEqual([
      `25${ESPACE_FINE}001,00`,
      `25${ESPACE_FINE}001,00`,
    ]);
    expect(colonneAffichee(hote, 'rembourse')).toEqual([
      `12${ESPACE_FINE}500,50`,
      `12${ESPACE_FINE}500,50`,
    ]);
    expect(reperes(hote, 'total').map((total) => total.textContent)).toEqual([
      '',
      `25${ESPACE_FINE}001,00`,
    ]);
    expect(repere(hote, 'solde')?.textContent?.trim()).toMatch(
      new RegExp(` 12${ESPACE_FINE}500,50$`),
    );
  });

  it('garde le foyer et la frappe dans la cellule saisie malgre le rendu', () => {
    const champ = cellule(hote, 1, 'prix');
    champ.focus();
    saisir(hote, 1, 'prix', '20,5');
    expect(hote.shadowRoot?.activeElement?.getAttribute('data-cle')).toBe('prix');
    expect(hote.shadowRoot?.activeElement?.getAttribute('data-rang')).toBe('1');
    expect(cellule(hote, 1, 'prix').value).toBe('20,5');
  });

  it('F-37 · refuse un envoi vide puis un envoi incomplet, et envoie les valeurs que le back a lues', () => {
    const recus = envois(hote);
    const demandes = demandesDEvaluation(hote);
    attendreLEnvoiVideRefuse(hote);
    saisir(hote, 0, 'prix', PRIX_SAISIS[0]);
    cliquer(hote, 'valider');
    servirLaDerniere(hote, demandes, buildTableauEvalue());
    expect(texteDe(hote, 'retour')).toBe('Complétez chaque cellule à saisir avant de valider');
    expect(recus).toEqual([]);

    toutSaisir(hote);
    cliquer(hote, 'valider');

    expect(recus).toEqual([]);
    expect(demandes.at(-1)?.['saisies']).toEqual([
      { rang: 0, cle: 'prix', saisie: '21,60' },
      { rang: 0, cle: 'indice', saisie: '108' },
      { rang: 1, cle: 'prix', saisie: '20,52' },
      { rang: 1, cle: 'indice', saisie: '102,6' },
      { rang: 2, cle: 'prix', saisie: '21,34' },
      { rang: 2, cle: 'indice', saisie: '106,7' },
      { rang: 3, cle: 'prix', saisie: '20,70' },
      { rang: 3, cle: 'indice', saisie: '103,5' },
    ]);
    servirLaDerniere(hote, demandes, TOILE_EVALUEE);

    expect(recus.length).toBe(1);
    expect(recus[0]['planId']).toBe(PLAN.id);
    expect(recus[0]['saisies']).toEqual([
      { rang: 0, cle: 'prix', valeur: 21.6 },
      { rang: 0, cle: 'indice', valeur: 108 },
      { rang: 1, cle: 'prix', valeur: 20.52 },
      { rang: 1, cle: 'indice', valeur: 102.6 },
      { rang: 2, cle: 'prix', valeur: 21.34 },
      { rang: 2, cle: 'indice', valeur: 106.7 },
      { rang: 3, cle: 'prix', valeur: 20.7 },
      { rang: 3, cle: 'indice', valeur: 103.5 },
    ]);
    expect(texteDe(hote, 'retour')).toBe('Réponse enregistrée');
    expect(cellule(hote, 0, 'prix').disabled).toBeTrue();
  });

  it('L4-F21 · efface le refus des qu une cellule est saisie', () => {
    attendreLeRefusEffaceALaFrappe(hote, () => saisir(hote, 0, 'prix', PRIX_SAISIS[0]));
  });

  it('envoie je ne sais pas sans saisie', () => {
    const recus = envois(hote);
    cliquer(hote, 'je-ne-sais-pas');
    expect(recus.map((detail) => detail['neSaitPas'])).toEqual([true]);
  });

  it('n ecrit dans aucun stockage : le brouillon passe par l hote, et sa reprise demande l evaluation', () => {
    const brouillons = detailsEmis(hote, 'fp-brouillon');
    saisir(hote, 0, 'prix', PRIX_SAISIS[0]);
    expect(brouillons).toEqual([{ id: PLAN.id, valeur: { '0:prix': PRIX_SAISIS[0] } }]);
    expect(traces.ecritures).toEqual([]);

    hote.plan = buildTableBuildPlan({ id: 'b2-01-a4-recharge' });
    const demandes = demandesDEvaluation(hote);
    hote.brouillon = { '1:indice': '102,6', '0:coef': '9', '9:prix': '1' };

    expect(cellule(hote, 1, 'indice').value).toBe('102,6');
    expect(cellule(hote, 0, 'coef').value).toBe('—');
    expect(texteDe(hote, 'brouillon-restaure')).toBe('Brouillon restauré');
    expect(demandes).toEqual([
      {
        planId: 'b2-01-a4-recharge',
        rang: jasmine.any(Number),
        saisies: [{ rang: 1, cle: 'indice', saisie: '102,6' }],
      },
    ]);
  });

  it('marque les cellules selon le verdict recu et compte les lignes justes', () => {
    recevoirLeVerdictPartiel(hote);

    const fausse = cellule(hote, 1, 'prix').closest('td');
    expect(fausse?.getAttribute('data-etat')).toBe('a-revoir');
    expect(fausse?.getAttribute('title')).toBe('Taux appliqué au prix initial');
    expect(cellule(hote, 0, 'prix').closest('td')?.getAttribute('data-etat')).toBe('confirme');
    expect(texteDe(hote, 'decompte')).toBe('Lignes justes : 1/2');
  });

  it('RET-31 · laisse reprendre les seules cases fausses apres verdict puis les renvoie une fois', () => {
    const recus = envois(hote);
    const demandes = demandesDEvaluation(hote);
    recevoirLeVerdictPartiel(hote);

    expect(boutonValider(hote).disabled).toBeTrue();
    expect(cellule(hote, 0, 'prix').disabled).toBeTrue();
    expect(cellule(hote, 1, 'prix').disabled).toBeFalse();
    saisir(hote, 1, 'prix', '20,52');

    expect(boutonValider(hote).disabled).toBeFalse();
    expect(boutonValider(hote).textContent?.trim()).toBe(RENVOYER);
    cliquer(hote, 'valider');
    servirLaDerniere(hote, demandes, TOILE_EVALUEE);

    expect(recus.length).toBe(2);
    expect(recus[1]['saisies']).toContain({ rang: 1, cle: 'prix', valeur: 20.52 });
    attendreLeRenvoiEpuise(hote, recus, 2);
  });

  it('RET-31 · ferme la reprise des cases fausses des que le serveur ferme la saisie', () => {
    const recus = envois(hote);
    const demandes = demandesDEvaluation(hote);
    recevoirLeVerdictPartiel(hote);
    hote.saisieFermee = true;

    expect(cellule(hote, 1, 'prix').disabled).toBeTrue();
    saisir(hote, 1, 'prix', '20,52');
    expect(boutonValider(hote).disabled).toBeTrue();
    const avant = demandes.length;
    cliquer(hote, 'valider');
    expect(recus.length).toBe(1);
    expect(demandes.length).toBe(avant);
  });

  it('ne sert aucun tableau corrige tant que la correction n est pas revelee', () => {
    const attendreAucunTableauCorrige = (): void => {
      for (const role of ROLES) {
        hote.setAttribute('data-cours-role', role);
        expect(repere(hote, 'tableau-corrige')).withContext(role).toBeNull();
      }
    };
    hote.corrige = CORRIGE_DE_LA_TOILE;
    attendreAucunTableauCorrige();
    hote.corrige = null;
    hote.etayage = 2;
    attendreAucunTableauCorrige();
  });

  it('F-37 · ne projette un tableau corrige que si le back le sert avec le corrige', () => {
    projeterAuPresentateur(hote, { type: 'tableau', attendus: CORRIGE_DE_LA_TOILE.attendus }, 1);

    expect(repere(hote, 'tableau-corrige')).toBeNull();
  });

  it('RET-31 · projette le tableau corrige servi, sa premiere colonne a corriger des le niveau 1', () => {
    projeterAuPresentateur(hote, CORRIGE_DE_LA_TOILE, 1);

    const corrige = repere(hote, 'tableau-corrige');
    expect(corrige?.getAttribute('data-correction')).toBe('juste');
    expect(corrige?.querySelector('caption')?.textContent?.trim()).toBe(
      `Correction — ${PLAN.intitule}`,
    );
    expect(repere(hote, 'tableau')).toBeNull();
    expect(colonneCorrigee(hote, 'prix')).toEqual(PRIX_SAISIS);
    expect(colonneCorrigee(hote, 'indice')).toEqual(['—', '—', '—', '—']);
  });

  it('n additionne pas les taux successifs quand la synthese les resume deja', () => {
    for (const role of ROLES) {
      hote.setAttribute('data-cours-role', role);
      expect(repere(hote, 'totaux')).withContext(role).toBeNull();
    }
    hote.plan = buildTableBuildPlan({ id: 'TB-SANS-SYNTHESE', synthese: [] });
    expect(repere(hote, 'totaux')).not.toBeNull();
    expect(reperes(hote, 'total').map((total) => total.textContent)).toEqual(['4', '', '', '', '']);
  });

  it('F27 · corrige une colonne non donnee par niveau, sans laisser deviner les suivantes', () => {
    projeterAuPresentateur(hote, CORRIGE_DE_LA_TOILE, 1);
    const premieres = (): (string | undefined)[] =>
      ['prix', 'coef', 'indice', 'evolution'].map((cle) => colonneCorrigee(hote, cle)[0]);

    expect(premieres()).toEqual(['21,60', '—', '—', '—']);
    hote.etayage = 2;
    expect(premieres()).toEqual(['21,60', COEFFICIENTS_DEDUITS[0], '—', '—']);
    hote.etayage = 3;
    expect(premieres()).toEqual(['21,60', COEFFICIENTS_DEDUITS[0], '108,00', '—']);
    hote.etayage = 4;
    expect(premieres()).toEqual([
      '21,60',
      COEFFICIENTS_DEDUITS[0],
      '108,00',
      EVOLUTIONS_DEDUITES[0],
    ]);
  });

  it('RET-31 · sert a l etudiant le meme tableau corrige sous sa grille de saisie', () => {
    toutSaisir(hote);
    hote.corrige = CORRIGE_DE_LA_TOILE;
    hote.etayage = 2;

    expect(repere(hote, 'tableau')).not.toBeNull();
    expect(repere(hote, 'tableau-corrige')?.querySelectorAll('input').length).toBe(0);
    expect(colonneCorrigee(hote, 'prix')).toEqual(PRIX_SAISIS);
    expect(colonneCorrigee(hote, 'indice')).toEqual(['—', '—', '—', '—']);
    expect(cellule(hote, 0, 'prix').value).toBe(PRIX_SAISIS[0]);
  });

  it('partage le meme tableau entre les roles et retire champs et actions au presentateur', () => {
    toutSaisirEtServir(hote);
    for (const role of ROLES) {
      hote.setAttribute('data-cours-role', role);
      expect(hote.shadowRoot?.querySelector('caption')?.textContent?.trim())
        .withContext(role)
        .toBe(PLAN.intitule);
      expect(reperes(hote, 'entete').length).withContext(role).toBe(PLAN.colonnes.length);
      expect(reperes(hote, 'ligne').length).withContext(role).toBe(PLAN.echeances);
      expect(repere(hote, 'consignes')).withContext(role).not.toBeNull();
    }
    expect(hote.shadowRoot?.querySelectorAll('input').length).toBe(0);
    expect(colonneAffichee(hote, 'prix')).toEqual(PRIX_SAISIS);
    expect(repere(hote, 'valider')).toBeNull();
    expect(repere(hote, 'synthese')).toBeNull();
    expect(repere(hote, 'modalite')).toBeNull();
  });

  it('imprime sur papier le tableau vierge de l etudiant, sans champ ni action', () => {
    hote.setAttribute('data-papier', '');

    expect(reperes(hote, 'ligne').length).toBe(PLAN.echeances);
    expect(repere(hote, 'consignes')).not.toBeNull();
    expect(hote.shadowRoot?.querySelectorAll('input, button').length).toBe(0);
    expect(repere(hote, 'synthese')).toBeNull();
  });

  it('bati un plan sans echeance sans casser le tableau', () => {
    hote.plan = buildTableBuildPlan({ id: 'b2-01-vide', echeances: 0 });
    expect(reperes(hote, 'ligne')).toEqual([]);
    expect(texteDe(hote, 'vide')).toContain('Aucune ligne à bâtir');
  });

  for (const [echeances, lignes] of [
    [2.9, 2],
    [-3, 0],
    [Number.NaN, 0],
    [Number.POSITIVE_INFINITY, 0],
  ] as const) {
    it(`bati ${String(lignes)} ligne(s) pour ${String(echeances)} echeances`, () => {
      hote.plan = buildTableBuildPlan({ id: 'b2-01-bornes', echeances });
      expect(reperes(hote, 'ligne').length).toBe(lignes);
    });
  }

  it('echappe le html injecte dans l intitule, les libelles de ligne et les valeurs servies', () => {
    hote.plan = buildTableBuildPlan({
      id: 'b2-01-xss',
      intitule: CHARGE_XSS,
      libellesLignes: [CHARGE_XSS],
      tableauInitial: buildTableauEvalue({
        lignes: [{ rang: 0, valeurs: { taux: { valeur: 8, affichage: CHARGE_XSS } } }],
      }),
    });
    expect(hote.shadowRoot?.querySelector('img')).toBeNull();
    expect(hote.shadowRoot?.querySelector('caption')?.textContent?.trim()).toBe(CHARGE_XSS);
    expect(colonneAffichee(hote, 'taux')[0]).toBe(CHARGE_XSS);
  });

  describe('table de verite (colonnes booleennes)', () => {
    const P = [1, 1, 0, 0];
    const Q = [1, 0, 1, 0];

    function choisir(rang: number, cle: string, valeur: '1' | '0'): void {
      const choix = hote.shadowRoot?.querySelector<HTMLSelectElement>(
        `select[data-rang="${rang}"][data-cle="${cle}"]`,
      );
      if (!(choix instanceof HTMLSelectElement)) {
        throw new Error(`aucun choix V/F ${cle} a la ligne ${rang}`);
      }
      choix.value = valeur;
      choix.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function toutChoisir(): void {
      ['1', '0', '0', '0'].forEach((v, rang) => choisir(rang, 'pEtQ', v as '1' | '0'));
      ['1', '1', '1', '0'].forEach((v, rang) => choisir(rang, 'pOuQ', v as '1' | '0'));
    }

    function servie(valeur: number | null): ValeurAffichee {
      return { valeur, affichage: valeur === null ? '—' : String(valeur) };
    }

    function tableDeVerite(
      pEtQ: readonly (number | null)[],
      pOuQ: readonly (number | null)[],
    ): TableauEvalue {
      return buildTableauEvalue({
        lignes: P.map((p, rang) => ({
          rang,
          valeurs: {
            p: servie(p),
            q: servie(Q[rang]),
            pEtQ: servie(pEtQ[rang] ?? null),
            pOuQ: servie(pOuQ[rang] ?? null),
          },
        })),
        totaux: {},
        synthese: [],
        soldeFinal: null,
      });
    }

    beforeEach(() => {
      hote.plan = buildTableDeVeritePlan();
    });

    it('affiche V et F, jamais 1 ou 0, et propose un choix V/F dans chaque case a saisir', () => {
      expect(colonneAffichee(hote, 'p')).toEqual(['V', 'V', 'F', 'F']);
      expect(colonneAffichee(hote, 'q')).toEqual(['V', 'F', 'V', 'F']);
      const choix = [...(hote.shadowRoot?.querySelectorAll('select') ?? [])];
      expect(choix.length).toBe(8);
      expect([...choix[0].options].map((option) => option.textContent?.trim())).toEqual([
        '—',
        'V',
        'F',
      ]);
      expect(hote.shadowRoot?.querySelectorAll('input[data-role="saisie"]').length).toBe(0);
      expect(repere(hote, 'totaux')).toBeNull();
    });

    it('F-37 · un choix V ou F demande aussitot l evaluation du tableau', () => {
      const demandes = demandesDEvaluation(hote);
      choisir(0, 'pEtQ', '1');

      expect(demandes.map((demande) => demande['saisies'])).toEqual([
        [{ rang: 0, cle: 'pEtQ', saisie: '1' }],
      ]);
    });

    it('envoie 1 pour V et 0 pour F, tels que le back les a lus', () => {
      const recus = envois(hote);
      const demandes = demandesDEvaluation(hote);
      toutChoisir();
      cliquer(hote, 'valider');
      servirLaDerniere(hote, demandes, tableDeVerite([1, 0, 0, 0], [1, 1, 1, 0]));

      expect(recus).toHaveSize(1);
      expect(recus[0]).toEqual(
        jasmine.objectContaining({
          planId: 'b2-03-a1-table-et-ou',
          saisies: [
            { rang: 0, cle: 'pEtQ', valeur: 1 },
            { rang: 0, cle: 'pOuQ', valeur: 1 },
            { rang: 1, cle: 'pEtQ', valeur: 0 },
            { rang: 1, cle: 'pOuQ', valeur: 1 },
            { rang: 2, cle: 'pEtQ', valeur: 0 },
            { rang: 2, cle: 'pOuQ', valeur: 1 },
            { rang: 3, cle: 'pEtQ', valeur: 0 },
            { rang: 3, cle: 'pOuQ', valeur: 0 },
          ],
        }),
      );
    });

    it('refuse l envoi tant qu une case reste sans V ni F', () => {
      const recus = envois(hote);
      const demandes = demandesDEvaluation(hote);
      choisir(0, 'pEtQ', '1');
      cliquer(hote, 'valider');
      servirLaDerniere(hote, demandes, tableDeVerite([1], []));

      expect(recus).toEqual([]);
      expect(texteDe(hote, 'retour')).toBe('Complétez chaque cellule à saisir avant de valider');
    });

    it('projette le corrige servi en V et F au niveau 2', () => {
      projeterAuPresentateur(
        hote,
        {
          type: 'tableau',
          attendus: [{ rang: 0, cle: 'pOuQ', valeur: 1 }],
          tableauCorrige: tableDeVerite([1, 0, 0, 0], [1, 1, 1, 0]),
        },
        2,
      );

      expect(colonneCorrigee(hote, 'pEtQ')).toEqual(['V', 'F', 'F', 'F']);
      expect(colonneCorrigee(hote, 'pOuQ')).toEqual(['V', 'V', 'V', 'F']);
    });

    it('imprime sur papier « V / F » a entourer dans chaque case a saisir', () => {
      hote.setAttribute('data-papier', '');

      expect(colonneAffichee(hote, 'pEtQ')).toEqual(['V / F', 'V / F', 'V / F', 'V / F']);
      expect(colonneAffichee(hote, 'p')).toEqual(['V', 'V', 'F', 'F']);
      expect(hote.shadowRoot?.querySelectorAll('select, input, button').length).toBe(0);
    });
  });

  it('couvre par une regle de la feuille chaque classe fp emise', () => {
    toutSaisirEtServir(hote);
    hote.corrige = CORRIGE_DE_LA_TOILE;
    hote.etayage = 2;
    expect(classesEmises(hote).size).toBeGreaterThanOrEqual(CLASSES_ATTENDUES);
    expect(classesOrphelines(hote, 'table-build')).toEqual([]);
  });
});

describe('FpTableBuild sur les tables des cours servis', () => {
  const TABLES_SERVIES = INSTANTANES_DES_COURS_SERVIS.flatMap(([, instantane]) =>
    ecransPublicsDe(instantane)
      .filter((ecran) => ecran.type === 'fp-table-build')
      .map((ecran) => ({ id: ecran.id, plan: ecran.donnees?.['plan'] as TableBuildPlanPublic })),
  );
  const VERITES = new Map<number | null, string>([
    [1, 'V'],
    [0, 'F'],
  ]);
  const seDeduit = (plan: TableBuildPlanPublic): boolean =>
    plan.colonnes.some((colonne) => colonne.role === 'deduite');

  beforeAll(() => enregistrerBrique('fp-table-build', FpTableBuild));

  it('sert des tables avec et sans colonne déduite', () => {
    expect(TABLES_SERVIES.filter(({ plan }) => seDeduit(plan)).length).toBeGreaterThan(0);
    expect(TABLES_SERVIES.filter(({ plan }) => !seDeduit(plan)).length).toBeGreaterThan(0);
  });

  const TABLES_CORRIGEES = INSTANTANES_DES_COURS_SERVIS.flatMap(([, instantane]) =>
    ecransDuPupitreDe(instantane)
      .filter((ecran) => ecran.type === 'fp-table-build')
      .map((ecran) => ({
        id: ecran.id,
        plan: ecran.donnees?.['plan'] as TableBuildPlanPublic,
        corrige: ecran.corrigeEcran?.type === 'tableau' ? ecran.corrigeEcran : null,
      })),
  );

  it('corrige chaque table servie par ses attendus et son tableau corrige', () => {
    expect(TABLES_CORRIGEES.length).toBe(TABLES_SERVIES.length);
    for (const { id, corrige } of TABLES_CORRIGEES) {
      expect(corrige?.attendus.length ?? 0)
        .withContext(id)
        .toBeGreaterThan(0);
      expect(corrige?.tableauCorrige.lignes.length ?? 0)
        .withContext(id)
        .toBeGreaterThan(0);
    }
  });

  for (const { id, plan } of TABLES_SERVIES) {
    it(`F-37 · ${id} : affiche chaque donnee du tableau initial servi, sans rien calculer`, () => {
      const table = creerBrique<FpTableBuild>('fp-table-build', (brique) => {
        brique.plan = plan;
      });
      for (const colonne of plan.colonnes.filter(({ role }) => role !== 'saisie')) {
        expect(colonneAffichee(table, colonne.cle))
          .withContext(colonne.cle)
          .toEqual(
            plan.tableauInitial.lignes.map(({ valeurs }) =>
              colonne.format === 'booleen'
                ? (VERITES.get(valeurs[colonne.cle].valeur) ?? '—')
                : valeurs[colonne.cle].affichage,
            ),
          );
      }
      table.remove();
    });
  }

  for (const { id, plan, corrige } of TABLES_CORRIGEES) {
    it(`${id} : chaque niveau corrige la colonne non donnee suivante, le solde a la derniere`, () => {
      const aCorriger = plan.colonnes.filter(({ role }) => role !== 'donnee').map(({ cle }) => cle);
      const aSolde = plan.colonnes.some(({ soldeDe }) => soldeDe !== undefined);
      const table = creerBrique<FpTableBuild>('fp-table-build', (brique) => {
        brique.plan = plan;
      });
      projeterAuPresentateur(table, corrige, aCorriger.length);
      const completes = aCorriger.map((cle) => colonneCorrigee(table, cle));

      completes.forEach((colonne, rang) =>
        expect(colonne.some((valeur) => valeur !== '—'))
          .withContext(aCorriger[rang])
          .toBeTrue(),
      );
      for (let niveau = 1; niveau <= aCorriger.length; niveau += 1) {
        table.etayage = niveau;
        aCorriger.forEach((cle, rang) =>
          expect(colonneCorrigee(table, cle))
            .withContext(`${cle} au niveau ${String(niveau)}`)
            .toEqual(rang < niveau ? completes[rang] : completes[rang].map(() => '—')),
        );
        expect(repere(table, 'solde') !== null)
          .withContext(`solde au niveau ${String(niveau)}`)
          .toBe(aSolde && niveau === aCorriger.length);
      }
      table.remove();
    });
  }

  for (const { id, plan } of TABLES_SERVIES) {
    it(`${id} : ne dit « les autres colonnes se calculent seules » que si une colonne se déduit`, () => {
      const table = creerBrique<FpTableBuild>('fp-table-build', (brique) => {
        brique.plan = plan;
      });
      const consigne =
        table.shadowRoot?.querySelector('.fp-table-build__consigne')?.textContent ?? '';

      expect(consigne).toContain('Remplissez les cellules à saisir ligne par ligne');
      expect(consigne.includes('se calculent seules')).toBe(seDeduit(plan));
      table.remove();
    });
  }
});
