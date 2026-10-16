import type { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import type { EcranContent, PilotageEcran } from '../cours/content/types';
import type { EtatSession, ResultatsDuFlux } from '../cours/runtime/core/sync';
import { SlideActivityComponent } from '../app/shared/slides/session/slide-activity.component';
import { deuxImages, uneImage } from './deux-images';
import { elementsCoupes } from './elements-coupes';
import type { FluxDouble } from './factories/sync.factory';
import { type LectureDesLibelles, lireLesLibellesDeChaqueEcran } from './libelles-colles';

interface VueDeSeance {
  quandStabilise(): Promise<void>;
}

export async function stabiliserLaVue(fixture: ComponentFixture<VueDeSeance>): Promise<void> {
  await fixture.componentInstance.quandStabilise();
  fixture.detectChanges();
}

const IMAGES_DE_LA_MISE_EN_PAGE = 10;
const IMAGES_STABLES = 2;

function empreinteDeLaMiseEnPage(hote: HTMLElement): string {
  return [...hote.querySelectorAll<HTMLElement>('app-cours-presentation')]
    .map((presentation) => {
      const cadre = presentation.querySelector<HTMLElement>('[data-testid="cours-cadre"]');
      const toile = presentation.querySelector<HTMLElement>('[data-testid="cours-toile"]');
      return `${presentation.className}|${toile?.style.transform ?? ''}|${cadre?.clientWidth ?? 0}x${cadre?.clientHeight ?? 0}`;
    })
    .join(';');
}

export async function stabiliserLaMiseEnPage(
  fixture: ComponentFixture<VueDeSeance>,
): Promise<void> {
  const hote = fixture.nativeElement as HTMLElement;
  await stabiliserLaVue(fixture);
  let empreinte = empreinteDeLaMiseEnPage(hote);
  let stables = 0;
  for (let image = 0; image < IMAGES_DE_LA_MISE_EN_PAGE; image += 1) {
    const avant = empreinte;
    await uneImage();
    await stabiliserLaVue(fixture);
    empreinte = empreinteDeLaMiseEnPage(hote);
    stables = empreinte === avant ? stables + 1 : 0;
    if (stables === IMAGES_STABLES) {
      return;
    }
  }
  throw new Error(
    `mise en page non posée après ${IMAGES_DE_LA_MISE_EN_PAGE} images : ${empreinte}`,
  );
}

export function diffuserSurLaVue<T>(
  double: FluxDouble,
  fixture: ComponentFixture<T>,
  etat: Partial<EtatSession>,
): void {
  double.diffuser(etat);
  fixture.detectChanges();
}

export async function attendreChaqueLibelleSepareDeSaValeur(
  double: FluxDouble,
  fixture: ComponentFixture<VueDeSeance>,
  ecrans: readonly Pick<EcranContent, 'id'>[],
  vues: readonly string[],
  etat: Partial<EtatSession> = {},
): Promise<void> {
  const lecture: LectureDesLibelles = await lireLesLibellesDeChaqueEcran(
    fixture.nativeElement as HTMLElement,
    ecrans,
    async (ecranCourant, pilotage) => {
      diffuserSurLaVue(double, fixture, { etat: 'en_cours', ...etat, ecranCourant, pilotage });
      await stabiliserLaMiseEnPage(fixture);
    },
    vues,
    'bout-a-bout',
  );

  expect(lecture).toEqual({ colles: [], vuesAbsentes: [] });
}

const PILOTAGES_DES_CALQUES: readonly PilotageEcran[] = [
  { revele: true, explicationsDevoilees: 20, etayage: 20 },
  { revele: true, resultatsProjetes: true },
];

export async function attendreChaqueCalqueEntierDansLaToile(
  double: FluxDouble,
  fixture: ComponentFixture<VueDeSeance>,
  ecrans: readonly Pick<EcranContent, 'id'>[],
  etat: Partial<EtatSession> = {},
): Promise<void> {
  const hote = fixture.nativeElement as HTMLElement;
  const coupes: string[] = [];
  const zoomes: string[] = [];
  const bandes: string[] = [];
  let calques = 0;
  for (const [ecranCourant, { id }] of ecrans.entries()) {
    for (const pilotageDeLEcran of PILOTAGES_DES_CALQUES) {
      const pilotage = { [id]: pilotageDeLEcran };
      diffuserSurLaVue(double, fixture, { etat: 'en_cours', ...etat, ecranCourant, pilotage });
      await stabiliserLaMiseEnPage(fixture);
      const toile = hote.querySelector('[data-testid="cours-toile"]');
      const vus = [...(toile?.querySelectorAll(SELECTEUR_DES_CALQUES) ?? [])];
      calques += vus.length;
      coupes.push(
        ...vus.flatMap((calque) =>
          toile === null ? [] : elementsCoupes(calque, toile).map((coupe) => `${id} ${coupe}`),
        ),
      );
      zoomes.push(
        ...vus.flatMap((calque) => elementsZoomes(calque).map((zoom) => `${id} ${zoom}`)),
      );
      bandes.push(
        ...vus.flatMap((calque) => bandesSousLaListe(calque).map((bande) => `${id} ${bande}`)),
      );
    }
  }

  expect({ coupes, zoomes, bandes, calquesVus: calques > 0 }).toEqual({
    coupes: [],
    zoomes: [],
    bandes: [],
    calquesVus: true,
  });
}

export async function mettreLaToileALEchelle(
  fixture: ComponentFixture<VueDeSeance>,
  echelle: number,
): Promise<number> {
  const hote = fixture.nativeElement as HTMLElement;
  const cadre = hote.querySelector<HTMLElement>('[data-testid="cours-cadre"]');
  const toile = hote.querySelector<HTMLElement>('[data-testid="cours-toile"]');
  if (cadre === null || toile === null) {
    return 0;
  }
  hote.style.inlineSize = `${toile.offsetWidth * echelle + hote.clientWidth - cadre.clientWidth}px`;
  hote.style.blockSize = `${toile.offsetHeight * echelle + hote.clientHeight - cadre.clientHeight}px`;
  await deuxImages();
  await stabiliserLaVue(fixture);
  await deuxImages();
  return toile.getBoundingClientRect().width / toile.offsetWidth;
}

function bandesSousLaListe(calque: Element): string[] {
  return [...calque.querySelectorAll('.cours-correction__liste')].flatMap((liste) => {
    const place = liste.parentElement?.getBoundingClientRect();
    const bande = Math.round((place?.bottom ?? 0) - liste.getBoundingClientRect().bottom);
    return bande > 1 ? [`bande vide de ${bande} px sous la liste`] : [];
  });
}

function elementsZoomes(calque: Element): string[] {
  return [calque, ...calque.querySelectorAll('*')].flatMap((element) => {
    const zoom = getComputedStyle(element).zoom;
    return zoom === '1'
      ? []
      : [`${element.tagName.toLowerCase()}.${element.className} zoom ${zoom}`];
  });
}

const SELECTEUR_DES_CALQUES =
  '[data-testid="cours-correction"], [data-testid="resultats-projetes"]';

export function publierSurLaVue<T>(
  double: FluxDouble,
  fixture: ComponentFixture<T>,
  resultats: Partial<ResultatsDuFlux>,
): void {
  double.diffuserResultats(resultats);
  fixture.detectChanges();
}

export function ecransMontes<T>(fixture: ComponentFixture<T>): readonly SlideActivityComponent[] {
  return fixture.debugElement
    .queryAll(By.directive(SlideActivityComponent))
    .map((ecran) => ecran.componentInstance as SlideActivityComponent);
}

export function idsDesEcransMontes<T>(fixture: ComponentFixture<T>): readonly string[] {
  return ecransMontes(fixture).map((ecran) => ecran.slide().id);
}

export function attendreLaFermetureDuFlux<T>(
  double: FluxDouble,
  fixture: ComponentFixture<T>,
): void {
  expect(double.flux.close).not.toHaveBeenCalled();
  fixture.destroy();
  expect(double.flux.close).toHaveBeenCalledTimes(1);
}
