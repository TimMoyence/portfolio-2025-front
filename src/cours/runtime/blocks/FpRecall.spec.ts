import { buildRecallQuestion } from '../../../testing/factories/cours.factory';
import { feuilleDe } from '../design/blocks';
import { base, stage, tokens } from '../design/styles';
import { shuffleWithSeed } from '../core/seed';
import { FpRecall } from './FpRecall';

interface DetailRecall {
  questionId: string;
  valeur: string;
  rappel: string;
  dureeMs: number;
}

const QUESTION = buildRecallQuestion();
const GRAINE = 4242;
const DELAI_DEFAUT_MS = 8000;
const INSTANT_INITIAL = '2026-09-12T09:00:00.000Z';
const LIBELLE_PREMIERE = 'On multiplie par (1 + i) puissance n';
const RAPPEL_ETUDIANT = 'On applique le taux chaque annee sur le capital deja augmente';
const CHARGE_XSS = '<img src=x onerror="alert(1)">';
const RENDUS = ['hand', 'stage', 'board'];

function champRappel(element: FpRecall): HTMLTextAreaElement {
  const champ = element.shadowRoot?.querySelector<HTMLTextAreaElement>('[data-testid="rappel"]');
  if (champ === null || champ === undefined) {
    throw new Error('champ de rappel absent');
  }
  return champ;
}

function saisirRappel(element: FpRecall, frappe: string): void {
  const champ = champRappel(element);
  champ.value = frappe;
  champ.dispatchEvent(new Event('input'));
}

function optionsDe(element: FpRecall): HTMLButtonElement[] {
  return [
    ...(element.shadowRoot?.querySelectorAll<HTMLButtonElement>('[data-testid="option"]') ?? []),
  ];
}

function ordreAffiche(element: FpRecall): string[] {
  return optionsDe(element).map((option) => option.getAttribute('data-option') ?? '');
}

function annonceDe(element: FpRecall): string {
  return (
    element.shadowRoot?.querySelector('[data-testid="compte-a-rebours"]')?.textContent?.trim() ?? ''
  );
}

function texteDe(element: FpRecall, identifiant: string): string {
  return (
    element.shadowRoot?.querySelector(`[data-testid="${identifiant}"]`)?.textContent?.trim() ?? ''
  );
}

function detailsEmis(element: FpRecall): DetailRecall[] {
  const details: DetailRecall[] = [];
  element.addEventListener('fp-recall-submit', (evenement) => {
    details.push((evenement as CustomEvent).detail as DetailRecall);
  });
  return details;
}

describe('FpRecall', () => {
  let hote: FpRecall;

  beforeAll(() => {
    if (!customElements.get('fp-recall')) {
      customElements.define('fp-recall', FpRecall);
    }
  });

  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(INSTANT_INITIAL));
    hote = document.createElement('fp-recall') as FpRecall;
    hote.question = QUESTION;
    hote.setAttribute('seed', String(GRAINE));
    document.body.appendChild(hote);
  });

  afterEach(() => {
    hote.remove();
    jasmine.clock().uninstall();
  });

  it('presente l enonce et le champ de rappel libre des le depart', () => {
    expect(hote.shadowRoot?.querySelector('legend')?.textContent?.trim()).toBe(QUESTION.enonce);
    expect(champRappel(hote).value).toBe('');
  });

  const INSTANTS_MUETS = [0, 1000, 4000, 7999];

  for (const instant of INSTANTS_MUETS) {
    it(`ne met aucune option dans le dom a ${instant} ms de rappel`, () => {
      jasmine.clock().tick(instant);
      expect(optionsDe(hote).length).toBe(0);
      expect(hote.shadowRoot?.innerHTML).not.toContain(LIBELLE_PREMIERE);
      for (const rendu of RENDUS) {
        hote.setAttribute('render', rendu);
        expect(optionsDe(hote).length).withContext(`rendu ${rendu}`).toBe(0);
        expect(hote.shadowRoot?.innerHTML)
          .withContext(`rendu ${rendu}`)
          .not.toContain(LIBELLE_PREMIERE);
      }
    });
  }

  it('ne rend aucune option au tout premier affichage', () => {
    const neuve = document.createElement('fp-recall') as FpRecall;
    neuve.question = QUESTION;
    document.body.appendChild(neuve);
    expect(neuve.shadowRoot?.querySelectorAll('[data-testid="option"]').length).toBe(0);
    expect(neuve.shadowRoot?.innerHTML).not.toContain(LIBELLE_PREMIERE);
    expect(annonceDe(neuve)).toBe('Options disponibles dans 8 s');
    neuve.remove();
  });

  it('fait apparaitre les options a la fin des huit secondes', () => {
    expect(hote.delaiMs).toBe(DELAI_DEFAUT_MS);
    jasmine.clock().tick(DELAI_DEFAUT_MS);
    expect(optionsDe(hote).length).toBe(QUESTION.options.length);
    expect(annonceDe(hote)).toBe('Options disponibles');
  });

  it('respecte un delai configure a la place des huit secondes', () => {
    hote.delaiMs = 3000;
    jasmine.clock().tick(2999);
    expect(optionsDe(hote).length).toBe(0);
    jasmine.clock().tick(1);
    expect(optionsDe(hote).length).toBe(QUESTION.options.length);
  });

  it('annonce le compte a rebours dans une region live', () => {
    const compte = hote.shadowRoot?.querySelector('[data-testid="compte-a-rebours"]');
    expect(compte?.getAttribute('aria-live')).toBe('polite');
  });

  const PALIERS: ReadonlyArray<{ ecoule: number; annonce: string }> = [
    { ecoule: 0, annonce: 'Options disponibles dans 8 s' },
    { ecoule: 1000, annonce: 'Options disponibles dans 7 s' },
    { ecoule: 5000, annonce: 'Options disponibles dans 3 s' },
    { ecoule: 7000, annonce: 'Options disponibles dans 1 s' },
  ];

  for (const palier of PALIERS) {
    it(`annonce le temps restant apres ${palier.ecoule} ms`, () => {
      jasmine.clock().tick(palier.ecoule);
      expect(annonceDe(hote)).toBe(palier.annonce);
    });
  }

  it('ne remet pas le compte a rebours a zero quand la brique part puis revient', () => {
    jasmine.clock().tick(5000);
    hote.remove();
    document.body.appendChild(hote);
    expect(annonceDe(hote)).toBe('Options disponibles dans 3 s');
    jasmine.clock().tick(3000);
    expect(optionsDe(hote).length).toBe(QUESTION.options.length);
  });

  it('ne remplace pas le champ de rappel a chaque seconde ecoulee', () => {
    const champ = champRappel(hote);
    saisirRappel(hote, RAPPEL_ETUDIANT);
    jasmine.clock().tick(3000);
    expect(champRappel(hote)).toBe(champ);
    expect(champRappel(hote).value).toBe(RAPPEL_ETUDIANT);
  });

  it('emet le rappel libre saisi avec la reponse choisie', () => {
    const details = detailsEmis(hote);
    saisirRappel(hote, RAPPEL_ETUDIANT);
    jasmine.clock().tick(DELAI_DEFAUT_MS);
    jasmine.clock().tick(400);
    optionsDe(hote)
      .find((option) => option.getAttribute('data-option') === 'b')
      ?.click();
    expect(details.length).toBe(1);
    expect(details[0].rappel).toBe(RAPPEL_ETUDIANT);
    expect(details[0].valeur).toBe('b');
    expect(details[0].questionId).toBe(QUESTION.id);
    expect(details[0].dureeMs).toBe(DELAI_DEFAUT_MS + 400);
  });

  it('n emet qu une seule reponse par question', () => {
    const details = detailsEmis(hote);
    jasmine.clock().tick(DELAI_DEFAUT_MS);
    optionsDe(hote)[0].click();
    optionsDe(hote)[1]?.click();
    expect(details.length).toBe(1);
    expect(optionsDe(hote).every((option) => option.disabled)).toBe(true);
  });

  it('derive l ordre des options de la graine et non de l horloge', () => {
    jasmine.clock().tick(DELAI_DEFAUT_MS);
    const attendu = shuffleWithSeed([...QUESTION.options], GRAINE).map((option) => option.id);
    expect(ordreAffiche(hote)).toEqual(attendu);
    expect(ordreAffiche(hote)).not.toEqual(QUESTION.options.map((option) => option.id));
  });

  it('efface la misconception pour le poste etudiant', () => {
    expect(hote.question?.options.every((option) => !('misconception' in option))).toBe(true);
    expect(JSON.stringify(hote.question?.options)).not.toContain('interet-simple');
  });

  it('conserve la misconception pour le poste presentateur', () => {
    hote.setAttribute('role', 'presentateur');
    hote.question = buildRecallQuestion({ id: 'Q-RAPPEL-05' });
    expect(hote.question?.options[1]).toEqual(
      jasmine.objectContaining({ misconception: 'interet-simple' }),
    );
  });

  it('efface une donnee de correction nichee dans les metadonnees', () => {
    const piege = buildRecallQuestion({ id: 'Q-RAPPEL-06' });
    const metadonnees = { ...piege.metadonnees, bonneReponse: 'a' };
    hote.question = { ...piege, metadonnees };
    expect(JSON.stringify(hote.question)).not.toContain('bonneReponse');
  });

  it('echappe le html injecte dans l enonce et dans les libelles', () => {
    hote.question = buildRecallQuestion({
      id: 'Q-RAPPEL-07',
      enonce: CHARGE_XSS,
      options: [{ id: 'a', libelle: CHARGE_XSS, misconception: null }],
    });
    jasmine.clock().tick(DELAI_DEFAUT_MS);
    expect(hote.shadowRoot?.querySelector('img')).toBeNull();
    expect(hote.shadowRoot?.querySelector('legend')?.textContent?.trim()).toBe(CHARGE_XSS);
    expect(texteDe(hote, 'option')).toBe(CHARGE_XSS);
  });

  it('echappe le rappel libre reaffiche apres l apparition des options', () => {
    saisirRappel(hote, CHARGE_XSS);
    jasmine.clock().tick(DELAI_DEFAUT_MS);
    const rendu = hote.shadowRoot?.innerHTML ?? '';
    expect(rendu).not.toContain('<img src=x');
    expect(rendu).toContain('&lt;img');
    expect(hote.shadowRoot?.querySelector('img')).toBeNull();
    expect(champRappel(hote).value).toBe(CHARGE_XSS);
  });

  it('recapitule les concepts la modalite et la duree en mode tableau', () => {
    hote.setAttribute('render', 'board');
    expect(texteDe(hote, 'concepts')).toBe('capitalisation');
    expect(texteDe(hote, 'modalite')).toBe('solo');
    expect(texteDe(hote, 'duree')).toBe('4 min');
  });

  it('couvre par une regle de la feuille chaque classe fp emise', () => {
    const feuille = [tokens, base, feuilleDe('recall'), stage].join('\n');
    jasmine.clock().tick(DELAI_DEFAUT_MS);
    const emises = new Set<string>();
    for (const rendu of RENDUS) {
      hote.setAttribute('render', rendu);
      for (const noeud of hote.shadowRoot?.querySelectorAll('[class]') ?? []) {
        noeud.classList.forEach((classe) => emises.add(classe));
      }
    }
    expect(emises.size).toBeGreaterThanOrEqual(10);
    const orphelines = [...emises].filter(
      (classe) => !new RegExp(`\\.${classe}(?![\\w-])`).test(feuille),
    );
    expect(orphelines).toEqual([]);
  });
});
