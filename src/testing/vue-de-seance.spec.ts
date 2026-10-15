import { Component, CUSTOM_ELEMENTS_SCHEMA, type ElementRef, viewChild } from '@angular/core';
import { pageMontee } from './montage-page';
import { stabiliserLaMiseEnPage } from './vue-de-seance';

@Component({
  selector: 'app-hote-vue-de-seance',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `<app-cours-presentation class="cours-presentation--projection">
    <div data-testid="cours-cadre" style="inline-size: 40rem; block-size: 20rem">
      <div #toile data-testid="cours-toile"></div>
    </div>
  </app-cours-presentation>`,
})
class HoteVueDeSeanceComponent {
  private readonly toile = viewChild.required<ElementRef<HTMLElement>>('toile');
  private demande = 0;

  quandStabilise(): Promise<void> {
    return Promise.resolve();
  }

  deplacerChaqueImage(decalage: (image: number) => number): void {
    let image = 0;
    const suivante = (): void => {
      this.toile().nativeElement.style.transform = `translate(${decalage(image)}px, 0px)`;
      image += 1;
      this.demande = requestAnimationFrame(suivante);
    };
    this.demande = requestAnimationFrame(suivante);
  }

  arreter(): void {
    cancelAnimationFrame(this.demande);
  }
}

describe('stabiliserLaMiseEnPage', () => {
  const page = pageMontee(HoteVueDeSeanceComponent);

  const issueDeLaStabilisation = (): Promise<string> =>
    stabiliserLaMiseEnPage(page.fixture).then(
      () => 'posée',
      (erreur: Error) => erreur.message,
    );

  afterEach(() => page.composant.arreter());

  it('rend la main sur une mise en page posée, puis sur une toile qui se pose après trois images', async () => {
    expect(await issueDeLaStabilisation()).toBe('posée');

    page.composant.deplacerChaqueImage((image) => Math.min(image, 3));

    expect(await issueDeLaStabilisation()).toBe('posée');
  });

  for (const periode of [2, 3]) {
    it(`échoue en nommant l'empreinte quand la toile oscille avec une période de ${periode} images`, async () => {
      page.composant.deplacerChaqueImage((image) => image % periode);

      expect(await issueDeLaStabilisation()).toMatch(
        /^mise en page non posée .*cours-presentation--projection\|translate\(/,
      );
    });
  }
});
