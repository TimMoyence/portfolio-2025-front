import { COURS_EN_SEANCE, cheminDuPupitre } from './cours-en-seance';

describe('cheminDuPupitre', () => {
  it('mène au pupitre de chaque cours en séance', () => {
    for (const slug of COURS_EN_SEANCE) {
      expect(cheminDuPupitre(slug)).toBe(`/cours/presenter/${slug}`);
    }
  });

  it('garde dans un seul segment un slug qui en sortirait', () => {
    expect(cheminDuPupitre('b2/../admin?x=1')).toBe('/cours/presenter/b2%2F..%2Fadmin%3Fx%3D1');
  });
});
