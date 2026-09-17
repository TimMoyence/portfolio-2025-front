import { FpQuiz, type QuizQuestion } from './FpQuiz';

const QUESTION: QuizQuestion = {
  id: 'Q-B2-03',
  enonce: 'Quel graphique monte le plus ?',
  options: [
    { id: 'a', libelle: 'Le graphique A' },
    { id: 'b', libelle: 'Le graphique B' },
    { id: 'c', libelle: 'Ils montrent la même progression' },
  ],
  bonneReponse: 'c',
  retourBonne: 'Même variation : seule l’échelle visuelle change.',
  retourErreur: 'Regardez les valeurs avant de comparer la pente.',
};

describe('FpQuiz', () => {
  let hote: FpQuiz;

  beforeAll(() => {
    if (!customElements.get('fp-quiz')) {
      customElements.define('fp-quiz', FpQuiz);
    }
  });

  beforeEach(() => {
    hote = document.createElement('fp-quiz') as FpQuiz;
    hote.question = QUESTION;
    document.body.appendChild(hote);
  });

  afterEach(() => hote.remove());

  it('affiche les options et garde la réponse masquée avant le choix', () => {
    expect(hote.shadowRoot?.querySelectorAll('[data-testid="option"]').length).toBe(3);
    expect(hote.shadowRoot?.querySelector('[data-testid="feedback"]')).toBeNull();
  });

  it('révèle le feedback pédagogique après le choix', () => {
    hote.shadowRoot?.querySelector<HTMLButtonElement>('[data-option="c"]')?.click();

    expect(hote.shadowRoot?.querySelector('[data-testid="feedback"]')?.textContent).toContain(
      'Même variation',
    );
    expect(
      hote.shadowRoot?.querySelector<HTMLButtonElement>('[data-option="c"]')?.disabled,
    ).toBeTrue();
  });

  it('émet une réponse pour la progression de séance', () => {
    const reponses: unknown[] = [];
    hote.addEventListener('fp-quiz-submit', (event) => {
      reponses.push((event as CustomEvent).detail);
    });

    hote.shadowRoot?.querySelector<HTMLButtonElement>('[data-option="a"]')?.click();

    expect(reponses).toEqual([jasmine.objectContaining({ questionId: 'Q-B2-03', valeur: 'a' })]);
  });
});
