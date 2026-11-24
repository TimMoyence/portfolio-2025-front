import type { ComponentFixture } from '@angular/core/testing';
import type { PresentationServie } from '../../../contrat';
import { zPresentationServie } from '../../../contrat/zod.gen';
import { SlideCourbeComponent } from '../../app/shared/slides/layouts/donnees/slide-courbe/slide-courbe.component';
import { INSTANTANE_B2_07 } from '../fixtures/instantanes/b2/instantane-b2-07';
import { proprietesServies } from '../page/montage-d-instantane';
import { montagePage, poserLesEntrees } from '../page/montage-page';
import { rendreALaLargeur } from '../texte/deux-images';

const ECRAN_DE_LA_COURBE = 'B2-07-A2-04-COURBE-PENTES';

function courbeServie(): Extract<PresentationServie, { renderer: 'courbe' }>['props'] {
  const servie = zPresentationServie.parse({
    version: 2,
    screenId: ECRAN_DE_LA_COURBE,
    renderer: 'courbe',
    props: proprietesServies(INSTANTANE_B2_07, ECRAN_DE_LA_COURBE, 'courbe'),
  });
  if (servie.renderer !== 'courbe') {
    throw new Error(`courbe absente du cours servi : ${ECRAN_DE_LA_COURBE}`);
  }
  return servie.props;
}

export const COURBE_DU_B2_07 = courbeServie();

export function monterLaCourbeDuB207(): () => ComponentFixture<SlideCourbeComponent> {
  return montagePage(SlideCourbeComponent, {
    http: false,
    avantRendu: (montee) => poserLesEntrees(montee, COURBE_DU_B2_07),
  });
}

export async function tangentesDuPapierALaLargeur(
  fixture: ComponentFixture<SlideCourbeComponent>,
  largeur: string,
): Promise<{ readonly placees: readonly string[]; readonly masquees: readonly string[] }> {
  const racine = fixture.nativeElement as HTMLElement;
  racine.style.containerType = 'inline-size';
  await rendreALaLargeur(fixture, largeur);
  const etiquettes = Array.from(
    racine.querySelectorAll<HTMLElement>('.slide-courbe__imprime .slide-scatter__point-label'),
  );
  const texte = (etiquette: HTMLElement): string => etiquette.textContent?.trim() ?? '';
  return {
    placees: etiquettes.map(texte),
    masquees: etiquettes
      .filter((etiquette) => etiquette.classList.contains('slide-scatter__point-label--hors-place'))
      .map(texte),
  };
}
