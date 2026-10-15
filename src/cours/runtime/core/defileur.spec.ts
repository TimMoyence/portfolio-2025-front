import { deuxImages } from '../../../testing/deux-images';
import { suivreLaSuite } from './defileur';

describe('suivreLaSuite', () => {
  let defileur: HTMLElement;
  let arreter: () => void = () => undefined;

  function monter(largeurDuContenu: number): void {
    defileur = document.createElement('div');
    defileur.style.cssText = 'width:200px;overflow-x:auto;';
    const contenu = document.createElement('div');
    contenu.style.cssText = `width:${largeurDuContenu}px;height:20px;`;
    defileur.appendChild(contenu);
    document.body.appendChild(defileur);
    arreter = suivreLaSuite(defileur);
  }

  async function defilerA(gauche: number): Promise<void> {
    defileur.scrollLeft = gauche;
    await deuxImages();
  }

  function suite(): { avant: boolean; apres: boolean } {
    return {
      avant: defileur.hasAttribute('data-suite-avant'),
      apres: defileur.hasAttribute('data-suite-apres'),
    };
  }

  afterEach(() => {
    arreter();
    defileur.remove();
  });

  it('signale la suite à droite au départ, puis la partie passée à gauche au fil du défilement', async () => {
    monter(500);

    expect(suite()).toEqual({ avant: false, apres: true });
    await defilerA(150);

    expect(suite()).toEqual({ avant: true, apres: true });
    await defilerA(300);

    expect(suite()).toEqual({ avant: true, apres: false });
  });

  it('ne signale aucune suite quand le contenu tient dans le défileur', () => {
    monter(150);

    expect(suite()).toEqual({ avant: false, apres: false });
  });

  it('relit la suite quand le défileur s élargit jusqu à tout montrer', async () => {
    monter(500);
    defileur.style.width = '600px';
    await deuxImages();

    expect(suite()).toEqual({ avant: false, apres: false });
  });

  const FINS_DU_SUIVI: readonly (readonly [string, () => Promise<void>])[] = [
    ['cesse de suivre le défilement une fois arrêté', async () => arreter()],
    [
      'cesse de suivre d elle-même un défileur retiré de la page, quand la brique se redessine',
      async () => {
        defileur.remove();
        await deuxImages();
        document.body.appendChild(defileur);
      },
    ],
  ];

  for (const [titre, finirLeSuivi] of FINS_DU_SUIVI) {
    it(titre, async () => {
      monter(500);
      await finirLeSuivi();
      await defilerA(300);

      expect(suite()).toEqual({ avant: false, apres: true });
    });
  }
});
