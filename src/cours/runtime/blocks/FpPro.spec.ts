import { classesEmises, classesOrphelines } from '../../../testing/classes-briques';
import { type TracesEffets, surveillerEffets } from '../../../testing/effets-briques';
import { buildProCas } from '../../../testing/factories/cours.factory';
import { FpPro } from './FpPro';

const CAS = buildProCas();
const CHARGE_XSS = '<img src=x onerror="alert(1)">';
const CLASSES_ATTENDUES = 16;

function cible(element: FpPro, repere: string): Element | null {
  return element.shadowRoot?.querySelector(`[data-testid="${repere}"]`) ?? null;
}

function lu(element: FpPro, repere: string): string {
  return cible(element, repere)?.textContent?.trim() ?? '';
}

describe('FpPro', () => {
  let hote: FpPro;
  let traces: TracesEffets;

  beforeAll(() => {
    if (!customElements.get('fp-pro')) {
      customElements.define('fp-pro', FpPro);
    }
  });

  beforeEach(() => {
    hote = document.createElement('fp-pro') as FpPro;
    traces = surveillerEffets(hote);
    hote.cas = CAS;
    document.body.appendChild(hote);
  });

  afterEach(() => {
    traces.restaurer();
    hote.remove();
  });

  it('pose le cas dans un aside et non dans un div nu', () => {
    const cadre = hote.shadowRoot?.querySelector('.fp-pro__cas');
    expect(cadre?.tagName).toBe('ASIDE');
    expect(lu(hote, 'metier')).toBe(CAS.metier);
    expect(lu(hote, 'situation')).toBe(CAS.situation);
  });

  it('detache le geste professionnel de la situation sous un intitule propre', () => {
    const geste = cible(hote, 'geste');
    expect(lu(hote, 'geste')).toBe(CAS.geste);
    expect(geste?.closest('.fp-pro__geste')).toBeTruthy();
    expect(hote.shadowRoot?.querySelector('.fp-pro__intitule')?.textContent?.trim()).toBe(
      'Le geste professionnel',
    );
  });

  it('annonce la portee du geste quand la consequence est renseignee', () => {
    expect(lu(hote, 'consequence')).toBe(`Sur le terrain : ${CAS.consequence}`);
  });

  it('n affiche aucune consequence quand elle n est pas renseignee', () => {
    hote.cas = buildProCas({ id: 'M-METIER-07', consequence: null });
    expect(cible(hote, 'consequence')).toBeNull();
    expect(hote.shadowRoot?.innerHTML ?? '').not.toContain('Sur le terrain');
  });

  it('echappe le html injecte dans le metier, la situation, le geste et la consequence', () => {
    hote.cas = buildProCas({
      id: 'M-METIER-08',
      metier: CHARGE_XSS,
      situation: CHARGE_XSS,
      geste: CHARGE_XSS,
      consequence: CHARGE_XSS,
    });
    expect(hote.shadowRoot?.querySelector('img')).toBeNull();
    expect(lu(hote, 'metier')).toBe(CHARGE_XSS);
    expect(lu(hote, 'situation')).toBe(CHARGE_XSS);
    expect(lu(hote, 'geste')).toBe(CHARGE_XSS);
    expect(lu(hote, 'consequence')).toBe(`Sur le terrain : ${CHARGE_XSS}`);
    expect(hote.shadowRoot?.innerHTML ?? '').toContain('&lt;img');
  });

  it('passe le geste a la grande typographie de projection en rendu stage seulement', () => {
    expect(cible(hote, 'geste')?.classList.contains('fp-enonce')).toBe(false);
    hote.setAttribute('render', 'stage');
    expect(cible(hote, 'geste')?.classList.contains('fp-enonce')).toBe(true);
    expect(hote.shadowRoot?.querySelector('.fp-root')?.getAttribute('data-render')).toBe('stage');
  });

  it('efface une donnee de correction nichee dans les metadonnees', () => {
    const piege = buildProCas({ id: 'M-METIER-09' });
    const metadonnees = { ...piege.metadonnees, bonneReponse: 'a' };
    hote.cas = { ...piege, metadonnees };
    expect(JSON.stringify(hote.cas)).not.toContain('bonneReponse');
  });

  it('ne diffuse aucun evenement et n ecrit dans aucun stockage', () => {
    hote.cas = buildProCas({ id: 'M-METIER-10' });
    for (const rendu of ['stage', 'board', 'hand']) {
      hote.setAttribute('render', rendu);
    }
    expect(traces.evenements).toEqual([]);
    expect(traces.ecritures).toEqual([]);
  });

  it('couvre par une regle de la feuille chaque classe fp emise', () => {
    expect(classesEmises(hote).size).toBeGreaterThanOrEqual(CLASSES_ATTENDUES);
    expect(classesOrphelines(hote, 'pro')).toEqual([]);
  });
});
