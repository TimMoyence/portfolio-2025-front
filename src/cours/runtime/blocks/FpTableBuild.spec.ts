import { classesEmises, classesOrphelines } from '../../../testing/classes-briques';
import {
  attendreLEnvoiVideRefuse,
  attendreLeRenvoiEpuise,
  detailsEmis,
  installerBrique,
} from '../../../testing/banc-de-brique';
import {
  buildTableBuildPlan,
  buildVerdictDeProduction,
} from '../../../testing/factories/cours.factory';
import { FpTableBuild } from './FpTableBuild';

const PLAN = buildTableBuildPlan();
const CHARGE_XSS = '<img src=x onerror="alert(1)">';
const CLASSES_ATTENDUES = 14;
const ROLES = ['etudiant', 'presentateur'] as const;
const RENVOYER = 'Renvoyer les cases corrigées';
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
const ATTENDUS_FORMATEUR = {
  type: 'tableau',
  attendus: [{ rang: 0, cle: 'prix', valeur: 21.6 }],
};

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

function toutSaisir(hote: FpTableBuild): void {
  PRIX_SAISIS.forEach((prix, rang) => saisir(hote, rang, 'prix', prix));
  INDICES_SAISIS.forEach((indice, rang) => saisir(hote, rang, 'indice', indice));
}

function cliquer(hote: FpTableBuild, nom: string): void {
  repere(hote, nom)?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

function recevoirLeVerdictPartiel(hote: FpTableBuild): void {
  toutSaisir(hote);
  cliquer(hote, 'valider');
  hote.verdict = VERDICT_PARTIEL;
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

  it('affiche les donnees du plan en lecture seule et ne laisse saisir que les colonnes a saisir', () => {
    expect(colonneAffichee(hote, 'taux')).toEqual(['8', '-5', '4', '-3']);
    expect(cellule(hote, 0, 'taux').readOnly).toBeTrue();
    expect(cellule(hote, 0, 'coef').readOnly).toBeTrue();
    expect(cellule(hote, 0, 'prix').readOnly).toBeFalse();
    expect(cellule(hote, 0, 'indice').readOnly).toBeFalse();
  });

  it('deduit chaque colonne par le moteur de formules des qu une valeur est saisie', () => {
    toutSaisir(hote);
    expect(colonneAffichee(hote, 'coef')).toEqual(COEFFICIENTS_DEDUITS);
    expect(colonneAffichee(hote, 'evolution')).toEqual(EVOLUTIONS_DEDUITES);
  });

  it('marque d un tiret une deduction impossible sans casser la ligne', () => {
    saisir(hote, 0, 'prix', 'douze euros');
    expect(cellule(hote, 0, 'coef').value).toBe('—');
    saisir(hote, 0, 'prix', '1 080,00');
    expect(cellule(hote, 0, 'coef').value).toBe('54,0000');
  });

  it('calcule la synthese sans ligne de totaux a cote', () => {
    toutSaisir(hote);
    expect(hote.shadowRoot?.querySelector('[data-testid="total"]')).toBeNull();
    expect(
      reperes(hote, 'synthese-ligne').map((ligne) => ligne.querySelector('dd')?.textContent),
    ).toEqual(['4,00 %', '3,50 %']);
  });

  it('garde le foyer et la frappe dans la cellule saisie malgre le recalcul', () => {
    const champ = cellule(hote, 1, 'prix');
    champ.focus();
    saisir(hote, 1, 'prix', '20,5');
    expect(hote.shadowRoot?.activeElement?.getAttribute('data-cle')).toBe('prix');
    expect(hote.shadowRoot?.activeElement?.getAttribute('data-rang')).toBe('1');
    expect(cellule(hote, 1, 'prix').value).toBe('20,5');
  });

  it('refuse un envoi vide puis un envoi incomplet, et envoie les seules valeurs saisies', () => {
    const recus = envois(hote);
    attendreLEnvoiVideRefuse(hote);
    saisir(hote, 0, 'prix', PRIX_SAISIS[0]);
    cliquer(hote, 'valider');
    expect(texteDe(hote, 'retour')).toBe('Complétez chaque cellule à saisir avant de valider');
    expect(recus).toEqual([]);

    toutSaisir(hote);
    cliquer(hote, 'valider');

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

  it('envoie je ne sais pas sans saisie', () => {
    const recus = envois(hote);
    cliquer(hote, 'je-ne-sais-pas');
    expect(recus.map((detail) => detail['neSaitPas'])).toEqual([true]);
  });

  it('n ecrit dans aucun stockage : le brouillon passe par l hote', () => {
    const brouillons = detailsEmis(hote, 'fp-brouillon');
    saisir(hote, 0, 'prix', PRIX_SAISIS[0]);
    expect(brouillons).toEqual([{ id: PLAN.id, valeur: { '0:prix': PRIX_SAISIS[0] } }]);
    expect(traces.ecritures).toEqual([]);

    hote.plan = buildTableBuildPlan({ id: 'b2-01-a4-recharge' });
    hote.brouillon = { '1:indice': '102,6', '0:coef': '9', '9:prix': '1' };

    expect(cellule(hote, 1, 'indice').value).toBe('102,6');
    expect(cellule(hote, 0, 'coef').value).toBe('—');
    expect(texteDe(hote, 'brouillon-restaure')).toBe('Brouillon restauré');
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
    recevoirLeVerdictPartiel(hote);

    expect(boutonValider(hote).disabled).toBeTrue();
    expect(cellule(hote, 0, 'prix').disabled).toBeTrue();
    expect(cellule(hote, 1, 'prix').disabled).toBeFalse();
    saisir(hote, 1, 'prix', '20,52');

    expect(boutonValider(hote).disabled).toBeFalse();
    expect(boutonValider(hote).textContent?.trim()).toBe(RENVOYER);
    cliquer(hote, 'valider');

    expect(recus.length).toBe(2);
    expect(recus[1]['saisies']).toContain({ rang: 1, cle: 'prix', valeur: 20.52 });
    attendreLeRenvoiEpuise(hote, recus, 2);
  });

  it('RET-31 · ferme la reprise des cases fausses des que la correction est revelee', () => {
    const recus = envois(hote);
    recevoirLeVerdictPartiel(hote);
    hote.etayage = 1;

    expect(cellule(hote, 1, 'prix').disabled).toBeTrue();
    saisir(hote, 1, 'prix', '20,52');
    expect(boutonValider(hote).disabled).toBeTrue();
    cliquer(hote, 'valider');
    expect(recus.length).toBe(1);
  });

  it('ne sert aucun tableau corrige tant que la correction n est pas revelee', () => {
    const attendreAucunTableauCorrige = (): void => {
      for (const role of ROLES) {
        hote.setAttribute('data-cours-role', role);
        expect(repere(hote, 'tableau-corrige')).withContext(role).toBeNull();
      }
    };
    hote.corrige = ATTENDUS_FORMATEUR;
    attendreAucunTableauCorrige();
    hote.corrige = null;
    hote.etayage = 2;
    attendreAucunTableauCorrige();
  });

  it('RET-31 · projette le tableau corrige, saisies masquees au niveau 1 puis revelees au niveau 2', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.corrige = ATTENDUS_FORMATEUR;
    hote.etayage = 1;

    const corrige = repere(hote, 'tableau-corrige');
    expect(corrige?.getAttribute('data-correction')).toBe('juste');
    expect(corrige?.querySelector('caption')?.textContent?.trim()).toBe(
      `Correction — ${PLAN.intitule}`,
    );
    expect(repere(hote, 'tableau')).toBeNull();
    expect(colonneCorrigee(hote, 'prix')).toEqual(['—', '—', '—', '—']);

    hote.etayage = 2;
    expect(colonneCorrigee(hote, 'prix')).toEqual(['21,60', '—', '—', '—']);
  });

  it('n additionne pas les taux successifs quand la synthese les resume deja', () => {
    for (const role of ROLES) {
      hote.setAttribute('data-cours-role', role);
      expect(repere(hote, 'totaux')).withContext(role).toBeNull();
    }
    hote.plan = buildTableBuildPlan({ id: 'TB-SANS-SYNTHESE', synthese: [] });
    expect(repere(hote, 'totaux')).not.toBeNull();
  });

  it('F27 · ne laisse deviner au niveau 1 ni les prix ni les indices par les colonnes deduites', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.corrige = {
      type: 'tableau',
      attendus: [
        { rang: 0, cle: 'prix', valeur: 21.6 },
        { rang: 0, cle: 'indice', valeur: 108 },
      ],
    };
    hote.etayage = 1;

    expect(colonneCorrigee(hote, 'coef')[0]).toBe(COEFFICIENTS_DEDUITS[0]);
    expect(colonneCorrigee(hote, 'indice')[0]).toBe('—');
    expect(colonneCorrigee(hote, 'evolution')[0]).toBe('—');

    hote.etayage = 2;
    expect(colonneCorrigee(hote, 'indice')[0]).toBe('108,00');
    expect(colonneCorrigee(hote, 'evolution')[0]).toBe(EVOLUTIONS_DEDUITES[0]);
  });

  it('RET-31 · sert a l etudiant le meme tableau corrige sous sa grille de saisie', () => {
    toutSaisir(hote);
    hote.corrige = ATTENDUS_FORMATEUR;
    hote.etayage = 2;

    expect(repere(hote, 'tableau')).not.toBeNull();
    expect(repere(hote, 'tableau-corrige')?.querySelectorAll('input').length).toBe(0);
    expect(colonneCorrigee(hote, 'prix')).toEqual(['21,60', '—', '—', '—']);
    expect(cellule(hote, 0, 'prix').value).toBe(PRIX_SAISIS[0]);
  });

  it('partage le meme tableau entre les roles et retire champs et actions au presentateur', () => {
    toutSaisir(hote);
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

  it('bati un plan sans echeance sans casser le tableau', () => {
    hote.plan = buildTableBuildPlan({ id: 'b2-01-vide', echeances: 0 });
    expect(reperes(hote, 'ligne')).toEqual([]);
    expect(texteDe(hote, 'vide')).toContain('Aucune ligne à bâtir');
  });

  it('echappe le html injecte dans l intitule et les libelles de ligne', () => {
    hote.plan = buildTableBuildPlan({
      id: 'b2-01-xss',
      intitule: CHARGE_XSS,
      libellesLignes: [CHARGE_XSS],
    });
    expect(hote.shadowRoot?.querySelector('img')).toBeNull();
    expect(hote.shadowRoot?.querySelector('caption')?.textContent?.trim()).toBe(CHARGE_XSS);
  });

  it('couvre par une regle de la feuille chaque classe fp emise', () => {
    toutSaisir(hote);
    hote.corrige = ATTENDUS_FORMATEUR;
    hote.etayage = 2;
    expect(classesEmises(hote).size).toBeGreaterThanOrEqual(CLASSES_ATTENDUES);
    expect(classesOrphelines(hote, 'table-build')).toEqual([]);
  });
});
