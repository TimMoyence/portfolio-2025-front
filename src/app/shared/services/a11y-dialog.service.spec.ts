import { injecterSurPlateforme } from '../../../testing/plateforme';
import { A11yDialogService } from './a11y-dialog.service';

describe('A11yDialogService', () => {
  let service: A11yDialogService;

  const tabulation = (): KeyboardEvent => new KeyboardEvent('keydown', { key: 'Tab' });
  const tabulerSansConteneur = (): void => service.trapFocus(tabulation(), null);

  describe('en contexte navigateur', () => {
    beforeEach(() => {
      service = injecterSurPlateforme(A11yDialogService, 'browser');
    });

    it('devrait etre cree', () => {
      expect(service).toBeTruthy();
    });

    it('devrait sauvegarder et restaurer le focus', () => {
      const btn = document.createElement('button');
      document.body.appendChild(btn);
      btn.focus();

      service.saveFocus();
      service.restoreFocus();

      expect(document.activeElement).toBe(btn);
      document.body.removeChild(btn);
    });

    it('restoreFocus ne devrait rien faire si aucun focus sauvegarde', () => {
      expect(() => service.restoreFocus()).not.toThrow();
    });

    it('focusFirstDescendant devrait focus le premier element focusable', () => {
      const container = document.createElement('div');
      const btn = document.createElement('button');
      btn.textContent = 'Click';
      container.appendChild(btn);
      document.body.appendChild(container);

      service.focusFirstDescendant(container);
      expect(document.activeElement).toBe(btn);

      document.body.removeChild(container);
    });

    it('focusFirstDescendant ne devrait rien faire si container est null', () => {
      expect(() => service.focusFirstDescendant(null)).not.toThrow();
    });

    it('focusFirstDescendant ne devrait rien faire si container est undefined', () => {
      expect(() => service.focusFirstDescendant(undefined as unknown as HTMLElement)).not.toThrow();
    });

    const cycles: readonly [string, boolean, 'First' | 'Last', 'First' | 'Last'][] = [
      ['vers le premier element quand Tab atteint le dernier', false, 'Last', 'First'],
      ['vers le dernier element quand Shift+Tab atteint le premier', true, 'First', 'Last'],
    ];

    for (const [cas, shiftKey, depart, arrivee] of cycles) {
      it(`trapFocus devrait cycler le focus ${cas}`, () => {
        const container = document.createElement('div');
        const boutons = new Map(
          (['First', 'Last'] as const).map((libelle) => {
            const bouton = document.createElement('button');
            bouton.textContent = libelle;
            container.appendChild(bouton);
            return [libelle, bouton] as const;
          }),
        );
        document.body.appendChild(container);

        boutons.get(depart)!.focus();
        service.trapFocus(
          new KeyboardEvent('keydown', { key: 'Tab', shiftKey, cancelable: true }),
          container,
        );

        expect(document.activeElement).toBe(boutons.get(arrivee)!);
        document.body.removeChild(container);
      });
    }

    it('trapFocus ne devrait rien faire pour une touche autre que Tab', () => {
      const container = document.createElement('div');
      const btn = document.createElement('button');
      container.appendChild(btn);
      document.body.appendChild(container);
      btn.focus();

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      service.trapFocus(event, container);

      expect(document.activeElement).toBe(btn);
      document.body.removeChild(container);
    });

    it('trapFocus ne devrait rien faire si container est null', () => {
      expect(tabulerSansConteneur).not.toThrow();
    });

    it('trapFocus ne devrait rien faire si le container est vide', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      expect(() => service.trapFocus(tabulation(), container)).not.toThrow();

      document.body.removeChild(container);
    });
  });

  describe('en contexte serveur (SSR)', () => {
    beforeEach(() => {
      service = injecterSurPlateforme(A11yDialogService, 'server');
    });

    it('devrait etre cree en SSR', () => {
      expect(service).toBeTruthy();
    });

    it('saveFocus ne devrait pas crasher en SSR', () => {
      expect(() => service.saveFocus()).not.toThrow();
    });

    it('trapFocus ne devrait pas crasher en SSR', () => {
      expect(tabulerSansConteneur).not.toThrow();
    });

    it('restoreFocus ne devrait pas crasher en SSR', () => {
      expect(() => service.restoreFocus()).not.toThrow();
    });

    it('focusFirstDescendant ne devrait pas crasher en SSR', () => {
      expect(() => service.focusFirstDescendant(null)).not.toThrow();
    });
  });
});
