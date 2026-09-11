import { buildVoteQuestion } from '../../../testing/factories/cours.factory';
import { base, components, stage, tokens } from '../design/styles';
import { shuffleWithSeed } from '../core/seed';
import { FpVote } from './FpVote';

const QUESTION = buildVoteQuestion();

const QUESTION_LARGE = buildVoteQuestion({
  id: 'Q-ORDRE-01',
  options: [
    { id: 'a', libelle: 'un', misconception: null },
    { id: 'b', libelle: 'deux', misconception: 'x' },
    { id: 'c', libelle: 'trois', misconception: 'x' },
    { id: 'd', libelle: 'quatre', misconception: 'x' },
    { id: 'e', libelle: 'cinq', misconception: 'x' },
    { id: 'f', libelle: 'six', misconception: 'x' },
  ],
});

function ordreAffiche(element: FpVote): string[] {
  return [...(element.shadowRoot?.querySelectorAll('[data-testid="option"]') ?? [])].map(
    (option) => option.getAttribute('data-option') ?? '',
  );
}

const DELAI_CLIC_MS = 300;
const ID_JE_NE_SAIS_PAS = '__je_ne_sais_pas__';

function mesurerDuree(lectureMs: number, rendus: number): number | undefined {
  jasmine.clock().install();
  try {
    jasmine.clock().mockDate(new Date('2026-09-11T08:00:00.000Z'));
    const element = document.createElement('fp-vote') as FpVote;
    element.question = QUESTION;
    element.setAttribute('seed', '1001');
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
    hote.setAttribute('seed', '1001');
    document.body.appendChild(hote);
  });

  afterEach(() => {
    hote.remove();
  });

  it('affiche toutes les options en mode main', () => {
    const options = hote.shadowRoot?.querySelectorAll('[data-testid="option"]');
    expect(options?.length).toBe(3);
  });

  it('ajoute une option je ne sais pas', () => {
    const bouton = hote.shadowRoot?.querySelector('[data-testid="je-ne-sais-pas"]');
    expect(bouton).toBeTruthy();
  });

  it('melange les options selon la graine', () => {
    const libelles = () =>
      [...(hote.shadowRoot?.querySelectorAll('[data-testid="option"]') ?? [])].map((element) =>
        element.textContent?.trim(),
      );
    const premier = libelles();
    hote.setAttribute('seed', '2002');
    expect(libelles()).not.toEqual(premier);
  });

  it('derive l ordre des options de la graine et non de l horloge', () => {
    hote.question = QUESTION_LARGE;
    const attendu = shuffleWithSeed([...QUESTION_LARGE.options], 1001).map((option) => option.id);
    expect(ordreAffiche(hote)).toEqual(attendu);
  });

  it('restitue le meme ordre a chaque rendu pour une meme graine', () => {
    hote.question = QUESTION_LARGE;
    const premier = ordreAffiche(hote);
    hote.resultats = { total: 3, parOption: { a: 3 } };
    hote.phase = 'discussion';
    expect(ordreAffiche(hote)).toEqual(premier);
  });

  it('emet la valeur choisie', (done) => {
    hote.addEventListener('fp-vote-submit', (event) => {
      expect((event as CustomEvent).detail.questionId).toBe('Q-CAP-03');
      done();
    });
    hote.shadowRoot?.querySelector<HTMLButtonElement>('[data-testid="option"]')?.click();
  });

  const CAS_DUREE: ReadonlyArray<{
    nom: string;
    lecture: number;
    rendus: number;
    attendu: number;
  }> = [
    { nom: 'une reponse instantanee', lecture: 0, rendus: 0, attendu: 300 },
    { nom: 'une reponse reflechie', lecture: 40000, rendus: 0, attendu: 40300 },
    {
      nom: 'une reponse reflechie coupee par deux rafraichissements',
      lecture: 40000,
      rendus: 2,
      attendu: 40300,
    },
  ];

  for (const cas of CAS_DUREE) {
    it(`mesure ${cas.nom} depuis la presentation de la question`, () => {
      expect(mesurerDuree(cas.lecture, cas.rendus)).toBe(cas.attendu);
    });
  }

  it('verrouille les options apres le vote', () => {
    hote.shadowRoot?.querySelector<HTMLButtonElement>('[data-testid="option"]')?.click();
    const options = hote.shadowRoot?.querySelectorAll<HTMLButtonElement>('[data-testid="option"]');
    expect([...(options ?? [])].every((bouton) => bouton.disabled)).toBe(true);
  });

  it('n affiche jamais quelle option est correcte avant la revelation', () => {
    expect(hote.shadowRoot?.innerHTML).not.toContain('misconception');
    expect(hote.shadowRoot?.querySelector('[data-correcte]')).toBeNull();
  });

  it('echappe le html injecte dans le libelle d une option', () => {
    const charge = '<img src=x onerror="alert(1)">';
    hote.question = buildVoteQuestion({
      id: 'Q-XSS-01',
      enonce: 'Question',
      options: [
        { id: 'a', libelle: charge, misconception: null },
        { id: 'b', libelle: 'reponse', misconception: 'distracteur' },
      ],
    });
    expect(hote.shadowRoot?.querySelector('img')).toBeNull();
    const bouton = hote.shadowRoot?.querySelector<HTMLButtonElement>('[data-option="a"]');
    expect(bouton?.textContent?.trim()).toBe(charge);
  });

  it('ignore une cle html ou un nom d etudiant inconnu dans resultats.parOption', () => {
    hote.setAttribute('role', 'presentateur');
    hote.setAttribute('render', 'stage');
    hote.question = QUESTION;
    const cleMalicieuse = '<img src=x onerror="alert(1)">';
    const cleNom = 'Jean Dupont';
    hote.resultats = {
      total: 14,
      parOption: { a: 7, b: 4, c: 1, [cleMalicieuse]: 1, [cleNom]: 1 },
    };
    expect(hote.shadowRoot?.querySelector('img')).toBeNull();
    expect(hote.shadowRoot?.innerHTML).not.toContain(cleNom);
    const barres = hote.shadowRoot?.querySelectorAll('[data-testid="barre"]');
    expect(barres?.length).toBe(3);
  });

  it('echappe l id d une option connue dans l histogramme', () => {
    hote.setAttribute('role', 'presentateur');
    hote.setAttribute('render', 'stage');
    hote.question = buildVoteQuestion({
      id: 'Q-QUOTE-01',
      enonce: 'Question',
      options: [{ id: 'a"b', libelle: 'Option', misconception: null }],
    });
    hote.resultats = { total: 1, parOption: { 'a"b': 1 } };
    const barre = hote.shadowRoot?.querySelector<HTMLElement>('[data-testid="barre"]');
    expect(barre?.getAttribute('data-option')).toBe('a"b');
  });

  it('ne conserve pas la misconception en role etudiant', () => {
    expect(hote.question?.options.every((option) => !('misconception' in option))).toBe(true);
  });

  it('conserve la misconception en role presentateur', () => {
    hote.setAttribute('role', 'presentateur');
    hote.question = QUESTION;
    expect(hote.question?.options[0]).toEqual(QUESTION.options[0]);
    expect(hote.question?.options[0]).toEqual(
      jasmine.objectContaining({ misconception: 'interet-simple' }),
    );
  });

  it('n affiche en mode scene que des identifiants d option connus', () => {
    hote.setAttribute('role', 'presentateur');
    hote.setAttribute('render', 'stage');
    hote.question = QUESTION;
    hote.resultats = { total: 12, parOption: { a: 7, b: 4, c: 1 } };
    const barres = hote.shadowRoot?.querySelectorAll<HTMLElement>('[data-testid="barre"]');
    expect(barres?.length).toBe(3);
    for (const barre of [...(barres ?? [])]) {
      expect(['a', 'b', 'c']).toContain(barre.getAttribute('data-option') ?? '');
    }
  });

  it('donne a chaque barre une largeur qui reflete sa proportion', () => {
    hote.setAttribute('role', 'presentateur');
    hote.setAttribute('render', 'stage');
    hote.question = QUESTION;
    hote.resultats = { total: 12, parOption: { a: 7, b: 4, c: 1 } };
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

  it('pose toutes les pistes sur un rail de meme longueur quels que soient les libelles', () => {
    hote.style.display = 'block';
    hote.style.width = '600px';
    hote.setAttribute('role', 'presentateur');
    hote.setAttribute('render', 'stage');
    hote.question = buildVoteQuestion({
      id: 'Q-RAIL-01',
      options: [
        { id: 'a', libelle: 'Non', misconception: null },
        { id: 'b', libelle: 'Un libelle nettement plus long que le premier', misconception: 'x' },
      ],
    });
    hote.resultats = { total: 100, parOption: { a: 95, b: 5 } };
    const pistes = [...(hote.shadowRoot?.querySelectorAll<HTMLElement>('.fp-barre__piste') ?? [])];
    const largeurs = pistes.map((piste) => piste.getBoundingClientRect().width);
    expect(largeurs.length).toBe(2);
    expect(largeurs[0]).toBeGreaterThan(0);
    expect(largeurs[1]).toBeCloseTo(largeurs[0], 1);
  });

  it('etiquette chaque barre avec le libelle de son option', () => {
    hote.setAttribute('role', 'presentateur');
    hote.setAttribute('render', 'stage');
    hote.question = QUESTION;
    hote.resultats = { total: 12, parOption: { a: 7, b: 4, [ID_JE_NE_SAIS_PAS]: 1 } };
    const libelles = [
      ...(hote.shadowRoot?.querySelectorAll('[data-testid="barre-libelle"]') ?? []),
    ].map((etiquette) => etiquette.textContent);
    expect(libelles).toEqual(['1 400 €', '1 480,24 €', 'Je ne sais pas']);
  });

  it('toute classe fp emise par la brique porte une regle dans la feuille', () => {
    const feuille = [tokens, base, components, stage].join('\n');
    const emises = new Set<string>();
    for (const rendu of ['hand', 'stage', 'board']) {
      hote.setAttribute('role', 'presentateur');
      hote.setAttribute('render', rendu);
      hote.question = QUESTION;
      hote.resultats = { total: 12, parOption: { a: 7, b: 4, c: 1 } };
      for (const element of hote.shadowRoot?.querySelectorAll('[class]') ?? []) {
        for (const classe of element.classList) {
          emises.add(classe);
        }
      }
    }
    expect(emises.size).toBeGreaterThanOrEqual(11);
    for (const classe of emises) {
      expect(new RegExp(`\\.${classe}(?![\\w-])`).test(feuille))
        .withContext(`aucune regle pour .${classe}`)
        .toBe(true);
    }
  });

  it('affiche la repartition par misconception en mode tableau', () => {
    hote.setAttribute('role', 'presentateur');
    hote.setAttribute('render', 'board');
    hote.question = QUESTION;
    hote.resultats = { total: 12, parOption: { a: 7, b: 4, c: 1 } };
    const bandeau = hote.shadowRoot?.querySelector('[data-testid="erreur-dominante"]');
    expect(bandeau?.textContent).toContain('interet-simple');
  });

  it('recommande de reexpliquer sous le seuil', () => {
    hote.setAttribute('role', 'presentateur');
    hote.setAttribute('render', 'board');
    hote.question = QUESTION;
    hote.seuil = 0.7;
    hote.resultats = { total: 12, parOption: { a: 7, b: 4, c: 1 } };
    const verdict = hote.shadowRoot?.querySelector('[data-testid="verdict"]');
    expect(verdict?.textContent).toContain('Réexpliquer');
  });

  it('rafraichit le verdict quand le seuil change apres les resultats', () => {
    hote.setAttribute('role', 'presentateur');
    hote.setAttribute('render', 'board');
    hote.question = QUESTION;
    hote.resultats = { total: 12, parOption: { a: 7, b: 4, c: 1 } };
    hote.seuil = 0.1;
    const verdict = hote.shadowRoot?.querySelector('[data-testid="verdict"]');
    expect(verdict?.textContent).toContain('Passer');
  });

  it('recommande d avancer au dessus du seuil', () => {
    hote.setAttribute('role', 'presentateur');
    hote.setAttribute('render', 'board');
    hote.question = QUESTION;
    hote.seuil = 0.7;
    hote.resultats = { total: 10, parOption: { a: 1, b: 9, c: 0 } };
    const verdict = hote.shadowRoot?.querySelector('[data-testid="verdict"]');
    expect(verdict?.textContent).toContain('Passer');
  });

  it('deverrouille les options apres passage en revote', () => {
    hote.shadowRoot?.querySelector<HTMLButtonElement>('[data-testid="option"]')?.click();
    let options = hote.shadowRoot?.querySelectorAll<HTMLButtonElement>('[data-testid="option"]');
    expect([...(options ?? [])].every((b) => b.disabled)).toBe(true);
    hote.phase = 'revote';
    options = hote.shadowRoot?.querySelectorAll<HTMLButtonElement>('[data-testid="option"]');
    expect([...(options ?? [])].every((b) => b.disabled)).toBe(false);
  });

  it('emet fp-vote-phase quand la phase change', (done) => {
    hote.addEventListener('fp-vote-phase', (event) => {
      expect((event as CustomEvent).detail.phase).toBe('discussion');
      done();
    });
    hote.phase = 'discussion';
  });

  it('expose un groupe de reponses accessible', () => {
    expect(hote.shadowRoot?.querySelector('fieldset')).toBeTruthy();
    expect(hote.shadowRoot?.querySelector('legend')).toBeTruthy();
  });

  it('annonce le retour dans une region live', () => {
    const region = hote.shadowRoot?.querySelector('[aria-live]');
    expect(region).toBeTruthy();
  });

  it('alimente la region live apres le vote', () => {
    hote.shadowRoot?.querySelector<HTMLButtonElement>('[data-testid="option"]')?.click();
    const region = hote.shadowRoot?.querySelector('[data-testid="retour"]');
    expect(region?.textContent?.trim()).toBe('Réponse enregistrée');
  });

  it('permet de repondre je ne sais pas', (done) => {
    hote.addEventListener('fp-vote-submit', (event) => {
      expect((event as CustomEvent).detail.valeur).toBe('__je_ne_sais_pas__');
      done();
    });
    hote.shadowRoot?.querySelector<HTMLButtonElement>('[data-testid="je-ne-sais-pas"]')?.click();
  });
});
