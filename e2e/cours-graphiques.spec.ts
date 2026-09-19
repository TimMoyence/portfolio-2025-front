import { expect, test, type Locator, type Page } from '@playwright/test';
import { B2_SLUG, coursB2Catalogue, ecranB2Graphique, servirCatalogueB2 } from './fixtures';

type Plage = readonly [number, number];

interface Graphique {
  readonly fichier: string;
  readonly plage: Plage;
  readonly props: Readonly<Record<string, unknown>> & {
    readonly title: string;
    readonly unit: string;
    readonly reading: string;
    readonly source: string;
    readonly kind?: 'line';
    readonly series: readonly {
      readonly label: string;
      readonly values: readonly number[];
      readonly tone: 'teal' | 'gold' | 'ink';
    }[];
  };
}

const MASQUES = [
  'app-navbar',
  'app-cookie-banner',
  '.slide-deck-progress',
  '.slide-deck-fullscreen',
].join(', ');

const SANS_SURCOUCHES = `${MASQUES} { display: none !important; } app-slide-chart .slide-chart { min-height: 0 !important; }`;

const TOLERANCE_PX = 1.5;

const SEUIL_INSTANTANE = 0.002;

const G1: Graphique = {
  fichier: 'g1-marge-brute-axe-zero.png',
  plage: [0, 300000],
  props: {
    title: 'Marge brute d’Atelier Rivage, 2022–2025',
    caption: 'Axe vertical de 0 à 300 000 €',
    labels: ['2022', '2023', '2024', '2025'],
    series: [{ label: 'Marge brute', values: [285000, 288000, 289800, 291000], tone: 'teal' }],
    axisRanges: [[0, 300000]],
    axisLabels: ['0 à 300 000 €'],
    unit: '€',
    formula: 'Évolution 2022–2025 = (291 000 − 285 000) ÷ 285 000 ≈ 0,021',
    reading:
      'La marge brute passe de 285 000 € à 291 000 € : +6 000 € en trois ans, soit +2,1 %. La progression est réelle mais faible, et elle ralentit chaque année.',
    source: 'Comptes de résultat 2022 à 2025 d’Atelier Rivage (données fictives).',
    description:
      'Diagramme en barres à partir de zéro : quatre barres presque égales, de 285 000 € en 2022 à 291 000 € en 2025.',
  },
};

const G2: Graphique = {
  fichier: 'g2-inflation-annuelle.png',
  plage: [0, 6],
  props: {
    title: 'Inflation annuelle en France, 2019–2025',
    caption: 'Taux d’inflation annuel moyen (IPC), en %',
    labels: ['2019', '2020', '2021', '2022', '2023', '2024', '2025'],
    series: [
      { label: 'Inflation (IPC)', values: [1.1, 0.5, 1.6, 5.2, 4.9, 2.0, 0.9], tone: 'teal' },
    ],
    axisRanges: [[0, 6]],
    unit: '% par an',
    reading: 'Le taux culmine à 5,2 % en 2022, puis diminue : 2,0 % en 2024 et 0,9 % en 2025.',
    source:
      'Source : Insee, indice des prix à la consommation, « L’essentiel sur… l’inflation », paru le 23 mars 2026.',
    description:
      'Diagramme en barres des taux d’inflation annuels moyens : 1,1 % en 2019, 0,5 % en 2020, 1,6 % en 2021, 5,2 % en 2022, 4,9 % en 2023, 2,0 % en 2024 et 0,9 % en 2025.',
  },
};

const G3: Graphique = {
  fichier: 'g3-indice-des-prix.png',
  plage: [95, 120],
  props: {
    title: 'Indice des prix à la consommation, base 100 = moyenne 2019',
    caption: 'Indice reconstitué à partir des taux annuels moyens de l’Insee',
    kind: 'line',
    labels: ['2019', '2020', '2021', '2022', '2023', '2024', '2025'],
    series: [
      {
        label: 'Indice des prix',
        values: [100, 100.5, 102.11, 107.42, 112.68, 114.93, 115.97],
        tone: 'gold',
      },
    ],
    axisRanges: [[95, 120]],
    axisLabels: ['95 à 120'],
    unit: 'indice (base 100 en 2019)',
    formula: 'Indice 2025 = 100 × 1,005 × 1,016 × 1,052 × 1,049 × 1,020 × 1,009 ≈ 115,97',
    reading:
      'Les prix de 2025 sont en moyenne 16,0 % plus élevés qu’en 2019. Le rythme ralentit depuis 2023, mais l’indice continue de monter.',
    source:
      'Calcul du cours à partir des taux annuels moyens publiés par l’Insee (IPC, « L’essentiel sur… l’inflation », paru le 23 mars 2026).',
    description:
      'Courbe croissante de l’indice : 100 en 2019, 107,42 en 2022, 112,68 en 2023, 115,97 en 2025 ; axe gradué de 95 à 120.',
  },
};

const G4: Graphique = {
  fichier: 'g4-ca-par-canal.png',
  plage: [0, 180],
  props: {
    title: 'CA HT 2025 d’Atelier Rivage par canal et par trimestre',
    caption: 'Une courbe par canal : la forme suit la question (une évolution dans le temps)',
    kind: 'line',
    labels: ['T1', 'T2', 'T3', 'T4'],
    series: [
      { label: 'Sur-mesure', values: [120, 95, 102, 80], tone: 'ink' },
      { label: 'Entretien', values: [58, 61, 49, 62], tone: 'gold' },
      { label: 'Marketplace', values: [98, 131, 167, 127], tone: 'teal' },
    ],
    axisRanges: [[0, 180]],
    axisLabels: ['0 à 180 milliers d’euros'],
    unit: 'milliers d’euros HT',
    reading:
      'La marketplace culmine au 3e trimestre (167 000 €) ; le sur-mesure recule de 120 000 € à 80 000 € entre le 1er et le 4e trimestre ; l’entretien reste entre 49 000 € et 62 000 €.',
    source: 'Comptabilité analytique d’Atelier Rivage, 2025 (données fictives).',
    description:
      'Trois courbes étiquetées sur quatre trimestres : sur-mesure 120, 95, 102, 80 ; entretien 58, 61, 49, 62 ; marketplace 98, 131, 167, 127 (milliers d’euros) ; axe de 0 à 180.',
  },
};

const PRIX_DU_SAC: Graphique = {
  fichier: 'a3-03-prix-du-sac.png',
  plage: [0, 120],
  props: {
    title: 'Prix du sac étanche : +10 %, puis −10 %',
    caption: '100 ventes par période ; coût d’achat unitaire : 80 € HT',
    kind: 'line',
    unit: '€ HT par sac',
    labels: ['Prix initial', 'Après +10 %', 'Après −10 %'],
    series: [
      { label: 'Prix de vente unitaire', values: [100, 110, 99], tone: 'teal' },
      { label: 'Coût d’achat unitaire', values: [80, 80, 80], tone: 'ink' },
      { label: 'Marge unitaire', values: [20, 30, 19], tone: 'gold' },
    ],
    axisRanges: [[0, 120]],
    formula: 'Prix : 100 × 1,10 × 0,90 = 99 € · CA : 10 000 → 11 000 → 9 900 €',
    reading:
      'Après la baisse, le prix (99 €) reste sous le prix initial : −1 %. Avec un coût inchangé, la marge unitaire tombe à 19 €.',
    source:
      'Cas Atelier Rivage (données fictives) : 100 ventes à chaque période, coût d’achat constant.',
    description:
      'Trois courbes étiquetées : prix de vente 100, 110 puis 99 € ; coût d’achat constant à 80 € ; marge unitaire 20, 30 puis 19 €.',
  },
};

const DIAPOSITIVE_DE_SAMIR: Graphique = {
  fichier: 'a1-09-diapositive-tronquee.png',
  plage: [284000, 292000],
  props: {
    title: 'Marge brute : une croissance continue',
    caption: 'Diapositive 3 du support commercial',
    context: 'Voici la diapositive que Samir veut projeter jeudi.',
    labels: ['2022', '2023', '2024', '2025'],
    series: [{ label: 'Marge brute', values: [285000, 288000, 289800, 291000], tone: 'gold' }],
    axisRanges: [[284000, 292000]],
    axisLabels: ['284 000 à 292 000 €'],
    unit: '€',
    reading:
      'Lecture proposée par le service commercial : « la marge brute progresse nettement chaque année ».',
    source: 'Service commercial d’Atelier Rivage (données fictives).',
    description:
      'Diagramme en barres : marge brute de 2022 à 2025, axe vertical de 284 000 € à 292 000 € ; barres de 285 000 €, 288 000 €, 289 800 € et 291 000 €.',
  },
};

const GRAPHIQUES: readonly Graphique[] = [G1, G2, G3, G4, PRIX_DU_SAC, DIAPOSITIVE_DE_SAMIR];

function hauteurAttendue(valeur: number, [min, max]: Plage): number {
  return (valeur - min) / (max - min);
}

async function boite(
  locator: Locator,
): Promise<{ x: number; y: number; width: number; height: number }> {
  const mesure = await locator.boundingBox();
  if (mesure === null) {
    throw new Error('élément sans boîte de rendu');
  }
  return mesure;
}

async function graphiquePret(page: Page, rang: number): Promise<Locator> {
  const graphique = page.locator('app-slide-chart').nth(rang);
  await graphique.scrollIntoViewIfNeeded();
  await expect(
    graphique.locator('.slide-chart__bar.is-visible, .slide-chart__line.is-visible').first(),
  ).toBeVisible();
  return graphique;
}

test.use({ viewport: { width: 1280, height: 1200 } });

test.describe('Graphiques v2 du B2-01 (F13 : AC-26, AC-29, AC-30)', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await servirCatalogueB2(
      page,
      coursB2Catalogue(
        GRAPHIQUES.map((graphique, rang) => ecranB2Graphique(rang + 1, graphique.props)),
      ),
    );
    await page.goto(`/formations/${B2_SLUG}`);
    await page.addStyleTag({ content: SANS_SURCOUCHES });
    await expect(page.locator('app-slide-chart')).toHaveCount(GRAPHIQUES.length);
    await page.evaluate(() => document.fonts.ready);
  });

  for (const [rang, graphique] of GRAPHIQUES.entries()) {
    test(`${graphique.fichier} : titre, unité, lecture, source et échelle graduée (AC-26, AC-29)`, async ({
      page,
    }) => {
      const rendu = await graphiquePret(page, rang);

      await expect(rendu.locator('h2')).toHaveText(graphique.props.title);
      await expect(rendu.locator('.slide-chart__unit')).toHaveText(graphique.props.unit);
      await expect(rendu.locator('.slide-chart__reading')).toContainText(graphique.props.reading);
      await expect(rendu.locator('[data-testid="slide-chart-description"]')).toBeVisible();
      expect(
        await rendu.locator('[data-testid="slide-chart-graduation"]').count(),
      ).toBeGreaterThanOrEqual(4);

      await rendu.getByText('Voir les données').click();
      await expect(rendu.locator('.slide-chart__data table')).toBeVisible();
      await expect(rendu.locator('.slide-chart__source')).toContainText(graphique.props.source);
      await expect(rendu.locator('.slide-chart__data tbody tr')).toHaveCount(
        graphique.props.series.length,
      );
    });

    test(`${graphique.fichier} : chaque marque tombe sur l échelle graduée (AC-26)`, async ({
      page,
    }) => {
      const rendu = await graphiquePret(page, rang);
      const zone = await boite(rendu.getByTestId('slide-chart-zone'));
      const base = zone.y + zone.height;

      for (const graduation of await rendu.getByTestId('slide-chart-graduation').all()) {
        const valeur = Number((await graduation.innerText()).replace(/\s/g, '').replace(',', '.'));
        const repere = await boite(graduation);
        expect(
          Math.abs(
            repere.y +
              repere.height / 2 -
              (base - hauteurAttendue(valeur, graphique.plage) * zone.height),
          ),
        ).toBeLessThanOrEqual(TOLERANCE_PX);
      }

      const valeurs = graphique.props.series.flatMap((serie) => serie.values);
      const marques = rendu.locator(
        graphique.props.kind === 'line' ? '.slide-chart__point' : '.slide-chart__bar',
      );
      await expect(marques).toHaveCount(valeurs.length);
      for (const [index, valeur] of valeurs.entries()) {
        const marque = await boite(marques.nth(index));
        const sommet = graphique.props.kind === 'line' ? marque.y + marque.height / 2 : marque.y;
        expect(
          Math.abs(sommet - (base - hauteurAttendue(valeur, graphique.plage) * zone.height)),
        ).toBeLessThanOrEqual(TOLERANCE_PX);
      }
    });

    test(`${graphique.fichier} : instantané visuel`, async ({ page }) => {
      const rendu = await graphiquePret(page, rang);

      await expect(rendu.locator('figure')).toHaveScreenshot(graphique.fichier, {
        animations: 'disabled',
        maxDiffPixelRatio: SEUIL_INSTANTANE,
      });
    });
  }

  test('G4 : trois courbes étiquetées directement, marqueurs distincts, sans légende (AC-30)', async ({
    page,
  }) => {
    const rendu = await graphiquePret(page, GRAPHIQUES.indexOf(G4));

    await expect(rendu.getByTestId('slide-chart-etiquette')).toHaveText([
      'Sur-mesure',
      'Entretien',
      'Marketplace',
    ]);
    const formes = await rendu
      .locator('.slide-chart__point')
      .evaluateAll((points) => [
        ...new Set(points.map((point) => point.getAttribute('data-marqueur'))),
      ]);
    expect(formes).toEqual(['rond', 'carre', 'losange']);
    await expect(rendu.locator('.slide-chart__legend')).toHaveCount(0);
  });

  test('G1 : tableau « Voir les données » ouvert, instantané visuel (AC-29)', async ({ page }) => {
    const rendu = await graphiquePret(page, GRAPHIQUES.indexOf(G1));
    await rendu.getByText('Voir les données').click();

    await expect(rendu.locator('.slide-chart__data')).toHaveScreenshot('g1-voir-les-donnees.png', {
      animations: 'disabled',
      maxDiffPixelRatio: SEUIL_INSTANTANE,
    });
  });
});
