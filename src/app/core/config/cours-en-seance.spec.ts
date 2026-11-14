import {
  INSTANTANES_DES_COURS_SERVIS,
  SLUGS_DES_COURS_SERVIS,
} from '../../../testing/fixtures/instantanes-des-cours';
import { COURS_EN_SEANCE, cheminDuPupitre, dureeDuCoursEnSeance } from './cours-en-seance';

describe('COURS_EN_SEANCE', () => {
  it('TST-01 · le harnais des tests porte l’instantané de chaque cours servi en séance, ni plus ni moins', () => {
    expect([...SLUGS_DES_COURS_SERVIS]).toEqual([...COURS_EN_SEANCE]);
  });

  it('TST-01 · nomme chaque instantané du harnais par le code du cours qu’il sert', () => {
    expect(
      INSTANTANES_DES_COURS_SERVIS.filter(
        ([code, { sujet }]) => !sujet.id.startsWith(`${code.toLowerCase()}-`),
      ).map(([code, { sujet }]) => `${code} sert ${sujet.id}`),
    ).toEqual([]);
  });
});

describe('dureeDuCoursEnSeance', () => {
  it('PUB-01 · écrit la durée servie de chaque cours, arrondie aux cinq minutes, en heures et minutes', () => {
    expect(COURS_EN_SEANCE.map((slug) => [slug.slice(0, 5), dureeDuCoursEnSeance(slug)])).toEqual([
      ['b1-01', '2 h 00'],
      ['b1-02', '2 h 00'],
      ['b1-03', '2 h 00'],
      ['b1-04', '2 h 00'],
      ['b1-05', '2 h 00'],
      ['b2-01', '3 h 20'],
      ['b2-02', '2 h 45'],
      ['b2-03', '2 h 15'],
      ['b2-04', '2 h 45'],
      ['b2-05', '2 h 15'],
      ['b2-06', '2 h 15'],
      ['b2-07', '2 h 15'],
      ['b2-08', '2 h 15'],
      ['b2-09', '2 h 15'],
      ['b3-01', '2 h 55'],
      ['b3-02', '3 h 00'],
      ['b3-03', '3 h 00'],
      ['b3-04', '3 h 00'],
    ]);
  });

  it('PUB-01 · refuse un cours qui n’est pas servi en séance', () => {
    expect(() => dureeDuCoursEnSeance('b9-99-inconnu')).toThrowError(/b9-99-inconnu/);
  });
});

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
