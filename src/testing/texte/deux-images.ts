import type { ComponentFixture } from '@angular/core/testing';

export function uneImage(): Promise<void> {
  return new Promise((suite) => requestAnimationFrame(() => suite()));
}

export async function rendreALaLargeur(
  fixture: ComponentFixture<unknown>,
  largeur: string,
): Promise<void> {
  (fixture.nativeElement as HTMLElement).style.width = largeur;
  for (let image = 0; image < 3; image += 1) {
    await uneImage();
    fixture.detectChanges();
  }
}

export async function deuxImages(): Promise<void> {
  await uneImage();
  await uneImage();
}

export function empreinteSurDeuxImages(mesurer: () => string): () => string {
  let precedente: string | null = null;
  return () => {
    const lue = mesurer();
    const avant = precedente ?? lue;
    precedente = lue;
    return avant < lue ? `${avant}~${lue}` : `${lue}~${avant}`;
  };
}

const IMAGES_STABLES = 2;

export async function attendreQueLaMiseEnPageSePose(
  nom: string,
  empreinte: () => string,
  rafraichir: () => Promise<void>,
  images: number,
): Promise<void> {
  let lue = empreinte();
  let stables = 0;
  for (let image = 0; image < images; image += 1) {
    const avant = lue;
    await uneImage();
    await rafraichir();
    lue = empreinte();
    stables = lue === avant ? stables + 1 : 0;
    if (stables === IMAGES_STABLES) {
      return;
    }
  }
  throw new Error(`mise en page non posée après ${images} images, ${nom} : ${lue}`);
}
