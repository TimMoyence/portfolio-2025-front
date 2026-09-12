import { buildNumericQuestion } from '../../../testing/factories/cours.factory';
import { feuilleDe } from '../design/blocks';
import { base, stage, tokens } from '../design/styles';
import { FpNumeric, type NumericQuestionPublique } from './FpNumeric';

type ClesIdentiques<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

const SURFACE_PUBLIQUE_EXACTE: ClesIdentiques<
  keyof NumericQuestionPublique,
  'id' | 'enonce' | 'unite' | 'metadonnees'
> = true;

interface DetailNumeric {
  questionId: string;
  valeur: number;
  dureeMs: number;
}

const QUESTION_NOTEE = buildNumericQuestion();
const CLES_PUBLIQUES = ['enonce', 'id', 'metadonnees', 'unite'];
const VALEUR_ATTENDUE = '1480.24';
const SAISIE_VALIDE = '12,5';
const MESSAGE_REFUS = 'Saisissez un nombre — la virgule décimale est acceptée';
const INSTANT_INITIAL = '2026-09-12T08:00:00.000Z';
const DELAI_SAISIE_MS = 300;
const RENDUS = ['hand', 'stage', 'board'];
const AUTRE_QUESTION = 'Q-TAUX-02';

function champDe(element: FpNumeric): HTMLInputElement | null {
  return element.shadowRoot?.querySelector<HTMLInputElement>('[data-testid="champ"]') ?? null;
}

function saisir(element: FpNumeric, frappe: string): void {
  const champ = champDe(element);
  if (champ !== null) {
    champ.value = frappe;
  }
  element.shadowRoot?.querySelector<HTMLButtonElement>('[data-testid="valider"]')?.click();
}

function clesDe(element: FpNumeric): string[] {
  return Object.keys(element.question ?? {}).sort((gauche, droite) => gauche.localeCompare(droite));
}

function retourDe(element: FpNumeric): string {
  return element.shadowRoot?.querySelector('[data-testid="retour"]')?.textContent?.trim() ?? '';
}

function detailsEmis(element: FpNumeric): DetailNumeric[] {
  const details: DetailNumeric[] = [];
  element.addEventListener('fp-numeric-submit', (evenement) => {
    details.push((evenement as CustomEvent).detail as DetailNumeric);
  });
  return details;
}

function dureeEmise(lectureMs: number, rafraichissements: number): number | undefined {
  jasmine.clock().install();
  try {
    jasmine.clock().mockDate(new Date(INSTANT_INITIAL));
    const element = document.createElement('fp-numeric') as FpNumeric;
    element.question = QUESTION_NOTEE;
    document.body.appendChild(element);
    const details = detailsEmis(element);
    jasmine.clock().tick(lectureMs);
    for (let rang = 0; rang < rafraichissements; rang += 1) {
      element.setAttribute('etat', `rendu-${rang}`);
    }
    jasmine.clock().tick(DELAI_SAISIE_MS);
    saisir(element, '12');
    element.remove();
    return details[0]?.dureeMs;
  } finally {
    jasmine.clock().uninstall();
  }
}

function classesEmises(element: FpNumeric): string[] {
  const classes = new Set<string>();
  for (const rendu of RENDUS) {
    element.setAttribute('render', rendu);
    for (const noeud of element.shadowRoot?.querySelectorAll('[class]') ?? []) {
      noeud.classList.forEach((classe) => classes.add(classe));
    }
  }
  return [...classes];
}

describe('FpNumeric', () => {
  let hote: FpNumeric;

  beforeAll(() => {
    if (!customElements.get('fp-numeric')) {
      customElements.define('fp-numeric', FpNumeric);
    }
  });

  beforeEach(() => {
    hote = document.createElement('fp-numeric') as FpNumeric;
    hote.question = QUESTION_NOTEE;
    document.body.appendChild(hote);
  });

  afterEach(() => {
    hote.remove();
  });

  it('affiche l enonce de la question', () => {
    const legende = hote.shadowRoot?.querySelector('legend');
    expect(legende?.textContent?.trim()).toBe(QUESTION_NOTEE.enonce);
  });

  it('ouvre le clavier decimal sans rejeter la virgule', () => {
    const champ = champDe(hote);
    expect(champ?.getAttribute('inputmode')).toBe('decimal');
    expect(champ?.getAttribute('type')).toBe('text');
  });

  it('rend l unite hors du champ et la rattache a la saisie', () => {
    const unite = hote.shadowRoot?.querySelector('[data-testid="unite"]');
    expect(unite?.tagName).toBe('SPAN');
    expect(unite?.textContent?.trim()).toBe('€');
    expect(champDe(hote)?.value).toBe('');
    expect(champDe(hote)?.getAttribute('aria-describedby')).toBe(unite?.id ?? '');
  });

  it('n annonce aucune unite quand la question n en porte pas', () => {
    hote.question = buildNumericQuestion({ id: AUTRE_QUESTION, unite: null });
    expect(hote.shadowRoot?.querySelector('[data-testid="unite"]')).toBeNull();
    expect(champDe(hote)?.getAttribute('aria-describedby')).toBeNull();
  });

  const SAISIES_VALIDES: ReadonlyArray<{ nom: string; frappe: string; valeur: number }> = [
    { nom: 'le point decimal', frappe: '12.5', valeur: 12.5 },
    { nom: 'la virgule decimale francaise', frappe: SAISIE_VALIDE, valeur: 12.5 },
    { nom: 'un entier', frappe: '1480', valeur: 1480 },
    { nom: 'un espace de milliers ordinaire', frappe: '1 480,24', valeur: 1480.24 },
    { nom: 'une espace fine insecable de milliers', frappe: '1 480,24', valeur: 1480.24 },
    { nom: 'une espace insecable de milliers', frappe: '1 480,24', valeur: 1480.24 },
    { nom: 'un montant negatif', frappe: '-1 480,24', valeur: -1480.24 },
  ];

  for (const cas of SAISIES_VALIDES) {
    it(`normalise ${cas.nom}`, () => {
      const details = detailsEmis(hote);
      saisir(hote, cas.frappe);
      expect(details.length).toBe(1);
      expect(details[0].valeur).toBe(cas.valeur);
      expect(details[0].questionId).toBe(QUESTION_NOTEE.id);
    });
  }

  const SAISIES_REFUSEES = ['douze', '', '12,5,6', '1 480 euros'];

  for (const frappe of SAISIES_REFUSEES) {
    it(`n emet rien pour la saisie non numerique « ${frappe} »`, () => {
      const details = detailsEmis(hote);
      saisir(hote, frappe);
      expect(details).toEqual([]);
      expect(retourDe(hote)).toBe(MESSAGE_REFUS);
    });
  }

  it('conserve la saisie refusee dans le champ', () => {
    saisir(hote, 'douze');
    expect(champDe(hote)?.value).toBe('douze');
    expect(champDe(hote)?.disabled).toBe(false);
  });

  it('verrouille le champ apres une reponse acceptee', () => {
    saisir(hote, SAISIE_VALIDE);
    expect(champDe(hote)?.disabled).toBe(true);
    expect(retourDe(hote)).toBe('Réponse enregistrée');
  });

  it('n emet qu une seule reponse par question', () => {
    const details = detailsEmis(hote);
    saisir(hote, SAISIE_VALIDE);
    saisir(hote, '99');
    expect(details.length).toBe(1);
  });

  it('deverrouille le champ quand une nouvelle question arrive', () => {
    saisir(hote, SAISIE_VALIDE);
    hote.question = buildNumericQuestion({ id: AUTRE_QUESTION });
    expect(champDe(hote)?.disabled).toBe(false);
    expect(champDe(hote)?.value).toBe('');
    expect(retourDe(hote)).toBe('');
  });

  const CAS_DUREE: ReadonlyArray<{
    nom: string;
    lecture: number;
    rendus: number;
    attendu: number;
  }> = [
    { nom: 'une reponse immediate', lecture: 0, rendus: 0, attendu: DELAI_SAISIE_MS },
    { nom: 'une longue reflexion', lecture: 40000, rendus: 0, attendu: 40300 },
    {
      nom: 'une longue reflexion coupee par deux rendus',
      lecture: 40000,
      rendus: 2,
      attendu: 40300,
    },
  ];

  for (const cas of CAS_DUREE) {
    it(`mesure ${cas.nom} depuis la presentation de la question`, () => {
      expect(dureeEmise(cas.lecture, cas.rendus)).toBe(cas.attendu);
    });
  }

  it('declare une surface publique exactement egale aux quatre champs annonces', () => {
    expect([SURFACE_PUBLIQUE_EXACTE, clesDe(hote)]).toEqual([true, CLES_PUBLIQUES]);
  });

  it('efface la tolerance et la valeur attendue pour le poste etudiant', () => {
    expect(clesDe(hote)).toEqual(CLES_PUBLIQUES);
    const recu = JSON.stringify(hote.question);
    expect(recu).not.toContain('tolerance');
    expect(recu).not.toContain(VALEUR_ATTENDUE);
  });

  it('efface la tolerance et la valeur attendue meme pour le poste presentateur', () => {
    hote.setAttribute('role', 'presentateur');
    hote.question = buildNumericQuestion({ id: 'Q-PRES-01' });
    expect(clesDe(hote)).toEqual(CLES_PUBLIQUES);
    expect(JSON.stringify(hote.question)).not.toContain(VALEUR_ATTENDUE);
  });

  it('efface une valeur attendue nichee dans les metadonnees', () => {
    const piege = buildNumericQuestion({ id: 'Q-PIEGE-01' });
    const metadonnees = { ...piege.metadonnees, valeurAttendue: 1480.24 };
    hote.question = { ...piege, metadonnees };
    expect(JSON.stringify(hote.question)).not.toContain(VALEUR_ATTENDUE);
  });

  it('ne publie dans le DOM aucune valeur attendue', () => {
    for (const rendu of RENDUS) {
      hote.setAttribute('render', rendu);
      expect(hote.shadowRoot?.innerHTML).not.toContain(VALEUR_ATTENDUE);
    }
  });

  it('echappe le html injecte dans l enonce et dans l unite', () => {
    const charge = '<img src=x onerror="alert(1)">';
    hote.question = buildNumericQuestion({ id: 'Q-XSS-01', enonce: charge, unite: charge });
    expect(hote.shadowRoot?.querySelector('img')).toBeNull();
    expect(hote.shadowRoot?.querySelector('legend')?.textContent?.trim()).toBe(charge);
  });

  it('annonce le retour dans une region live', () => {
    expect(hote.shadowRoot?.querySelector('[aria-live="polite"]')).toBeTruthy();
    expect(hote.shadowRoot?.querySelector('fieldset')).toBeTruthy();
  });

  it('recapitule la modalite et la duree prevue en mode tableau', () => {
    hote.setAttribute('render', 'board');
    const modalite = hote.shadowRoot?.querySelector('[data-testid="modalite"]');
    const duree = hote.shadowRoot?.querySelector('[data-testid="duree"]');
    expect(modalite?.textContent?.trim()).toBe('solo');
    expect(duree?.textContent?.trim()).toBe('3 min');
  });

  it('couvre par une regle de la feuille chaque classe fp emise', () => {
    const feuille = [tokens, base, feuilleDe('numeric'), stage].join('\n');
    const emises = classesEmises(hote);
    expect(emises.length).toBeGreaterThanOrEqual(10);
    const orphelines = emises.filter(
      (classe) => !new RegExp(`\\.${classe}(?![\\w-])`).test(feuille),
    );
    expect(orphelines).toEqual([]);
  });
});
