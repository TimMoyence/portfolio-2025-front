import { buildChallengeProbleme } from '../../../testing/factories/cours.factory';
import { feuilleDe } from '../design/blocks';
import { base, stage, tokens } from '../design/styles';
import { FpChallenge } from './FpChallenge';

interface DetailChallenge {
  problemeId: string;
  tentative: string;
  dureeMs: number;
}

const PROBLEME = buildChallengeProbleme();
const LIBELLE_FAUSSE = 'Diviser 100 par 7 et arrondir';
const LIBELLE_JUSTE = PROBLEME.strategies[1].libelle;
const TENTATIVE = 'A vue de nez une dizaine d annees, j ai ajoute 7 % chaque annee de tete';
const CHARGE_XSS = '<img src=x onerror="alert(1)">';
const RENDUS = ['hand', 'stage', 'board'];
const INSTANT_INITIAL = '2026-09-13T10:00:00.000Z';

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

function boutonReveler(element: FpChallenge): HTMLButtonElement | null {
  return element.shadowRoot?.querySelector<HTMLButtonElement>('[data-testid="reveler"]') ?? null;
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

  it('pose le probleme sans methode ni formule avant toute tentative', () => {
    expect(hote.shadowRoot?.querySelector('legend')?.textContent?.trim()).toBe(PROBLEME.enonce);
    expect(hote.shadowRoot?.querySelector('[data-testid="consigne"]')?.textContent?.trim()).toBe(
      'Cherchez par vous-même : aucune méthode ne vous a encore été donnée',
    );
    expect(zoneTentative(hote).value).toBe('');
  });

  it('ne met aucune strategie dans le dom avant la revelation', () => {
    for (const rendu of RENDUS) {
      hote.setAttribute('render', rendu);
      expect(strategiesDe(hote).length).withContext(`rendu ${rendu}`).toBe(0);
      expect(hote.shadowRoot?.innerHTML).withContext(`rendu ${rendu}`).not.toContain(LIBELLE_JUSTE);
      expect(hote.shadowRoot?.innerHTML)
        .withContext(`rendu ${rendu}`)
        .not.toContain(LIBELLE_FAUSSE);
    }
  });

  it('refuse de reveler les strategies tant qu aucune tentative n a ete soumise', () => {
    hote.revelee = true;
    expect(hote.revelee).toBe(false);
    expect(strategiesDe(hote).length).toBe(0);
    expect(hote.shadowRoot?.innerHTML).not.toContain(LIBELLE_JUSTE);
  });

  it('garde le bouton de revelation ferme tant que la tentative manque', () => {
    expect(boutonReveler(hote)?.disabled).toBe(true);
    boutonReveler(hote)?.click();
    expect(hote.revelee).toBe(false);
    tenter(hote, TENTATIVE);
    expect(boutonReveler(hote)?.disabled).toBe(false);
  });

  it('ne prend pas une tentative vide pour un echec productif', () => {
    const emises = tentativesEmises(hote);
    tenter(hote, '   \n  ');
    expect(emises).toEqual([]);
    expect(hote.tentativeSoumise).toBe(false);
    hote.revelee = true;
    expect(hote.revelee).toBe(false);
    expect(strategiesDe(hote).length).toBe(0);
    expect(hote.shadowRoot?.querySelector('[data-testid="retour"]')?.textContent?.trim()).toBe(
      'Écrivez votre tentative, même imparfaite : c’est elle qui compte',
    );
  });

  it('revele les strategies une fois la tentative soumise', () => {
    tenter(hote, TENTATIVE);
    hote.revelee = true;
    expect(hote.revelee).toBe(true);
    expect(strategiesDe(hote).length).toBe(PROBLEME.strategies.length);
    expect(hote.shadowRoot?.innerHTML).toContain(LIBELLE_FAUSSE);
  });

  it('emet la tentative et sa duree au moment de la soumission', () => {
    const emises = tentativesEmises(hote);
    jasmine.clock().tick(90000);
    tenter(hote, TENTATIVE);
    expect(emises.length).toBe(1);
    expect(emises[0].problemeId).toBe(PROBLEME.id);
    expect(emises[0].tentative).toBe(TENTATIVE);
    expect(emises[0].dureeMs).toBe(90000);
  });

  it('n accepte qu une tentative et verrouille la saisie ensuite', () => {
    const emises = tentativesEmises(hote);
    tenter(hote, TENTATIVE);
    tenter(hote, 'seconde tentative apres coup');
    expect(emises.length).toBe(1);
    expect(zoneTentative(hote).disabled).toBe(true);
  });

  it('ne marque aucune strategie fausse sur le poste etudiant apres revelation', () => {
    tenter(hote, TENTATIVE);
    hote.revelee = true;
    expect(strategiesDe(hote).length).toBe(PROBLEME.strategies.length);
    expect(marquesDe(hote)).toEqual([]);
    expect(JSON.stringify(hote.probleme)).not.toContain('fausse');
    expect(hote.shadowRoot?.innerHTML).not.toContain('Piste fausse');
  });

  it('marque les strategies fausses sur le poste presentateur apres revelation', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.probleme = buildChallengeProbleme({ id: 'D-DEFI-06' });
    tenter(hote, TENTATIVE);
    hote.revelee = true;
    expect(marquesDe(hote)).toEqual(['a', 'c']);
    expect(hote.shadowRoot?.querySelector('[data-testid="marque"]')?.textContent?.trim()).toBe(
      'Piste fausse',
    );
  });

  it('ne marque rien sur le poste presentateur avant la revelation', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.probleme = buildChallengeProbleme({ id: 'D-DEFI-07' });
    tenter(hote, TENTATIVE);
    expect(marquesDe(hote)).toEqual([]);
    expect(hote.shadowRoot?.innerHTML).not.toContain('Piste fausse');
    expect(hote.shadowRoot?.innerHTML).not.toContain(LIBELLE_FAUSSE);
  });

  it('efface une donnee de correction nichee dans les metadonnees', () => {
    const piege = buildChallengeProbleme({ id: 'D-DEFI-08' });
    const metadonnees = { ...piege.metadonnees, bonneReponse: 'b' };
    hote.probleme = { ...piege, metadonnees };
    expect(JSON.stringify(hote.probleme)).not.toContain('bonneReponse');
  });

  it('echappe la tentative et les libelles de strategie a l affichage', () => {
    hote.probleme = buildChallengeProbleme({
      id: 'D-DEFI-09',
      strategies: [{ id: 'a', libelle: CHARGE_XSS, fausse: true }],
    });
    tenter(hote, CHARGE_XSS);
    hote.revelee = true;
    const rendu = hote.shadowRoot?.innerHTML ?? '';
    expect(rendu).not.toContain('<img src=x');
    expect(rendu).toContain('&lt;img');
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
      'binome',
    );
  });

  it('couvre par une regle de la feuille chaque classe fp emise', () => {
    const feuille = [tokens, base, feuilleDe('challenge'), stage].join('\n');
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.probleme = buildChallengeProbleme({ id: 'D-DEFI-10' });
    tenter(hote, TENTATIVE);
    hote.revelee = true;
    const emises = new Set<string>();
    for (const rendu of RENDUS) {
      hote.setAttribute('render', rendu);
      hote.shadowRoot
        ?.querySelectorAll('[class]')
        .forEach((noeud) => noeud.classList.forEach((classe) => emises.add(classe)));
    }
    expect(emises.size).toBeGreaterThanOrEqual(10);
    expect(
      [...emises].filter((classe) => !new RegExp(`\\.${classe}(?![\\w-])`).test(feuille)),
    ).toEqual([]);
  });
});
