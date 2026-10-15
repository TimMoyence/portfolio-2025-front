import type { ComponentFixture } from '@angular/core/testing';
import { fondEffectif, rapportDeContraste } from '../../../../../testing/contraste';
import { INSTANTANE_B2_01 } from '../../../../../testing/fixtures/instantane-b2-01';
import { INSTANTANE_B2_04 } from '../../../../../testing/fixtures/instantane-b2-04';
import { INSTANTANE_B2_05 } from '../../../../../testing/fixtures/instantane-b2-05';
import {
  ecransPublicsDe,
  type InstantaneDuCoursB2,
} from '../../../../../testing/fixtures/instantane-de-cours';
import { INSTANTANES_DES_COURS_SERVIS } from '../../../../../testing/fixtures/instantanes-des-cours';
import {
  jouerLesGraphiquesJusquAuBout,
  monterLeGraphique,
  preparerLeGraphique,
} from '../../../../../testing/graphique-monte';
import { libellesColles } from '../../../../../testing/libelles-colles';
import { textes } from '../../../../../testing/textes-dom';
import { valeursSurUneForme } from '../../../../../testing/valeurs-sur-les-formes';
import { presentationDe } from '../../visual/presentation-v2';
import type { SlideChartKind, SlideChartSeries } from './slide-chart.component';
import { SlideChartComponent } from './slide-chart.component';

const LIBELLES = ['2023', '2024', '2025'];

const SERIES: readonly SlideChartSeries[] = [
  { label: 'Chiffre d’affaires', values: [120, 132.5, 150], tone: 'teal' },
  { label: 'Charges', values: [80, 90, 95], tone: 'gold' },
];

const MARGE_BRUTE: readonly SlideChartSeries[] = [
  { label: 'Marge brute', values: [285000, 288000, 289800, 291000], tone: 'teal' },
];

const ANNEES_MARGE = ['2022', '2023', '2024', '2025'];

const CANAUX: readonly SlideChartSeries[] = [
  { label: 'Sur-mesure', values: [120, 95, 102, 80], tone: 'ink' },
  { label: 'Entretien', values: [58, 61, 49, 62], tone: 'gold' },
  { label: 'Marketplace', values: [98, 131, 167, 127], tone: 'teal' },
];

const TRIMESTRES = ['T1', 'T2', 'T3', 'T4'];

const SEUIL_TEXTE = 4.5;
const SEUIL_TRAIT = 3;

function monter(
  entrees: Readonly<Record<string, unknown>> = {},
): ComponentFixture<SlideChartComponent> {
  return monterLeGraphique({
    title: 'Une évolution à contrôler',
    caption: 'Exercice',
    labels: LIBELLES,
    series: SERIES,
    ...entrees,
  });
}

function element(fixture: ComponentFixture<SlideChartComponent>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

function variables(racine: HTMLElement, selecteur: string, variable: string): string[] {
  return Array.from(racine.querySelectorAll<HTMLElement>(selecteur)).map((noeud) =>
    noeud.style.getPropertyValue(variable).trim(),
  );
}

function marqueurs(racine: HTMLElement, selecteur: string): (string | null)[] {
  return Array.from(racine.querySelectorAll(selecteur)).map((noeud) =>
    noeud.getAttribute('data-marqueur'),
  );
}

function pourcentages(valeurs: readonly string[]): number[] {
  return valeurs.map((valeur) => Number.parseFloat(valeur));
}

describe('SlideChartComponent', () => {
  preparerLeGraphique();

  it('rend le titre, le contexte, l unité et la légende de chaque série', () => {
    const fixture = monter({ context: 'Deux séries sur trois ans', unit: 'k€' });

    const rendu = element(fixture);
    expect(rendu.querySelector('h2')?.textContent).toContain('Une évolution à contrôler');
    expect(rendu.querySelector('.slide-chart__context')?.textContent).toContain('trois ans');
    expect(rendu.querySelector('.slide-chart__unit')?.textContent).toContain('k€');
    expect(textes(rendu, '.slide-chart__legend li')).toEqual(['Chiffre d’affaires', 'Charges']);
  });

  it('résume toutes les valeurs dans le libellé accessible du graphique', () => {
    const fixture = monter();

    const libelle = element(fixture).querySelector('[role="img"]')?.getAttribute('aria-label');
    expect(libelle).toContain('Une évolution à contrôler');
    expect(libelle).toContain('Chiffre d’affaires: 120 ; 132,5 ; 150. Charges: 80 ; 90 ; 95');
    expect(libelle).not.toContain('132.5');
  });

  it('expose les données dans un tableau, nombres écrits à la française', () => {
    const rendu = element(monter());
    const marge = element(monter({ labels: ANNEES_MARGE, series: MARGE_BRUTE }));

    expect(textes(rendu, '.slide-chart__data thead th')).toEqual(['Exercice', ...LIBELLES]);
    expect(textes(rendu, '.slide-chart__data tbody tr td')).toContain('132,5');
    expect(textes(marge, '.slide-chart__data tbody tr td')).toEqual([
      '285 000',
      '288 000',
      '289 800',
      '291 000',
    ]);
  });

  it('dessine une barre par série et par période en mode barres', () => {
    const fixture = monter();

    expect(element(fixture).querySelectorAll('.slide-chart__bar')).toHaveSize(
      LIBELLES.length * SERIES.length,
    );
    expect(element(fixture).querySelector('svg.slide-chart__svg')).toBeNull();
  });

  it('trace une courbe par série en mode ligne', () => {
    const kind: SlideChartKind = 'line';
    const fixture = monter({ kind });

    const rendu = element(fixture);
    expect(rendu.querySelectorAll('polyline.slide-chart__line')).toHaveSize(SERIES.length);
    expect(rendu.querySelectorAll('.slide-chart__labels span')).toHaveSize(LIBELLES.length);
    expect(rendu.querySelector('.slide-chart__bars')).toBeNull();
  });

  it('relie la description textuelle au graphique et garde le bouton Voir les données (AC-29)', () => {
    const fixture = monter({
      description: 'Le chiffre d’affaires progresse plus vite que les charges.',
    });

    const rendu = element(fixture);
    const description = rendu.querySelector('[data-testid="slide-chart-description"]');
    expect(description?.textContent?.trim()).toBe(
      'Le chiffre d’affaires progresse plus vite que les charges.',
    );
    expect(rendu.querySelector('[role="img"]')?.getAttribute('aria-describedby')).toBe(
      description?.id ?? 'sans description',
    );
    expect(rendu.querySelector('.slide-chart__data summary')?.textContent?.trim()).toBe(
      'Voir les données',
    );
  });

  it('gradue un axe calculé en valeurs rondes, barres partant de zéro', () => {
    expect(textes(element(monter()), '[data-testid="slide-chart-graduation"]')).toEqual([
      '150',
      '120',
      '90',
      '60',
      '30',
      '0',
    ]);
  });

  it('gradue exactement la plage axisRanges, courbes comprises, chaque repère à sa hauteur (AC-26)', () => {
    const indice = element(
      monter({
        kind: 'line',
        labels: ['2019', '2020'],
        series: [{ label: 'Indice des prix', values: [100, 115.97], tone: 'gold' }],
        axisRanges: [[95, 120]],
      }),
    );
    const marge = element(
      monter({ labels: ANNEES_MARGE, series: MARGE_BRUTE, axisRanges: [[0, 300000]] }),
    );

    expect(textes(indice, '[data-testid="slide-chart-graduation"]')).toEqual([
      '120',
      '115',
      '110',
      '105',
      '100',
      '95',
    ]);
    expect(variables(indice, '[data-testid="slide-chart-graduation"]', '--y')).toEqual([
      '100%',
      '80%',
      '60%',
      '40%',
      '20%',
      '0%',
    ]);
    expect(textes(marge, '[data-testid="slide-chart-graduation"]')).toEqual([
      '300 000',
      '250 000',
      '200 000',
      '150 000',
      '100 000',
      '50 000',
      '0',
    ]);
  });

  it('place chaque point d une courbe sur l échelle axisRanges (AC-26)', () => {
    const rendu = element(
      monter({
        kind: 'line',
        series: [{ label: 'Indice', values: [100, 107.5, 120], tone: 'gold' }],
        axisRanges: [[95, 120]],
      }),
    );

    expect(variables(rendu, '.slide-chart__point', '--y')).toEqual(['20%', '50%', '100%']);
    expect(
      pourcentages(variables(rendu, '.slide-chart__point', '--x')).map(
        (abscisse) => Math.round(abscisse * 100) / 100,
      ),
    ).toEqual([16.67, 50, 83.33]);
  });

  it('dessine des barres proportionnelles quand l axe part de zéro (AC-26)', () => {
    const depuisZero = element(
      monter({ labels: ANNEES_MARGE, series: MARGE_BRUTE, axisRanges: [[0, 300000]] }),
    );
    const tronque = element(
      monter({ labels: ANNEES_MARGE, series: MARGE_BRUTE, axisRanges: [[284000, 292000]] }),
    );

    expect(variables(depuisZero, '.slide-chart__bar', '--hauteur')).toEqual([
      '95%',
      '96%',
      '96.6%',
      '97%',
    ]);
    expect(variables(tronque, '.slide-chart__bar', '--hauteur')).toEqual([
      '12.5%',
      '50%',
      '72.5%',
      '87.5%',
    ]);
  });

  it('écrit la valeur de chaque barre au-dessus d elle, jamais dans la barre', () => {
    const rendu = element(
      monter({ labels: ANNEES_MARGE, series: MARGE_BRUTE, axisRanges: [[0, 300000]] }),
    );

    expect(textes(rendu, '.slide-chart__value')).toEqual([
      '285 000',
      '288 000',
      '289 800',
      '291 000',
    ]);
    expect(variables(rendu, '.slide-chart__value', '--hauteur')).toEqual(
      variables(rendu, '.slide-chart__bar', '--hauteur'),
    );
  });

  it('distingue les séries d une courbe par la forme du marqueur et une étiquette directe', () => {
    const rendu = element(monter({ kind: 'line' }));

    expect(marqueurs(rendu, '.slide-chart__point')).toEqual([
      'rond',
      'rond',
      'rond',
      'carre',
      'carre',
      'carre',
    ]);
    expect(textes(rendu, '[data-testid="slide-chart-etiquette"]')).toEqual([
      'Chiffre d’affaires',
      'Charges',
    ]);
    expect(rendu.querySelector('.slide-chart__legend')).toBeNull();
  });

  it('écarte les étiquettes directes de deux courbes qui finissent côte à côte', () => {
    const rendu = element(
      monter({
        kind: 'line',
        labels: ['T3', 'T4'],
        series: [
          { label: 'Sur-mesure', values: [102, 80], tone: 'ink' },
          { label: 'Entretien', values: [49, 82], tone: 'gold' },
        ],
        axisRanges: [[0, 180]],
      }),
    );

    const [surMesure, entretien] = pourcentages(
      variables(rendu, '[data-testid="slide-chart-etiquette"]', '--y'),
    );
    expect(Math.abs(entretien - surMesure)).toBeGreaterThanOrEqual(7);
  });

  it('écrit la valeur de la courbe la plus haute au-dessus du point et la plus basse au-dessous', () => {
    const rendu = element(
      monter({ kind: 'line', labels: TRIMESTRES, series: CANAUX, axisRanges: [[0, 180]] }),
    );

    const dessous = Array.from(rendu.querySelectorAll('.slide-chart__point-value')).map((valeur) =>
      valeur.classList.contains('is-below'),
    );
    expect(dessous).toEqual([
      false,
      false,
      false,
      false,
      true,
      true,
      true,
      true,
      true,
      false,
      false,
      false,
    ]);
  });

  it('marque chaque barre d un graphique à plusieurs séries par la forme de sa série (AC-30)', () => {
    const rendu = element(monter());

    expect(marqueurs(rendu, '.slide-chart__bar-wrap .slide-chart__marqueur')).toEqual([
      'rond',
      'carre',
      'rond',
      'carre',
      'rond',
      'carre',
    ]);
    expect(marqueurs(rendu, '.slide-chart__legend .slide-chart__marqueur')).toEqual([
      'rond',
      'carre',
    ]);
  });

  it('mesure des contrastes d au moins 4,5:1 pour les textes et 3:1 pour les traits (AC-30)', () => {
    const configurations: readonly Readonly<Record<string, unknown>>[] = [
      { unit: 'k€' },
      { kind: 'line', labels: TRIMESTRES, series: CANAUX, axisRanges: [[0, 180]] },
    ];

    for (const configuration of configurations) {
      const rendu = element(monter(configuration));
      rendu.style.backgroundColor = 'var(--cream)';
      const textesMesures = Array.from(
        rendu.querySelectorAll(
          '.slide-chart__eyebrow, .slide-chart__unit, [data-testid="slide-chart-graduation"], .slide-chart__labels span, .slide-chart__value, .slide-chart__point-value, .slide-chart__serie-label, .slide-chart__legend li, .slide-chart__data summary',
        ),
      );
      const traits = Array.from(
        rendu.querySelectorAll(
          '.slide-chart__bar, .slide-chart__point, .slide-chart__marqueur, .slide-chart__base',
        ),
      );
      const lignes = Array.from(rendu.querySelectorAll('.slide-chart__line'));

      expect(textesMesures.length).toBeGreaterThan(0);
      expect(traits.length).toBeGreaterThan(0);
      for (const texte of textesMesures) {
        expect(rapportDeContraste(getComputedStyle(texte).color, fondEffectif(texte)))
          .withContext(`${texte.className} « ${texte.textContent?.trim()} »`)
          .toBeGreaterThanOrEqual(SEUIL_TEXTE);
      }
      for (const trait of traits) {
        const couleur = getComputedStyle(trait).backgroundColor;
        expect(rapportDeContraste(couleur, fondEffectif(trait.parentElement ?? rendu)))
          .withContext(trait.className)
          .toBeGreaterThanOrEqual(SEUIL_TRAIT);
      }
      for (const ligne of lignes) {
        expect(rapportDeContraste(getComputedStyle(ligne).stroke, fondEffectif(rendu)))
          .withContext(ligne.getAttribute('class') ?? 'courbe')
          .toBeGreaterThanOrEqual(SEUIL_TRAIT);
      }
    }
  });

  it('affiche la lecture professionnelle et la source seulement quand elles sont fournies', () => {
    const sansLecture = monter();
    expect(element(sansLecture).querySelector('.slide-chart__reading')).toBeNull();
    expect(element(sansLecture).querySelector('.slide-chart__source')).toBeNull();

    const avecLecture = monter({ reading: 'La marge progresse', source: 'Comptes annuels' });
    expect(element(avecLecture).querySelector('.slide-chart__reading')?.textContent).toContain(
      'La marge progresse',
    );
    expect(element(avecLecture).querySelector('.slide-chart__source')?.textContent).toContain(
      'Comptes annuels',
    );
  });
});

const ABSCISSES = '.slide-chart__labels > span';
const VALEURS_DES_POINTS = '.slide-chart__point-value';
const VALEURS_DES_BARRES = '.slide-chart__value';

function graphiqueServi(
  instantane: InstantaneDuCoursB2,
  id: string,
): Readonly<Record<string, unknown>> {
  const ecran = ecransPublicsDe(instantane).find((candidat) => candidat.id === id);
  const presentation = ecran === undefined ? null : presentationDe(ecran);
  if (presentation?.renderer !== 'chart') {
    throw new Error(`graphique absent du cours servi : ${id}`);
  }
  return presentation.props;
}

async function rendreALaLargeur(
  fixture: ComponentFixture<SlideChartComponent>,
  largeur: string,
): Promise<void> {
  element(fixture).style.width = largeur;
  for (let image = 0; image < 3; image += 1) {
    await new Promise((suite) => requestAnimationFrame(suite));
    fixture.detectChanges();
  }
}

function rangsVisibles(rendu: HTMLElement, selecteur: string): number[] {
  return Array.from(rendu.querySelectorAll(selecteur)).flatMap((texte, rang) =>
    getComputedStyle(texte).visibility === 'visible' ? [rang] : [],
  );
}

const GRADUATIONS = '.slide-chart__axis--left .slide-chart__tick';

function glisse(rendu: HTMLElement): boolean {
  const defileur = rendu.querySelector<HTMLElement>('.slide-chart__defileur');
  return defileur !== null && defileur.scrollWidth > defileur.clientWidth + 1;
}

const TEXTES_RECULABLES = `${ABSCISSES}, ${VALEURS_DES_BARRES}, ${VALEURS_DES_POINTS}`;

function reculsDesTextes(rendu: HTMLElement): string[] {
  return Array.from(rendu.querySelectorAll<HTMLElement>(TEXTES_RECULABLES)).flatMap((texte) => {
    const recul = texte.style.getPropertyValue('--recul').trim();
    const sorte = texte.matches(ABSCISSES) ? 'abscisse' : 'valeur';
    return recul === '' || recul === '0px'
      ? []
      : [`${sorte} ${texte.textContent?.trim()} ${recul}`];
  });
}

const GRAPHIQUES_SERVIS = INSTANTANES_DES_COURS_SERVIS.flatMap(([, instantane]) =>
  ecransPublicsDe(instantane).flatMap((ecran) => {
    const presentation = presentationDe(ecran);
    return presentation?.renderer === 'chart' ? [[ecran.id, presentation.props] as const] : [];
  }),
);

const LARGEURS_DES_RECULS = ['18rem', '37.3rem', '80rem'];

function textesHorsDuTrace(rendu: HTMLElement): string[] {
  const trace = rendu.querySelector('.slide-chart__plot')?.getBoundingClientRect();
  return Array.from(rendu.querySelectorAll<HTMLElement>(TEXTES_RECULABLES)).flatMap((texte) => {
    if (trace === undefined || getComputedStyle(texte).visibility !== 'visible') {
      return [];
    }
    const plage = document.createRange();
    plage.selectNodeContents(texte);
    const cadre = plage.getBoundingClientRect();
    return cadre.left < trace.left - 0.5 || cadre.right > trace.right + 0.5
      ? [`${texte.textContent?.trim()} ${Math.round(cadre.left)}→${Math.round(cadre.right)}`]
      : [];
  });
}

function rangsDesGraduationsVisibles(rendu: HTMLElement): number[] {
  return Array.from(rendu.querySelectorAll<HTMLElement>(GRADUATIONS))
    .flatMap((graduation) =>
      getComputedStyle(graduation).visibility === 'visible'
        ? [Number(graduation.dataset['rang'])]
        : [],
    )
    .sort((un, autre) => un - autre);
}

function unSurN(nombre: number, pas: number): number[] {
  return Array.from({ length: Math.floor((nombre - 1) / pas) + 1 }, (_, rang) => rang * pas);
}

const LARGEURS_DU_TELEPHONE_A_LA_PROJECTION = [18, 21, 24, 27, 30, 34, 38, 44, 50];

async function lireAChaqueLargeur<T extends object>(
  fixture: ComponentFixture<SlideChartComponent>,
  largeurs: readonly number[],
  lire: (rendu: HTMLElement) => T,
): Promise<({ largeur: number } & T)[]> {
  const lectures: ({ largeur: number } & T)[] = [];
  for (const largeur of largeurs) {
    await rendreALaLargeur(fixture, `${largeur}rem`);
    lectures.push({ largeur, ...lire(element(fixture)) });
  }
  return lectures;
}

async function tracerALaHauteur(
  fixture: ComponentFixture<SlideChartComponent>,
  hauteur: string,
): Promise<void> {
  element(fixture)
    .querySelector<HTMLElement>('.slide-chart__plot')
    ?.style.setProperty('--plot-h', hauteur);
  await rendreALaLargeur(fixture, '44rem');
}

async function lireAChaqueHauteurJusquAuTraceMinimal<T extends object>(
  fixture: ComponentFixture<SlideChartComponent>,
  lire: (rendu: HTMLElement) => T,
): Promise<({ hauteur: number } & T)[]> {
  const lectures: ({ hauteur: number } & T)[] = [];
  for (const hauteur of [4, 5, 6, 8, 10]) {
    await tracerALaHauteur(fixture, `${hauteur}rem`);
    lectures.push({ hauteur, ...lire(element(fixture)) });
  }
  await tracerALaHauteur(fixture, '12rem');
  return lectures;
}

describe('SlideChartComponent · QP-02, des libellés qui ne se touchent jamais', () => {
  preparerLeGraphique();
  jouerLesGraphiquesJusquAuBout();

  it('n écrit qu une fois la valeur du point commun à deux courbes, comme 826 au B2-04', () => {
    const rendu = element(
      monterLeGraphique(graphiqueServi(INSTANTANE_B2_04, 'B2-04-A3-01-GRAPHIQUE')),
    );

    expect(textes(rendu, VALEURS_DES_POINTS)).toEqual([
      '826',
      '870',
      '914',
      '958',
      '1 002',
      '1 046',
      '875,56',
      '928,09',
      '983,78',
      '1 042,81',
      '1 105,37',
    ]);
  });

  it('garde au-dessus la valeur du point commun aux courbes les plus hautes, et la plus basse au-dessous', () => {
    const rendu = element(
      monter({
        kind: 'line',
        series: [
          { label: 'Hypothèse A', values: [150, 132.5, 120], tone: 'teal' },
          { label: 'Hypothèse B', values: [150, 90, 95], tone: 'gold' },
          { label: 'Plancher', values: [60, 80, 70], tone: 'ink' },
        ],
        axisRanges: [[0, 180]],
      }),
    );

    expect(
      Array.from(rendu.querySelectorAll('.slide-chart__point-value[data-rang="0"]')).map(
        (valeur) => [valeur.textContent?.trim(), valeur.classList.contains('is-below')],
      ),
    ).toEqual([
      ['150', false],
      ['60', true],
    ]);
  });

  it('ne garde qu une abscisse et une valeur sur deux, ou sur trois, quand elles ne tiennent pas, et les rend toutes dès qu elles tiennent', async () => {
    const fixture = monterLeGraphique(graphiqueServi(INSTANTANE_B2_01, 'B2-01-A3-08-INDICE-PRIX'));
    const rendu = element(fixture);
    const lectures = await lireAChaqueLargeur(
      fixture,
      LARGEURS_DU_TELEPHONE_A_LA_PROJECTION,
      (vue) => ({
        colles: libellesColles(vue),
        abscisses: rangsVisibles(vue, ABSCISSES),
        valeurs: rangsVisibles(vue, VALEURS_DES_POINTS),
      }),
    );
    await rendreALaLargeur(fixture, '75rem');

    expect(lectures).toEqual(
      lectures.map(({ largeur, abscisses, valeurs }) => ({
        largeur,
        colles: [],
        abscisses: unSurN(7, abscisses[1] ?? 1),
        valeurs: unSurN(7, valeurs[1] ?? 1),
      })),
    );
    expect([
      lectures.some(({ abscisses }) => abscisses.length < 7),
      lectures.some(({ valeurs }) => valeurs.length < 7),
    ]).toEqual([true, true]);
    expect([
      libellesColles(rendu),
      rangsVisibles(rendu, ABSCISSES),
      rangsVisibles(rendu, VALEURS_DES_POINTS),
    ]).toEqual([[], unSurN(7, 1), unSurN(7, 1)]);
  });

  it('QP-19 · ne garde qu une graduation sur deux, base comprise, quand elles se touchent, et les rend toutes dès que le tracé est assez haut, comme le prix du sac du B2-01 en projection', async () => {
    const fixture = monterLeGraphique(graphiqueServi(INSTANTANE_B2_01, 'B2-01-A3-03-PRIX-SAC'));
    const rendu = element(fixture);
    const nombre = rendu.querySelectorAll(GRADUATIONS).length;
    const lectures = await lireAChaqueHauteurJusquAuTraceMinimal(fixture, (vue) => ({
      colles: libellesColles(vue),
      graduations: rangsDesGraduationsVisibles(vue),
    }));

    expect(lectures).toEqual(
      lectures.map(({ hauteur, graduations }) => ({
        hauteur,
        colles: [],
        graduations: unSurN(nombre, graduations[1] ?? 1),
      })),
    );
    expect(lectures.some(({ graduations }) => graduations.length < nombre)).toBeTrue();
    expect([libellesColles(rendu), rangsDesGraduationsVisibles(rendu)]).toEqual([
      [],
      unSurN(nombre, 1),
    ]);
  });

  it('remesure ses abscisses quand une police finit de charger, sans que le graphique change de taille', async () => {
    const fixture = monterLeGraphique(graphiqueServi(INSTANTANE_B2_01, 'B2-01-A3-08-INDICE-PRIX'));
    const rendu = element(fixture);
    await rendreALaLargeur(fixture, '44rem');
    const avant = rangsVisibles(rendu, ABSCISSES);

    rendu
      .querySelector<HTMLElement>('.slide-chart__labels')
      ?.style.setProperty('letter-spacing', '1.5em');
    document.fonts.dispatchEvent(new Event('loadingdone'));
    await rendreALaLargeur(fixture, '44rem');

    expect([avant, libellesColles(rendu)]).toEqual([unSurN(7, 1), []]);
    expect(rangsVisibles(rendu, ABSCISSES).length).toBeLessThan(7);
  });
});

describe('SlideChartComponent · QP-18, une valeur ne touche que sa propre forme', () => {
  preparerLeGraphique();
  jouerLesGraphiquesJusquAuBout();

  it('cale la valeur sur le bord extérieur de sa barre, sinon n en garde qu une sur deux, sans jamais toucher la barre ou le marqueur d une autre série, comme l emprunt du B2-05', async () => {
    const fixture = monterLeGraphique(graphiqueServi(INSTANTANE_B2_05, 'B2-05-A3-01-GRAPHIQUE'));
    const rendu = element(fixture);
    const lectures = await lireAChaqueLargeur(
      fixture,
      [...LARGEURS_DU_TELEPHONE_A_LA_PROJECTION, 60],
      (vue) => ({
        surLesFormes: valeursSurUneForme(vue),
        colles: libellesColles(vue),
        glisse: glisse(vue),
      }),
    );
    await rendreALaLargeur(fixture, '75rem');

    expect(lectures).toEqual(
      lectures.map(({ largeur }) => ({ largeur, surLesFormes: [], colles: [], glisse: false })),
    );
    expect([valeursSurUneForme(rendu), rangsVisibles(rendu, VALEURS_DES_BARRES).length]).toEqual([
      [],
      20,
    ]);
  });

  it('fait reculer au moins une valeur et une abscisse des graphiques servis, au téléphone ou en projection', async () => {
    const sortes = new Set<string>();
    for (const [, entrees] of GRAPHIQUES_SERVIS) {
      const fixture = monterLeGraphique(entrees);
      for (const largeur of LARGEURS_DES_RECULS) {
        await rendreALaLargeur(fixture, largeur);
        reculsDesTextes(element(fixture)).forEach((recul) => sortes.add(recul.split(' ')[0]));
      }
      fixture.destroy();
    }

    expect([sortes.has('abscisse'), sortes.has('valeur')]).toEqual([true, true]);
  });

  for (const [id, entrees] of GRAPHIQUES_SERVIS) {
    it(`${id} : recule une valeur ou une abscisse de la même longueur à toute échelle de la toile et à chaque nouvelle mesure, sans qu elle sorte du tracé, comme l emprunt du B2-05 en projection`, async () => {
      const fixture = monterLeGraphique(entrees);
      const rendu = element(fixture);
      rendu.style.transformOrigin = '0 0';
      const lectures: object[] = [];
      const attendues: object[] = [];
      for (const largeur of LARGEURS_DES_RECULS) {
        rendu.style.transform = '';
        await rendreALaLargeur(fixture, largeur);
        const aLEchelleUn = reculsDesTextes(rendu);
        for (const echelle of [1.4, 0.75, 1]) {
          rendu.style.transform = `scale(${echelle})`;
          for (const mesure of [1, 2, 3]) {
            document.fonts.dispatchEvent(new Event('loadingdone'));
            await rendreALaLargeur(fixture, largeur);
            const lecture = { largeur, echelle, mesure };
            lectures.push({
              ...lecture,
              reculs: reculsDesTextes(rendu),
              hors: textesHorsDuTrace(rendu),
            });
            attendues.push({ ...lecture, reculs: aLEchelleUn, hors: [] });
          }
        }
      }

      expect(lectures).toEqual(attendues);
    });
  }

  it('écarte la valeur d un point du point d une autre courbe, ou la masque, et les rend toutes dès que le tracé est assez haut, comme « 80 » au prix du sac du B2-01', async () => {
    const fixture = monterLeGraphique(graphiqueServi(INSTANTANE_B2_01, 'B2-01-A3-03-PRIX-SAC'));
    const rendu = element(fixture);
    const lectures = await lireAChaqueHauteurJusquAuTraceMinimal(fixture, (vue) => ({
      surLesFormes: valeursSurUneForme(vue),
      colles: libellesColles(vue),
    }));

    expect(lectures).toEqual(
      lectures.map(({ hauteur }) => ({ hauteur, surLesFormes: [], colles: [] })),
    );
    expect([valeursSurUneForme(rendu), rangsVisibles(rendu, VALEURS_DES_POINTS).length]).toEqual([
      [],
      9,
    ]);
  });

  it('passe la valeur de l autre côté de son point quand elle toucherait un point voisin, plutôt que de la masquer, comme l indice des prix du B2-01', async () => {
    const fixture = monterLeGraphique(graphiqueServi(INSTANTANE_B2_01, 'B2-01-A3-08-INDICE-PRIX'));
    const lectures = await lireAChaqueLargeur(
      fixture,
      LARGEURS_DU_TELEPHONE_A_LA_PROJECTION,
      (vue) => ({
        surLesFormes: valeursSurUneForme(vue),
        dessous: rangsVisibles(vue, `${VALEURS_DES_POINTS}.is-below`).length,
      }),
    );

    expect(lectures.map(({ largeur, surLesFormes }) => ({ largeur, surLesFormes }))).toEqual(
      lectures.map(({ largeur }) => ({ largeur, surLesFormes: [] })),
    );
    expect(lectures.filter(({ dessous }) => dessous > 0).length).toBeGreaterThan(0);
  });
});
