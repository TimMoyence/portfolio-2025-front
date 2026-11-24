import { variantesDeLargeur } from './variantes-de-largeur';

describe('variantesDeLargeur', () => {
  it('sert chaque largeur sous la largeur naturelle, puis la largeur naturelle', () => {
    expect(variantesDeLargeur('/a', 700)).toBe(
      '/a/360.webp 360w, /a/400.webp 400w, /a/480.webp 480w, /a/560.webp 560w, /a/640.webp 640w, /a/700.webp 700w',
    );
  });

  it('une image plus étroite que la plus petite largeur n a que sa largeur naturelle', () => {
    expect(variantesDeLargeur('/x', 300)).toBe('/x/300.webp 300w');
  });

  it('une largeur naturelle égale à une largeur servie ne se répète pas', () => {
    expect(variantesDeLargeur('/x', 400)).toBe('/x/360.webp 360w, /x/400.webp 400w');
  });
});
