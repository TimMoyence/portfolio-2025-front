import { expect, test, type Page } from '@playwright/test';
import {
  figureDeLaPage,
  figureDeLaSection,
  sommetsDuCiel,
} from '../../../src/app/shared/components/cadre/constellation/ciel/ciel';
import { ANNEAU } from '../../../src/app/shared/components/cadre/constellation/ciel/figures';
import {
  traverse,
  type Boite,
} from '../../../src/app/shared/components/cadre/constellation/formes';
import { ouvrir } from '../ouvrir';
import {
  TOILE_DE_FOND,
  journalDe,
  journaliserLesToiles,
  placer,
  sansMouvement,
  surLaToile,
  type AppelDeDessin,
} from './toile';

interface Position {
  readonly x: number;
  readonly y: number;
}

const BLOCS =
  '.kicker, .cta-title, .cta-lead, .ai-method-title, .ai-method-lead, .ai-rule, .ai-step';
const SECTIONS = 'main router-outlet + * section:not(section section)';
const VOILE = 0.25;

surLaToile();
sansMouvement();
journaliserLesToiles();

const lireLaNuit = (page: Page, couche: string) =>
  page.evaluate(
    ([nuit, blocs, sections]) => {
      const coucheDeNuit = document.querySelector(nuit);
      const boite = (element: Element) => {
        const { left, top, width, height } = element.getBoundingClientRect();
        return { left, top, width, height };
      };
      const toutes = [...document.querySelectorAll(sections)];
      const section = toutes.find((candidate) => candidate.contains(coucheDeNuit));
      const cta = section?.querySelector('.cta');
      return {
        blocs: [...(coucheDeNuit?.closest('.theme-night')?.querySelectorAll(blocs) ?? [])].map(
          boite,
        ),
        chiffres: [...(section?.querySelectorAll('.ai-n, .num') ?? [])].map((element) => {
          const { left, top, width, height } = boite(element);
          return { x: left + width / 2, y: top + height / 2 };
        }),
        section: section ? toutes.indexOf(section) : -1,
        bande: toutes.findIndex((candidate) => candidate.querySelector('.cta')),
        cadre: cta ? boite(cta) : { left: 0, top: 0, width: innerWidth, height: innerHeight },
      };
    },
    [couche, BLOCS, SECTIONS] as const,
  );

const proche = (positions: readonly Position[], x: number, y: number): boolean =>
  positions.some((position) => Math.hypot(position.x - x, position.y - y) < 0.5);

const laNuitPlacee = async (page: Page, chemin: string, couche: string, selecteur: string) => {
  await ouvrir(page, chemin);
  await placer(page, selecteur, 100);
  await page.clock.runFor(300);
  const [fond, nuit] = await journalDe(page, TOILE_DE_FOND, couche);
  const lu = await lireLaNuit(page, couche);
  const figure = figureDeLaPage(chemin);
  if (figure === undefined) throw new Error(`${chemin} n a pas de ciel`);
  const etoiles = sommetsDuCiel(
    ANNEAU[figureDeLaSection(figure, lu.section, lu.bande)],
    lu.cadre as Boite,
  );
  const horsDuReseau = ({ type, x1, y1, x2, y2 }: AppelDeDessin) =>
    type === 'fill' ||
    (proche(etoiles, x1, y1) && proche(etoiles, x2, y2)) ||
    (proche(lu.chiffres, x1, y1) && proche(lu.chiffres, x2, y2));
  const coupe = (de: Position, vers: Position) => lu.blocs.some((bloc) => traverse(de, vers, bloc));
  return { ...lu, fond, nuit, etoiles, horsDuReseau, coupe };
};

for (const [chemin, couche, selecteur] of [
  ['/', '.cta canvas.couche-de-nuit', 'section:has(.cta)'],
  ['/presentation', '.ai-method canvas.couche-de-nuit', '.ai-method-section'],
] as const) {
  test(`VOI-01 · ${chemin} : sur la nuit, un trait du réseau qui coupe un bloc de texte passe au quart de son opacité, les autres ne changent pas`, async ({
    page,
  }) => {
    const { fond, nuit, blocs, horsDuReseau, coupe } = await laNuitPlacee(
      page,
      chemin,
      couche,
      selecteur,
    );

    expect(blocs.length).toBeGreaterThan(1);
    expect(nuit).toHaveLength(fond.length);
    let voiles = 0;
    let intacts = 0;
    fond.forEach((trait, index) => {
      expect(nuit[index]).toEqual(expect.objectContaining({ x1: trait.x1, y1: trait.y1 }));
      if (horsDuReseau(trait)) return;
      const voile = coupe({ x: trait.x1, y: trait.y1 }, { x: trait.x2, y: trait.y2 });
      if (voile) voiles++;
      else intacts++;
      expect(nuit[index].alpha).toBeCloseTo(trait.alpha * (voile ? VOILE : 1), 6);
    });
    expect(voiles).toBeGreaterThan(0);
    expect(intacts).toBeGreaterThan(0);
  });

  test(`VOI-02 · ${chemin} : sur la nuit, un trait du ciel qui coupe un bloc de texte et une étoile posée dans un bloc passent au quart, les autres ne changent pas`, async ({
    page,
  }) => {
    const { fond, nuit, etoiles, coupe } = await laNuitPlacee(page, chemin, couche, selecteur);
    const traits = fond.flatMap(({ type, x1, y1, x2, y2 }, index) =>
      type === 'stroke' && proche(etoiles, x1, y1) && proche(etoiles, x2, y2)
        ? [{ index, voile: coupe({ x: x1, y: y1 }, { x: x2, y: y2 }) }]
        : [],
    );
    const astres = fond
      .flatMap(({ type }, index) => (type === 'fill' ? [index] : []))
      .slice(0, etoiles.length)
      .map((index, rang) => ({ index, voile: coupe(etoiles[rang], etoiles[rang]) }));

    expect(traits.length).toBeGreaterThan(0);
    expect(nuit).toHaveLength(fond.length);
    for (const { index, voile } of [...traits, ...astres]) {
      expect(nuit[index].alpha).toBeCloseTo(fond[index].alpha * (voile ? VOILE : 1), 6);
    }
    expect([...traits, ...astres].filter(({ voile }) => voile).length).toBeGreaterThan(0);
    expect([...traits, ...astres].filter(({ voile }) => !voile).length).toBeGreaterThan(0);
  });
}
