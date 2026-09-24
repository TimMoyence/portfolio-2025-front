import { Component, input } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { EcranContent } from '../../../../cours/content/types';
import { attendreQue, DELAI_DE_MONTAGE_MS } from '../../../../testing/briques-montees';
import {
  ecransDuPupitreB2_01,
  ecransPublicsB2_01,
} from '../../../../testing/fixtures/instantane-b2-01';
import { chargerLesPolicesDeLApplication } from '../../../../testing/polices';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import {
  CoursPresentationComponent,
  type CoursPresentationMode,
} from './cours-presentation.component';

const POSTES = ['cours-etudiant', 'cours-presentateur'] as const;

@Component({
  standalone: true,
  imports: [CoursPresentationComponent],
  template: `
    <app-cours-presentation mode="projection" [slide]="slide()" [surimpression]="calque" />
    <ng-template #calque><p data-testid="surimpression">45,5</p></ng-template>
  `,
})
class HoteAvecSurimpressionComponent {
  readonly slide = input.required<EcranContent>();
}

interface EcranCadre {
  readonly cadre: HTMLElement;
  readonly hote: HTMLElement;
  readonly toile: () => HTMLElement | null;
  readonly brique: () => HTMLElement | null;
  readonly detruire: () => void;
}

function ecranDuPupitre(suffixe: string): EcranContent {
  const ecran = ecransDuPupitreB2_01().find(({ id }) => id.endsWith(suffixe));
  if (ecran === undefined) {
    throw new Error(`écran absent du pupitre : ${suffixe}`);
  }
  return ecran;
}

async function monterDansUnCadre(
  ecran: EcranContent,
  mode: CoursPresentationMode,
  largeur: number,
  hauteur: number,
  renvoi: EcranContent | null = null,
): Promise<EcranCadre> {
  const cadre = document.createElement('div');
  cadre.style.cssText = `position:fixed;top:0;left:0;width:${largeur}px;height:${hauteur}px;display:flex;overflow:auto;`;
  document.body.appendChild(cadre);
  const fixture = TestBed.createComponent(CoursPresentationComponent);
  cadre.appendChild(fixture.nativeElement as HTMLElement);
  fixture.componentRef.setInput('mode', mode);
  fixture.componentRef.setInput('slide', ecran);
  if (renvoi !== null) {
    fixture.componentRef.setInput('renvoi', renvoi);
  }
  const racine = fixture.nativeElement as HTMLElement;
  const toile = (): HTMLElement | null =>
    racine.querySelector<HTMLElement>('[data-testid="cours-toile"]');
  const brique = (): HTMLElement | null =>
    racine.querySelector<HTMLElement>(
      '[data-testid="cours-contenu"] app-slide-activity [data-cours-role]',
    );
  await attendreQue(
    fixture,
    () => racine.querySelector('app-slide-activity *') !== null,
    `l écran ${ecran.id} en ${mode}`,
  );
  await chargerLesPolicesDeLApplication();
  await new Promise((suite) => setTimeout(suite, 50));
  fixture.detectChanges();
  return {
    cadre,
    hote: racine,
    toile,
    brique,
    detruire: () => {
      fixture.destroy();
      cadre.remove();
    },
  };
}

describe('CoursPresentationComponent : un seul écran pour la projection et le pupitre', () => {
  beforeEach(() => setupTestBed({ imports: [CoursPresentationComponent] }));

  it('mesure les écrans avec les polices servies par l application, quelle que soit la machine', async () => {
    expect(await chargerLesPolicesDeLApplication()).toEqual([
      'Geist Mono',
      'Hanken Grotesk',
      'Instrument Serif',
    ]);
  });

  it('G1 · rend l aperçu formateur dans une toile 1280 × 720 mise à l échelle de son cadre', async () => {
    const monte = await monterDansUnCadre(
      ecranDuPupitre('A1-09-DIAPOSITIVE'),
      'formateur',
      640,
      900,
    );
    const rect = monte.toile()?.getBoundingClientRect();

    expect(monte.toile()?.offsetWidth).toBe(1280);
    expect(monte.toile()?.offsetHeight).toBe(720);
    expect(rect?.width).toBeCloseTo(640, 0);
    expect(rect?.height).toBeCloseTo(360, 0);
    monte.detruire();
  });

  it('G1 · centre la toile de projection dans une scène qui n est pas en 16:9', async () => {
    const monte = await monterDansUnCadre(
      ecranDuPupitre('A1-09-DIAPOSITIVE'),
      'projection',
      1000,
      1000,
    );
    const rect = monte.toile()?.getBoundingClientRect();

    expect(rect?.width).toBeCloseTo(1000, 0);
    expect(rect?.height).toBeCloseTo(562.5, 0);
    expect(rect?.top).toBeCloseTo((1000 - 562.5) / 2, 0);
    monte.detruire();
  });

  for (const [reference, suffixe] of [
    ['G1', 'A1-09-DIAPOSITIVE'],
    ['G1', 'A2-01-PLAYFAIR'],
    ['E13', 'A2-02-ORIGINE-AXE'],
    ['E14', 'A2-03-ATELIER-1'],
    ['R6', 'A5-04-SIMULATEUR-MIX'],
    ['RET-22', 'A3-03-PRIX-SAC'],
    ['RET-26', 'A3-07-ATELIER-2'],
    ['RET-27', 'A3-08-INDICE-PRIX'],
    ['F33', 'A5-07-CONTROLE-DISCRIMINANT'],
    ['F33', 'A5-07-CORRECTION'],
  ] as const) {
    for (const mode of ['formateur', 'projection', 'etudiant'] as const) {
      it(`${reference} · ${suffixe} tient dans la toile sans défilement en ${mode}`, async () => {
        const ecran =
          mode === 'etudiant'
            ? ecransPublicsB2_01().find(({ id }) => id.endsWith(suffixe))
            : ecranDuPupitre(suffixe);
        if (ecran === undefined) {
          throw new Error(`écran absent du poste étudiant : ${suffixe}`);
        }
        const renvoi = ecransDuPupitreB2_01().find(({ id }) => id === ecran.renvoi) ?? null;
        const monte = await monterDansUnCadre(ecran, mode, 1280, 720, renvoi);
        const toile = monte.toile();

        if (!defilante(monte)) {
          expect(toile?.scrollHeight).withContext('hauteur du contenu').toBeLessThanOrEqual(720);
          expect(toile?.scrollWidth).withContext('largeur du contenu').toBeLessThanOrEqual(1280);
        }
        expect(elementsPerdus(monte)).withContext('éléments coupés').toEqual([]);
        monte.detruire();
      });
    }
  }

  for (const mode of ['formateur', 'projection', 'etudiant'] as const) {
    it(
      `T2 · T3 · G01 · chaque écran du B2-01 tient sur une toile 1280 × 720 en ${mode}, sans défilement interne ni tassement`,
      async () => {
        const pupitre = ecransDuPupitreB2_01();
        const ecrans = mode === 'etudiant' ? ecransPublicsB2_01() : pupitre;
        const fautes: string[] = [];
        for (const ecran of ecrans) {
          const renvoi = pupitre.find(({ id }) => id === ecran.renvoi) ?? null;
          const monte = await monterDansUnCadre(ecran, mode, 1280, 720, renvoi);
          const toile = monte.toile();
          const horsToile = elementsPerdus(monte);
          const defileurs = toile === null ? [] : defileursInternes(toile);
          const echelle = echelleDuContenu(toile);
          if (horsToile.length > 0 || defileurs.length > 0 || echelle < ECHELLE_MINIMALE) {
            fautes.push(
              `${ecran.id} ${mode} hors=${horsToile.join(',')} defile=${defileurs.join(',')} echelle=${echelle}`,
            );
          }
          monte.detruire();
        }

        expect(ecrans.length).withContext('écrans du B2-01').toBeGreaterThan(50);
        expect(fautes).toEqual([]);
      },
      DELAI_DE_MONTAGE_MS,
    );
  }

  it(
    'G01 · sur un portable 14 pouces, chaque écran étudiant du B2-01 tient dans son cadre sans défiler, à une taille lisible',
    async () => {
      const pupitre = ecransDuPupitreB2_01();
      const fautes: string[] = [];
      for (const ecran of ecransPublicsB2_01()) {
        const renvoi = pupitre.find(({ id }) => id === ecran.renvoi) ?? null;
        const monte = await monterDansUnCadre(
          ecran,
          'etudiant',
          CADRE_ETUDIANT_14_POUCES.largeur,
          CADRE_ETUDIANT_14_POUCES.hauteur,
          renvoi,
        );
        const defile = monte.cadre.scrollHeight > monte.cadre.clientHeight + 1;
        const horsToile = elementsHorsToile(monte);
        const echelle = echelleAffichee(monte);
        if (defile || horsToile.length > 0 || echelle < ECHELLE_MINIMALE - 0.001) {
          fautes.push(
            `${ecran.id} defile=${String(defile)} hors=${horsToile.join(',')} echelle=${echelle.toFixed(3)}`,
          );
        }
        monte.detruire();
      }

      expect(fautes).toEqual([]);
    },
    DELAI_DE_MONTAGE_MS,
  );

  it('G01 · au poste étudiant, le contenu d une toile réduite garde 0,8 et celui d une toile agrandie s affiche au moins à 0,8', async () => {
    const recommandation = ecransPublicsB2_01().find(({ id }) =>
      id.endsWith('A5-08-RECOMMANDATION'),
    );
    if (recommandation === undefined) {
      throw new Error('écran absent du poste étudiant : A5-08-RECOMMANDATION');
    }
    const reduite = await monterDansUnCadre(recommandation, 'etudiant', 1350, 700);

    expect(echelleDuContenu(reduite.toile())).toBeCloseTo(ECHELLE_MINIMALE, 3);
    reduite.detruire();

    const agrandie = await monterDansUnCadre(
      recommandation,
      'etudiant',
      CADRE_ETUDIANT_14_POUCES.largeur,
      CADRE_ETUDIANT_14_POUCES.hauteur,
    );

    expect(echelleAffichee(agrandie)).toBeGreaterThanOrEqual(ECHELLE_MINIMALE - 0.001);
    agrandie.detruire();
  });

  for (const mode of ['formateur', 'projection'] as const) {
    it(`G01 · en ${mode}, un écran trop long ne défile jamais : il est mis à l échelle de la toile`, async () => {
      const ecrans = ecransDuPupitreB2_01();
      const recommandation = ecranDuPupitre('A5-08-RECOMMANDATION');
      const renvoi = ecrans.find(({ id }) => id === recommandation.renvoi) ?? null;
      const monte = await monterDansUnCadre(recommandation, mode, 1280, 720, renvoi);

      expect(monte.hote.classList).not.toContain('cours-presentation--defilante');
      expect(echelleDuContenu(monte.toile())).toBeLessThan(1);
      expect(elementsHorsToile(monte)).toEqual([]);
      monte.detruire();
    });
  }

  it('G01 · T3 · au poste étudiant, un écran trop long garde une taille lisible et fait défiler la page', async () => {
    const ecrans = ecransPublicsB2_01();
    const recommandation = ecrans.find(({ id }) => id.endsWith('A5-08-RECOMMANDATION'));
    if (recommandation === undefined) {
      throw new Error('écran absent du poste étudiant : A5-08-RECOMMANDATION');
    }
    const renvoi = ecrans.find(({ id }) => id === recommandation.renvoi) ?? null;
    const monte = await monterDansUnCadre(recommandation, 'etudiant', 1280, 720, renvoi);
    const envoyer = monte.brique()?.shadowRoot?.querySelector('[data-testid="envoyer"]');

    expect(monte.hote.classList).toContain('cours-presentation--defilante');
    expect(echelleDuContenu(monte.toile())).toBeGreaterThanOrEqual(ECHELLE_MINIMALE);
    expect(monte.cadre.scrollHeight).toBeGreaterThan(monte.cadre.clientHeight);
    expect(envoyer).withContext('bouton d envoi de la recommandation').toBeTruthy();
    expect(elementsHorsDeLaPage(monte)).toEqual([]);
    expect(defileursInternes(monte.toile() as HTMLElement)).toEqual([]);
    monte.detruire();
  });

  for (const mode of ['formateur', 'projection', 'etudiant'] as const) {
    it(
      `T1 · chaque écran à renvoi tient entier dans sa demi-toile en ${mode}, titre compris`,
      async () => {
        const ecrans = ecransDuPupitreB2_01();
        const coupes: string[] = [];
        const aRenvoi = ecrans.filter(({ renvoi }) => renvoi !== undefined);
        expect(aRenvoi.length).withContext('écrans à renvoi du B2-01').toBeGreaterThan(5);
        for (const ecran of aRenvoi) {
          const renvoi = ecrans.find(({ id }) => id === ecran.renvoi) ?? null;
          const monte = await monterDansUnCadre(ecran, mode, 1280, 720, renvoi);
          await new Promise((suite) => setTimeout(suite, 50));
          const horsToile = elementsPerdus(monte);
          if (horsToile.length > 0) {
            coupes.push(`${ecran.id} (${horsToile.join(',')})`);
          }
          monte.detruire();
        }

        expect(coupes).toEqual([]);
      },
      DELAI_DE_MONTAGE_MS,
    );
  }

  for (const mode of ['formateur', 'projection', 'etudiant'] as const) {
    it(`G09 · ORIGINE-AXE remplit sa colonne en ${mode} au lieu d être réduit`, async () => {
      const ecrans = ecransDuPupitreB2_01();
      const ecran = ecranDuPupitre('A2-02-ORIGINE-AXE');
      const renvoi = ecrans.find(({ id }) => id === ecran.renvoi) ?? null;
      const monte = await monterDansUnCadre(ecran, mode, 1280, 720, renvoi);
      await new Promise((suite) => setTimeout(suite, 50));
      const principal = monte.toile()?.querySelector<HTMLElement>('.cours-toile__principal');
      const style =
        principal === null || principal === undefined ? null : getComputedStyle(principal);
      const colonne =
        (principal?.clientWidth ?? 0) -
        Number.parseFloat(style?.paddingInlineStart ?? '0') -
        Number.parseFloat(style?.paddingInlineEnd ?? '0');
      const carte = monte.brique()?.shadowRoot?.querySelector('.fp-plot__atelier');

      expect(carte?.getBoundingClientRect().width ?? 0).toBeGreaterThanOrEqual(colonne * 0.9);
      monte.detruire();
    });
  }

  it('R1 · pose dans la toile la surimpression fournie par le poste', () => {
    const fixture = TestBed.createComponent(HoteAvecSurimpressionComponent);
    fixture.componentRef.setInput('slide', ecranDuPupitre('A2-03-ATELIER-1'));
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="cours-toile"] [data-testid="surimpression"]',
      )?.textContent,
    ).toBe('45,5');
    fixture.destroy();
  });

  it('G1 · garde la même taille logique de titre quelle que soit la largeur du cadre', async () => {
    const tailleDuTitre = async (largeur: number): Promise<string | undefined> => {
      const monte = await monterDansUnCadre(
        ecranDuPupitre('A1-09-DIAPOSITIVE'),
        'formateur',
        largeur,
        2000,
      );
      const titre = monte.toile()?.querySelector('h1, h2');
      const taille =
        titre === null || titre === undefined ? undefined : getComputedStyle(titre).fontSize;
      const toile = monte.toile()?.getBoundingClientRect().width;
      monte.detruire();
      return toile === undefined ? undefined : `${taille}@${Math.round(toile / largeur)}`;
    };

    expect(await tailleDuTitre(540)).toBe(await tailleDuTitre(1280));
    expect(await tailleDuTitre(540)).toMatch(/px@1$/);
  });

  it('E10 · place la miniature de la diapositive de Samir dans la toile, à côté de l audit', async () => {
    const monte = await monterDansUnCadre(
      ecranDuPupitre('A1-10-AUDIT-DIAPOSITIVE'),
      'projection',
      1280,
      720,
      ecranDuPupitre('A1-09-DIAPOSITIVE'),
    );
    await new Promise((suite) => setTimeout(suite, 50));
    const toile = monte.toile();
    const miniature = toile?.querySelector<HTMLElement>('[data-testid="cours-renvoi"]');
    const cadreMiniature = miniature?.getBoundingClientRect();
    const cadreDuRenvoi = miniature
      ?.querySelector<HTMLElement>('.cours-renvoi__cadre')
      ?.getBoundingClientRect();
    const toileDuRenvoi = miniature
      ?.querySelector<HTMLElement>('.cours-renvoi__toile')
      ?.getBoundingClientRect();
    const audit = monte.brique()?.shadowRoot?.querySelector('fieldset')?.getBoundingClientRect();
    const seChevauchent =
      cadreMiniature !== undefined &&
      audit !== undefined &&
      cadreMiniature.left < audit.right &&
      audit.left < cadreMiniature.right &&
      cadreMiniature.top < audit.bottom &&
      audit.top < cadreMiniature.bottom;

    expect(miniature?.textContent).toContain('Marge brute : une croissance continue');
    expect(cadreMiniature?.width).toBeCloseTo(1280 * 0.6, 0);
    expect(toileDuRenvoi?.width).toBeLessThanOrEqual((cadreDuRenvoi?.width ?? 0) + 1);
    expect(toileDuRenvoi?.height).toBeLessThanOrEqual((cadreDuRenvoi?.height ?? 0) + 1);
    expect(seChevauchent).toBeFalse();
    expect(toile?.scrollHeight).toBeLessThanOrEqual(720);
    monte.detruire();
  });

  it(
    'R3 · donne à chaque diapositive commentée la part de toile que fixe son cadrage, et la fait remplir son cadre',
    async () => {
      const ecrans = ecransDuPupitreB2_01();
      const fautes: string[] = [];
      for (const ecran of ecrans.filter(({ renvoi }) => renvoi !== undefined)) {
        const renvoi = ecrans.find(({ id }) => id === ecran.renvoi) ?? null;
        const monte = await monterDansUnCadre(ecran, 'projection', 1280, 720, renvoi);
        await new Promise((suite) => setTimeout(suite, 50));
        const miniature = monte.toile()?.querySelector<HTMLElement>('[data-testid="cours-renvoi"]');
        const colonne = miniature?.getBoundingClientRect();
        const cadre = miniature?.querySelector('.cours-renvoi__cadre')?.getBoundingClientRect();
        const contenu = miniature
          ?.querySelector('.cours-renvoi__toile app-slide-activity')
          ?.getBoundingClientRect();
        const part = ecran.cadrageDuRenvoi?.part ?? 0;
        const remplissage =
          cadre === undefined || contenu === undefined
            ? 0
            : Math.max(contenu.width / cadre.width, contenu.height / cadre.height);
        if (Math.abs((colonne?.width ?? 0) - (1280 * part) / 100) > 1 || remplissage < 0.9) {
          fautes.push(
            `${ecran.id} colonne=${colonne?.width} part=${part} remplissage=${remplissage.toFixed(2)}`,
          );
        }
        monte.detruire();
      }

      expect(fautes).toEqual([]);
    },
    DELAI_DE_MONTAGE_MS,
  );

  it('R7 · ne montre, à l écran des points, que la ligne du taux de marge du tableau de bord', async () => {
    const ecrans = ecransDuPupitreB2_01();
    const points = ecranDuPupitre('A2-06-POINTS');
    const monte = await monterDansUnCadre(
      points,
      'projection',
      1280,
      720,
      ecrans.find(({ id }) => id === points.renvoi) ?? null,
    );
    await new Promise((suite) => setTimeout(suite, 50));
    const miniature = monte.toile()?.querySelector('[data-testid="cours-renvoi"]');
    const texte = [...(miniature?.querySelectorAll('*') ?? [])]
      .map((element) => element.shadowRoot?.textContent ?? '')
      .join(' ')
      .concat(miniature?.textContent ?? '');

    expect(texte).toContain('Taux de marge');
    expect(texte).not.toContain('CA HT total');
    expect(texte).not.toContain('Tableau de bord 2025 transmis au comité');
    monte.detruire();
  });

  it('R6 · SIMULATEUR-MIX : l aperçu formateur offre le même curseur, à la même place, que la projection', async () => {
    const curseurDe = async (mode: CoursPresentationMode) => {
      const monte = await monterDansUnCadre(ecranDuPupitre('A5-04-SIMULATEUR-MIX'), mode, 640, 360);
      const racine = monte.brique()?.shadowRoot;
      const curseur = racine?.querySelector<HTMLInputElement>('[data-testid="parametre"] input');
      const toile = monte.toile()?.getBoundingClientRect();
      const rect = curseur?.getBoundingClientRect();
      const releve = {
        curseurs: racine?.querySelectorAll('[data-testid="parametre"]').length,
        reglable: curseur !== null && curseur !== undefined && !curseur.disabled,
        position:
          rect === undefined || toile === undefined
            ? null
            : [
                Math.round(((rect.left - toile.left) / toile.width) * 100),
                Math.round(((rect.top - toile.top) / toile.height) * 100),
              ],
      };
      monte.detruire();
      return releve;
    };

    const formateur = await curseurDe('formateur');

    expect(formateur.curseurs).toBe(1);
    expect(formateur.reglable).toBeTrue();
    expect(formateur).toEqual(await curseurDe('projection'));
  });

  for (const suffixe of ['A6-06-FICHE-MEMO', 'A6-07-BOITE-A-OUTILS']) {
    for (const mode of ['formateur', 'projection'] as const) {
      it(`R7 · ${suffixe} en ${mode} : chaque carte, recto puis verso, tient dans la toile`, async () => {
        const monte = await monterDansUnCadre(ecranDuPupitre(suffixe), mode, 1280, 720);
        const toile = monte.toile() as HTMLElement;
        const releve = (face: string) => ({
          face,
          toile: [toile.scrollWidth <= 1280, toile.scrollHeight <= 720],
          cartesQuiDebordent: cartesQuiDebordent(toile),
        });
        const recto = releve('recto');
        for (const carte of toile.querySelectorAll<HTMLElement>('.slide-grid__card--flip')) {
          carte.click();
        }
        await new Promise((suite) => setTimeout(suite, 300));

        expect([recto, releve('verso')]).toEqual([
          { face: 'recto', toile: [true, true], cartesQuiDebordent: [] },
          { face: 'verso', toile: [true, true], cartesQuiDebordent: [] },
        ]);
        monte.detruire();
      });
    }
  }

  for (const suffixe of [
    'A1-10-AUDIT-DIAPOSITIVE',
    'A1-11-JALON-1',
    'A2-02-ORIGINE-AXE',
    'A5-04-SIMULATEUR-MIX',
  ]) {
    it(`G2 · ${suffixe} : l aperçu formateur rend la même brique que la projection`, async () => {
      const releve = async (mode: CoursPresentationMode) => {
        const monte = await monterDansUnCadre(ecranDuPupitre(suffixe), mode, 640, 360);
        const brique = monte.brique();
        const rendu = {
          brique: brique?.tagName.toLowerCase(),
          role: brique?.getAttribute('data-cours-role'),
          rendu: brique?.shadowRoot?.innerHTML,
        };
        monte.detruire();
        return rendu;
      };

      const formateur = await releve('formateur');

      expect(formateur.role).toBe('presentateur');
      expect(formateur.rendu ?? '').not.toBe('');
      expect(formateur).toEqual(await releve('projection'));
    });
  }
});

function cartesQuiDebordent(racine: ParentNode): string[] {
  return [...racine.querySelectorAll<HTMLElement>('.slide-grid__card')]
    .filter((carte) => {
      const cadre = carte.getBoundingClientRect();
      return (
        carte.scrollHeight > carte.clientHeight + 1 ||
        carte.scrollWidth > carte.clientWidth + 1 ||
        [...carte.querySelectorAll<HTMLElement>('h3, p, strong, span')].some((texte) => {
          const bloc = texte.getBoundingClientRect();
          return (
            bloc.width > 0 &&
            getComputedStyle(texte).visibility === 'visible' &&
            (bloc.right > cadre.right + 1 ||
              bloc.bottom > cadre.bottom + 1 ||
              bloc.left < cadre.left - 1 ||
              bloc.top < cadre.top - 1)
          );
        })
      );
    })
    .map((carte) => carte.querySelector('h3, strong')?.textContent?.trim() ?? '?');
}

function elementsHorsToile(monte: EcranCadre): string[] {
  const toile = monte.toile()?.getBoundingClientRect();
  const contenu = monte.toile()?.querySelector('[data-testid="cours-contenu"]');
  if (toile === undefined || contenu === null || contenu === undefined) {
    return ['toile absente'];
  }
  return elementsDe(contenu)
    .filter((element) => {
      const bloc = element.getBoundingClientRect();
      const replie = element.parentElement?.closest('details:not([open])');
      const resume = element.tagName === 'SUMMARY' && element.parentElement === replie;
      return (
        bloc.height > 0 &&
        (replie === null || replie === undefined || resume) &&
        getComputedStyle(element).visibility === 'visible' &&
        (bloc.top < toile.top - 1 || bloc.bottom > toile.bottom + 1)
      );
    })
    .map(({ tagName }) => tagName);
}

const ECHELLE_MINIMALE = 0.8;

const CADRE_ETUDIANT_14_POUCES = { largeur: 1480, hauteur: 913 } as const;

function echelleAffichee(monte: EcranCadre): number {
  const toile = monte.toile();
  const largeur = toile?.getBoundingClientRect().width ?? 0;
  return (largeur / 1280) * echelleDuContenu(toile);
}

function defilante(monte: EcranCadre): boolean {
  return monte.hote.classList.contains('cours-presentation--defilante');
}

function elementsPerdus(monte: EcranCadre): string[] {
  return defilante(monte) ? elementsHorsDeLaPage(monte) : elementsHorsToile(monte);
}

function elementsHorsDeLaPage(monte: EcranCadre): string[] {
  const cadre = monte.cadre.getBoundingClientRect();
  const fond = cadre.top - monte.cadre.scrollTop + monte.cadre.scrollHeight;
  const contenu = monte.toile()?.querySelector('[data-testid="cours-contenu"]');
  return contenu === null || contenu === undefined
    ? ['toile absente']
    : elementsDe(contenu)
        .filter((element) => {
          const bloc = element.getBoundingClientRect();
          return (
            bloc.height > 0 &&
            getComputedStyle(element).visibility === 'visible' &&
            (bloc.bottom > fond + 1 || bloc.right > cadre.right + 1 || bloc.left < cadre.left - 1)
          );
        })
        .map(({ tagName }) => tagName);
}

function echelleDuContenu(toile: HTMLElement | null): number {
  const contenu = toile?.querySelector<HTMLElement>('.cours-toile__contenu');
  if (contenu === null || contenu === undefined) {
    return 1;
  }
  const { transform } = getComputedStyle(contenu);
  return transform === 'none' ? 1 : new DOMMatrixReadOnly(transform).a;
}

function elementsDe(racine: ParentNode): HTMLElement[] {
  return [...racine.querySelectorAll<HTMLElement>('*')].flatMap((element) => [
    element,
    ...(element.shadowRoot === null ? [] : elementsDe(element.shadowRoot)),
  ]);
}

function defileursInternes(racine: ParentNode): string[] {
  return elementsDe(racine)
    .filter((element) => {
      const { overflowY } = getComputedStyle(element);
      return (
        (overflowY === 'auto' || overflowY === 'scroll') &&
        element.scrollHeight > element.clientHeight + 1
      );
    })
    .map((element) => `${element.tagName.toLowerCase()}.${element.className}`);
}

describe('CoursPresentationComponent au poste étudiant', () => {
  beforeEach(() => setupTestBed({ imports: [CoursPresentationComponent] }));

  async function monterAuPosteEtudiant(
    suffixe: string,
    largeur: number,
    pret: (racine: HTMLElement) => boolean,
  ): Promise<{ fixture: ComponentFixture<CoursPresentationComponent>; racine: HTMLElement }> {
    const ecran = ecransPublicsB2_01().find(({ id }) => id.endsWith(suffixe));
    expect(ecran).withContext(suffixe).toBeDefined();
    const poste = document.createElement('section');
    poste.className = 'student-session';
    poste.style.cssText = `display:block;width:${largeur}px;`;
    document.body.appendChild(poste);
    const fixture = TestBed.createComponent(CoursPresentationComponent);
    poste.appendChild(fixture.nativeElement as HTMLElement);
    fixture.componentRef.onDestroy(() => poste.remove());
    fixture.componentRef.setInput('mode', 'etudiant');
    fixture.componentRef.setInput('slide', ecran ?? null);
    const racine = fixture.nativeElement as HTMLElement;
    await attendreQue(fixture, () => pret(racine), `${suffixe} au poste étudiant`);
    return { fixture, racine };
  }

  it('R5 · COFFRE : la page défile, aucun bloc ne défile en interne', async () => {
    const { fixture, racine } = await monterAuPosteEtudiant(
      'A6-02-COFFRE',
      390,
      (element) =>
        element.querySelector('app-slide-activity [data-cours-role]')?.shadowRoot?.firstChild !=
        null,
    );
    await new Promise((suite) => setTimeout(suite, 50));

    expect(defileursInternes(racine)).toEqual([]);
    fixture.destroy();
  });

  for (const largeur of [390, 1280]) {
    it(`R7 · BOITE-A-OUTILS à ${largeur} px : chaque carte, recto puis verso, tient dans son contenant`, async () => {
      const { fixture, racine } = await monterAuPosteEtudiant(
        'A6-07-BOITE-A-OUTILS',
        largeur,
        (element) => element.querySelector('.slide-grid__card') !== null,
      );
      const recto = cartesQuiDebordent(racine);
      for (const carte of racine.querySelectorAll<HTMLElement>('.slide-grid__card--flip')) {
        carte.click();
      }
      fixture.detectChanges();
      await new Promise((suite) => setTimeout(suite, 300));

      expect({ recto, verso: cartesQuiDebordent(racine) }).toEqual({ recto: [], verso: [] });
      fixture.destroy();
    });
  }
});

function monterDansLePoste(poste: string): { chrome: HTMLElement; slide: HTMLElement } {
  const conteneur = document.createElement('div');
  conteneur.className = poste;
  conteneur.innerHTML = `
    <button type="button" data-testid="chrome">Écran suivant</button>
    <app-cours-presentation>
      <button type="button" class="slide-grid__card" data-testid="slide">Mesure</button>
    </app-cours-presentation>
  `;
  document.body.appendChild(conteneur);
  const lire = (marque: string): HTMLElement => {
    const element = conteneur.querySelector<HTMLElement>(`[data-testid="${marque}"]`);
    if (element === null) {
      throw new Error(`Aucun bouton ${marque} dans le poste ${poste}`);
    }
    return element;
  };
  return { chrome: lire('chrome'), slide: lire('slide') };
}

describe('CoursPresentationComponent dans les postes du cours', () => {
  afterEach(() => {
    POSTES.forEach((poste) => document.querySelector(`.${poste}`)?.remove());
  });

  for (const poste of POSTES) {
    it(`R4/R8 · ne donne pas le style pilule du poste ${poste} aux boutons du contenu d une slide`, () => {
      const { chrome, slide } = monterDansLePoste(poste);
      const styleDuChrome = getComputedStyle(chrome);
      const styleDeLaSlide = getComputedStyle(slide);

      expect(styleDeLaSlide.borderTopLeftRadius).not.toBe(styleDuChrome.borderTopLeftRadius);
      expect(styleDeLaSlide.minHeight).not.toBe(styleDuChrome.minHeight);
    });
  }
});
