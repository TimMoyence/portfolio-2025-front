import { adoptCoursStyles, resetCoursStyles } from './sheet';

describe('adoptCoursStyles', () => {
  let hote: HTMLDivElement;
  let racine: ShadowRoot;

  beforeEach(() => {
    resetCoursStyles();
    hote = document.createElement('div');
    document.body.appendChild(hote);
    racine = hote.attachShadow({ mode: 'open' });
  });

  afterEach(() => {
    hote.remove();
  });

  it('adopte la feuille dans une racine shadow', () => {
    adoptCoursStyles(racine);
    expect(racine.adoptedStyleSheets.length).toBeGreaterThan(0);
  });

  it('ne construit la feuille qu une seule fois', () => {
    adoptCoursStyles(racine);
    const premiere = racine.adoptedStyleSheets[0];
    const autre = document.createElement('div').attachShadow({ mode: 'open' });
    adoptCoursStyles(autre);
    expect(autre.adoptedStyleSheets[0]).toBe(premiere);
  });

  it('n adopte pas deux fois dans la meme racine', () => {
    adoptCoursStyles(racine);
    adoptCoursStyles(racine);
    expect(racine.adoptedStyleSheets.length).toBe(1);
  });

  it('G2 · donne à la projection les couleurs du poste étudiant et une échelle valide', () => {
    adoptCoursStyles(racine);
    racine.innerHTML = `
      <div class="fp-root" data-role="etudiant" data-testid="etudiant"></div>
      <div class="fp-root" data-role="presentateur" data-testid="presentateur"></div>
    `;
    const jetons = (role: string): Record<string, string> => {
      const element = racine.querySelector(`[data-testid="${role}"]`);
      const style = element === null ? null : getComputedStyle(element);
      return Object.fromEntries(
        ['--fp-surface', '--fp-confirme', '--fp-a-revoir', '--fp-en-cours', '--fp-remplissage'].map(
          (jeton) => [jeton, style?.getPropertyValue(jeton).trim() ?? ''],
        ),
      );
    };
    const corps = racine.querySelector('[data-testid="presentateur"]');

    expect(jetons('presentateur')).toEqual(jetons('etudiant'));
    expect(
      corps === null ? '' : getComputedStyle(corps).getPropertyValue('--fp-echelle').trim(),
    ).toMatch(/^\d+(\.\d+)?$/);
  });

  it('masque à l’impression la validation et le « je ne sais pas », sans objet sur papier', () => {
    adoptCoursStyles(racine);
    const impression = Array.from(racine.adoptedStyleSheets[0].cssRules).filter(
      (regle): regle is CSSMediaRule =>
        regle instanceof CSSMediaRule && regle.conditionText === 'print',
    );
    const masques = impression
      .flatMap((regle) => Array.from(regle.cssRules))
      .filter(
        (regle): regle is CSSStyleRule =>
          regle instanceof CSSStyleRule && regle.style.display === 'none',
      )
      .map((regle) => regle.selectorText)
      .join(' ');

    expect(masques).toContain(`[data-testid="valider"]`);
    expect(masques).toContain(`[data-testid="je-ne-sais-pas"]`);
    expect(masques).toContain(`[data-option="__je_ne_sais_pas__"]`);
  });

  it('n adopte rien et ne leve pas quand CSSStyleSheet est indisponible (SSR)', () => {
    const contexte = globalThis as unknown as { CSSStyleSheet?: typeof CSSStyleSheet };
    const original = contexte.CSSStyleSheet;
    contexte.CSSStyleSheet = undefined;
    try {
      expect(() => adoptCoursStyles(racine)).not.toThrow();
      expect(racine.adoptedStyleSheets.length).toBe(0);
    } finally {
      contexte.CSSStyleSheet = original;
    }
  });
});
