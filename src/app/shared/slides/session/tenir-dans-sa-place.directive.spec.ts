import { Component, signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { deuxImages } from '../../../../testing/deux-images';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import { TenirDansSaPlaceDirective } from './tenir-dans-sa-place.directive';

@Component({
  standalone: true,
  imports: [TenirDansSaPlaceDirective],
  template: `
    <div class="toile" [style.transform]="'scale(' + echelleDeLaToile() + ')'">
      <div class="cadre" [class.cadre--au-contenu]="auContenu()" [style.inline-size.px]="largeur()">
        <div class="place">
          <div class="liste" appTenirDansSaPlace>
            @for (carte of cartes(); track carte; let rang = $index) {
              <p class="carte" [style.block-size.px]="hauteurs()[rang]">{{ carte }}</p>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .toile {
      transform-origin: 0 0;
    }

    .place {
      block-size: 200px;
    }

    .cadre--au-contenu {
      display: grid;
      grid-template-rows: minmax(0, 1fr);
      max-block-size: 200px;
    }

    .cadre--au-contenu .place {
      block-size: auto;
    }

    .liste {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
      gap: 0.5rem;
    }

    .carte {
      margin: 0;
      block-size: 5rem;
    }
  `,
})
class HoteDeLaPlaceComponent {
  readonly cartes = signal(Array.from({ length: 12 }, (_, rang) => `Question ${rang + 1}`));
  readonly hauteurs = signal<readonly number[]>([]);
  readonly largeur = signal(600);
  readonly auContenu = signal(false);
  readonly echelleDeLaToile = signal(1);
}

async function monterLaPlace(
  regler: (hote: HoteDeLaPlaceComponent) => void = () => undefined,
): Promise<ComponentFixture<HoteDeLaPlaceComponent>> {
  setupTestBed({ http: false, imports: [HoteDeLaPlaceComponent] });
  const fixture = TestBed.createComponent(HoteDeLaPlaceComponent);
  regler(fixture.componentInstance);
  fixture.autoDetectChanges();
  await laisserTenir();
  return fixture;
}

async function laisserTenir(): Promise<void> {
  await deuxImages();
  await deuxImages();
}

function lireLaPlace(fixture: ComponentFixture<HoteDeLaPlaceComponent>): {
  readonly debordeEnHauteur: boolean;
  readonly largeurOccupee: number;
  readonly colonnes: number;
  readonly zoomes: number;
} {
  const hote = fixture.nativeElement as HTMLElement;
  const place = hote.querySelector('.place')?.getBoundingClientRect();
  const liste = hote.querySelector('.liste')?.getBoundingClientRect();
  const cartes = [...hote.querySelectorAll('.carte')];
  return {
    debordeEnHauteur: (liste?.bottom ?? 0) > (place?.bottom ?? 0) + 1,
    largeurOccupee: Math.round(((liste?.width ?? 0) / (place?.width ?? 1)) * 100),
    colonnes: new Set(cartes.map((carte) => Math.round(carte.getBoundingClientRect().left))).size,
    zoomes: [...hote.querySelectorAll('*')].filter(
      (element) => getComputedStyle(element).zoom !== '1',
    ).length,
  };
}

function bandeSousLaListe(fixture: ComponentFixture<HoteDeLaPlaceComponent>): number {
  const hote = fixture.nativeElement as HTMLElement;
  const place = hote.querySelector('.place')?.getBoundingClientRect();
  const liste = hote.querySelector('.liste')?.getBoundingClientRect();
  return Math.round((place?.bottom ?? 0) - (liste?.bottom ?? 0));
}

describe('TenirDansSaPlaceDirective', () => {
  for (const echelle of [1, 1.5, 0.625]) {
    it(`ne laisse ni bande vide ni débord sous une liste réduite quand sa place suit sa hauteur, comme le bandeau de correction, dans une toile à l’échelle ${echelle}`, async () => {
      const fixture = await monterLaPlace((hote) => {
        hote.cartes.set(Array.from({ length: 6 }, (_, rang) => `Question ${rang + 1}`));
        hote.largeur.set(400);
        hote.auContenu.set(true);
        hote.echelleDeLaToile.set(echelle);
      });

      const liste = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.liste');
      expect([
        liste?.style.transform.startsWith('scale('),
        lireLaPlace(fixture).debordeEnHauteur,
        bandeSousLaListe(fixture),
      ]).toEqual([true, false, 0]);
    });
  }

  it('mesure la réduction de départ : une liste dont les rangées grandissent en gagnant des colonnes ne déborde pas', async () => {
    const fixture = await monterLaPlace((hote) => {
      hote.cartes.set(['A', 'B', 'C', 'D']);
      hote.hauteurs.set([20, 20, 240, 240]);
      hote.largeur.set(400);
    });

    expect(lireLaPlace(fixture)).toEqual(
      jasmine.objectContaining({ debordeEnHauteur: false, largeurOccupee: 100, zoomes: 0 }),
    );
  });

  it('réduit une liste trop haute en lui faisant gagner des colonnes sur toute la largeur de sa place, sans zoom que Safari arrête à 9 px', async () => {
    const fixture = await monterLaPlace();

    expect(lireLaPlace(fixture)).toEqual({
      debordeEnHauteur: false,
      largeurOccupee: 100,
      colonnes: 4,
      zoomes: 0,
    });
  });

  it('rend sa taille à la liste qui tient de nouveau dans sa place', async () => {
    const fixture = await monterLaPlace();

    fixture.componentInstance.cartes.set(['Question 1', 'Question 2', 'Question 3']);
    await laisserTenir();

    const liste = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.liste');
    expect([
      liste?.style.transform,
      liste?.style.inlineSize,
      liste?.style.marginBlockEnd,
      lireLaPlace(fixture),
    ]).toEqual([
      '',
      '',
      '',
      { debordeEnHauteur: false, largeurOccupee: 100, colonnes: 3, zoomes: 0 },
    ]);
  });
});
