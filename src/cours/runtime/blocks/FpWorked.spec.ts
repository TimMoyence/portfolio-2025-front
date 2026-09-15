import { classesEmises, classesOrphelines } from '../../../testing/classes-briques';
import { type TracesEffets, surveillerEffets } from '../../../testing/effets-briques';
import { buildWorkedExemple } from '../../../testing/factories/cours.factory';
import { FpWorked } from './FpWorked';

interface EnvoiWorked {
  readonly exempleId: string;
  readonly etayage: number;
  readonly etayageSuivant: number;
  readonly redactions: Record<string, string>;
  readonly explications: Record<string, string>;
  readonly dureeMs: number;
}

const EXEMPLE = buildWorkedExemple();
const ETAPES = EXEMPLE.etapes.map((etape) => etape.id);
const PLEIN = ETAPES.length;
const DERNIERE = ETAPES[PLEIN - 1];
const CHARGE_XSS = '<img src=x onerror="alert(1)">';
const CLASSES_ATTENDUES = 17;

function reperes(hote: FpWorked, repere: string): HTMLElement[] {
  return [...(hote.shadowRoot?.querySelectorAll<HTMLElement>(`[data-testid="${repere}"]`) ?? [])];
}

function zone(hote: FpWorked, repere: string, etape: string): HTMLTextAreaElement {
  const trouve = reperes(hote, repere).find((noeud) => noeud.dataset['etape'] === etape);
  if (!(trouve instanceof HTMLTextAreaElement)) {
    throw new Error(`aucune zone ${repere} pour l etape ${etape}`);
  }
  return trouve;
}

function ecrire(hote: FpWorked, repere: string, etape: string, contenu: string): void {
  const champ = zone(hote, repere, etape);
  champ.value = contenu;
  champ.dispatchEvent(new Event('input', { bubbles: true }));
}

function valider(hote: FpWorked): void {
  hote.shadowRoot?.querySelector<HTMLButtonElement>('[data-testid="valider"]')?.click();
}

function aCompleter(hote: FpWorked): string[] {
  return reperes(hote, 'etape')
    .filter((etape) => etape.dataset['resolue'] === 'false')
    .map((etape) => etape.dataset['etape'] ?? '');
}

function completerTout(hote: FpWorked): void {
  for (const etape of aCompleter(hote)) {
    ecrire(hote, 'saisie', etape, `redaction de ${etape}`);
  }
}

function montrees(hote: FpWorked): string[] {
  return reperes(hote, 'raisonnement').map((detail) => detail.dataset['etape'] ?? '');
}

function fil(hote: FpWorked): string[] {
  const noeuds =
    hote.shadowRoot?.querySelectorAll<HTMLElement>(
      '[data-testid="etape"], [data-testid="explication"]',
    ) ?? [];
  return [...noeuds].map((noeud) => `${noeud.dataset['testid']}:${noeud.dataset['etape']}`);
}

describe('FpWorked', () => {
  let hote: FpWorked;
  let traces: TracesEffets;
  let envois: EnvoiWorked[];
  let ecouteur: (evenement: Event) => void;

  function dernierEnvoi(): EnvoiWorked {
    if (envois.length === 0) {
      throw new Error('aucun envoi recu');
    }
    return envois[envois.length - 1];
  }

  function monter(etayage: number): FpWorked {
    const neuf = document.createElement('fp-worked') as FpWorked;
    neuf.exemple = EXEMPLE;
    neuf.etayage = etayage;
    document.body.appendChild(neuf);
    return neuf;
  }

  beforeAll(() => {
    if (!customElements.get('fp-worked')) {
      customElements.define('fp-worked', FpWorked);
    }
  });

  beforeEach(() => {
    envois = [];
    ecouteur = (evenement: Event): void => {
      envois.push((evenement as CustomEvent).detail as EnvoiWorked);
    };
    document.addEventListener('fp-worked-submit', ecouteur);
    hote = document.createElement('fp-worked') as FpWorked;
    traces = surveillerEffets(hote);
    hote.exemple = EXEMPLE;
    document.body.appendChild(hote);
  });

  afterEach(() => {
    document.removeEventListener('fp-worked-submit', ecouteur);
    traces.restaurer();
    for (const reste of [...document.querySelectorAll('fp-worked')]) {
      reste.remove();
    }
  });

  it('montre tout le raisonnement a la premiere presentation', () => {
    expect(hote.etayage).toBe(PLEIN);
    expect(montrees(hote)).toEqual(ETAPES);
    expect(aCompleter(hote)).toEqual([]);
    expect(reperes(hote, 'saisie')).toEqual([]);
  });

  it('retire la derniere etape puis les deux dernieres a mesure que l etayage baisse', () => {
    hote.etayage = PLEIN - 1;
    expect(aCompleter(hote)).toEqual(ETAPES.slice(PLEIN - 1));
    expect(montrees(hote)).toEqual(ETAPES.slice(0, PLEIN - 1));
    hote.etayage = PLEIN - 2;
    expect(aCompleter(hote)).toEqual(ETAPES.slice(PLEIN - 2));
    expect(montrees(hote)).toEqual(ETAPES.slice(0, PLEIN - 2));
  });

  it('ne pre remplit aucune etape au dernier niveau d etayage', () => {
    hote.etayage = 0;
    expect(hote.etayage).toBe(0);
    expect(montrees(hote)).toEqual([]);
    expect(aCompleter(hote)).toEqual(ETAPES);
    expect(reperes(hote, 'saisie').length).toBe(PLEIN);
  });

  it('ne remonte jamais l etayage deja retire a l etudiant', () => {
    hote.etayage = 1;
    hote.etayage = PLEIN;
    expect(hote.etayage).toBe(1);
    expect(aCompleter(hote)).toEqual(ETAPES.slice(1));
    hote.etayage = 42;
    expect(hote.etayage).toBe(1);
    expect(montrees(hote)).toEqual(ETAPES.slice(0, 1));
  });

  it('annonce un etayage plus faible que celui presente sans jamais passer sous zero', () => {
    hote.etayage = 1;
    completerTout(hote);
    valider(hote);
    expect(dernierEnvoi().etayage).toBe(1);
    expect(dernierEnvoi().etayageSuivant).toBe(0);
    const autonome = monter(0);
    completerTout(autonome);
    valider(autonome);
    expect(dernierEnvoi().etayage).toBe(0);
    expect(dernierEnvoi().etayageSuivant).toBe(0);
  });

  it('pose le prompt d auto explication avant l etape suivante et non apres la derniere', () => {
    expect(fil(hote)).toEqual(
      ETAPES.flatMap((etape) => [`etape:${etape}`, `explication:${etape}`]),
    );
  });

  it('laisse avancer avec une auto explication vide sans rien emettre a sa place', () => {
    hote.etayage = PLEIN - 1;
    completerTout(hote);
    ecrire(hote, 'explication', ETAPES[1], '   ');
    valider(hote);
    expect(traces.evenements).toEqual(['fp-worked-submit']);
    expect(dernierEnvoi().explications).toEqual({});
    expect(dernierEnvoi().redactions[DERNIERE]).toBe(`redaction de ${DERNIERE}`);
  });

  it('emet l auto explication ecrite avec la redaction de l etape a completer', () => {
    hote.etayage = PLEIN - 1;
    ecrire(hote, 'saisie', DERNIERE, 'la valeur acquise vaut 1 124,86 euros');
    ecrire(hote, 'explication', ETAPES[0], 'le taux doit etre ecrit en decimal');
    valider(hote);
    expect(dernierEnvoi().explications).toEqual({
      [ETAPES[0]]: 'le taux doit etre ecrit en decimal',
    });
    expect(dernierEnvoi().redactions).toEqual({
      [DERNIERE]: 'la valeur acquise vaut 1 124,86 euros',
    });
    expect(dernierEnvoi().exempleId).toBe(EXEMPLE.id);
  });

  it('refuse d avancer tant qu une etape a completer reste vide', () => {
    hote.etayage = PLEIN - 2;
    ecrire(hote, 'saisie', DERNIERE, 'la valeur acquise');
    valider(hote);
    expect(traces.evenements).toEqual([]);
    expect(reperes(hote, 'retour')[0]?.textContent).toContain('avant de valider');
    ecrire(hote, 'saisie', ETAPES[PLEIN - 2], 'on remplace les valeurs dans la formule');
    valider(hote);
    expect(traces.evenements).toEqual(['fp-worked-submit']);
  });

  it('reprend au remontage l etayage tenu par le deck sans rien ecrire dans un stockage', () => {
    hote.etayage = 2;
    completerTout(hote);
    valider(hote);
    const rouvert = monter(dernierEnvoi().etayageSuivant);
    expect(rouvert.etayage).toBe(1);
    expect(aCompleter(rouvert)).toEqual(ETAPES.slice(1));
    expect(reperes(rouvert, 'saisie').length).toBe(PLEIN - 1);
    expect(traces.ecritures).toEqual([]);
  });

  it('ne livre pas a l etudiant le raisonnement d une etape qu il doit completer', () => {
    hote.etayage = PLEIN - 1;
    const cache = EXEMPLE.etapes[PLEIN - 1].raisonnement;
    expect(JSON.stringify(hote.exemple)).not.toContain(cache);
    expect(hote.shadowRoot?.innerHTML ?? '').not.toContain(cache);
    hote.setAttribute('role', 'presentateur');
    expect(JSON.stringify(hote.exemple)).toContain(cache);
  });

  it('efface une donnee de correction nichee dans les metadonnees', () => {
    const piege = buildWorkedExemple({ id: 'K-RESOLU-09' });
    const metadonnees = { ...piege.metadonnees, bonneReponse: 'c' };
    hote.exemple = { ...piege, metadonnees };
    expect(JSON.stringify(hote.exemple)).not.toContain('bonneReponse');
  });

  it('echappe le html injecte dans l enonce, les etapes et les invites', () => {
    hote.exemple = buildWorkedExemple({
      id: 'K-RESOLU-08',
      enonce: CHARGE_XSS,
      etapes: EXEMPLE.etapes.map((etape) => ({
        ...etape,
        intitule: CHARGE_XSS,
        raisonnement: CHARGE_XSS,
        invite: CHARGE_XSS,
      })),
    });
    expect(hote.shadowRoot?.querySelector('img')).toBeNull();
    expect(reperes(hote, 'enonce')[0]?.textContent).toBe(CHARGE_XSS);
    expect(reperes(hote, 'raisonnement')[0]?.textContent).toBe(CHARGE_XSS);
    expect(hote.shadowRoot?.innerHTML ?? '').toContain('&lt;img');
  });

  it('projette sans zone de saisie et annonce au tableau le niveau d etayage', () => {
    hote.etayage = 2;
    hote.setAttribute('render', 'stage');
    expect(reperes(hote, 'saisie')).toEqual([]);
    expect(reperes(hote, 'explication')).toEqual([]);
    expect(montrees(hote)).toEqual(ETAPES.slice(0, 2));
    hote.setAttribute('render', 'board');
    expect(reperes(hote, 'niveau')[0]?.dataset['niveau']).toBe('2');
    expect(reperes(hote, 'modalite')[0]?.textContent).toBe(EXEMPLE.metadonnees.modalite);
  });

  it('couvre par une regle de la feuille chaque classe fp emise', () => {
    expect(classesEmises(hote).size).toBeGreaterThanOrEqual(CLASSES_ATTENDUES);
    expect(classesOrphelines(hote, 'worked')).toEqual([]);
  });
});
