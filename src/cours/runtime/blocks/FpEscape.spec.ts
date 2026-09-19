import { classesEmises, classesOrphelines } from '../../../testing/classes-briques';
import { type TracesEffets, surveillerEffets } from '../../../testing/effets-briques';
import {
  buildEscapeParcours,
  buildProgressionDesEnigmes,
  buildVerdictDeTentative,
} from '../../../testing/factories/cours.factory';
import { FpEscape } from './FpEscape';

const PARCOURS = buildEscapeParcours();
const CHARGE_XSS = '<img src=x onerror="alert(1)">';
const CLASSES_ATTENDUES = 25;
const RENDUS = ['stage', 'hand', 'board'] as const;
const DELAI_INDICE_MS = 120000;
const BUDGET_MS = 360000;
const DEBUT = new Date('2026-09-14T09:00:00.000Z');
const SOLUTIONNAIRE = {
  type: 'enigmes',
  enigmes: [
    { enigmeId: 'seuil', solution: '30000', fragment: 'TR' },
    { enigmeId: 'marge', solution: '30000', fragment: 'ES' },
    { enigmeId: 'tva', solution: '2500', fragment: 'OR' },
  ],
  codeFinal: 'TRESOR',
};
const MOTS_DE_CLASSEMENT = [
  'classement',
  'podium',
  'gagnant',
  'vainqueur',
  'plus rapide',
  'penalite',
];

interface DetailTentative {
  parcoursId: string;
  enigmeId: string;
  reponse: string;
  dureeMs: number;
}

function sansAccent(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function noeud(hote: FpEscape, nom: string): Element | null {
  return hote.shadowRoot?.querySelector(`[data-testid="${nom}"]`) ?? null;
}

function noeuds(hote: FpEscape, nom: string): Element[] {
  return [...(hote.shadowRoot?.querySelectorAll(`[data-testid="${nom}"]`) ?? [])];
}

function libelleDe(hote: FpEscape, nom: string): string {
  return noeud(hote, nom)?.textContent?.trim().replace(/\s+/g, ' ') ?? '';
}

function etats(hote: FpEscape): string[] {
  return noeuds(hote, 'enigme').map((element) => element.getAttribute('data-etat') ?? '');
}

function proposer(hote: FpEscape, reponse: string): void {
  const champ = noeud(hote, 'saisie');
  if (!(champ instanceof HTMLInputElement)) {
    throw new Error('aucun champ de reponse');
  }
  champ.value = reponse;
  champ.dispatchEvent(new Event('input', { bubbles: true }));
  noeud(hote, 'repondre')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

function tentativesEmises(hote: FpEscape): DetailTentative[] {
  const emises: DetailTentative[] = [];
  hote.addEventListener('fp-escape-tentative', (evenement) =>
    emises.push((evenement as CustomEvent<DetailTentative>).detail),
  );
  return emises;
}

describe('FpEscape', () => {
  let hote: FpEscape;
  let traces: TracesEffets;

  beforeAll(() => {
    if (!customElements.get('fp-escape')) {
      customElements.define('fp-escape', FpEscape);
    }
  });

  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(DEBUT);
    hote = document.createElement('fp-escape') as FpEscape;
    traces = surveillerEffets(hote);
    hote.parcours = buildEscapeParcours();
    document.body.appendChild(hote);
  });

  afterEach(() => {
    traces.restaurer();
    hote.remove();
    jasmine.clock().uninstall();
  });

  it('ouvre la premiere enigme et verrouille les suivantes', () => {
    expect(etats(hote)).toEqual(['ouverte', 'verrouillee', 'verrouillee']);
    expect(libelleDe(hote, 'enonce')).toBe(PARCOURS.enigmes[0].enonce);
    expect(libelleDe(hote, 'progression')).toBe('Énigmes résolues : 0 / 3');
    expect(libelleDe(hote, 'tentatives-restantes')).toBe('Tentatives restantes : 10');
  });

  it('confie la tentative au serveur sans jamais la juger localement', () => {
    const emises = tentativesEmises(hote);
    jasmine.clock().tick(45000);
    proposer(hote, ' 30 000 ');

    expect(emises).toEqual([
      { parcoursId: PARCOURS.id, enigmeId: 'seuil', reponse: '30 000', dureeMs: 45000 },
    ]);
    expect(etats(hote)).toEqual(['ouverte', 'verrouillee', 'verrouillee']);
    expect(noeud(hote, 'repondre')?.hasAttribute('disabled')).toBeTrue();
    expect(JSON.stringify(hote.parcours)).not.toContain('30000');
  });

  it('refuse une reponse vide sans rien emettre', () => {
    const emises = tentativesEmises(hote);
    proposer(hote, '   ');
    expect(emises).toEqual([]);
    expect(libelleDe(hote, 'annonce')).toBe('Écrivez une réponse avant de la proposer');
  });

  it('livre le fragment servi et ouvre l enigme suivante sur verdict juste', () => {
    proposer(hote, '30000');
    hote.tentatives = [buildVerdictDeTentative()];

    expect(etats(hote)).toEqual(['resolue', 'ouverte', 'verrouillee']);
    expect(libelleDe(hote, 'fragment')).toBe('Fragment du code obtenu : TR');
    expect(libelleDe(hote, 'annonce')).toBe('Énigme suivante déverrouillée : La marge commerciale');
    expect(noeud(hote, 'repondre')?.hasAttribute('disabled')).toBeFalse();
  });

  it('decompte les tentatives sur verdict faux et laisse chercher', () => {
    proposer(hote, '12');
    hote.tentatives = [
      buildVerdictDeTentative({ correcte: false, fragment: null, tentativesRestantes: 9 }),
    ];

    expect(etats(hote)[0]).toBe('ouverte');
    expect(libelleDe(hote, 'tentatives-restantes')).toBe('Tentatives restantes : 9');
    expect(libelleDe(hote, 'annonce')).toBe(
      'Ce n’est pas encore cela : relisez l’énoncé et proposez autre chose',
    );
  });

  it('ouvre l enigme suivante, sans fragment, quand les tentatives sont epuisees', () => {
    proposer(hote, '12');
    hote.tentatives = [
      buildVerdictDeTentative({ correcte: false, fragment: null, tentativesRestantes: 0 }),
    ];
    expect(etats(hote)).toEqual(['epuisee', 'ouverte', 'verrouillee']);
    expect(libelleDe(hote, 'epuisee')).toBe(
      'Tentatives épuisées : l’énigme suivante s’ouvre, sans fragment',
    );
  });

  it('reprend la progression servie apres rechargement', () => {
    hote.progression = buildProgressionDesEnigmes();
    expect(etats(hote)).toEqual(['resolue', 'ouverte', 'verrouillee']);
    expect(libelleDe(hote, 'progression')).toBe('Énigmes résolues : 1 / 3');
  });

  it('ignore une progression ou une tentative d un autre parcours', () => {
    hote.progression = buildProgressionDesEnigmes({ parcoursId: 'K-AUTRE' });
    hote.tentatives = [buildVerdictDeTentative({ parcoursId: 'K-AUTRE' })];
    expect(etats(hote)).toEqual(['ouverte', 'verrouillee', 'verrouillee']);
  });

  it('reconstitue le code a partir des seuls fragments servis', () => {
    hote.progression = buildProgressionDesEnigmes({
      resolues: [
        { enigmeId: 'seuil', fragment: 'TR' },
        { enigmeId: 'marge', fragment: 'ES' },
      ],
      tentativesRestantes: { seuil: 8, marge: 7, tva: 0 },
    });
    expect(libelleDe(hote, 'code')).toBe('Code final : TRES·');
  });

  it('libere la saisie quand l envoi echoue', () => {
    proposer(hote, '30000');
    hote.erreur = 'Envoi impossible pour le moment';
    expect(noeud(hote, 'repondre')?.hasAttribute('disabled')).toBeFalse();
    expect(libelleDe(hote, 'erreur')).toBe('Envoi impossible pour le moment');
  });

  it('retient l indice jusqu au delai puis l offre sans penalite', () => {
    noeud(hote, 'demander-indice')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(libelleDe(hote, 'annonce')).toBe('L’indice s’ouvre dans 120 secondes');
    expect(noeud(hote, 'indice')).toBeNull();

    jasmine.clock().tick(DELAI_INDICE_MS);
    noeud(hote, 'demander-indice')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(libelleDe(hote, 'indice')).toBe(`Indice : ${PARCOURS.enigmes[0].indice}`);
    expect(libelleDe(hote, 'gratuite')).toBe('Prendre un indice ne retire rien à votre parcours');
  });

  it('signale le budget annonce depasse sans rien fermer', () => {
    jasmine.clock().tick(BUDGET_MS);
    hote.setAttribute('render', 'hand');
    expect(noeud(hote, 'minuteur')?.getAttribute('data-echu')).toBe('true');
    expect(libelleDe(hote, 'echeance')).toContain('rien ne se ferme');
    expect(noeud(hote, 'saisie')).not.toBeNull();
  });

  it('confie la saisie au brouillon de l hote et la restaure', () => {
    const brouillons: unknown[] = [];
    hote.addEventListener('fp-brouillon', (evenement) =>
      brouillons.push((evenement as CustomEvent).detail),
    );
    const champ = noeud(hote, 'saisie') as HTMLInputElement;
    champ.value = '300';
    champ.dispatchEvent(new Event('input', { bubbles: true }));
    expect(brouillons).toEqual([{ id: PARCOURS.id, valeur: { saisie: '300' } }]);
    expect(traces.ecritures).toEqual([]);

    hote.brouillon = { saisie: '29 000' };
    expect((noeud(hote, 'saisie') as HTMLInputElement).value).toBe('29 000');
  });

  it('montre au pupitre les reponses et le code, jamais a un poste etudiant', () => {
    hote.corrige = SOLUTIONNAIRE;
    for (const rendu of RENDUS) {
      hote.setAttribute('render', rendu);
      expect(hote.shadowRoot?.innerHTML).withContext(rendu).not.toContain('TRESOR');
    }
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.setAttribute('render', 'board');
    expect(noeuds(hote, 'solutions')[0]?.querySelectorAll('li').length).toBe(3);
    expect(libelleDe(hote, 'code-final')).toBe('Code final : TRESOR');
  });

  it('projette la liste des enigmes sans enonce ni champ', () => {
    hote.setAttribute('render', 'stage');
    expect(noeuds(hote, 'enigme').length).toBe(3);
    expect(hote.shadowRoot?.querySelectorAll('input').length).toBe(0);
    expect(hote.shadowRoot?.innerHTML).not.toContain(PARCOURS.enigmes[0].enonce);
  });

  it('ne parle jamais de classement ni de competition', () => {
    hote.corrige = SOLUTIONNAIRE;
    hote.setAttribute('data-cours-role', 'presentateur');
    const textes = RENDUS.map((rendu) => {
      hote.setAttribute('render', rendu);
      return sansAccent(hote.shadowRoot?.textContent ?? '');
    }).join(' ');
    for (const mot of MOTS_DE_CLASSEMENT) {
      expect(textes).withContext(mot).not.toContain(mot);
    }
  });

  it('echappe le html injecte dans un enonce', () => {
    hote.parcours = buildEscapeParcours({
      id: 'K-EVASION-XSS',
      enigmes: [{ id: 'x', intitule: CHARGE_XSS, enonce: CHARGE_XSS, indice: CHARGE_XSS }],
    });
    expect(hote.shadowRoot?.querySelector('img')).toBeNull();
    expect(libelleDe(hote, 'enonce')).toBe(CHARGE_XSS);
  });

  it('couvre par une regle de la feuille chaque classe fp emise', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.corrige = SOLUTIONNAIRE;
    hote.progression = buildProgressionDesEnigmes();
    jasmine.clock().tick(BUDGET_MS);
    noeud(hote, 'demander-indice')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(classesEmises(hote).size).toBeGreaterThanOrEqual(CLASSES_ATTENDUES);
    expect(classesOrphelines(hote, 'escape')).toEqual([]);
  });
});
