import { classesEmises, classesOrphelines } from '../../../testing/classes-briques';
import { type TracesEffets, surveillerEffets } from '../../../testing/effets-briques';
import { buildEscapeParcours } from '../../../testing/factories/cours.factory';
import { FpEscape } from './FpEscape';

const PARCOURS = buildEscapeParcours();
const CHARGE_XSS = '<img src=x onerror="alert(1)">';
const CLASSES_ATTENDUES = 25;
const RENDUS = ['stage', 'hand', 'board'] as const;
const CODE_FINAL = 'TRESOR';
const CLE_STOCKAGE = 'fp.escape.K-EVASION-01';
const SEUIL = '30000';
const MARGE = '30000';
const TVA = '2500';
const DELAI_INDICE_MS = 120000;
const BUDGET_MS = 360000;
const DEBUT = new Date('2026-09-14T09:00:00.000Z');
const MOTS_DE_CLASSEMENT = [
  'classement',
  'podium',
  'score',
  'points',
  'gagnant',
  'vainqueur',
  'meilleur',
  'plus rapide',
  'en tete',
  'adversaire',
  'bonus',
  'malus',
  'penalite',
];

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

function mentionsEtat(hote: FpEscape): string[] {
  return noeuds(hote, 'etat').map((element) => element.textContent?.trim() ?? '');
}

function cliquer(element: Element | null): void {
  element?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

function proposer(hote: FpEscape, reponse: string): void {
  const champ = noeud(hote, 'saisie');
  if (!(champ instanceof HTMLInputElement)) {
    throw new Error('aucun champ de reponse ouvert');
  }
  champ.value = reponse;
  champ.dispatchEvent(new Event('input', { bubbles: true }));
  cliquer(noeud(hote, 'repondre'));
}

function monter(): FpEscape {
  const cree = document.createElement('fp-escape') as FpEscape;
  cree.parcours = buildEscapeParcours();
  document.body.appendChild(cree);
  return cree;
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
    localStorage.removeItem(CLE_STOCKAGE);
    hote = document.createElement('fp-escape') as FpEscape;
    traces = surveillerEffets(hote);
    hote.parcours = buildEscapeParcours();
    document.body.appendChild(hote);
  });

  afterEach(() => {
    traces.restaurer();
    hote.remove();
    localStorage.removeItem(CLE_STOCKAGE);
    jasmine.clock().uninstall();
  });

  it('n ouvre que la premiere enigme et tient les suivantes verrouillees', () => {
    expect(etats(hote)).toEqual(['ouverte', 'verrouillee', 'verrouillee']);
    expect(noeuds(hote, 'enonce').length)
      .withContext('une enigme verrouillee ne doit livrer ni son enonce ni son champ')
      .toBe(1);
    expect(noeuds(hote, 'saisie').length).toBe(1);
    expect(noeuds(hote, 'verrou').length).toBe(2);
    expect(libelleDe(hote, 'enonce')).toBe(PARCOURS.enigmes[0].enonce);
    expect(hote.shadowRoot?.innerHTML ?? '')
      .withContext('l enonce d une enigme verrouillee ne doit exister nulle part dans le dom')
      .not.toContain('TVA collectee');
  });

  it('ouvre l enigme suivante quand la precedente est resolue', () => {
    proposer(hote, SEUIL);
    expect(hote.avancement).toBe(1);
    expect(etats(hote)).toEqual(['resolue', 'ouverte', 'verrouillee']);
    expect(libelleDe(hote, 'enonce')).toBe(PARCOURS.enigmes[1].enonce);
    expect(traces.evenements).toEqual(['fp-escape-resolue']);
    proposer(hote, MARGE);
    expect(etats(hote)).toEqual(['resolue', 'resolue', 'ouverte']);
  });

  it('laisse l enigme fermee sur une reponse qui n est pas la bonne', () => {
    proposer(hote, 'quarante mille');
    expect(hote.avancement).toBe(0);
    expect(etats(hote)).toEqual(['ouverte', 'verrouillee', 'verrouillee']);
    expect(libelleDe(hote, 'annonce')).toBe(
      'Ce n’est pas encore cela : relisez l’énoncé et proposez autre chose',
    );
    expect(traces.evenements).toEqual([]);
    proposer(hote, '   ');
    expect(libelleDe(hote, 'annonce')).toBe('Écrivez une réponse avant de la proposer');
  });

  it('accepte la bonne reponse a l espace, a la casse et a l accent pres', () => {
    hote.parcours = buildEscapeParcours({
      id: 'K-EVASION-MOTS',
      enigmes: [
        {
          id: 'poste',
          intitule: 'Le poste du bilan',
          enonce: 'Quel poste regroupe la caisse et les comptes en banque ?',
          indice: 'Il ouvre le bas du bilan actif',
          solution: 'Trésorerie nette',
          fragment: 'ZZ',
        },
      ],
    });
    proposer(hote, '  tresorerie   NETTE ');
    expect(hote.avancement)
      .withContext('la reponse tapee par un etudiant ne doit pas dependre de sa mise en forme')
      .toBe(1);
    localStorage.removeItem('fp.escape.K-EVASION-MOTS');
  });

  it('ne met le code final dans aucun rendu avant la derniere enigme', () => {
    for (const rendu of RENDUS) {
      hote.setAttribute('render', rendu);
      expect(hote.shadowRoot?.innerHTML ?? '')
        .withContext(`le code final apparait dans le rendu ${rendu} avant d etre merite`)
        .not.toContain(CODE_FINAL);
    }
    hote.setAttribute('render', 'hand');
    expect(hote.codeFinal).toBe('');
    expect((hote.parcours?.enigmes ?? []).map((enigme) => enigme.fragment)).toEqual(['', '', '']);
  });

  it('reconstitue le code final une fois la derniere enigme resolue', () => {
    proposer(hote, SEUIL);
    proposer(hote, MARGE);
    expect(hote.shadowRoot?.innerHTML ?? '').not.toContain(CODE_FINAL);
    proposer(hote, TVA);
    expect(hote.codeFinal).toBe(CODE_FINAL);
    expect(libelleDe(hote, 'code')).toContain(CODE_FINAL);
    expect(noeuds(hote, 'saisie')).toEqual([]);
  });

  it('n affiche aucun classement ni aucune comparaison entre groupes', () => {
    proposer(hote, SEUIL);
    for (const rendu of RENDUS) {
      hote.setAttribute('render', rendu);
      const lisible = sansAccent(hote.shadowRoot?.innerHTML ?? '');
      for (const mot of MOTS_DE_CLASSEMENT) {
        expect(lisible)
          .withContext(`le rendu ${rendu} oppose les groupes en parlant de « ${mot} »`)
          .not.toContain(mot);
      }
    }
  });

  it('ouvre l indice apres le delai annonce et ne le fait payer a personne', () => {
    cliquer(noeud(hote, 'demander-indice'));
    expect(noeud(hote, 'indice')).toBeNull();
    expect(libelleDe(hote, 'annonce')).toBe('L’indice s’ouvre dans 120 secondes');
    expect(noeud(hote, 'demander-indice')?.getAttribute('data-pret')).toBe('false');
    jasmine.clock().tick(DELAI_INDICE_MS);
    cliquer(noeud(hote, 'demander-indice'));
    expect(noeud(hote, 'demander-indice')?.getAttribute('data-pret')).toBe('true');
    expect(libelleDe(hote, 'indice')).toContain(PARCOURS.enigmes[0].indice);
    proposer(hote, SEUIL);
    expect(hote.avancement)
      .withContext('un indice pris ne doit rien retirer a la progression')
      .toBe(1);
    expect(libelleDe(hote, 'annonce')).toBe('Énigme suivante déverrouillée : La marge commerciale');
  });

  it('annonce le deblocage dans une region aria-live et sans recours a la couleur', () => {
    const region = noeud(hote, 'annonce');
    expect(region?.getAttribute('role')).toBe('status');
    expect(region?.getAttribute('aria-live')).toBe('polite');
    expect(mentionsEtat(hote)).toEqual(['Ouverte', 'Verrouillée', 'Verrouillée']);
    proposer(hote, SEUIL);
    expect(libelleDe(hote, 'annonce')).toBe('Énigme suivante déverrouillée : La marge commerciale');
    expect(mentionsEtat(hote))
      .withContext('l avancement doit se lire en toutes lettres, pas a la seule couleur')
      .toEqual(['Résolue', 'Ouverte', 'Verrouillée']);
  });

  it('retrouve l avancement apres un rechargement de la page', () => {
    proposer(hote, SEUIL);
    expect(traces.ecritures).toContain(CLE_STOCKAGE);
    hote.remove();
    const recharge = monter();
    expect(recharge.avancement)
      .withContext('un rechargement ne doit pas renvoyer le groupe a la premiere enigme')
      .toBe(1);
    expect(etats(recharge)).toEqual(['resolue', 'ouverte', 'verrouillee']);
    expect(libelleDe(recharge, 'enonce')).toBe(PARCOURS.enigmes[1].enonce);
    recharge.remove();
  });

  it('informe que le temps annonce est ecoule sans rien fermer', () => {
    expect(noeud(hote, 'minuteur')?.getAttribute('data-echu')).toBe('false');
    jasmine.clock().tick(BUDGET_MS);
    hote.setAttribute('render', 'hand');
    expect(noeud(hote, 'minuteur')?.getAttribute('data-echu')).toBe('true');
    expect(libelleDe(hote, 'echeance')).toBe(
      'Le temps annoncé est écoulé : rien ne se ferme, prenez le temps qu’il faut',
    );
    proposer(hote, SEUIL);
    expect(hote.avancement)
      .withContext('le minuteur informe, il ne barre pas la route au groupe qui cherche encore')
      .toBe(1);
    expect(traces.evenements).toEqual(['fp-escape-resolue']);
  });

  it('efface la solution des enigmes pour le poste etudiant', () => {
    const recu = JSON.stringify(hote.parcours);
    expect(recu).not.toContain('solution');
    expect(recu).not.toContain(MARGE);
    expect(recu).not.toContain(TVA);
    expect(noeud(hote, 'solutions')).toBeNull();
  });

  it('garde les solutions pour le seul poste presentateur', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.parcours = buildEscapeParcours();
    hote.setAttribute('render', 'board');
    expect(libelleDe(hote, 'solutions')).toContain(MARGE);
    hote.setAttribute('data-cours-role', 'etudiant');
    hote.parcours = buildEscapeParcours();
    expect(JSON.stringify(hote.parcours)).not.toContain(MARGE);
  });

  it('echappe le html injecte dans les enonces et les indices', () => {
    hote.parcours = buildEscapeParcours({
      id: 'K-EVASION-XSS',
      intitule: CHARGE_XSS,
      delaiIndiceMs: 0,
      enigmes: [
        {
          id: 'piege',
          intitule: CHARGE_XSS,
          enonce: CHARGE_XSS,
          indice: CHARGE_XSS,
          solution: 'reponse',
          fragment: 'ZZ',
        },
      ],
    });
    cliquer(noeud(hote, 'demander-indice'));
    proposer(hote, `<b>${CHARGE_XSS}</b>`);
    expect(hote.shadowRoot?.querySelector('img')).toBeNull();
    expect(libelleDe(hote, 'enonce')).toBe(CHARGE_XSS);
    expect(hote.shadowRoot?.innerHTML ?? '').toContain('&lt;img');
    localStorage.removeItem('fp.escape.K-EVASION-XSS');
  });

  it('tient un parcours sans enigme sans casser la brique', () => {
    hote.parcours = buildEscapeParcours({ id: 'K-EVASION-VIDE', enigmes: [] });
    expect(libelleDe(hote, 'vide')).toContain('Aucune énigme');
    expect(hote.codeFinal).toBe('');
    expect(traces.evenements).toEqual([]);
    localStorage.removeItem('fp.escape.K-EVASION-VIDE');
  });

  it('retire toute commande en projection et affiche les reperes au tableau', () => {
    hote.setAttribute('render', 'stage');
    expect(hote.shadowRoot?.querySelectorAll('button').length).toBe(0);
    expect(hote.shadowRoot?.querySelectorAll('input').length).toBe(0);
    expect(etats(hote)).toEqual(['ouverte', 'verrouillee', 'verrouillee']);
    hote.setAttribute('render', 'board');
    expect(libelleDe(hote, 'modalite')).toBe(PARCOURS.metadonnees.modalite);
    expect(libelleDe(hote, 'duree')).toContain(String(PARCOURS.metadonnees.dureeMinutes));
    expect(libelleDe(hote, 'progression')).toContain('0 / 3');
  });

  it('couvre par une regle de la feuille chaque classe fp emise', () => {
    expect(classesEmises(hote).size).toBeGreaterThanOrEqual(CLASSES_ATTENDUES);
    expect(classesOrphelines(hote, 'escape')).toEqual([]);
  });
});
