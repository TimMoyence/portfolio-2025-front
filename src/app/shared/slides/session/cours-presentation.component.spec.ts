import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { EcranContent } from '../../../../cours/content/types';
import { attendreQue } from '../../../../testing/briques-montees';
import {
  ecransDuPupitreB2_01,
  ecransPublicsB2_01,
} from '../../../../testing/fixtures/instantane-b2-01';
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
  cadre.style.cssText = `position:fixed;top:0;left:0;width:${largeur}px;height:${hauteur}px;display:flex;`;
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
    racine.querySelector<HTMLElement>('app-slide-activity [render]');
  await attendreQue(
    fixture,
    () => racine.querySelector('app-slide-activity *') !== null,
    `l écran ${ecran.id} en ${mode}`,
  );
  await new Promise((suite) => setTimeout(suite, 50));
  fixture.detectChanges();
  return {
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
    ['G1', 'A2-04-MARGE-AXE-ZERO'],
    ['E13', 'A2-02-ORIGINE-AXE'],
    ['E14', 'A2-03-ATELIER-1'],
    ['R6', 'A5-04-SIMULATEUR-MIX'],
  ] as const) {
    for (const mode of ['formateur', 'projection'] as const) {
      it(`${reference} · ${suffixe} tient dans la toile sans défilement en ${mode}`, async () => {
        const monte = await monterDansUnCadre(ecranDuPupitre(suffixe), mode, 1280, 720);
        const toile = monte.toile();

        expect(toile?.scrollHeight).withContext('hauteur du contenu').toBeLessThanOrEqual(720);
        expect(toile?.scrollWidth).withContext('largeur du contenu').toBeLessThanOrEqual(1280);
        monte.detruire();
      });
    }
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
    const toile = monte.toile();
    const miniature = toile?.querySelector<HTMLElement>('[data-testid="cours-renvoi"]');
    const cadreMiniature = miniature?.getBoundingClientRect();
    const audit = monte.brique()?.shadowRoot?.querySelector('fieldset')?.getBoundingClientRect();
    const seChevauchent =
      cadreMiniature !== undefined &&
      audit !== undefined &&
      cadreMiniature.left < audit.right &&
      audit.left < cadreMiniature.right &&
      cadreMiniature.top < audit.bottom &&
      audit.top < cadreMiniature.bottom;

    expect(miniature?.textContent).toContain('Marge brute : une croissance continue');
    expect(cadreMiniature?.width).toBeLessThanOrEqual(1280 * 0.35);
    expect(seChevauchent).toBeFalse();
    expect(toile?.scrollHeight).toBeLessThanOrEqual(720);
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
      const formateur = await monterDansUnCadre(ecranDuPupitre(suffixe), 'formateur', 640, 360);
      const renduFormateur = formateur.brique()?.getAttribute('render');
      formateur.detruire();
      const projection = await monterDansUnCadre(ecranDuPupitre(suffixe), 'projection', 640, 360);
      const renduProjection = projection.brique()?.getAttribute('render');
      projection.detruire();

      expect(renduFormateur).toBe('stage');
      expect(renduProjection).toBe('stage');
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

  it('R5 · COFFRE : la page défile, aucun bloc ne défile en interne', async () => {
    const coffre = ecransPublicsB2_01().find(({ id }) => id.endsWith('A6-02-COFFRE'));
    const poste = document.createElement('section');
    poste.className = 'student-session';
    poste.style.cssText = 'display:block;width:390px;';
    document.body.appendChild(poste);
    const fixture = TestBed.createComponent(CoursPresentationComponent);
    poste.appendChild(fixture.nativeElement as HTMLElement);
    fixture.componentRef.setInput('mode', 'etudiant');
    fixture.componentRef.setInput('slide', coffre ?? null);
    const racine = fixture.nativeElement as HTMLElement;
    await attendreQue(
      fixture,
      () => racine.querySelector('app-slide-activity [render]')?.shadowRoot?.firstChild != null,
      'le coffre au poste étudiant',
    );
    await new Promise((suite) => setTimeout(suite, 50));

    expect(coffre).toBeDefined();
    expect(defileursInternes(racine)).toEqual([]);
    fixture.destroy();
    poste.remove();
  });

  for (const largeur of [390, 1280]) {
    it(`R7 · BOITE-A-OUTILS à ${largeur} px : chaque carte, recto puis verso, tient dans son contenant`, async () => {
      const boite = ecransPublicsB2_01().find(({ id }) => id.endsWith('A6-07-BOITE-A-OUTILS'));
      const poste = document.createElement('section');
      poste.className = 'student-session';
      poste.style.cssText = `display:block;width:${largeur}px;`;
      document.body.appendChild(poste);
      const fixture = TestBed.createComponent(CoursPresentationComponent);
      poste.appendChild(fixture.nativeElement as HTMLElement);
      fixture.componentRef.setInput('mode', 'etudiant');
      fixture.componentRef.setInput('slide', boite ?? null);
      const racine = fixture.nativeElement as HTMLElement;
      await attendreQue(
        fixture,
        () => racine.querySelector('.slide-grid__card') !== null,
        'la boîte à outils au poste étudiant',
      );
      const recto = cartesQuiDebordent(racine);
      for (const carte of racine.querySelectorAll<HTMLElement>('.slide-grid__card--flip')) {
        carte.click();
      }
      fixture.detectChanges();
      await new Promise((suite) => setTimeout(suite, 300));

      expect({ recto, verso: cartesQuiDebordent(racine) }).toEqual({ recto: [], verso: [] });
      fixture.destroy();
      poste.remove();
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
