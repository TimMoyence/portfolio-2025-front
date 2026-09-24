import { creerMetadonneesBrique } from '../../content/types';
import { buildVerdictDeReponse, buildVoteQuestion } from '../../../testing/factories/cours.factory';
import { classesOrphelines } from '../../../testing/classes-briques';
import { FpVote } from './FpVote';

const QUESTION = buildVoteQuestion();
const JUMELLE = buildVoteQuestion({
  id: 'Q-CAP-03-JUMELLE',
  enonce: 'Un capital de 2 000 € place a 4 % pendant 10 ans vaut :',
  options: [
    { id: 'j-a', libelle: '2 800 €' },
    { id: 'j-b', libelle: '2 960,49 €' },
  ],
});

const QUESTION_LARGE = buildVoteQuestion({
  id: 'Q-ORDRE-01',
  options: ['f', 'b', 'd', 'a', 'e', 'c'].map((id) => ({ id, libelle: `option ${id}` })),
});

const REVELATION = {
  type: 'revelation',
  titre: 'Ce que montre le cas jumeau',
  lignes: ['Le capital double, la valeur acquise double.'],
};

const DELAI_CLIC_MS = 300;
const ID_JE_NE_SAIS_PAS = '__je_ne_sais_pas__';
const RESULTATS = { total: 12, parOption: { a: 7, b: 4, c: 1 } };

function ordreAffiche(element: FpVote): string[] {
  return [...(element.shadowRoot?.querySelectorAll('[data-testid="option"]') ?? [])].map(
    (option) => option.getAttribute('data-option') ?? '',
  );
}

function options(element: FpVote): HTMLButtonElement[] {
  return [...(element.shadowRoot?.querySelectorAll<HTMLButtonElement>('[data-option]') ?? [])];
}

function legende(element: FpVote): string {
  return element.shadowRoot?.querySelector('legend')?.textContent?.trim() ?? '';
}

function marque(element: FpVote, nom: string): Element | null {
  return element.shadowRoot?.querySelector(`[data-testid="${nom}"]`) ?? null;
}

function mesurerDuree(lectureMs: number, rendus: number): number | undefined {
  jasmine.clock().install();
  try {
    jasmine.clock().mockDate(new Date('2026-09-11T08:00:00.000Z'));
    const element = document.createElement('fp-vote') as FpVote;
    element.question = QUESTION;
    document.body.appendChild(element);
    const durees: number[] = [];
    element.addEventListener('fp-vote-submit', (evenement) => {
      durees.push((evenement as CustomEvent).detail.dureeMs);
    });
    jasmine.clock().tick(lectureMs);
    for (let index = 1; index <= rendus; index += 1) {
      element.resultats = { total: index, parOption: { a: index } };
    }
    jasmine.clock().tick(DELAI_CLIC_MS);
    element.shadowRoot?.querySelector<HTMLButtonElement>('[data-testid="option"]')?.click();
    element.remove();
    return durees[0];
  } finally {
    jasmine.clock().uninstall();
  }
}

describe('FpVote', () => {
  let hote: FpVote;

  beforeAll(() => {
    if (!customElements.get('fp-vote')) {
      customElements.define('fp-vote', FpVote);
    }
  });

  beforeEach(() => {
    hote = document.createElement('fp-vote') as FpVote;
    hote.question = QUESTION;
    document.body.appendChild(hote);
  });

  afterEach(() => {
    hote.remove();
  });

  function presenter(): void {
    hote.setAttribute('data-cours-role', 'presentateur');
  }

  function structure(element: FpVote): string[] {
    return [...(element.shadowRoot?.querySelectorAll('.fp-root *') ?? [])].map(
      (noeud) => `${noeud.localName}.${noeud.className}`,
    );
  }

  it('affiche toutes les options et une option je ne sais pas pour l etudiant', () => {
    expect(ordreAffiche(hote).length).toBe(3);
    expect(marque(hote, 'je-ne-sais-pas')).toBeTruthy();
  });

  it('montre au presentateur les memes options, desactivees et sans je ne sais pas', () => {
    presenter();

    expect(ordreAffiche(hote)).toEqual(['a', 'b', 'c']);
    expect(legende(hote)).toBe(QUESTION.enonce);
    expect(marque(hote, 'je-ne-sais-pas')).toBeNull();
    expect(marque(hote, 'retour')).toBeNull();
    expect(options(hote).every((bouton) => bouton.disabled)).toBeTrue();
  });

  it('pose la meme carte et le meme fieldset d options pour les deux roles', () => {
    const etudiant = structure(hote).filter((noeud) => !noeud.includes('neutre'));
    presenter();
    const presentateur = structure(hote);

    for (const noeud of [
      'div.fp-carte fp-scene',
      'fieldset.fp-vote__options',
      'legend.fp-enonce',
    ]) {
      expect(etudiant).toContain(noeud);
      expect(presentateur).toContain(noeud);
    }
    expect(hote.shadowRoot?.querySelector('.fp-root')?.getAttribute('data-role')).toBe(
      'presentateur',
    );
  });

  it('n emet aucun vote depuis le poste presentateur', () => {
    presenter();
    const emis: unknown[] = [];
    hote.addEventListener('fp-vote-submit', (evenement) => emis.push(evenement));

    options(hote)[0].click();

    expect(emis).toEqual([]);
  });

  it('garde l ordre servi, deja melange par le serveur, sans graine locale', () => {
    hote.setAttribute('seed', '2002');
    hote.question = QUESTION_LARGE;

    expect(ordreAffiche(hote)).toEqual(['f', 'b', 'd', 'a', 'e', 'c']);
  });

  it('emet la valeur choisie avec l identifiant stable de l option', (done) => {
    hote.addEventListener('fp-vote-submit', (event) => {
      expect((event as CustomEvent).detail).toEqual(
        jasmine.objectContaining({ questionId: 'Q-CAP-03', valeur: 'b' }),
      );
      done();
    });
    hote.shadowRoot?.querySelector<HTMLButtonElement>('[data-option="b"]')?.click();
  });

  for (const cas of [
    { nom: 'une reponse instantanee', lecture: 0, rendus: 0, attendu: 300 },
    {
      nom: 'une reponse reflechie coupee par deux rafraichissements',
      lecture: 40000,
      rendus: 2,
      attendu: 40300,
    },
  ]) {
    it(`mesure ${cas.nom} depuis la presentation de la question`, () => {
      expect(mesurerDuree(cas.lecture, cas.rendus)).toBe(cas.attendu);
    });
  }

  it('verrouille les options apres le vote et l annonce dans la region live', () => {
    options(hote)[0].click();

    expect(options(hote).every((bouton) => bouton.disabled)).toBeTrue();
    expect(marque(hote, 'retour')?.textContent?.trim()).toBe('Réponse enregistrée');
  });

  it('permet de repondre je ne sais pas', (done) => {
    hote.addEventListener('fp-vote-submit', (event) => {
      expect((event as CustomEvent).detail.valeur).toBe(ID_JE_NE_SAIS_PAS);
      done();
    });
    hote.shadowRoot?.querySelector<HTMLButtonElement>('[data-testid="je-ne-sais-pas"]')?.click();
  });

  it('echappe le html injecte dans le libelle d une option', () => {
    const charge = '<img src=x onerror="alert(1)">';
    hote.question = buildVoteQuestion({
      id: 'Q-XSS-01',
      options: [
        { id: 'a', libelle: charge },
        { id: 'b', libelle: 'reponse' },
      ],
    });
    expect(hote.shadowRoot?.querySelector('img')).toBeNull();
    expect(hote.shadowRoot?.querySelector('[data-option="a"]')?.textContent?.trim()).toBe(charge);
  });

  it('ne garde que les champs publics d une question, meme en role presentateur', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.question = {
      ...QUESTION,
      options: QUESTION.options.map((option) => ({ ...option, confusion: 'secret' })),
    };
    expect(JSON.stringify(hote.question)).not.toContain('secret');
  });

  it('garde les metadonnees publiques de la question sans les afficher en badge', () => {
    presenter();

    hote.question = buildVoteQuestion({
      id: 'Q-CAP-04',
      metadonnees: creerMetadonneesBrique({
        concepts: ['capitalisation'],
        misconceptionsCiblees: [],
        dureeMinutes: 2,
        modalite: 'classe',
        regime: 'ouvert',
      }),
    });

    expect(hote.question?.metadonnees?.modalite).toBe('classe');
    expect(hote.question?.metadonnees?.dureeMinutes).toBe(2);
    expect(marque(hote, 'modalite')).toBeNull();
    expect(marque(hote, 'duree')).toBeNull();
  });

  it('en cours de vote simple, ne projette au presentateur que le decompte', () => {
    presenter();
    hote.resultats = RESULTATS;

    expect(marque(hote, 'decompte')?.textContent).toContain('12');
    expect(marque(hote, 'histogramme')).toBeNull();
  });

  it('projette l histogramme au presentateur une fois le vote clos', () => {
    presenter();
    hote.resultats = RESULTATS;
    hote.cloture = true;

    expect(marque(hote, 'histogramme')?.querySelectorAll('[data-testid="barre"]').length).toBe(4);
    expect(marque(hote, 'decompte')?.textContent).toContain('12');
  });

  for (const role of ['etudiant', 'presentateur'] as const) {
    it(`revele au role ${role} la bonne reponse et marque la bonne option quand le corrige est pose`, () => {
      hote.setAttribute('data-cours-role', role);
      expect(marque(hote, 'bonne-reponse')).toBeNull();

      hote.corrige = { type: 'cible', cible: '1 480,24 €', optionId: 'b' };

      expect(marque(hote, 'bonne-reponse')?.textContent).toContain('1 480,24 €');
      expect(marque(hote, 'bonne-reponse')?.getAttribute('data-etat')).toBe('confirme');
      expect(
        hote.shadowRoot?.querySelector('[data-option="b"]')?.getAttribute('data-correction'),
      ).toBe('juste');
      expect(
        hote.shadowRoot?.querySelector('[data-option="a"]')?.hasAttribute('data-correction'),
      ).toBeFalse();
    });
  }

  it('marque comme fausse l option choisie par l etudiant quand ce n est pas la bonne', () => {
    options(hote)[0].click();

    hote.corrige = { type: 'cible', cible: '1 480,24 €', optionId: 'b' };

    expect(
      hote.shadowRoot?.querySelector('[data-option="a"]')?.getAttribute('data-correction'),
    ).toBe('fausse');
    expect(
      hote.shadowRoot?.querySelector('[data-option="c"]')?.hasAttribute('data-correction'),
    ).toBeFalse();
  });

  it('ne marque aucune option quand le corrige ne porte pas d identifiant d option', () => {
    hote.corrige = { type: 'cible', cible: '1 480,24 €' };

    expect(marque(hote, 'bonne-reponse')).not.toBeNull();
    expect(hote.shadowRoot?.querySelector('[data-correction]')).toBeNull();
  });

  describe('instruction par les pairs', () => {
    beforeEach(() => {
      hote.questionJumelle = JUMELLE;
    });

    it('fait voter sur la principale en phase vote, sans montrer la jumelle', () => {
      hote.phase = 'vote';

      expect(legende(hote)).toBe(QUESTION.enonce);
      expect(marque(hote, 'phase')?.textContent).toContain('Votez seul·e');
      expect(hote.shadowRoot?.innerHTML).not.toContain(JUMELLE.enonce);
    });

    it('ferme le vote pendant la discussion', () => {
      hote.phase = 'discussion';

      expect(options(hote).every((bouton) => bouton.disabled)).toBeTrue();
      expect(marque(hote, 'phase')?.textContent).toContain('Discutez avec votre voisin');
    });

    it('ouvre la jumelle en revote, meme apres un vote sur la principale', () => {
      hote.phase = 'vote';
      options(hote)[0].click();
      const emis: string[] = [];
      hote.addEventListener('fp-vote-submit', (event) =>
        emis.push((event as CustomEvent).detail.questionId),
      );

      hote.phase = 'revote';

      expect(legende(hote)).toBe(JUMELLE.enonce);
      expect(options(hote).every((bouton) => !bouton.disabled)).toBeTrue();
      options(hote)[1].click();
      expect(emis).toEqual([JUMELLE.id]);
    });

    it('n emet rien quand l hote change la phase', () => {
      const emis: string[] = [];
      hote.addEventListener('fp-vote-phase', () => emis.push('phase'));
      hote.phase = 'discussion';
      hote.phase = 'revote';
      expect(emis).toEqual([]);
    });

    it('ne montre les verdicts qu a la revelation', () => {
      hote.phase = 'vote';
      hote.verdicts = [buildVerdictDeReponse({ questionId: QUESTION.id })];

      expect(marque(hote, 'verdict')).toBeNull();
      expect(options(hote).every((bouton) => bouton.disabled)).toBeTrue();

      hote.phase = 'revele';
      hote.verdicts = [
        buildVerdictDeReponse({ questionId: QUESTION.id }),
        buildVerdictDeReponse({ questionId: JUMELLE.id, correcte: true, libelleConfusion: null }),
      ];

      expect(marque(hote, 'verdict')?.getAttribute('data-etat')).toBe('confirme');
    });

    it('au presentateur, ne montre l histogramme qu en phase revele', () => {
      presenter();
      hote.resultats = RESULTATS;
      hote.phase = 'revote';

      expect(marque(hote, 'histogramme')).toBeNull();
      expect(marque(hote, 'decompte')?.textContent).toContain('12');

      hote.phase = 'revele';

      expect(marque(hote, 'histogramme')).not.toBeNull();
    });

    it('RET-20 · projette les resultats du premier vote pendant la discussion, sans la bonne reponse tant que le corrige n est pas pose', () => {
      presenter();
      hote.resultats = RESULTATS;
      hote.phase = 'discussion';

      const histogramme = marque(hote, 'histogramme');
      expect(histogramme?.getAttribute('data-vote')).toBe('premier');
      expect(histogramme?.querySelectorAll('[data-testid="barre"]').length).toBe(4);
      expect(marque(hote, 'bonne-reponse')).toBeNull();
    });

    it('RET-20 · projette cote a cote les deux votes une fois la reponse revelee', () => {
      presenter();
      hote.resultatsPremierVote = RESULTATS;
      hote.resultats = { total: 10, parOption: { 'j-a': 2, 'j-b': 8 } };
      hote.phase = 'revele';

      const histogrammes = [
        ...(hote.shadowRoot?.querySelectorAll('[data-testid="histogramme"]') ?? []),
      ];
      expect(histogrammes.map((element) => element.getAttribute('data-vote'))).toEqual([
        'premier',
        'second',
      ]);
      expect(histogrammes[0].textContent).toContain('58%');
      expect(histogrammes[1].textContent).toContain('80%');
    });

    for (const role of ['etudiant', 'presentateur'] as const) {
      it(`montre la revelation au role ${role} des que le corrige est pose, quelle que soit la phase`, () => {
        hote.setAttribute('data-cours-role', role);
        hote.phase = 'vote';
        expect(marque(hote, 'revelation')).toBeNull();

        hote.corrige = REVELATION;

        expect(marque(hote, 'revelation')?.textContent).toContain('Le capital double');
      });
    }
  });

  it('montre le verdict d un vote simple des qu il arrive', () => {
    hote.verdicts = [buildVerdictDeReponse({ questionId: QUESTION.id })];

    expect(marque(hote, 'verdict')?.textContent).toContain('À revoir');
    expect(options(hote).every((bouton) => bouton.disabled)).toBeTrue();
  });

  it('montre le deja repondu et ferme le vote', () => {
    hote.dejaRepondu = true;

    expect(marque(hote, 'deja-repondu')).not.toBeNull();
    expect(options(hote).every((bouton) => bouton.disabled)).toBeTrue();
  });

  it('ignore une cle html ou un nom d etudiant inconnu dans resultats.parOption', () => {
    presenter();
    hote.phase = 'revele';
    const cleMalicieuse = '<img src=x onerror="alert(1)">';
    hote.resultats = {
      total: 14,
      parOption: { a: 7, b: 4, c: 1, [cleMalicieuse]: 1, 'Jean Dupont': 1 },
    };

    expect(hote.shadowRoot?.querySelector('img')).toBeNull();
    expect(hote.shadowRoot?.innerHTML).not.toContain('Jean Dupont');
    expect(hote.shadowRoot?.querySelectorAll('[data-testid="barre"]').length).toBe(4);
  });

  it('donne a chaque barre une largeur qui reflete sa proportion', () => {
    presenter();
    hote.phase = 'revele';
    hote.resultats = RESULTATS;
    const largeurs = new Map(
      [...(hote.shadowRoot?.querySelectorAll<HTMLElement>('[data-testid="barre"]') ?? [])].map(
        (barre) => [
          barre.getAttribute('data-option') ?? '',
          barre.querySelector<HTMLElement>('[data-testid="barre-valeur"]')?.style.width,
        ],
      ),
    );
    expect(largeurs.get('a')).toBe('58%');
    expect(largeurs.get('b')).toBe('33%');
    expect(largeurs.get('c')).toBe('8%');
  });

  it('etiquette chaque barre avec le libelle de son option', () => {
    presenter();
    hote.phase = 'revele';
    hote.resultats = { total: 12, parOption: { a: 7, b: 4, [ID_JE_NE_SAIS_PAS]: 1 } };
    const libelles = [
      ...(hote.shadowRoot?.querySelectorAll('[data-testid="barre-libelle"]') ?? []),
    ].map((etiquette) => etiquette.textContent);
    expect(libelles).toEqual(['1 400 €', '1 480,24 €', '1 040 €', 'Je ne sais pas']);
  });

  it('pose toutes les pistes sur un rail de meme longueur quels que soient les libelles', () => {
    hote.style.display = 'block';
    hote.style.width = '600px';
    presenter();
    hote.phase = 'revele';
    hote.question = buildVoteQuestion({
      id: 'Q-RAIL-01',
      options: [
        { id: 'a', libelle: 'Non' },
        { id: 'b', libelle: 'Un libelle nettement plus long que le premier' },
      ],
    });
    hote.resultats = { total: 100, parOption: { a: 95, b: 5 } };
    const largeurs = [
      ...(hote.shadowRoot?.querySelectorAll<HTMLElement>('.fp-vote__barre__piste') ?? []),
    ].map((piste) => piste.getBoundingClientRect().width);
    expect(largeurs.length).toBe(3);
    expect(largeurs[0]).toBeGreaterThan(0);
    expect(largeurs[1]).toBeCloseTo(largeurs[0], 1);
  });

  it('toute classe fp emise par la brique porte une regle dans la feuille', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.questionJumelle = JUMELLE;
    hote.phase = 'revele';
    hote.corrige = REVELATION;
    hote.resultats = RESULTATS;
    hote.verdicts = [buildVerdictDeReponse({ questionId: JUMELLE.id })];
    expect(classesOrphelines(hote, 'vote')).toEqual([]);
  });
});
