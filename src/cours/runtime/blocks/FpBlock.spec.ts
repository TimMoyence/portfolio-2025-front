import { type EscapedHtml, safeHtml } from '../core/html';
import { FpBlock } from './FpBlock';

class FpDemo extends FpBlock {
  render(): EscapedHtml {
    return safeHtml`<p data-testid="scene">scene</p><button data-testid="action">agir</button><input data-testid="champ" data-cle="a" value="saisie">${this.annonces()}`;
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
  render(): EscapedHtml {
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

  it('rend son unique rendu pour le role etudiant par defaut', () => {
    expect(hote.shadowRoot?.querySelector('[data-testid="scene"]')).toBeTruthy();
    expect(hote.shadowRoot?.querySelector('[data-testid="action"]')).toBeTruthy();
  });

  it('rend le meme contenu au presentateur qu a l etudiant', () => {
    const etudiant = hote.shadowRoot?.querySelector('.fp-root')?.innerHTML;
    hote.setAttribute('data-cours-role', 'presentateur');
    expect(hote.shadowRoot?.querySelector('.fp-root')?.innerHTML).toBe(etudiant);
  });

  it('se rafraichit quand l hote change le role', () => {
    const avant = hote.shadowRoot?.querySelector('.fp-root');
    hote.setAttribute('data-cours-role', 'presentateur');
    expect(hote.shadowRoot?.querySelector('.fp-root')).not.toBe(avant);
  });

  it('adopte les styles du design system', () => {
    expect(hote.shadowRoot?.adoptedStyleSheets.length).toBeGreaterThan(0);
  });

  it('pose la classe racine sur son conteneur', () => {
    expect(hote.shadowRoot?.querySelector('.fp-root')).toBeTruthy();
  });

  it('expose le role sur le conteneur', () => {
    expect(hote.shadowRoot?.querySelector('.fp-root')?.getAttribute('data-role')).toBe('etudiant');
    hote.setAttribute('data-cours-role', 'presentateur');
    expect(hote.shadowRoot?.querySelector('.fp-root')?.getAttribute('data-role')).toBe(
      'presentateur',
    );
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

  it('lit le role reel pose par l hote sur data-cours-role', () => {
    expect(hote.roleActuel()).toBe('etudiant');
    hote.setAttribute('data-cours-role', 'presentateur');
    expect(hote.roleActuel()).toBe('presentateur');
    hote.setAttribute('data-slide-role', 'revision');
    expect(hote.roleActuel()).toBe('presentateur');
  });

  it('se sait en apercu quand l hote pose data-apercu', () => {
    expect(hote.enApercu()).toBeFalse();
    hote.setAttribute('data-apercu', '');
    expect(hote.enApercu()).toBeTrue();
  });

  it('affiche le refus et le deja repondu que l hote reinjecte, puis les retire', () => {
    hote.erreur = 'Cet écran n’est pas encore ouvert';
    hote.dejaRepondu = true;
    const racine = hote.shadowRoot;

    expect(racine?.querySelector('[data-testid="erreur"]')?.getAttribute('role')).toBe('alert');
    expect(racine?.querySelector('[data-testid="erreur"]')?.textContent).toContain('pas encore');
    expect(racine?.querySelector('[data-testid="deja-repondu"]')?.textContent).toBe(
      'Réponse déjà enregistrée : voici votre verdict',
    );

    hote.erreur = null;
    hote.dejaRepondu = false;

    expect(racine?.querySelector('[data-testid="erreur"]')).toBeNull();
    expect(racine?.querySelector('[data-testid="deja-repondu"]')).toBeNull();
  });

  it('rend le foyer et la selection au champ saisi quand un rafraichissement le remplace', () => {
    const champ = hote.shadowRoot?.querySelector<HTMLInputElement>('[data-testid="champ"]');
    champ?.focus();
    champ?.setSelectionRange(2, 4);

    hote.dejaRepondu = true;

    const remplacant = hote.shadowRoot?.querySelector<HTMLInputElement>('[data-testid="champ"]');
    expect(remplacant).not.toBe(champ);
    expect(hote.shadowRoot?.activeElement).toBe(remplacant ?? null);
    expect([remplacant?.selectionStart, remplacant?.selectionEnd]).toEqual([2, 4]);
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
