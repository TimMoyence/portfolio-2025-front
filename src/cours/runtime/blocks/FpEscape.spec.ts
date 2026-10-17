import {
  attendreLaChargeInerte,
  cliquerOmbre,
  detailsEmis,
  installerBrique,
  libelleOmbre,
  noeudOmbre,
  noeudsOmbre,
} from '../../../testing/banc-de-brique';
import { classesEmises, classesOrphelines } from '../../../testing/classes-briques';
import {
  buildEscapeParcours,
  buildProgressionDesEnigmes,
  buildVerdictDeTentative,
} from '../../../testing/factories/cours.factory';
import { FpEscape } from './FpEscape';
import type { EtatDesEnigmes, EtatEnigme, VerdictDeTentative } from './retours';

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

const DEUX_FRAGMENTS = [
  { enigmeId: 'seuil', fragment: 'TR' },
  { enigmeId: 'marge', fragment: 'ES' },
] as const;

type EtatServi = readonly [EtatEnigme, number];

function servi(
  [seuil, marge, tva]: readonly [EtatServi, EtatServi, EtatServi],
  enigmeOuverte: string | null,
): EtatDesEnigmes {
  const ligne = ([etat, tentativesRestantes]: EtatServi) => ({ etat, tentativesRestantes });
  return {
    etats: { seuil: ligne(seuil), marge: ligne(marge), tva: ligne(tva) },
    enigmeOuverte,
    acheve: enigmeOuverte === null,
  };
}

const PARCOURS_ACHEVE_SANS_LA_TVA = servi(
  [
    ['resolue', 8],
    ['resolue', 7],
    ['epuisee', 0],
  ],
  null,
);

function verdictFaux(verdict: Partial<VerdictDeTentative>): VerdictDeTentative {
  return buildVerdictDeTentative({ correcte: false, fragment: null, ...verdict });
}

function deuxEnigmesResolues(): ReturnType<typeof buildProgressionDesEnigmes> {
  return buildProgressionDesEnigmes({
    resolues: [...DEUX_FRAGMENTS],
    tentativesRestantes: { seuil: 8, marge: 7, tva: 0 },
    ...PARCOURS_ACHEVE_SANS_LA_TVA,
  });
}

function sansAccent(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function enoncesAffiches(hote: FpEscape): (string | undefined)[] {
  return noeudsOmbre(hote, 'enonce').map((enonce) => enonce.textContent?.trim());
}

function etats(hote: FpEscape): string[] {
  return noeudsOmbre(hote, 'enigme').map((element) => element.getAttribute('data-etat') ?? '');
}

function proposer(hote: FpEscape, reponse: string): void {
  const champ = noeudOmbre(hote, 'saisie');
  if (!(champ instanceof HTMLInputElement)) {
    throw new Error('aucun champ de reponse');
  }
  champ.value = reponse;
  champ.dispatchEvent(new Event('input', { bubbles: true }));
  cliquerOmbre(hote, 'repondre');
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
    expect(libelleOmbre(hote, 'enonce')).toBe(PARCOURS.enigmes[0].enonce);
    expect(libelleOmbre(hote, 'progression')).toBe('Énigmes résolues : 0 / 3');
    expect(libelleOmbre(hote, 'tentatives-restantes')).toBe('Tentatives restantes : 10');
  });

  it('annonce le maximum servi quand c est un entier strictement positif', () => {
    hote.parcours = buildEscapeParcours({ tentativesMax: 3 });

    expect(libelleOmbre(hote, 'tentatives-restantes')).toBe('Tentatives restantes : 3');
  });

  it('F-29 · affiche l état, l énigme ouverte et l achèvement que le back sert, même contraires à un recalcul', () => {
    hote.progression = buildProgressionDesEnigmes({
      resolues: [],
      tentativesRestantes: { seuil: 6 },
      etats: {
        seuil: { etat: 'epuisee', tentativesRestantes: 6 },
        marge: { etat: 'verrouillee', tentativesRestantes: 10 },
        tva: { etat: 'ouverte', tentativesRestantes: 4 },
      },
      enigmeOuverte: 'tva',
      acheve: false,
    });

    expect(etats(hote)).toEqual(['epuisee', 'verrouillee', 'ouverte']);
    expect(libelleOmbre(hote, 'enonce')).toBe(PARCOURS.enigmes[2].enonce);
    expect(libelleOmbre(hote, 'tentatives-restantes')).toBe('Tentatives restantes : 4');

    proposer(hote, '2500');
    hote.tentatives = [
      verdictFaux({
        enigmeId: 'tva',
        tentativesRestantes: 3,
        etats: {
          seuil: { etat: 'ouverte', tentativesRestantes: 6 },
          marge: { etat: 'verrouillee', tentativesRestantes: 10 },
          tva: { etat: 'epuisee', tentativesRestantes: 3 },
        },
        enigmeOuverte: null,
        acheve: true,
      }),
    ];

    expect(etats(hote)).toEqual(['ouverte', 'verrouillee', 'epuisee']);
    expect(noeudOmbre(hote, 'minuteur')).toBeNull();
    expect(libelleOmbre(hote, 'code')).toBe('Code final : ···');
  });

  it('imprime sur papier l énoncé de chaque énigme, sans saisie, tentatives, indice ni progression', () => {
    hote.setAttribute('data-papier', '');

    expect(enoncesAffiches(hote)).toEqual(PARCOURS.enigmes.map((enigme) => enigme.enonce));
    for (const absent of [
      'saisie',
      'repondre',
      'tentatives-restantes',
      'demander-indice',
      'progression',
      'minuteur',
    ]) {
      expect(noeudOmbre(hote, absent)).withContext(absent).toBeNull();
    }
  });

  it('confie la tentative au serveur sans jamais la juger localement', () => {
    const emises = tentativesEmises(hote);
    jasmine.clock().tick(45000);
    proposer(hote, ' 30 000 ');

    expect(emises).toEqual([
      { parcoursId: PARCOURS.id, enigmeId: 'seuil', reponse: '30 000', dureeMs: 45000 },
    ]);
    expect(etats(hote)).toEqual(['ouverte', 'verrouillee', 'verrouillee']);
    expect(noeudOmbre(hote, 'repondre')?.hasAttribute('disabled')).toBeTrue();
    expect(JSON.stringify(hote.parcours)).not.toContain('30000');
  });

  it('refuse une reponse vide sans rien emettre', () => {
    const emises = tentativesEmises(hote);
    proposer(hote, '   ');
    expect(emises).toEqual([]);
    expect(libelleOmbre(hote, 'annonce')).toBe('Écrivez une réponse avant de la proposer');
  });

  it('livre le fragment servi et ouvre l enigme suivante sur verdict juste', () => {
    proposer(hote, '30000');
    hote.tentatives = [buildVerdictDeTentative()];

    expect(etats(hote)).toEqual(['resolue', 'ouverte', 'verrouillee']);
    expect(libelleOmbre(hote, 'fragment')).toBe('Fragment du code obtenu : TR');
    expect(libelleOmbre(hote, 'annonce')).toBe(
      'Énigme suivante déverrouillée : La marge commerciale',
    );
    expect(noeudOmbre(hote, 'repondre')?.hasAttribute('disabled')).toBeFalse();
  });

  it('decompte les tentatives sur verdict faux et laisse chercher', () => {
    proposer(hote, '12');
    hote.tentatives = [
      verdictFaux({
        tentativesRestantes: 9,
        ...servi(
          [
            ['ouverte', 9],
            ['verrouillee', 10],
            ['verrouillee', 10],
          ],
          'seuil',
        ),
      }),
    ];

    expect(etats(hote)[0]).toBe('ouverte');
    expect(libelleOmbre(hote, 'tentatives-restantes')).toBe('Tentatives restantes : 9');
    expect(libelleOmbre(hote, 'annonce')).toBe(
      'Ce n’est pas encore cela : relisez l’énoncé et proposez autre chose',
    );
  });

  it('ouvre l enigme suivante, sans fragment, quand les tentatives sont epuisees', () => {
    proposer(hote, '12');
    hote.tentatives = [
      verdictFaux({
        tentativesRestantes: 0,
        ...servi(
          [
            ['epuisee', 0],
            ['ouverte', 10],
            ['verrouillee', 10],
          ],
          'marge',
        ),
      }),
    ];
    expect(etats(hote)).toEqual(['epuisee', 'ouverte', 'verrouillee']);
    expect(libelleOmbre(hote, 'epuisee')).toBe(
      'Tentatives épuisées : l’énigme suivante s’ouvre, sans fragment',
    );
  });

  it('ignore une tentative dont le fragment n est ni un texte ni nul', () => {
    proposer(hote, '12');
    const malformee: unknown = {
      ...verdictFaux({ tentativesRestantes: 0 }),
      fragment: 3,
    };
    hote.tentatives = [malformee as VerdictDeTentative];
    expect(etats(hote)).toEqual(['ouverte', 'verrouillee', 'verrouillee']);
  });

  const ANNONCES_DU_DERNIER_FRAGMENT: readonly (readonly [
    string,
    Parameters<typeof buildProgressionDesEnigmes>[0],
    EtatServi,
    string,
  ])[] = [
    [
      'dit le code incomplet, et non toutes les énigmes résolues, quand une énigme est épuisée',
      {
        tentativesRestantes: { seuil: 8, marge: 0, tva: 10 },
        ...servi(
          [
            ['resolue', 8],
            ['epuisee', 0],
            ['ouverte', 10],
          ],
          'tva',
        ),
      },
      ['epuisee', 0],
      'Parcours terminé sans tous les fragments, le code reste incomplet : TR·OR',
    ],
    [
      'dit toutes les énigmes résolues quand chacune a livré son fragment',
      {
        resolues: [...DEUX_FRAGMENTS],
        tentativesRestantes: { seuil: 8, marge: 7, tva: 10 },
        ...servi(
          [
            ['resolue', 8],
            ['resolue', 7],
            ['ouverte', 10],
          ],
          'tva',
        ),
      },
      ['resolue', 7],
      'Toutes les énigmes sont résolues, le code est reconstitué : TRESOR',
    ],
  ];

  for (const [cas, progression, marge, annonce] of ANNONCES_DU_DERNIER_FRAGMENT) {
    it(`QP-14 · ${cas}`, () => {
      hote.progression = buildProgressionDesEnigmes(progression);
      proposer(hote, '2500');
      hote.tentatives = [
        buildVerdictDeTentative({
          enigmeId: 'tva',
          fragment: 'OR',
          ...servi([['resolue', 8], marge, ['resolue', 9]], null),
        }),
      ];

      expect(libelleOmbre(hote, 'annonce')).toBe(annonce);
    });
  }

  it('QP-14 · annonce la fin du parcours, et non une énigme suivante, quand la dernière s’épuise', () => {
    hote.progression = buildProgressionDesEnigmes({
      resolues: [...DEUX_FRAGMENTS],
      tentativesRestantes: { seuil: 8, marge: 7, tva: 1 },
      ...servi(
        [
          ['resolue', 8],
          ['resolue', 7],
          ['ouverte', 1],
        ],
        'tva',
      ),
    });
    proposer(hote, '12');
    hote.tentatives = [
      verdictFaux({
        enigmeId: 'tva',
        tentativesRestantes: 0,
        ...PARCOURS_ACHEVE_SANS_LA_TVA,
      }),
    ];

    expect(libelleOmbre(hote, 'annonce')).toBe(
      'Parcours terminé sans tous les fragments, le code reste incomplet : TRES·',
    );
    expect(libelleOmbre(hote, 'epuisee')).toBe(
      'Tentatives épuisées : cette dernière énigme ne livre pas son fragment',
    );
  });

  it('reprend la progression servie apres rechargement', () => {
    hote.progression = buildProgressionDesEnigmes();
    expect(etats(hote)).toEqual(['resolue', 'ouverte', 'verrouillee']);
    expect(libelleOmbre(hote, 'progression')).toBe('Énigmes résolues : 1 / 3');
  });

  it('ignore une progression ou une tentative d un autre parcours', () => {
    hote.progression = buildProgressionDesEnigmes({ parcoursId: 'K-AUTRE' });
    hote.tentatives = [buildVerdictDeTentative({ parcoursId: 'K-AUTRE' })];
    expect(etats(hote)).toEqual(['ouverte', 'verrouillee', 'verrouillee']);
  });

  it('reconstitue le code a partir des seuls fragments servis', () => {
    hote.progression = deuxEnigmesResolues();
    expect(libelleOmbre(hote, 'code')).toBe('Code final : TRES·');
  });

  it('retire le minuteur une fois le parcours achevé', () => {
    expect(noeudOmbre(hote, 'minuteur')).not.toBeNull();

    hote.progression = deuxEnigmesResolues();

    expect(noeudOmbre(hote, 'minuteur')).toBeNull();
    expect(noeudOmbre(hote, 'progression')).not.toBeNull();
  });

  it('libere la saisie quand l envoi echoue', () => {
    proposer(hote, '30000');
    hote.erreur = 'Envoi impossible pour le moment';
    expect(noeudOmbre(hote, 'repondre')?.hasAttribute('disabled')).toBeFalse();
    expect(libelleOmbre(hote, 'erreur')).toBe('Envoi impossible pour le moment');
  });

  it('retient l indice jusqu au delai puis l offre', () => {
    cliquerOmbre(hote, 'demander-indice');
    expect(libelleOmbre(hote, 'annonce')).toBe('L’indice s’ouvre dans 120 secondes');
    expect(noeudOmbre(hote, 'indice')).toBeNull();

    ouvrirLIndice(hote);

    expect(libelleOmbre(hote, 'indice')).toBe(`Indice : ${PARCOURS.enigmes[0].indice}`);
  });

  it('G06 · ne garde aucune mention inutile à côté du bouton d indice, ouvert ou non', () => {
    expect(noeudOmbre(hote, 'gratuite')).toBeNull();
    expect(hote.shadowRoot?.textContent ?? '').not.toContain('ne retire rien');

    ouvrirLIndice(hote);

    expect(libelleOmbre(hote, 'annonce')).toBe('Indice ouvert');
    expect(hote.shadowRoot?.textContent ?? '').not.toContain('ne retire rien');
  });

  it('QP-12 · fait avancer le minuteur à la seconde, sans attendre un autre rendu', () => {
    expect(libelleOmbre(hote, 'minuteur')).toBe(
      'Temps passé sur cette énigme : 0:00 / 6:00 annoncées',
    );

    jasmine.clock().tick(65_000);

    expect(libelleOmbre(hote, 'minuteur')).toBe(
      'Temps passé sur cette énigme : 1:05 / 6:00 annoncées',
    );
  });

  it('QP-12 · arrête le minuteur quand le coffre quitte la page', () => {
    hote.remove();
    jasmine.clock().tick(5_000);

    expect(libelleOmbre(hote, 'minuteur')).toBe(
      'Temps passé sur cette énigme : 0:00 / 6:00 annoncées',
    );
  });

  it('QP-12 · annonce un budget non entier à la seconde près', () => {
    hote.parcours = buildEscapeParcours({ budgetEnigmeMs: 150_000 });

    expect(libelleOmbre(hote, 'minuteur')).toBe(
      'Temps passé sur cette énigme : 0:00 / 2:30 annoncées',
    );
  });

  it('QP-12 · rend l indice prêt et efface l attente à l échéance du délai, sans autre rendu', () => {
    cliquerOmbre(hote, 'demander-indice');
    expect(noeudOmbre(hote, 'demander-indice')?.getAttribute('data-pret')).toBe('false');
    expect(libelleOmbre(hote, 'annonce')).toBe('L’indice s’ouvre dans 120 secondes');

    jasmine.clock().tick(DELAI_INDICE_MS / 2);
    expect(libelleOmbre(hote, 'annonce')).toBe('L’indice s’ouvre dans 60 secondes');

    jasmine.clock().tick(DELAI_INDICE_MS / 2);

    expect(noeudOmbre(hote, 'demander-indice')?.getAttribute('data-pret')).toBe('true');
    expect(libelleOmbre(hote, 'annonce')).toBe('');
  });

  it('signale le budget annonce depasse sans rien fermer', () => {
    jasmine.clock().tick(BUDGET_MS);
    expect(noeudOmbre(hote, 'minuteur')?.getAttribute('data-echu')).toBe('true');
    expect(libelleOmbre(hote, 'echeance')).toContain('rien ne se ferme');
    expect(noeudOmbre(hote, 'saisie')).not.toBeNull();
  });

  it('confie la saisie au brouillon de l hote et la restaure', () => {
    const brouillons: unknown[] = [];
    hote.addEventListener('fp-brouillon', (evenement) =>
      brouillons.push((evenement as CustomEvent).detail),
    );
    const champ = noeudOmbre(hote, 'saisie') as HTMLInputElement;
    champ.value = '300';
    champ.dispatchEvent(new Event('input', { bubbles: true }));
    expect(brouillons).toEqual([{ id: PARCOURS.id, valeur: { saisie: '300' } }]);
    expect(traces.ecritures).toEqual([]);

    hote.brouillon = { saisie: '29 000' };
    expect((noeudOmbre(hote, 'saisie') as HTMLInputElement).value).toBe('29 000');
  });

  it('ne reprend pas un brouillon dont la saisie n est pas un texte', () => {
    hote.brouillon = { saisie: 29000 };

    expect((noeudOmbre(hote, 'saisie') as HTMLInputElement).value).toBe('');
    expect(hote.shadowRoot?.textContent).not.toContain('Brouillon restauré');
  });

  it('ne publie pour aucun role les solutions ni le code final tant que le corrige n est pas pose', () => {
    for (const role of ROLES) {
      hote.setAttribute('data-cours-role', role);
      expect(hote.shadowRoot?.innerHTML).withContext(role).not.toContain('TRESOR');
      expect(noeudsOmbre(hote, 'solution')).withContext(role).toEqual([]);
      expect(noeudOmbre(hote, 'code-final')).withContext(role).toBeNull();
    }
  });

  it('projette au presentateur chaque enigme avec son enonce, sans champ ni jeu', () => {
    hote.setAttribute('data-cours-role', 'presentateur');

    expect(noeudsOmbre(hote, 'enigme').map((enigme) => enigme.getAttribute('data-enigme'))).toEqual(
      PARCOURS.enigmes.map((enigme) => enigme.id),
    );
    expect(enoncesAffiches(hote)).toEqual(PARCOURS.enigmes.map((enigme) => enigme.enonce));
    expect(hote.shadowRoot?.querySelectorAll('input, button').length).toBe(0);
    expect(noeudOmbre(hote, 'progression')).toBeNull();
    expect(noeudOmbre(hote, 'minuteur')).toBeNull();
    expect(noeudOmbre(hote, 'annonce')).toBeNull();
    expect(libelleOmbre(hote, 'intitule')).toBe(PARCOURS.intitule);
  });

  it('ne projette pas au presentateur le code reconstitue par un poste', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.progression = buildProgressionDesEnigmes({
      resolues: [...DEUX_FRAGMENTS, { enigmeId: 'tva', fragment: 'OR' }],
    });
    expect(noeudOmbre(hote, 'code')).toBeNull();
    expect(noeudsOmbre(hote, 'fragment')).toEqual([]);
  });

  it('projette au presentateur la solution de chaque enigme et le code final une fois le corrige pose', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.corrige = SOLUTIONNAIRE;

    expect(noeudsOmbre(hote, 'enonce').length).toBe(PARCOURS.enigmes.length);
    expect(noeudsOmbre(hote, 'solution').map((solution) => solution.textContent?.trim())).toEqual([
      '30000 · TR',
      '30000 · ES',
      '2500 · OR',
    ]);
    expect(noeudOmbre(hote, 'solution')?.getAttribute('data-etat')).toBe('confirme');
    expect(libelleOmbre(hote, 'code-final')).toBe('Code final : TRESOR');
  });

  it('sert a l etudiant la meme projection corrigee, jeu retire, une fois le corrige pose', () => {
    hote.corrige = SOLUTIONNAIRE;
    const etudiant = hote.shadowRoot?.querySelector('ol')?.innerHTML;

    expect(noeudsOmbre(hote, 'solution').length).toBe(3);
    expect(libelleOmbre(hote, 'code-final')).toBe('Code final : TRESOR');
    expect(noeudOmbre(hote, 'saisie')).toBeNull();
    expect(noeudOmbre(hote, 'progression')).toBeNull();
    expect(noeudOmbre(hote, 'minuteur')).toBeNull();
    expect(noeudOmbre(hote, 'annonce')).not.toBeNull();

    hote.setAttribute('data-cours-role', 'presentateur');
    expect(hote.shadowRoot?.querySelector('ol')?.innerHTML).toBe(etudiant);
  });

  it('ignore un corrige mal forme', () => {
    hote.corrige = { type: 'enigmes', enigmes: SOLUTIONNAIRE.enigmes };
    expect(noeudOmbre(hote, 'code-final')).toBeNull();
    expect(noeudOmbre(hote, 'saisie')).not.toBeNull();
  });

  it('annonce aux deux roles un parcours sans enigme', () => {
    hote.parcours = buildEscapeParcours({ id: 'ESC-VIDE', enigmes: [] });
    for (const role of ROLES) {
      hote.setAttribute('data-cours-role', role);
      expect(noeudOmbre(hote, 'vide')).withContext(role).not.toBeNull();
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
