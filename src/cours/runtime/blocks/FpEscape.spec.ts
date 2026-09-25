import {
  attendreLaChargeInerte,
  cliquerOmbre,
  detailsEmis,
  installerBrique,
} from '../../../testing/banc-de-brique';
import { classesEmises, classesOrphelines } from '../../../testing/classes-briques';
import {
  buildEscapeParcours,
  buildProgressionDesEnigmes,
  buildVerdictDeTentative,
} from '../../../testing/factories/cours.factory';
import { FpEscape } from './FpEscape';

const PARCOURS = buildEscapeParcours();
const CHARGE_XSS = '<img src=x onerror="alert(1)">';
const CLASSES_ATTENDUES = 25;
const ROLES = ['etudiant', 'presentateur'] as const;
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

function ouvrirLIndice(hote: FpEscape): void {
  jasmine.clock().tick(DELAI_INDICE_MS);
  cliquerOmbre(hote, 'demander-indice');
}

function tentativesEmises(hote: FpEscape): DetailTentative[] {
  return detailsEmis(hote, 'fp-escape-tentative');
}

describe('FpEscape', () => {
  let hote: FpEscape;
  const traces = installerBrique<FpEscape>({
    balise: 'fp-escape',
    classe: FpEscape,
    instant: DEBUT,
    poser: (brique) => {
      hote = brique;
      brique.parcours = buildEscapeParcours();
    },
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

  it('retient l indice jusqu au delai puis l offre', () => {
    cliquerOmbre(hote, 'demander-indice');
    expect(libelleDe(hote, 'annonce')).toBe('L’indice s’ouvre dans 120 secondes');
    expect(noeud(hote, 'indice')).toBeNull();

    ouvrirLIndice(hote);

    expect(libelleDe(hote, 'indice')).toBe(`Indice : ${PARCOURS.enigmes[0].indice}`);
  });

  it('G06 · ne garde aucune mention inutile à côté du bouton d indice, ouvert ou non', () => {
    expect(noeud(hote, 'gratuite')).toBeNull();
    expect(hote.shadowRoot?.textContent ?? '').not.toContain('ne retire rien');

    ouvrirLIndice(hote);

    expect(libelleDe(hote, 'annonce')).toBe('Indice ouvert');
    expect(hote.shadowRoot?.textContent ?? '').not.toContain('ne retire rien');
  });

  it('signale le budget annonce depasse sans rien fermer', () => {
    jasmine.clock().tick(BUDGET_MS);
    hote.setAttribute('data-cours-role', 'etudiant');
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

  it('ne publie pour aucun role les solutions ni le code final tant que le corrige n est pas pose', () => {
    for (const role of ROLES) {
      hote.setAttribute('data-cours-role', role);
      expect(hote.shadowRoot?.innerHTML).withContext(role).not.toContain('TRESOR');
      expect(noeuds(hote, 'solution')).withContext(role).toEqual([]);
      expect(noeud(hote, 'code-final')).withContext(role).toBeNull();
    }
  });

  it('projette au presentateur chaque enigme avec son enonce, sans champ ni jeu', () => {
    hote.setAttribute('data-cours-role', 'presentateur');

    expect(noeuds(hote, 'enigme').map((enigme) => enigme.getAttribute('data-enigme'))).toEqual(
      PARCOURS.enigmes.map((enigme) => enigme.id),
    );
    expect(noeuds(hote, 'enonce').map((enonce) => enonce.textContent?.trim())).toEqual(
      PARCOURS.enigmes.map((enigme) => enigme.enonce),
    );
    expect(hote.shadowRoot?.querySelectorAll('input, button').length).toBe(0);
    expect(noeud(hote, 'progression')).toBeNull();
    expect(noeud(hote, 'minuteur')).toBeNull();
    expect(noeud(hote, 'annonce')).toBeNull();
    expect(libelleDe(hote, 'intitule')).toBe(PARCOURS.intitule);
  });

  it('ne projette pas au presentateur le code reconstitue par un poste', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.progression = buildProgressionDesEnigmes({
      resolues: [
        { enigmeId: 'seuil', fragment: 'TR' },
        { enigmeId: 'marge', fragment: 'ES' },
        { enigmeId: 'tva', fragment: 'OR' },
      ],
    });
    expect(noeud(hote, 'code')).toBeNull();
    expect(noeuds(hote, 'fragment')).toEqual([]);
  });

  it('projette au presentateur la solution de chaque enigme et le code final une fois le corrige pose', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.corrige = SOLUTIONNAIRE;

    expect(noeuds(hote, 'enonce').length).toBe(PARCOURS.enigmes.length);
    expect(noeuds(hote, 'solution').map((solution) => solution.textContent?.trim())).toEqual([
      '30000 · TR',
      '30000 · ES',
      '2500 · OR',
    ]);
    expect(noeud(hote, 'solution')?.getAttribute('data-etat')).toBe('confirme');
    expect(libelleDe(hote, 'code-final')).toBe('Code final : TRESOR');
  });

  it('sert a l etudiant la meme projection corrigee, jeu retire, une fois le corrige pose', () => {
    hote.corrige = SOLUTIONNAIRE;
    const etudiant = hote.shadowRoot?.querySelector('ol')?.innerHTML;

    expect(noeuds(hote, 'solution').length).toBe(3);
    expect(libelleDe(hote, 'code-final')).toBe('Code final : TRESOR');
    expect(noeud(hote, 'saisie')).toBeNull();
    expect(noeud(hote, 'progression')).toBeNull();
    expect(noeud(hote, 'minuteur')).toBeNull();
    expect(noeud(hote, 'annonce')).not.toBeNull();

    hote.setAttribute('data-cours-role', 'presentateur');
    expect(hote.shadowRoot?.querySelector('ol')?.innerHTML).toBe(etudiant);
  });

  it('ignore un corrige mal forme', () => {
    hote.corrige = { type: 'enigmes', enigmes: SOLUTIONNAIRE.enigmes };
    expect(noeud(hote, 'code-final')).toBeNull();
    expect(noeud(hote, 'saisie')).not.toBeNull();
  });

  it('annonce aux deux roles un parcours sans enigme', () => {
    hote.parcours = buildEscapeParcours({ id: 'ESC-VIDE', enigmes: [] });
    for (const role of ROLES) {
      hote.setAttribute('data-cours-role', role);
      expect(noeud(hote, 'vide')).withContext(role).not.toBeNull();
    }
  });

  it('ne parle jamais de classement ni de competition', () => {
    hote.corrige = SOLUTIONNAIRE;
    const textes = ROLES.map((role) => {
      hote.setAttribute('data-cours-role', role);
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
    attendreLaChargeInerte(hote, 'enonce', CHARGE_XSS);
  });

  it('couvre par une regle de la feuille chaque classe fp emise', () => {
    hote.progression = buildProgressionDesEnigmes();
    jasmine.clock().tick(BUDGET_MS);
    cliquerOmbre(hote, 'demander-indice');
    expect(classesEmises(hote).size).toBeGreaterThanOrEqual(CLASSES_ATTENDUES);
    expect(classesOrphelines(hote, 'escape')).toEqual([]);

    hote.corrige = SOLUTIONNAIRE;
    expect(classesOrphelines(hote, 'escape')).toEqual([]);
  });
});
