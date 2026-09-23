import { buildPulseSondage } from '../../../testing/factories/cours.factory';
import { feuilleDe } from '../design/blocks';
import { base, stage, tokens } from '../design/styles';
import { FpPulse } from './FpPulse';

const SONDAGE = buildPulseSondage();
const COMPTES = { perdu: 4, 'ca-va': 11, clair: 7 };
const INSTANT_INITIAL = '2026-09-13T09:00:00.000Z';
const NOM_ETUDIANT = 'Nadia Mbarek';
const CHARGE_XSS = '<img src=x onerror="alert(1)">';
const RENDUS = ['hand', 'stage', 'board'];

function boutonsEtat(element: FpPulse): HTMLButtonElement[] {
  return [...(element.shadowRoot?.querySelectorAll<HTMLButtonElement>('[data-etat-pulse]') ?? [])];
}

function declarer(element: FpPulse, etat: string): void {
  element.shadowRoot?.querySelector<HTMLButtonElement>(`[data-etat-pulse="${etat}"]`)?.click();
}

function presses(element: FpPulse): string[] {
  return boutonsEtat(element)
    .filter((bouton) => bouton.getAttribute('aria-pressed') === 'true')
    .map((bouton) => bouton.getAttribute('data-etat-pulse') ?? '');
}

function lireTexte(element: FpPulse, marqueur: string): string {
  return (
    element.shadowRoot?.querySelector(`[data-testid="${marqueur}"]`)?.textContent?.trim() ?? ''
  );
}

function triees(cles: readonly string[]): string[] {
  return [...cles].sort((gauche, droite) => gauche.localeCompare(droite));
}

function changements(element: FpPulse): Record<string, unknown>[] {
  const recus: Record<string, unknown>[] = [];
  element.addEventListener('fp-pulse-change', (evenement) => {
    recus.push((evenement as CustomEvent).detail as Record<string, unknown>);
  });
  return recus;
}

describe('FpPulse', () => {
  let hote: FpPulse;

  beforeAll(() => {
    if (!customElements.get('fp-pulse')) {
      customElements.define('fp-pulse', FpPulse);
    }
  });

  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(INSTANT_INITIAL));
    hote = document.createElement('fp-pulse') as FpPulse;
    hote.sondage = SONDAGE;
    document.body.appendChild(hote);
  });

  afterEach(() => {
    hote.remove();
    jasmine.clock().uninstall();
  });

  it('propose les trois etats des l ouverture', () => {
    expect(boutonsEtat(hote).map((bouton) => bouton.getAttribute('data-etat-pulse'))).toEqual([
      'perdu',
      'ca-va',
      'clair',
    ]);
    expect(presses(hote)).toEqual([]);
  });

  it('n emet aucun identifiant d etudiant avec l etat declare', () => {
    const recus = changements(hote);
    declarer(hote, 'perdu');
    expect(recus.length).toBe(1);
    expect(recus[0]).toEqual({ sondageId: SONDAGE.id, etat: 'perdu', dureeMs: 0 });
    expect(triees(Object.keys(recus[0]))).toEqual(['dureeMs', 'etat', 'sondageId']);
  });

  it('mesure la duree avec le chronometre de la brique', () => {
    const recus = changements(hote);
    jasmine.clock().tick(2500);
    declarer(hote, 'clair');
    expect(recus[0]['dureeMs']).toBe(2500);
  });

  it('remplace l etat quand l etudiant change d avis', () => {
    const recus = changements(hote);
    declarer(hote, 'perdu');
    declarer(hote, 'clair');
    expect(presses(hote)).toEqual(['clair']);
    expect(recus.map((detail) => detail['etat'])).toEqual(['perdu', 'clair']);
  });

  it('n emet rien quand l etat declare est deja celui retenu', () => {
    const recus = changements(hote);
    declarer(hote, 'ca-va');
    declarer(hote, 'ca-va');
    expect(recus.length).toBe(1);
  });

  it('laisse les trois etats ouverts en permanence', () => {
    declarer(hote, 'perdu');
    expect(boutonsEtat(hote).every((bouton) => !bouton.disabled)).toBe(true);
    declarer(hote, 'ca-va');
    expect(presses(hote)).toEqual(['ca-va']);
  });

  it('distingue les trois etats par un libelle et une forme sans recours a la couleur', () => {
    const libelles = boutonsEtat(hote).map(
      (bouton) => bouton.querySelector('.fp-pulse__libelle')?.textContent?.trim() ?? '',
    );
    const formes = boutonsEtat(hote).map(
      (bouton) => bouton.querySelector('.fp-pulse__forme')?.textContent?.trim() ?? '',
    );
    expect(libelles).toEqual(['Perdu', 'Ça va', 'C’est clair']);
    expect(new Set(formes).size).toBe(3);
    expect(formes.every((forme) => forme.length > 0)).toBe(true);
  });

  it('rappelle l etat retenu dans une region live', () => {
    declarer(hote, 'perdu');
    expect(lireTexte(hote, 'retour')).toBe('Votre état actuel : Perdu');
    expect(hote.shadowRoot?.querySelector('[aria-live="polite"]')).toBeTruthy();
  });

  it('agrege la classe en comptes et ne nomme jamais un etudiant', () => {
    const bruts = { ...COMPTES, [NOM_ETUDIANT]: 1, etudiants: [NOM_ETUDIANT] };
    hote.comptes = bruts;
    hote.setAttribute('render', 'board');
    const lignes = [...(hote.shadowRoot?.querySelectorAll('[data-testid="ligne"]') ?? [])];
    expect(lignes.map((ligne) => ligne.getAttribute('data-etat-pulse'))).toEqual([
      'perdu',
      'ca-va',
      'clair',
    ]);
    expect(
      lignes.map((ligne) => ligne.querySelector('[data-testid="compte"]')?.textContent?.trim()),
    ).toEqual(['4', '11', '7']);
    expect(lireTexte(hote, 'total')).toBe('Réponses reçues : 22');
    expect(hote.shadowRoot?.innerHTML ?? '').not.toContain(NOM_ETUDIANT);
  });

  it('efface du sondage retenu toute cle etrangere aux comptes', () => {
    const bruts = { ...COMPTES, etudiants: [NOM_ETUDIANT] };
    hote.comptes = bruts;
    expect(JSON.stringify(hote.comptes)).not.toContain(NOM_ETUDIANT);
    expect(triees(Object.keys(hote.comptes ?? {}))).toEqual(['ca-va', 'clair', 'perdu', 'total']);
  });

  it('efface une donnee de correction nichee dans les metadonnees', () => {
    const piege = buildPulseSondage({ id: 'P-PULSE-03' });
    const metadonnees = { ...piege.metadonnees, bonneReponse: 'a' };
    hote.sondage = { ...piege, metadonnees };
    expect(JSON.stringify(hote.sondage)).not.toContain('bonneReponse');
  });

  it('echappe le html injecte dans l invite', () => {
    hote.sondage = buildPulseSondage({ id: 'P-PULSE-04', invite: CHARGE_XSS });
    expect(hote.shadowRoot?.querySelector('img')).toBeNull();
    expect(hote.shadowRoot?.querySelector('legend')?.textContent?.trim()).toBe(CHARGE_XSS);
    expect(hote.shadowRoot?.innerHTML ?? '').toContain('&lt;img');
  });

  it('oublie l etat declare quand un nouveau sondage arrive', () => {
    declarer(hote, 'perdu');
    hote.sondage = buildPulseSondage({ id: 'P-PULSE-05' });
    expect(presses(hote)).toEqual([]);
  });

  it('G2 · projette l invite, l anonymat et les trois états du poste étudiant, inertes', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.setAttribute('render', 'stage');

    expect(hote.shadowRoot?.querySelector('legend')?.textContent?.trim()).toBe(SONDAGE.invite);
    expect(lireTexte(hote, 'anonymat')).not.toBe('');
    expect(boutonsEtat(hote).map((bouton) => bouton.disabled)).toEqual([true, true, true]);
    expect(presses(hote)).toEqual([]);
  });

  it('masque les comptes en projection sous cinq reponses, jamais au pupitre', () => {
    hote.comptes = { perdu: 1, 'ca-va': 2, clair: 1, total: 4 };
    hote.setAttribute('render', 'stage');

    expect(lireTexte(hote, 'masque')).toBe('Comptes affichés à partir de 5 réponses');
    expect(hote.shadowRoot?.querySelector('[data-testid="agregat"]')).toBeNull();

    hote.setAttribute('render', 'board');
    expect(lireTexte(hote, 'total')).toBe('Réponses reçues : 4');

    hote.setAttribute('render', 'stage');
    hote.comptes = { perdu: 1, 'ca-va': 2, clair: 2, total: 5 };
    expect(lireTexte(hote, 'total')).toBe('Réponses reçues : 5');
  });

  it('memorise l etat declare et le restaure apres rechargement', () => {
    const brouillons: unknown[] = [];
    hote.addEventListener('fp-brouillon', (evenement) =>
      brouillons.push((evenement as CustomEvent).detail),
    );
    declarer(hote, 'perdu');
    expect(brouillons).toEqual([{ id: SONDAGE.id, valeur: { etat: 'perdu' } }]);

    hote.sondage = buildPulseSondage({ id: 'P-PULSE-06' });
    hote.brouillon = { etat: 'clair' };
    expect(presses(hote)).toEqual(['clair']);
  });

  it('couvre par une regle de la feuille chaque classe fp emise', () => {
    const feuille = [tokens, base, feuilleDe('pulse'), stage].join('\n');
    hote.comptes = COMPTES;
    declarer(hote, 'clair');
    const couverte = (classe: string): boolean =>
      new RegExp(`\\.${classe}(?![\\w-])`).test(feuille);
    const emises = new Set(
      RENDUS.flatMap((rendu) => {
        hote.setAttribute('render', rendu);
        const portant = hote.shadowRoot?.querySelectorAll('[class]') ?? [];
        return [...portant].flatMap((noeud) => [...noeud.classList]);
      }),
    );
    expect(emises.size).toBeGreaterThanOrEqual(10);
    expect(triees([...emises].filter((classe) => !couverte(classe)))).toEqual([]);
  });
});
