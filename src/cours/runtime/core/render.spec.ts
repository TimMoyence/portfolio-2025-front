import { resolveRenderMode } from './render';

describe('resolveRenderMode', () => {
  it('la force prime sur tout', () => {
    expect(resolveRenderMode('etudiant', 2000, 'board')).toBe('board');
  });

  it('le presentateur passe en scene a la borne exacte', () => {
    expect(resolveRenderMode('presentateur', 1280)).toBe('stage');
  });

  it('le presentateur bascule en tableau juste sous la borne', () => {
    expect(resolveRenderMode('presentateur', 1279)).toBe('board');
  });

  it('un role non presentateur reste toujours en main', () => {
    expect(resolveRenderMode('etudiant', 2000)).toBe('hand');
    expect(resolveRenderMode('revision', 2000)).toBe('hand');
  });
});
