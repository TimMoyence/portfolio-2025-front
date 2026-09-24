import { ROLES_DE_MONTAGE } from '../../../testing/briques-montees';
import { CHARGE_XSS } from '../../../testing/charge-xss';
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
    for (const role of ROLES_DE_MONTAGE) {
      hote.setAttribute('data-cours-role', role);
      expect(hote.shadowRoot?.querySelector('legend')?.textContent?.trim())
        .withContext(`role ${role}`)
        .toBe(PROBLEME.enonce);
      expect(hote.shadowRoot?.querySelector('.fp-challenge__invite')?.textContent?.trim())
        .withContext(`role ${role}`)
        .toBe(PROBLEME.invite);
      expect(strategiesDe(hote).length).withContext(`role ${role}`).toBe(0);
      expect(hote.shadowRoot?.innerHTML).withContext(`role ${role}`).not.toContain(LIBELLE_FAUSSE);
    }
  });

  it('pose la meme carte pour les deux roles, seule la zone de reponse est reservee a l etudiant', () => {
    const carte = (): string =>
      hote.shadowRoot?.querySelector('fieldset')?.getAttribute('class') ?? '';
    const etudiant = carte();
    expect(zoneTentative(hote).getAttribute('aria-label')).toBeTruthy();
    expect(hote.shadowRoot?.querySelector('label.fp-challenge__invite')).not.toBeNull();

    hote.setAttribute('data-cours-role', 'presentateur');

    expect(carte()).toBe(etudiant);
    expect(hote.shadowRoot?.querySelector('p.fp-challenge__invite')).not.toBeNull();
    expect(hote.shadowRoot?.querySelector('textarea')).toBeNull();
    expect(hote.shadowRoot?.querySelector('[data-testid="envoyer"]')).toBeNull();
    expect(hote.shadowRoot?.querySelector('[data-testid="retour"]')).toBeNull();
  });

  it('R4 · rappelle le dossier chiffré pour chaque rôle, sans en échapper le contenu', () => {
    hote.probleme = buildChallengeProbleme({
      id: 'D-DEFI-RAPPEL',
      rappel: [
        { libelle: 'Marge brute', valeur: '289 800 € → 291 000 €' },
        { libelle: CHARGE_XSS, valeur: '34 % → 45,5 %' },
      ],
    });

    for (const role of ROLES_DE_MONTAGE) {
      hote.setAttribute('data-cours-role', role);
      const lignes = [
        ...(hote.shadowRoot?.querySelectorAll(
          '[data-testid="rappel"] dt, [data-testid="rappel"] dd',
        ) ?? []),
      ].map((ligne) => ligne.textContent?.trim());

      expect(lignes)
        .withContext(`role ${role}`)
        .toEqual(['Marge brute', '289 800 € → 291 000 €', CHARGE_XSS, '34 % → 45,5 %']);
      expect(hote.shadowRoot?.querySelector('img')).withContext(`role ${role}`).toBeNull();
    }
  });

  it('ne prend pas une tentative vide pour un echec productif', () => {
    const emises = tentativesEmises(hote);
    tenter(hote, '   \n  ');
    expect(emises).toEqual([]);
    expect(hote.shadowRoot?.querySelector('[data-testid="retour"]')?.textContent?.trim()).toBe(
      'Écrivez votre réponse avant de l’envoyer',
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

  for (const role of ROLES_DE_MONTAGE) {
    it(`au role ${role}, ne montre les pistes de reference, fausse comprise, qu une fois la revelation pilotee`, () => {
      hote.setAttribute('data-cours-role', role);
      hote.corrige = CORRIGE_DU_DEFI;

      expect(strategiesDe(hote).length).toBe(0);

      hote.revele = true;

      expect(marquesDe(hote)).toEqual(['diviser-cent']);
      expect(
        hote.shadowRoot?.querySelector('[data-testid="revelation"]')?.hasAttribute('open'),
      ).toBeTrue();
    });
  }

  it('SEC-4 · ferme la zone de tentative une fois le defi revele, meme sans envoi', () => {
    hote.revele = true;

    expect(zoneTentative(hote).disabled).toBeTrue();
    expect(
      hote.shadowRoot?.querySelector<HTMLButtonElement>('[data-testid="envoyer"]')?.disabled,
    ).toBeTrue();
  });

  it('ne montre pas au presentateur les strategies servies avant la revelation', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.strategies = buildStrategiesServies();

    expect(strategiesDe(hote).length).toBe(0);

    hote.revele = true;

    expect(strategiesDe(hote).length).toBe(2);
  });

  it('a la revelation, prefere les strategies de reference aux strategies servies', () => {
    tenter(hote, TENTATIVE);
    hote.strategies = [{ id: 'x', libelle: 'piste servie' }];
    hote.corrige = CORRIGE_DU_DEFI;

    expect(strategiesDe(hote).map((ligne) => ligne.getAttribute('data-strategie'))).toEqual(['x']);

    hote.revele = true;

    expect(strategiesDe(hote).map((ligne) => ligne.getAttribute('data-strategie'))).toEqual([
      'diviser-cent',
      'ajouter-sept',
    ]);
  });

  it('ignore un corrige qui n est pas celui d un defi', () => {
    hote.corrige = { type: 'cible', cible: 'x' };
    hote.revele = true;
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

  it('garde les metadonnees projetees sans les afficher en badge, pour aucun role', () => {
    for (const role of ROLES_DE_MONTAGE) {
      hote.setAttribute('data-cours-role', role);
      expect(hote.probleme?.metadonnees.modalite).withContext(`role ${role}`).toBe('binome');
      expect(hote.shadowRoot?.querySelector('[data-testid="modalite"]'))
        .withContext(`role ${role}`)
        .toBeNull();
      expect(hote.shadowRoot?.querySelector('[data-testid="concepts"]'))
        .withContext(`role ${role}`)
        .toBeNull();
    }
  });

  it('couvre par une regle de la feuille chaque classe fp emise', () => {
    tenter(hote, TENTATIVE);
    hote.strategies = buildStrategiesServies();
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.corrige = CORRIGE_DU_DEFI;
    hote.revele = true;
    expect(classesOrphelines(hote, 'challenge')).toEqual([]);
  });
});
