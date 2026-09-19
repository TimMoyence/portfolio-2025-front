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
const RENDUS = ['stage', 'hand', 'board'] as const;
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

  it('montre au pupitre la carte de maitrise par concept, jamais une liste de questions', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.setAttribute('render', 'board');
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
  });

  it('ne montre la carte de maitrise a aucun poste etudiant ni en projection', () => {
    hote.maitrise = [buildSyntheseConcept()];
    for (const rendu of RENDUS) {
      hote.setAttribute('render', rendu);
      expect(noeud(hote, 'carte-maitrise')).withContext(rendu).toBeNull();
    }
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
