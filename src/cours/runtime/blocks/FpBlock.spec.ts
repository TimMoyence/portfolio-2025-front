import { FpBlock } from './FpBlock';

class FpDemo extends FpBlock {
  renderStage(): string {
    return '<p data-testid="scene">scene</p>';
  }
  renderHand(): string {
    return '<button data-testid="action">agir</button>';
  }
  renderBoard(): string {
    return '<p data-testid="tableau">tableau</p>';
  }
  bind(racine: ShadowRoot): void {
    racine
      .querySelector('[data-testid="action"]')
      ?.addEventListener('click', () => this.emit('fp-action', { ok: true }));
  }
}

describe('FpBlock', () => {
  let hote: FpDemo;

  beforeAll(() => {
    if (!customElements.get('fp-demo')) {
      customElements.define('fp-demo', FpDemo);
    }
  });

  beforeEach(() => {
    hote = document.createElement('fp-demo') as FpDemo;
    document.body.appendChild(hote);
  });

  afterEach(() => {
    hote.remove();
  });

  it('rend le mode main par defaut', () => {
    expect(hote.shadowRoot?.querySelector('[data-testid="action"]')).toBeTruthy();
  });

  it('rend le mode scene quand l attribut le demande', () => {
    hote.setAttribute('render', 'stage');
    expect(hote.shadowRoot?.querySelector('[data-testid="scene"]')).toBeTruthy();
  });

  it('rend le mode tableau quand l attribut le demande', () => {
    hote.setAttribute('render', 'board');
    expect(hote.shadowRoot?.querySelector('[data-testid="tableau"]')).toBeTruthy();
  });

  it('adopte les styles du design system', () => {
    expect(hote.shadowRoot?.adoptedStyleSheets.length).toBeGreaterThan(0);
  });

  it('pose la classe racine sur son conteneur', () => {
    expect(hote.shadowRoot?.querySelector('.fp-root')).toBeTruthy();
  });

  it('expose le mode de rendu sur le conteneur', () => {
    hote.setAttribute('render', 'stage');
    const racine = hote.shadowRoot?.querySelector('.fp-root');
    expect(racine?.getAttribute('data-render')).toBe('stage');
  });

  it('emet un evenement composed qui traverse le shadow DOM', (done) => {
    document.addEventListener(
      'fp-action',
      (event) => {
        expect((event as CustomEvent).detail).toEqual({ ok: true });
        done();
      },
      { once: true },
    );
    hote.shadowRoot?.querySelector<HTMLButtonElement>('[data-testid="action"]')?.click();
  });

  it('lit la graine depuis l attribut', () => {
    hote.setAttribute('seed', '1001');
    expect(hote.seed()).toBe(1001);
  });

  it('retourne une graine nulle quand l attribut manque', () => {
    expect(hote.seed()).toBe(0);
  });

  it('traduit une cle d interface connue', () => {
    expect(hote.texte('valider')).toBe('Valider');
  });

  it('retourne la cle pour un libelle inconnu', () => {
    expect(hote.texte('cle-absente')).toBe('cle-absente');
  });
});
