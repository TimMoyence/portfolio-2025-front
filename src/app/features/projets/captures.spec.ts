import { REALISATIONS, variantesDeLaCapture } from './realisations.data';

const largeurServie = (url: string): Promise<number> =>
  new Promise((resoudre) => {
    const image = new Image();
    image.onload = () => resoudre(image.naturalWidth);
    image.onerror = () => resoudre(0);
    image.src = url;
  });

describe('VIT2-09 · chaque réalisation montre une capture réelle, servie à sa largeur', () => {
  for (const realisation of REALISATIONS) {
    it(`VIT2-09 · ${realisation.slug} : la capture et chacune de ses variantes existent à leur largeur`, async () => {
      const variantes = variantesDeLaCapture(realisation)
        .split(', ')
        .map((variante) => variante.split(' '));
      const attendues: (readonly [string, number])[] = [
        [realisation.image, realisation.largeurDeLaCapture],
        ...variantes.map(([url, largeur]) => [url, Number.parseInt(largeur, 10)] as const),
      ];
      const servies = await Promise.all(attendues.map(([url]) => largeurServie(url)));

      expect(attendues.map(([url], rang) => [url, servies[rang]])).toEqual(
        attendues.map(([url, largeur]) => [url, largeur]),
      );
      expect(realisation.imageAlt).toMatch(/^Capture /);
    });
  }
});
