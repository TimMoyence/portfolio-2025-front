import { classesOrphelines } from '../../../testing/classes-briques';
import {
  buildChallengeProbleme,
  buildStrategiesServies,
} from '../../../testing/factories/cours.factory';
import { FpChallenge } from './FpChallenge';

interface DetailChallenge {
  problemeId: string;
  tentative: string;
  dureeMs: number;
}

const PROBLEME = buildChallengeProbleme();
const LIBELLE_FAUSSE = 'Diviser 100 par 7 et arrondir';
const TENTATIVE = 'A vue de nez une dizaine d annees, j ai ajoute 7 % chaque annee de tete';
const CHARGE_XSS = '<img src=x onerror="alert(1)">';
const RENDUS = ['hand', 'stage', 'board'];
const INSTANT_INITIAL = '2026-09-13T10:00:00.000Z';
const CORRIGE_DU_DEFI = { type: 'defi', strategies: buildStrategiesServies(true) };

function zoneTentative(element: FpChallenge): HTMLTextAreaElement {
  const champ = element.shadowRoot?.querySelector<HTMLTextAreaElement>('[data-testid="tentative"]');
  if (champ === null || champ === undefined) {
    throw new Error('zone de tentative absente');
  }
  return champ;
}

function tenter(element: FpChallenge, frappe: string): void {
  const champ = zoneTentative(element);
  champ.value = frappe;
  champ.dispatchEvent(new Event('input'));
  element.shadowRoot?.querySelector<HTMLButtonElement>('[data-testid="envoyer"]')?.click();
}

function strategiesDe(element: FpChallenge): Element[] {
  return [...(element.shadowRoot?.querySelectorAll('[data-testid="strategie"]') ?? [])];
}

function marquesDe(element: FpChallenge): string[] {
  return strategiesDe(element)
    .filter((ligne) => ligne.querySelector('[data-testid="marque"]') !== null)
    .map((ligne) => ligne.getAttribute('data-strategie') ?? '');
}

function tentativesEmises(element: FpChallenge): DetailChallenge[] {
  const emises: DetailChallenge[] = [];
  element.addEventListener('fp-challenge-submit', (evenement) => {
    emises.push((evenement as CustomEvent).detail as DetailChallenge);
  });
  return emises;
}

describe('FpChallenge', () => {
  let hote: FpChallenge;

  beforeAll(() => {
    if (!customElements.get('fp-challenge')) {
      customElements.define('fp-challenge', FpChallenge);
    }
  });

  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(INSTANT_INITIAL));
    hote = document.createElement('fp-challenge') as FpChallenge;
    hote.probleme = PROBLEME;
    document.body.appendChild(hote);
  });

  afterEach(() => {
    hote.remove();
    jasmine.clock().uninstall();
  });

  it('pose le probleme sans methode ni strategie avant toute tentative', () => {
    expect(hote.shadowRoot?.querySelector('legend')?.textContent?.trim()).toBe(PROBLEME.enonce);
    expect(hote.shadowRoot?.querySelector('[data-testid="consigne"]')?.textContent?.trim()).toBe(
      'Cherchez par vous-même : aucune méthode ne vous a encore été donnée',
    );
    for (const rendu of RENDUS) {
      hote.setAttribute('render', rendu);
      expect(strategiesDe(hote).length).withContext(`rendu ${rendu}`).toBe(0);
      expect(hote.shadowRoot?.innerHTML)
        .withContext(`rendu ${rendu}`)
        .not.toContain(LIBELLE_FAUSSE);
    }
  });

  it('ne prend pas une tentative vide pour un echec productif', () => {
    const emises = tentativesEmises(hote);
    tenter(hote, '   \n  ');
    expect(emises).toEqual([]);
    expect(hote.shadowRoot?.querySelector('[data-testid="retour"]')?.textContent?.trim()).toBe(
      'Écrivez votre tentative, même imparfaite : c’est elle qui compte',
    );
  });

  it('emet la tentative et sa duree au moment de la soumission, une seule fois', () => {
    const emises = tentativesEmises(hote);
    jasmine.clock().tick(90000);
    tenter(hote, TENTATIVE);
    tenter(hote, 'seconde tentative apres coup');

    expect(emises).toEqual([{ problemeId: PROBLEME.id, tentative: TENTATIVE, dureeMs: 90000 }]);
    expect(zoneTentative(hote).disabled).toBeTrue();
  });

  it('affiche les strategies servies apres l envoi, sans piste fausse avant la revelation', () => {
    tenter(hote, TENTATIVE);
    hote.strategies = buildStrategiesServies();

    expect(strategiesDe(hote).length).toBe(2);
    expect(marquesDe(hote)).toEqual([]);
    expect(hote.shadowRoot?.querySelector('[data-testid="attente-revelation"]')?.textContent).toBe(
      'Les pistes fausses seront signalées à la révélation',
    );
  });

  it('signale la piste fausse quand le serveur la sert apres la revelation', () => {
    tenter(hote, TENTATIVE);
    hote.strategies = buildStrategiesServies(true);
    hote.revele = true;

    expect(marquesDe(hote)).toEqual(['diviser-cent']);
    expect(hote.shadowRoot?.querySelector('[data-testid="marque"]')?.textContent?.trim()).toBe(
      'Piste fausse',
    );
  });

  it('se tient pour soumise quand les strategies arrivent apres un rechargement', () => {
    hote.brouillon = { tentative: TENTATIVE };
    hote.strategies = buildStrategiesServies();

    expect(zoneTentative(hote).value).toBe(TENTATIVE);
    expect(zoneTentative(hote).disabled).toBeTrue();
  });

  it('memorise la tentative en brouillon a chaque frappe', () => {
    const brouillons: unknown[] = [];
    hote.addEventListener('fp-brouillon', (evenement) =>
      brouillons.push((evenement as CustomEvent).detail),
    );
    const champ = zoneTentative(hote);
    champ.value = 'debut';
    champ.dispatchEvent(new Event('input'));
    expect(brouillons).toEqual([{ id: PROBLEME.id, valeur: { tentative: 'debut' } }]);
  });

  it('ne projette les pistes, fausse comprise, qu une fois la revelation pilotee', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.setAttribute('render', 'stage');
    hote.corrige = CORRIGE_DU_DEFI;

    expect(strategiesDe(hote).length).toBe(0);

    hote.revele = true;

    expect(marquesDe(hote)).toEqual(['diviser-cent']);
  });

  it('montre au pupitre les strategies de reference et leur piste fausse', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.setAttribute('render', 'board');
    hote.corrige = CORRIGE_DU_DEFI;

    expect(marquesDe(hote)).toEqual(['diviser-cent']);
  });

  it('ne montre jamais les strategies de reference a un poste etudiant', () => {
    hote.setAttribute('render', 'board');
    hote.corrige = CORRIGE_DU_DEFI;
    expect(strategiesDe(hote).length).toBe(0);
  });

  it('ignore toute strategie posee dans l enonce public', () => {
    hote.probleme = { ...buildChallengeProbleme({ id: 'D-DEFI-08' }), strategies: [] };
    expect(JSON.stringify(hote.probleme)).not.toContain(LIBELLE_FAUSSE);
  });

  it('echappe la tentative et les libelles de strategie a l affichage', () => {
    tenter(hote, CHARGE_XSS);
    hote.strategies = [{ id: 'x', libelle: CHARGE_XSS }];
    const rendu = hote.shadowRoot?.innerHTML ?? '';
    expect(rendu).not.toContain('<img src=x');
    expect(hote.shadowRoot?.querySelector('img')).toBeNull();
    expect(zoneTentative(hote).value).toBe(CHARGE_XSS);
    expect(strategiesDe(hote)[0].textContent?.trim()).toBe(CHARGE_XSS);
  });

  it('rappelle les concepts et la modalite en mode tableau', () => {
    hote.setAttribute('render', 'board');
    expect(hote.shadowRoot?.querySelector('[data-testid="concepts"]')?.textContent?.trim()).toBe(
      'capitalisation',
    );
    expect(hote.shadowRoot?.querySelector('[data-testid="modalite"]')?.textContent?.trim()).toBe(
      'En binôme',
    );
  });

  it('couvre par une regle de la feuille chaque classe fp emise', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.corrige = CORRIGE_DU_DEFI;
    tenter(hote, TENTATIVE);
    hote.strategies = buildStrategiesServies();
    hote.revele = true;
    expect(classesOrphelines(hote, 'challenge')).toEqual([]);
  });
});
