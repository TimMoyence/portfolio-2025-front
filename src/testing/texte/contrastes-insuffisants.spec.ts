import { contrastesInsuffisants } from './contrastes-insuffisants';

describe('contrastesInsuffisants — rapport de contraste du texte réellement affiché', () => {
  let scene: HTMLElement;

  beforeEach(() => {
    scene = document.createElement('div');
    scene.style.background = '#fffaf2';
    document.body.appendChild(scene);
  });

  afterEach(() => scene.remove());

  const poser = (html: string): readonly string[] => {
    scene.innerHTML = html;
    return contrastesInsuffisants(scene);
  };

  it('signale un texte blanc sur teal à 2,53:1', () => {
    expect(
      poser('<button style="background:#4fb3a2;color:#fff;font-size:14px">J’ai compris</button>'),
    ).toEqual(['« J’ai compris » 2.53:1 < 4.5:1']);
  });

  it('accepte un texte foncé sur teal à 6,55:1', () => {
    expect(
      poser(
        '<button style="background:#4fb3a2;color:#06231f;font-size:14px">J’ai compris</button>',
      ),
    ).toEqual([]);
  });

  it('mesure sur le fond hérité de l’ancêtre opaque le plus proche', () => {
    expect(poser('<p style="color:#2f8a78;font-size:14px">Morning Brief</p>')).toEqual([
      '« Morning Brief » 4.02:1 < 4.5:1',
    ]);
  });

  it('compose un fond semi-transparent sur celui qu’il recouvre', () => {
    expect(
      poser(
        '<div style="background:rgba(0,0,0,0.8)"><span style="color:#fff;font-size:14px">clair</span></div>',
      ),
    ).toEqual([]);
  });

  it('applique le seuil de 3:1 au grand texte', () => {
    expect(poser('<h2 style="color:#2f8a78;font-size:32px">Grand titre</h2>')).toEqual([]);
  });

  it('ignore le texte caché aux lecteurs et à l’œil', () => {
    expect(
      poser(
        '<p style="color:#000">lu</p><span aria-hidden="true" style="color:#eee">décor</span><span style="display:none;color:#eee">caché</span>',
      ),
    ).toEqual([]);
  });

  it('ne juge pas un contrôle inactif, que la WCAG exempte', () => {
    expect(
      poser(
        '<p style="color:#000">lu</p><button disabled style="opacity:0.4;background:#4fb3a2;color:#06231f">Envoyer</button>',
      ),
    ).toEqual([]);
  });

  it('dit quand rien n’a pu être mesuré, plutôt que de passer en silence', () => {
    expect(
      poser('<p style="background-image:linear-gradient(#fff,#fff);color:#000">sur image</p>'),
    ).toEqual(['aucun texte mesuré']);
  });
});
