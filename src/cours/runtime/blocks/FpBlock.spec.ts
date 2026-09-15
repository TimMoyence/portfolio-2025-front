import { type EscapedHtml, safeHtml } from '../core/html';
import { FpBlock } from './FpBlock';

class FpDemo extends FpBlock {
  renderStage(): EscapedHtml {
    return safeHtml`<p data-testid="scene">scene</p>`;
  }
  renderHand(): EscapedHtml {
    return safeHtml`<button data-testid="action">agir</button>`;
  }
  renderBoard(): EscapedHtml {
    return safeHtml`<p data-testid="tableau">tableau</p>`;
  }
  question: string | null = 'Q-1';

  bind(racine: ShadowRoot): void {
    this.suivreAffichage(this.question);
    racine
      .querySelector('[data-testid="action"]')
      ?.addEventListener('click', () => this.emit('fp-action', { ok: true }));
  }
}

class FpBroken extends FpBlock {
  renderStage(): EscapedHtml {
    throw new Error('rendu impossible');
  }

  renderHand(): EscapedHtml {
    throw new Error('rendu impossible');
  }

  renderBoard(): EscapedHtml {
    throw new Error('rendu impossible');
  }

  bind(): void {
    return undefined;
  }
}

describe('FpBlock', () => {
  let hote: FpDemo;
  let enveloppe: HTMLDivElement | null;
  let horlogeSimulee: jasmine.Clock | null = null;

  beforeAll(() => {
    if (!customElements.get('fp-demo')) {
      customElements.define('fp-demo', FpDemo);
    }
    if (!customElements.get('fp-broken')) {
      customElements.define('fp-broken', FpBroken);
    }
  });

  beforeEach(() => {
    hote = document.createElement('fp-demo') as FpDemo;
    document.body.appendChild(hote);
    enveloppe = null;
  });

  afterEach(() => {
    horlogeSimulee?.uninstall();
    horlogeSimulee = null;
    hote.remove();
    enveloppe?.remove();
  });

  function figerLHorloge(): void {
    horlogeSimulee = jasmine.clock();
    horlogeSimulee.install();
    horlogeSimulee.mockDate(new Date(0));
  }

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

  it('emet un evenement composed qui traverse une racine shadow englobante', (done) => {
    enveloppe = document.createElement('div');
    const racineEnveloppe = enveloppe.attachShadow({ mode: 'open' });
    const hoteImbrique = document.createElement('fp-demo') as FpDemo;
    racineEnveloppe.appendChild(hoteImbrique);
    document.body.appendChild(enveloppe);

    document.addEventListener(
      'fp-action',
      (event) => {
        expect((event as CustomEvent).detail).toEqual({ ok: true });
        done();
      },
      { once: true },
    );

    hoteImbrique.shadowRoot?.querySelector<HTMLButtonElement>('[data-testid="action"]')?.click();
  });

  it('lit la graine depuis l attribut', () => {
    hote.setAttribute('seed', '1001');
    expect(hote.seed()).toBe(1001);
  });

  it('retourne une graine nulle quand l attribut manque', () => {
    expect(hote.seed()).toBe(0);
  });

  it('signale une erreur de rendu par un evenement compose', (done) => {
    const broken = document.createElement('fp-broken');
    broken.addEventListener(
      'fp-block-error',
      (event) => {
        expect((event as CustomEvent).detail).toEqual(new Error('rendu impossible'));
        broken.remove();
        done();
      },
      { once: true },
    );
    document.body.appendChild(broken);
  });

  it('traduit une cle d interface connue', () => {
    expect(hote.texte('valider')).toBe('Valider');
  });

  it('retourne la cle pour un libelle inconnu', () => {
    expect(hote.texte('cle-absente')).toBe('cle-absente');
  });

  it('ne rearme pas le chronometre quand la meme question est rendue a nouveau', () => {
    figerLHorloge();
    hote.question = 'Q-CHRONO';
    hote.refresh();

    jasmine.clock().tick(8000);
    hote.refresh();
    hote.refresh();

    expect(hote.depuisAffichage()).toBe(8000);
  });

  it('rearme le chronometre quand la question change', () => {
    figerLHorloge();
    hote.question = 'Q-CHRONO';
    hote.refresh();

    jasmine.clock().tick(8000);
    hote.question = 'Q-SUIVANTE';
    hote.refresh();
    jasmine.clock().tick(300);

    expect(hote.depuisAffichage()).toBe(300);
  });
});
