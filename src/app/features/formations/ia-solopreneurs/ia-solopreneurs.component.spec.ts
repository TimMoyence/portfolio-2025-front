import { montageDeckDeFormation } from '../../../../testing/deck-de-formation';
import { IaSolopreneursComponent } from './ia-solopreneurs.component';

describe('IaSolopreneursComponent', () => {
  const rendu = montageDeckDeFormation(IaSolopreneursComponent);
  const texte = (): string => rendu().textContent ?? '';

  it('rend la slide hero avec le titre attendu', () => {
    const hero = rendu().querySelector('app-slide-hero');
    expect(hero).toBeTruthy();
    expect(hero?.textContent).toContain('IA');
  });

  it('rend la slide CTA toolkit en fin de presentation', () => {
    const cta = rendu().querySelector('app-slide-cta');
    expect(cta).toBeTruthy();
    expect(cta?.textContent?.toLowerCase()).toContain('toolkit');
  });

  it('rend la 3e colonne Gemini dans la comparaison chat-produire', () => {
    expect(texte()).toContain('Gemini');
    expect(texte()).toContain('Workspace');
  });

  it('rend la 3e colonne n8n dans la comparaison automatiser', () => {
    expect(texte()).toContain('n8n');
    expect(texte()).toContain('self-host');
  });

  it('rend le palier intermediaire 60 euros sur stack-budget', () => {
    expect(texte()).toMatch(/intermédiaire/i);
    expect(texte()).toContain('Perplexity Pro');
  });

  it('rend la slide outils-detail (table 16 outils) en mode scroll', () => {
    const table = rendu().querySelector('app-slide-table');
    expect(table).toBeTruthy();
    expect(table?.querySelectorAll('tbody tr').length).toBe(16);
  });

  it('masque les slides present-only en mode scroll', () => {
    expect(rendu().querySelector('[id="transition-pratique"]')).toBeNull();
    expect(rendu().querySelector('[id="promesse"]')).toBeNull();
    expect(rendu().querySelector('[id="one-more-thing"]')).toBeNull();
  });

  it('rend les polls accroche, clients et recap-8020', () => {
    expect(rendu().querySelectorAll('app-slide-poll').length).toBeGreaterThanOrEqual(3);
  });
});
