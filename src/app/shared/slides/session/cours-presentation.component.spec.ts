import { TestBed } from '@angular/core/testing';
import type { EcranContent } from '../../../../cours/content/types';
import { attendreQue } from '../../../../testing/briques-montees';
import { ecransDuPupitreV3 } from '../../../../testing/fixtures/instantane-b2-01-v3';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import {
  CoursPresentationComponent,
  type CoursPresentationMode,
} from './cours-presentation.component';

const POSTES = ['cours-etudiant', 'cours-presentateur'] as const;

interface EcranCadre {
  readonly toile: () => HTMLElement | null;
  readonly brique: () => HTMLElement | null;
  readonly detruire: () => void;
}

function ecranDuPupitre(suffixe: string): EcranContent {
  const ecran = ecransDuPupitreV3().find(({ id }) => id.endsWith(suffixe));
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
): Promise<EcranCadre> {
  const cadre = document.createElement('div');
  cadre.style.cssText = `position:fixed;top:0;left:0;width:${largeur}px;height:${hauteur}px;display:flex;`;
  document.body.appendChild(cadre);
  const fixture = TestBed.createComponent(CoursPresentationComponent);
  cadre.appendChild(fixture.nativeElement as HTMLElement);
  fixture.componentRef.setInput('mode', mode);
  fixture.componentRef.setInput('slide', ecran);
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
    ['G1', 'A2-04-MARGE-AXE-ZERO'],
    ['E14', 'A2-03-ATELIER-1'],
    ['RET-22', 'A3-03-PRIX-SAC'],
    ['RET-26', 'A3-07-ATELIER-2'],
    ['RET-27', 'A3-08-INDICE-PRIX'],
  ] as const) {
    for (const mode of ['formateur', 'projection'] as const) {
      it(`${reference} · ${suffixe} tient dans la toile sans défilement en ${mode}`, async () => {
        const monte = await monterDansUnCadre(ecranDuPupitre(suffixe), mode, 640, 360);
        const toile = monte.toile();

        expect(toile?.scrollHeight).withContext('hauteur du contenu').toBeLessThanOrEqual(720);
        expect(toile?.scrollWidth).withContext('largeur du contenu').toBeLessThanOrEqual(1280);
        monte.detruire();
      });
    }
  }

  for (const suffixe of ['A1-10-AUDIT-DIAPOSITIVE', 'A1-11-JALON-1', 'A2-02-ORIGINE-AXE']) {
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
