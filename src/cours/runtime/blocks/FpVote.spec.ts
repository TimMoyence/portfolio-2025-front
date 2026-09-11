import { FpVote } from './FpVote';

const QUESTION = {
  id: 'Q-CAP-03',
  enonce: 'Un capital de 1 000 € place a 4 % pendant 10 ans vaut :',
  options: [
    { id: 'a', libelle: '1 400 €', misconception: 'interet-simple' },
    { id: 'b', libelle: '1 480,24 €', misconception: null },
    { id: 'c', libelle: '1 040 €', misconception: 'oubli-de-la-duree' },
  ],
};

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

  it('emet la valeur choisie', (done) => {
    hote.addEventListener('fp-vote-submit', (event) => {
      expect((event as CustomEvent).detail.questionId).toBe('Q-CAP-03');
      done();
    });
    hote.shadowRoot?.querySelector<HTMLButtonElement>('[data-testid="option"]')?.click();
  });

  it('mesure la duree de reponse', (done) => {
    hote.addEventListener('fp-vote-submit', (event) => {
      expect((event as CustomEvent).detail.dureeMs).toBeGreaterThanOrEqual(0);
      done();
    });
    hote.shadowRoot?.querySelector<HTMLButtonElement>('[data-testid="option"]')?.click();
  });

  it('verrouille les options apres le vote', () => {
    hote.shadowRoot?.querySelector<HTMLButtonElement>('[data-testid="option"]')?.click();
    const options = hote.shadowRoot?.querySelectorAll<HTMLButtonElement>('[data-testid="option"]');
    expect([...(options ?? [])].every((bouton) => bouton.disabled)).toBe(true);
  });

  it('n affiche jamais quelle option est correcte avant la revelation', () => {
    expect(hote.shadowRoot?.innerHTML).not.toContain('misconception');
    expect(hote.shadowRoot?.querySelector('[data-correcte]')).toBeNull();
  });

  it('ne conserve pas la misconception en role etudiant', () => {
    expect(hote.question?.options.every((option) => !('misconception' in option))).toBe(true);
  });

  it('conserve la misconception en role presentateur', () => {
    hote.setAttribute('role', 'presentateur');
    hote.question = QUESTION;
    expect(hote.question?.options[0].misconception).toBe('interet-simple');
  });

  it('n affiche aucun nom d etudiant en mode scene', () => {
    hote.setAttribute('role', 'presentateur');
    hote.setAttribute('render', 'stage');
    hote.question = QUESTION;
    hote.resultats = { total: 12, parOption: { a: 7, b: 4, c: 1 } };
    expect(hote.shadowRoot?.innerHTML).not.toContain('@');
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

  it('recommande d avancer au dessus du seuil', () => {
    hote.setAttribute('role', 'presentateur');
    hote.setAttribute('render', 'board');
    hote.question = QUESTION;
    hote.seuil = 0.7;
    hote.resultats = { total: 10, parOption: { a: 1, b: 9, c: 0 } };
    const verdict = hote.shadowRoot?.querySelector('[data-testid="verdict"]');
    expect(verdict?.textContent).toContain('Passer');
  });

  it('propose un revote apres la phase de discussion', () => {
    hote.phase = 'revote';
    const options = hote.shadowRoot?.querySelectorAll<HTMLButtonElement>('[data-testid="option"]');
    expect([...(options ?? [])].every((bouton) => bouton.disabled)).toBe(false);
  });

  it('expose un groupe de reponses accessible', () => {
    expect(hote.shadowRoot?.querySelector('fieldset')).toBeTruthy();
    expect(hote.shadowRoot?.querySelector('legend')).toBeTruthy();
  });

  it('annonce le retour dans une region live', () => {
    const region = hote.shadowRoot?.querySelector('[aria-live]');
    expect(region).toBeTruthy();
  });
});
