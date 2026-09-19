import { classesEmises, classesOrphelines } from '../../../testing/classes-briques';
import { type TracesEffets, surveillerEffets } from '../../../testing/effets-briques';
import {
  buildSpacedQuestion,
  buildSpacedQuestions,
} from '../../../testing/factories/cours.factory';
import { FpSpaced } from './FpSpaced';

const DUES = buildSpacedQuestions();
const CHARGE_XSS = '<img src=x onerror="alert(1)">';
const CLASSES_ATTENDUES = 20;
const RENDUS = ['stage', 'hand', 'board'] as const;
const DEBUT = new Date('2026-09-14T09:00:00.000Z');
const REFLEXION_MS = 4000;
const MISCONCEPTION = 'actualisation-confondue-avec-capitalisation';
const ORDRE_GRAINE_7 = ['act-c', 'act-b', 'act-d', 'act-a'];
const ORDRE_GRAINE_42 = ['act-a', 'act-d', 'act-b', 'act-c'];

function noeud(hote: FpSpaced, nom: string): Element | null {
  return hote.shadowRoot?.querySelector(`[data-testid="${nom}"]`) ?? null;
}

function noeuds(hote: FpSpaced, nom: string): Element[] {
  return [...(hote.shadowRoot?.querySelectorAll(`[data-testid="${nom}"]`) ?? [])];
}

function libelleDe(hote: FpSpaced, nom: string): string {
  return noeud(hote, nom)?.textContent?.trim().replace(/\s+/g, ' ') ?? '';
}

function ordreDesOptions(hote: FpSpaced): string[] {
  return noeuds(hote, 'option').map((element) => element.getAttribute('data-option') ?? '');
}

function boiteAffichee(hote: FpSpaced): string {
  return noeud(hote, 'boite')?.getAttribute('data-boite') ?? '';
}

function boitesRecues(hote: FpSpaced): number[] {
  return (hote.questions ?? []).map((question) => question.boite);
}

function repondre(hote: FpSpaced, rangOption: number): void {
  noeuds(hote, 'option')[rangOption]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

describe('FpSpaced', () => {
  let hote: FpSpaced;
  let traces: TracesEffets;
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
    traces = surveillerEffets(hote);
    hote.addEventListener('fp-spaced-reponse', (evenement) => {
      recues.push((evenement as CustomEvent<Record<string, unknown>>).detail);
    });
    hote.setAttribute('seed', '7');
    hote.questions = buildSpacedQuestions();
    document.body.appendChild(hote);
  });

  afterEach(() => {
    traces.restaurer();
    hote.remove();
    jasmine.clock().uninstall();
  });

  it('nomme le cours d origine de chaque question rappelee', () => {
    expect(libelleDe(hote, 'origine'))
      .withContext('l etudiant doit savoir de quelle seance la question revient')
      .toContain(DUES[0].cours);
    expect(libelleDe(hote, 'enonce')).toBe(DUES[0].enonce);
    expect(libelleDe(hote, 'concept')).toBe(DUES[0].concept);
    expect(libelleDe(hote, 'progression')).toContain('1 / 3');
    hote.setAttribute('render', 'stage');
    expect(libelleDe(hote, 'origine')).toContain(DUES[0].cours);
  });

  it('presente les questions dans l ordre recu du serveur, boite 1 en tete', () => {
    expect(boitesRecues(hote))
      .withContext('la brique ne retrie pas : le serveur a deja classe les boites')
      .toEqual([1, 2, 3]);
    expect(boiteAffichee(hote)).toBe('1');
    hote.setAttribute('render', 'board');
    expect(noeuds(hote, 'ligne').map((ligne) => ligne.getAttribute('data-boite'))).toEqual([
      '1',
      '2',
      '3',
    ]);
  });

  it('annonce qu il n y a rien a reviser au lieu de laisser l ecran vide', () => {
    hote.questions = [];
    for (const rendu of RENDUS) {
      hote.setAttribute('render', rendu);
      expect(libelleDe(hote, 'vide'))
        .withContext(`le rendu ${rendu} laisse l etudiant devant un ecran muet`)
        .toBe('Rien à réviser aujourd’hui : revenez après la prochaine séance');
      expect(noeuds(hote, 'option')).toEqual([]);
    }
  });

  it('distingue le chargement en cours d une absence de question due', () => {
    hote.questions = null;
    expect(libelleDe(hote, 'attente')).toBe('Chargement…');
    expect(noeud(hote, 'vide')).toBeNull();
  });

  it('affiche la panne sans effacer les questions deja a l ecran', () => {
    hote.erreur = true;
    expect(libelleDe(hote, 'panne')).toBe(
      'Les questions à revoir ne sont pas arrivées : réessayez dans un instant, rien n’est perdu',
    );
    expect(libelleDe(hote, 'enonce'))
      .withContext('un echec reseau ne doit pas emporter la question en cours')
      .toBe(DUES[0].enonce);
    expect(noeuds(hote, 'option').length).toBe(DUES[0].options.length);
    hote.questions = null;
    expect(libelleDe(hote, 'panne')).toContain('réessayez');
    expect(libelleDe(hote, 'attente')).toBe('Chargement…');
  });

  it('emet la reponse et ne deplace aucune boite de son propre chef', () => {
    jasmine.clock().tick(REFLEXION_MS);
    repondre(hote, 0);
    expect(recues.length).toBe(1);
    expect(Object.keys(recues[0]))
      .withContext(
        'le mouvement de boite appartient au serveur : la brique emet, elle ne calcule pas',
      )
      .toEqual(['questionId', 'optionId', 'dureeMs']);
    expect(recues[0]['questionId']).toBe(DUES[0].questionId);
    expect(recues[0]['optionId']).toBe(ORDRE_GRAINE_7[0]);
    expect(recues[0]['dureeMs']).toBe(REFLEXION_MS);
    expect(boitesRecues(hote))
      .withContext('aucune boite ne monte ni ne redescend sur le poste de l etudiant')
      .toEqual([1, 2, 3]);
    expect(traces.evenements).toEqual(['fp-spaced-reponse']);
    expect(traces.ecritures)
      .withContext('l historique d erreurs ne descend pas sur le poste')
      .toEqual([]);
  });

  it('passe a la question suivante puis clot la revision', () => {
    repondre(hote, 0);
    expect(libelleDe(hote, 'progression')).toContain('2 / 3');
    expect(libelleDe(hote, 'enonce')).toBe(DUES[1].enonce);
    expect(boiteAffichee(hote)).toBe('2');
    expect(libelleDe(hote, 'annonce')).toBe('Réponse enregistrée');
    repondre(hote, 0);
    repondre(hote, 0);
    expect(libelleDe(hote, 'termine')).toBe('Révision terminée : vos réponses sont parties');
    expect(noeuds(hote, 'option')).toEqual([]);
    expect(recues.map((detail) => detail['questionId'])).toEqual([
      DUES[0].questionId,
      DUES[1].questionId,
      DUES[2].questionId,
    ]);
  });

  it('tire l ordre des options de la graine de l etudiant et jamais du hasard', () => {
    const dessus = spyOn(Math, 'random').and.callThrough();
    hote.setAttribute('seed', '7');
    expect(ordreDesOptions(hote)).toEqual(ORDRE_GRAINE_7);
    hote.setAttribute('seed', '42');
    expect(ordreDesOptions(hote)).toEqual(ORDRE_GRAINE_42);
    expect(dessus)
      .withContext('deux etudiants doivent pouvoir comparer : le hasard n a pas sa place ici')
      .not.toHaveBeenCalled();
  });

  it('n expose la misconception a aucun poste etudiant', () => {
    const recu = JSON.stringify(hote.questions);
    expect(recu).not.toContain('misconception');
    expect(recu).not.toContain(MISCONCEPTION);
    for (const rendu of RENDUS) {
      hote.setAttribute('render', rendu);
      expect(hote.shadowRoot?.innerHTML ?? '')
        .withContext(`le rendu ${rendu} livre la confusion visee au poste etudiant`)
        .not.toContain(MISCONCEPTION);
    }
    expect(noeud(hote, 'diagnostics')).toBeNull();
  });

  it('garde les confusions visees pour le seul poste presentateur', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.questions = buildSpacedQuestions();
    hote.setAttribute('render', 'board');
    expect(libelleDe(hote, 'diagnostics')).toContain(MISCONCEPTION);
    hote.setAttribute('data-cours-role', 'etudiant');
    hote.questions = buildSpacedQuestions();
    expect(JSON.stringify(hote.questions)).not.toContain(MISCONCEPTION);
    expect(noeud(hote, 'diagnostics')).toBeNull();
  });

  it('echappe le html injecte dans l enonce et dans le nom du cours', () => {
    hote.questions = [
      buildSpacedQuestion({
        questionId: 'Q-XSS-01',
        cours: CHARGE_XSS,
        enonce: CHARGE_XSS,
        concept: CHARGE_XSS,
        options: [{ id: 'piege', libelle: CHARGE_XSS, misconception: null }],
      }),
    ];
    expect(hote.shadowRoot?.querySelector('img')).toBeNull();
    expect(libelleDe(hote, 'enonce')).toBe(CHARGE_XSS);
    expect(libelleDe(hote, 'origine')).toContain(CHARGE_XSS);
    expect(hote.shadowRoot?.innerHTML ?? '').toContain('&lt;img');
  });

  it('retire toute commande en projection et liste les questions dues au tableau', () => {
    hote.setAttribute('render', 'stage');
    expect(hote.shadowRoot?.querySelectorAll('button').length).toBe(0);
    expect(libelleDe(hote, 'enonce')).toBe(DUES[0].enonce);
    hote.setAttribute('render', 'board');
    expect(hote.shadowRoot?.querySelectorAll('button').length).toBe(0);
    expect(noeuds(hote, 'ligne').length).toBe(DUES.length);
    expect(libelleDe(hote, 'liste')).toContain(DUES[2].cours);
  });

  it('couvre par une regle de la feuille chaque classe fp emise', () => {
    expect(classesEmises(hote).size).toBeGreaterThanOrEqual(CLASSES_ATTENDUES);
    expect(classesOrphelines(hote, 'spaced')).toEqual([]);
  });
});
