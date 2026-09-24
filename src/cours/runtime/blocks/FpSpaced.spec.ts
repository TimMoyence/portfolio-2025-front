import { ROLES_DE_MONTAGE } from '../../../testing/briques-montees';
import { classesOrphelines } from '../../../testing/classes-briques';
import {
  buildSpacedQuestions,
  buildSpacedRappel,
  buildVerdictDeReponse,
} from '../../../testing/factories/cours.factory';
import { buildSyntheseConcept } from '../../../testing/factories/formations.factory';
import { FpSpaced } from './FpSpaced';

const RAPPEL = buildSpacedRappel();
const DUES = buildSpacedQuestions();
const CHARGE_XSS = '<img src=x onerror="alert(1)">';
const DEBUT = new Date('2026-09-14T09:00:00.000Z');
const REFLEXION_MS = 4000;

function noeud(hote: FpSpaced, nom: string): Element | null {
  return hote.shadowRoot?.querySelector(`[data-testid="${nom}"]`) ?? null;
}

function noeuds(hote: FpSpaced, nom: string): Element[] {
  return [...(hote.shadowRoot?.querySelectorAll(`[data-testid="${nom}"]`) ?? [])];
}

function libelleDe(hote: FpSpaced, nom: string): string {
  return noeud(hote, nom)?.textContent?.trim().replace(/\s+/g, ' ') ?? '';
}

function repondre(hote: FpSpaced, rangOption: number): void {
  noeuds(hote, 'option')[rangOption]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

describe('FpSpaced', () => {
  let hote: FpSpaced;
  let recues: Record<string, unknown>[];

  beforeAll(() => {
    if (!customElements.get('fp-spaced')) {
      customElements.define('fp-spaced', FpSpaced);
    }
  });

  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(DEBUT);
    recues = [];
    hote = document.createElement('fp-spaced') as FpSpaced;
    hote.addEventListener('fp-spaced-reponse', (evenement) => {
      recues.push((evenement as CustomEvent<Record<string, unknown>>).detail);
    });
    hote.rappel = RAPPEL;
    document.body.appendChild(hote);
  });

  afterEach(() => {
    hote.remove();
    jasmine.clock().uninstall();
  });

  it('annonce le chargement tant que les questions ne sont pas arrivees', () => {
    expect(libelleDe(hote, 'intitule')).toBe(RAPPEL.intitule);
    expect(libelleDe(hote, 'attente')).toBe('Chargement…');
    expect(noeuds(hote, 'option')).toEqual([]);
  });

  it('pose les questions servies par la seance, une a la fois, dans l ordre recu', () => {
    hote.questions = DUES;

    expect(libelleDe(hote, 'enonce')).toBe(DUES[0].enonce);
    expect(libelleDe(hote, 'origine')).toContain(DUES[0].cours);
    expect(libelleDe(hote, 'progression')).toContain('1 / 3');
    expect(noeuds(hote, 'option').map((option) => option.getAttribute('data-option'))).toEqual([
      ...DUES[0].options.map((option) => option.id),
      '__je_ne_sais_pas__',
    ]);
  });

  it('G06 · ne montre a l etudiant ni la boite de revision ni une consigne qui repete l intitule', () => {
    hote.questions = DUES;

    expect(noeud(hote, 'boite')).toBeNull();
    expect(hote.shadowRoot?.querySelector('.fp-spaced__consigne')?.textContent?.trim()).toBe(
      'Quelques questions sur ce que vous avez travaillé plus tôt.',
    );
  });

  it('G06 · separe la mention d origine du cours d ou vient la question', () => {
    hote.questions = DUES;
    const origine = noeud(hote, 'origine') as HTMLElement;
    const mention = origine.querySelector('.fp-spaced__mention') as HTMLElement;
    const cours = noeud(hote, 'origine-cours') as HTMLElement;

    expect(cours.textContent).toBe(DUES[0].cours);
    expect(
      cours.getBoundingClientRect().left - mention.getBoundingClientRect().right,
    ).toBeGreaterThanOrEqual(3);
  });

  it('T9 · une fois le rappel revele, montre la bonne reponse de chaque question, meme sans reponse, sans plus rien proposer', () => {
    hote.questions = DUES;
    hote.verdicts = [
      buildVerdictDeReponse({
        questionId: DUES[0].questionId,
        correcte: false,
        libelleConfusion: null,
      }),
    ];
    hote.corrige = {
      type: 'reponses',
      reponses: {
        [DUES[0].questionId]: { cible: 'x', optionId: DUES[0].options[0].id },
        [DUES[1].questionId]: { cible: 'Non', optionId: 'van-a' },
        [DUES[2].questionId]: { cible: 'Charge calculee', optionId: null },
        [CHARGE_XSS]: { cible: CHARGE_XSS, optionId: null },
      },
    };
    const ligne = (question: string): string =>
      hote.shadowRoot
        ?.querySelector(`[data-question="${question}"]`)
        ?.textContent?.replace(/\s+/g, ' ') ?? '';

    expect(noeuds(hote, 'option')).toEqual([]);
    expect(noeuds(hote, 'ligne').length).toBe(DUES.length);
    expect(ligne(DUES[0].questionId)).toContain(DUES[0].options[0].libelle);
    expect(ligne(DUES[1].questionId)).toContain('Non, il detruit de la valeur');
    expect(ligne(DUES[2].questionId)).toContain('Charge calculee');
    expect(hote.shadowRoot?.querySelector('img')).toBeNull();
  });

  it('T9 · sans revelation, ne montre aucune bonne reponse et garde les options', () => {
    hote.questions = DUES;
    hote.corrige = null;

    expect(noeuds(hote, 'option').length).toBe(DUES[0].options.length + 1);
    expect(noeuds(hote, 'bonne-reponse')).toEqual([]);
  });

  it('emet la reponse avec l identifiant stable de l option, puis passe a la suivante', () => {
    hote.questions = DUES;
    jasmine.clock().tick(REFLEXION_MS);
    repondre(hote, 1);

    expect(recues).toEqual([
      { questionId: DUES[0].questionId, optionId: DUES[0].options[1].id, dureeMs: REFLEXION_MS },
    ]);
    expect(libelleDe(hote, 'enonce')).toBe(DUES[1].enonce);
    expect(libelleDe(hote, 'progression')).toContain('2 / 3');
  });

  it('reprend apres rechargement a la premiere question sans verdict', () => {
    hote.questions = DUES;
    hote.verdicts = [
      buildVerdictDeReponse({
        questionId: DUES[0].questionId,
        correcte: true,
        libelleConfusion: null,
      }),
    ];

    expect(libelleDe(hote, 'enonce')).toBe(DUES[1].enonce);
    expect(noeuds(hote, 'ligne').length).toBe(1);
    expect(libelleDe(hote, 'verdict')).toContain('Juste');
  });

  it('annonce la fin une fois chaque question repondue', () => {
    hote.questions = DUES;
    for (let rang = 0; rang < DUES.length; rang += 1) {
      repondre(hote, 0);
    }
    expect(libelleDe(hote, 'termine')).toBe('Révision terminée : vos réponses sont parties');
  });

  it('dit qu il n y a rien a revoir quand la liste servie est vide', () => {
    hote.questions = [];
    expect(libelleDe(hote, 'vide')).toBe('Rien à revoir pour l’instant');
  });

  it('montre au presentateur la carte de maitrise par concept, jamais une liste de questions', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.questions = DUES;
    hote.maitrise = [buildSyntheseConcept()];

    const carte = noeud(hote, 'carte-maitrise');
    expect(carte?.querySelector('caption')?.textContent).toBe('Carte de maîtrise par concept');
    expect(
      noeuds(hote, 'concept').map((ligne) =>
        [...ligne.children].map((cellule) => cellule.textContent?.trim()),
      ),
    ).toEqual([['Évolution réciproque', '6', '14', '3', '1']]);
    expect(hote.shadowRoot?.innerHTML).not.toContain(DUES[0].enonce);
    expect(noeuds(hote, 'option')).toEqual([]);
    expect(noeud(hote, 'annonce')).toBeNull();
  });

  it('ne montre la carte de maitrise a aucun poste etudiant', () => {
    hote.questions = DUES;
    hote.maitrise = [buildSyntheseConcept()];
    expect(noeud(hote, 'carte-maitrise')).toBeNull();
    expect(libelleDe(hote, 'enonce')).toBe(DUES[0].enonce);
  });

  it('ne pose aucun tableau vide au presentateur tant que la maitrise n est pas servie', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.questions = DUES;
    expect(noeud(hote, 'carte-maitrise')).toBeNull();
    expect(hote.shadowRoot?.querySelector('table')).toBeNull();
  });

  it('pose la meme section, le meme intitule et la meme consigne pour les deux roles', () => {
    hote.questions = DUES;
    const entete = (): string[] =>
      [
        ...(hote.shadowRoot?.querySelectorAll(
          'section.fp-spaced__seance, .fp-spaced__intitule, .fp-spaced__consigne',
        ) ?? []),
      ].map((element) => `${element.className}:${element.firstChild?.textContent?.trim() ?? ''}`);
    const etudiant = entete();

    for (const role of ROLES_DE_MONTAGE) {
      hote.setAttribute('data-cours-role', role);
      expect(entete()).withContext(role).toEqual(etudiant);
    }
    expect(etudiant.length).toBe(3);
  });

  it('echappe le html injecte dans un enonce et un libelle', () => {
    hote.questions = [
      {
        ...DUES[0],
        enonce: CHARGE_XSS,
        options: [{ id: 'x', libelle: CHARGE_XSS }],
      },
    ];
    expect(hote.shadowRoot?.querySelector('img')).toBeNull();
    expect(libelleDe(hote, 'enonce')).toBe(CHARGE_XSS);
  });

  it('couvre par une regle de la feuille chaque classe fp emise', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.questions = DUES;
    hote.verdicts = [buildVerdictDeReponse({ questionId: DUES[0].questionId })];
    hote.maitrise = [buildSyntheseConcept()];
    expect(classesOrphelines(hote, 'spaced')).toEqual([]);
  });
});
