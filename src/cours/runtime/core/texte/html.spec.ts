import {
  DESACTIVE,
  escapeHtml,
  escapeUrl,
  LECTURE_SEULE,
  safeHtml,
  VIDE,
  type EscapedHtml,
} from './html';

type Rendu = () => unknown;

const LIEN_PIEGE = 'javascript:alert(1)';
const ARBITRAIRE = '<img src=x onerror=alert(1)>';

describe('fragments des briques', () => {
  it('rendent le vide, l attribut disabled et l attribut readonly', () => {
    expect([VIDE, DESACTIVE, LECTURE_SEULE].map(String)).toEqual(['', 'disabled', 'readonly']);
  });
});

function refuseChaqueInterpolation(cas: readonly (readonly [string, Rendu])[]): void {
  for (const [nom, rendre] of cas) {
    it(`refuse une interpolation dans ${nom}`, () => {
      expect(rendre).toThrowError(/Interpolation refusée/);
    });
  }
}

function accepteChaque(cas: readonly (readonly [string, Rendu, string])[]): void {
  for (const [nom, rendre, attendu] of cas) {
    it(`accepte ${nom}`, () => {
      expect(String(rendre())).toBe(attendu);
    });
  }
}

describe('escapeHtml', () => {
  it('echappe tous les caracteres HTML sensibles', () => {
    expect(escapeHtml('<a href="x">&\'')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
  });

  it('echappe `&` en premier (pas de double echappement des entites)', () => {
    expect(escapeHtml('<')).toBe('&lt;');
    expect(escapeHtml('&lt;')).toBe('&amp;lt;');
  });

  it('ne throw pas sur null et coerce via String()', () => {
    expect(() => escapeHtml(null)).not.toThrow();
    expect(escapeHtml(null)).toBe('null');
    expect(escapeHtml(undefined)).toBe('undefined');
    expect(escapeHtml(42)).toBe('42');
  });
});

describe('escapeUrl — schemas admis', () => {
  for (const url of [
    'https://asilidesign.fr/growth-audit?a=1#x',
    'http://example.com/',
    'mailto:tim.moyence@outlook.fr',
    '/formations/ia-solopreneurs/toolkit',
    '../x',
    '#ancre',
    'page.html',
  ]) {
    it(`laisse passer ${url} intacte`, () => {
      expect(String(escapeUrl(url))).toBe(url);
    });
  }

  it("n'ajoute pas la barre finale que `new URL` insererait", () => {
    expect(String(escapeUrl('https://asilidesign.fr'))).toBe('https://asilidesign.fr');
  });

  it("echappe les metacaracteres d'une URL admise (pas de sortie d'attribut)", () => {
    expect(String(escapeUrl('https://asilidesign.fr/?a="onmouseover="alert(1)'))).toBe(
      'https://asilidesign.fr/?a=&quot;onmouseover=&quot;alert(1)',
    );
  });
});

describe('escapeUrl — schemas refuses et contournements', () => {
  for (const [label, url] of [
    ['minuscule', 'javascript:alert(1)'],
    ['casse mixte', 'JaVaScRiPt:alert(1)'],
    ['majuscules', 'JAVASCRIPT:alert(1)'],
    ['tabulation dans le schema', 'java\tscript:alert(1)'],
    ['saut de ligne dans le schema', 'java\nscript:alert(1)'],
    ['retour chariot dans le schema', 'java\rscript:alert(1)'],
    ['espace en tete', ' javascript:alert(1)'],
    ['tabulation verticale en tete', '\u000Bjavascript:alert(1)'],
    ['nul en tete', '\u0000javascript:alert(1)'],
    ['data', 'data:text/html,<script>alert(1)</script>'],
    ['data base64', 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='],
    ['vbscript', 'vbscript:msgbox(1)'],
    ['file', 'file:///etc/passwd'],
    ['la valeur vide', ''],
    ['une valeur de blancs', '   '],
    ['une valeur de tabulation et saut de ligne', '\t\n'],
  ]) {
    it(`neutralise ${label}`, () => {
      expect(String(escapeUrl(url))).toBe('#');
    });
  }

  it("neutralise le schema encode en entite HTML par l'echappement du `&`", () => {
    const rendered = safeHtml`<a href="${escapeUrl('&#106;avascript:alert(1)')}">x</a>`;

    expect(rendered).toBe('<a href="&amp;#106;avascript:alert(1)">x</a>');
    expect(rendered).not.toContain('&#106;a');
  });

  it('neutralise le schema encode en entite hexadecimale', () => {
    expect(String(escapeUrl('&#x6a;avascript:alert(1)'))).toBe('&amp;#x6a;avascript:alert(1)');
  });

  it('rend inerte un href pris à escapeUrl dont le schéma est refusé', () => {
    expect(safeHtml`<a href="${escapeUrl(LIEN_PIEGE)}">x</a>`).toBe('<a href="#">x</a>');
  });
});

describe('escapeUrl — etancheite du type', () => {
  it('produit un fragment interpolable dans safeHtml', () => {
    expect(safeHtml`<a href="${escapeUrl('https://asilidesign.fr/x')}">x</a>`).toBe(
      '<a href="https://asilidesign.fr/x">x</a>',
    );
  });

  it('refuse une URL brute non passee par escapeUrl, a la compilation comme au rendu', () => {
    const url = 'javascript:alert(1)';

    // @ts-expect-error une string brute n'est pas un fragment sur
    expect(() => safeHtml`<a href="${url}">x</a>`).toThrowError(/Interpolation refusée/);
  });

  it('ne throw pas et coerce via String(), comme escapeHtml', () => {
    expect(() => escapeUrl(null)).not.toThrow();
    expect(String(escapeUrl(null))).toBe('null');
    expect(String(escapeUrl(undefined))).toBe('undefined');
    expect(String(escapeUrl(42))).toBe('42');
  });
});

describe('safeHtml en contexte sensible', () => {
  it('refuse une valeur seulement echappee dans un href', () => {
    expect(() => safeHtml`<a href="${escapeHtml(LIEN_PIEGE)}">lien</a>`).toThrowError(/href/);
  });

  refuseChaqueInterpolation([
    ['un mailto seulement echappe', () => safeHtml`<a href="mailto:${escapeHtml('a@b.fr')}">x</a>`],
    ['src entre apostrophes', () => safeHtml`<img src='${escapeHtml(LIEN_PIEGE)}' alt="" />`],
    ['href sans guillemets', () => safeHtml`<a href=${escapeHtml(LIEN_PIEGE)}>lien</a>`],
    ['style', () => safeHtml`<span style="color: ${escapeHtml('red')}"></span>`],
    ['un attribut style', () => safeHtml`<span style="${escapeHtml('width:0')}"></span>`],
    ['gestionnaire onclick', () => safeHtml`<button onclick="${escapeHtml('x')}"></button>`],
    [
      'url dans un style',
      () => safeHtml`<span style="background:${escapeUrl('https://a.fr')}"></span>`,
    ],
    ['un attribut inconnu', () => safeHtml`<form action="${escapeHtml('/envoi')}"></form>`],
  ]);

  it('accepte un nombre dans un attribut style, qui ne peut porter aucune charge', () => {
    expect(safeHtml`<span style="width:${58}%"></span>`).toBe('<span style="width:58%"></span>');
  });

  accepteChaque([
    ['un texte', () => safeHtml`<p>${escapeHtml('a<b')}</p>`, '<p>a&lt;b</p>'],
    [
      'un attribut ordinaire',
      () => safeHtml`<p class="${escapeHtml('a"b')}"></p>`,
      '<p class="a&quot;b"></p>',
    ],
    [
      'un attribut ferme avant l interpolation',
      () => safeHtml`<a href="/x">${escapeHtml('lien')}</a>`,
      '<a href="/x">lien</a>',
    ],
    [
      'un texte apres une feuille de style fermee',
      () => safeHtml`<style>a{}</style><p>${escapeHtml('x')}</p>`,
      '<style>a{}</style><p>x</p>',
    ],
    [
      'un titre de document, dont le contenu reste du texte',
      () => safeHtml`<title>${escapeHtml('a"b')}</title>`,
      '<title>a&quot;b</title>',
    ],
    [
      'une classe completee en cours de valeur',
      () => safeHtml`<p class="carte ${escapeHtml('solo')}"></p>`,
      '<p class="carte solo"></p>',
    ],
    [
      'une URL entre apostrophes',
      () => safeHtml`<a href='${escapeUrl('https://a.fr')}'>x</a>`,
      "<a href='https://a.fr'>x</a>",
    ],
    [
      'une couleur de presentation',
      () => safeHtml`<circle fill="${escapeHtml('#4fb3a2')}"/>`,
      '<circle fill="#4fb3a2"/>',
    ],
    [
      'un lien dans un commentaire conditionnel Outlook',
      () =>
        safeHtml`<!--[if mso]><v:roundrect href="${escapeUrl('https://a.fr')}"></v:roundrect><![endif]-->`,
      '<!--[if mso]><v:roundrect href="https://a.fr"></v:roundrect><![endif]-->',
    ],
  ]);
});

describe('safeHtml — ce que les briques du cours ajoutent aux attributs descriptifs', () => {
  accepteChaque([
    [
      'un attribut data-*',
      () => safeHtml`<p data-option="${escapeHtml('a"b')}"></p>`,
      '<p data-option="a&quot;b"></p>',
    ],
    [
      'un attribut aria-*',
      () => safeHtml`<div aria-describedby="${escapeHtml('aide')}"></div>`,
      '<div aria-describedby="aide"></div>',
    ],
    [
      'la valeur d’un champ',
      () => safeHtml`<input value="${escapeHtml('12,5')}" />`,
      '<input value="12,5" />',
    ],
    [
      'le libellé lié à un champ',
      () => safeHtml`<label for="${escapeHtml('champ-1')}"></label>`,
      '<label for="champ-1"></label>',
    ],
    [
      'un attribut booléen constant dans la balise',
      () => safeHtml`<button type="button" ${DESACTIVE}>ok</button>`,
      '<button type="button" disabled>ok</button>',
    ],
    [
      'un fragment vide dans la balise',
      () => safeHtml`<button type="button" ${VIDE}>ok</button>`,
      '<button type="button" >ok</button>',
    ],
    [
      'un attribut data-* assemblé en fragment, collé à la valeur précédente',
      () => {
        const vote = safeHtml` data-vote="${escapeHtml('oui')}"`;
        return safeHtml`<div data-testid="histogramme"${vote}></div>`;
      },
      '<div data-testid="histogramme" data-vote="oui"></div>',
    ],
    [
      'un champ en lecture seule',
      () => {
        const lectureSeule = safeHtml`readonly`;
        return safeHtml`<input ${lectureSeule}>`;
      },
      '<input readonly>',
    ],
    [
      'l’affiche d’une vidéo',
      () => safeHtml`<video poster="${escapeUrl('/affiche.jpg')}"></video>`,
      '<video poster="/affiche.jpg"></video>',
    ],
  ]);

  refuseChaqueInterpolation([
    [
      'un gestionnaire injecté dans la balise par une donnée échappée',
      () => safeHtml`<button ${escapeHtml('onclick=alert(1)')}>ok</button>`,
    ],
    [
      'une donnée seulement échappée dans l’affiche d’une vidéo',
      () => safeHtml`<video poster="${escapeHtml(LIEN_PIEGE)}"></video>`,
    ],
    [
      'une donnée seulement échappée dans un href assemblé en fragment',
      () => {
        const lien = safeHtml`href="${escapeHtml(LIEN_PIEGE)}"`;
        return safeHtml`<a ${lien}>x</a>`;
      },
    ],
    [
      'une donnée seulement échappée dans une affiche assemblée en fragment',
      () => {
        const affiche = safeHtml`poster="${escapeHtml(LIEN_PIEGE)}"`;
        return safeHtml`<video ${affiche}></video>`;
      },
    ],
    [
      'une URL assemblée en fragment, dont la valeur n’a été lue que comme du texte',
      () => {
        const affiche = safeHtml`poster="${escapeUrl('/a.jpg')}"`;
        return safeHtml`<video playsinline ${affiche}></video>`;
      },
    ],
    [
      'un fragment qui prolonge le nom d’un attribut',
      () => safeHtml`<video playsinline${DESACTIVE}></video>`,
    ],
    [
      'un style injecté dans la balise',
      () => {
        const style = safeHtml`style="color:red"`;
        return safeHtml`<div ${style}></div>`;
      },
    ],
    [
      'une valeur sans guillemets injectée dans la balise',
      () => safeHtml`<div ${escapeHtml('data-x=y')}></div>`,
    ],
    ['un fragment collé au nom de la balise', () => safeHtml`<div${DESACTIVE}></div>`],
    [
      'un fragment collé au nom d’un attribut',
      () => safeHtml`<button on${escapeHtml('click')}="x"></button>`,
    ],
    ['une URL dans la balise', () => safeHtml`<a ${escapeUrl('https://a.fr')}>x</a>`],
    ['une URL partielle dans un href', () => safeHtml`<a href="/cours/${escapeUrl('demo')}">x</a>`],
  ]);
});

describe('safeHtml — le contexte suit le HTML rendu, pas le texte des valeurs', () => {
  it('rend un prenom termine par un faux attribut, suivi du nom, comme la synthese de seance', () => {
    expect(
      safeHtml`<td style="padding:4px;">${escapeHtml('Theo onclick=')} ${escapeHtml('Martin')}</td>`,
    ).toBe('<td style="padding:4px;">Theo onclick= Martin</td>');
  });

  it('reste dans le contenu brut quand </style n est pas suivi d un blanc, de / ou de >', () => {
    expect(() => safeHtml`<style></stylex>${escapeHtml('a{}')}</style>`).toThrowError(
      /Interpolation refusée/,
    );
  });

  it('sort du contenu brut sur une fermeture suivie d un blanc', () => {
    expect(safeHtml`<style></style >${escapeHtml('a')}`).toBe('<style></style >a');
  });

  it('rend un prenom qui ressemble a un attribut, suivi d un lien', () => {
    const prenom = escapeHtml('Theo onclick=');

    expect(
      safeHtml`<p>Bonjour ${prenom}, <a href="${escapeUrl('https://a.fr')}">revoir</a></p>`,
    ).toBe('<p>Bonjour Theo onclick=, <a href="https://a.fr">revoir</a></p>');
  });

  for (const [brut, rendu] of [
    ['href=', 'href='],
    ['style="', 'style=&quot;'],
    ['<a href=', '&lt;a href='],
  ]) {
    it(`ne prend pas le texte ${brut} d une valeur pour un attribut ouvert`, () => {
      expect(safeHtml`<p>${escapeHtml(brut)}${escapeUrl('https://a.fr')}</p>`).toBe(
        `<p>${rendu}https://a.fr</p>`,
      );
    });
  }

  it('suit un fragment qui ouvre lui-meme un attribut d URL', () => {
    const ouvrant = safeHtml`<a href="`;

    expect(() => safeHtml`${ouvrant}${escapeHtml('javascript:alert(1)')}">x</a>`).toThrowError(
      /Interpolation refusée/,
    );
  });

  it('verifie chaque element d un tableau comme une interpolation a part', () => {
    const ouvrant = safeHtml`<a href="`;
    const elements = [ouvrant, escapeHtml('javascript:alert(1)')];

    expect(() => safeHtml`${elements}">x</a>`).toThrowError(/Interpolation refusée/);
  });

  it('accepte dans un attribut descriptif un fragment qui y reste', () => {
    const classe = safeHtml` pillar-${escapeHtml('ok')}`;

    expect(safeHtml`<p class="card${classe}">x</p>`).toBe('<p class="card pillar-ok">x</p>');
  });

  refuseChaqueInterpolation([
    [
      'un attribut descriptif qu un fragment imbrique referme',
      () => {
        const libelle = safeHtml`Le "${escapeHtml('x onmouseover=alert(1)//')}"`;
        return safeHtml`<a href="${escapeUrl('/x')}" title="${libelle}">lien</a>`;
      },
    ],
    [
      'un commentaire qu un fragment imbrique referme',
      () => {
        const charge = safeHtml`<i title="--><img src=x onerror=${escapeHtml('alert(1)//')} ">`;
        return safeHtml`<!-- ${charge} -->`;
      },
    ],
    [
      'un script que seul un blanc non HTML semble fermer',
      () => safeHtml`<script></script\u{a0}>${escapeHtml('alert(1)')}</script>`,
    ],
    [
      'une balise dont un blanc non HTML prolonge le nom',
      () => safeHtml`<p\u{a0}title="${escapeHtml('x onclick=alert(1)//')}">x</p>`,
    ],
  ]);
});

describe('safeHtml — contextes ou l echappement HTML ne protege de rien', () => {
  refuseChaqueInterpolation([
    ['formaction', () => safeHtml`<button formaction="${escapeHtml(LIEN_PIEGE)}">`],
    ['action', () => safeHtml`<form action="${escapeUrl('https://a.fr')}">`],
    ['xlink:href', () => safeHtml`<use xlink:href="${escapeHtml(LIEN_PIEGE)}"/>`],
    ['data d un objet', () => safeHtml`<object data="${escapeHtml(LIEN_PIEGE)}">`],
    [
      'content d un meta refresh',
      () => safeHtml`<meta http-equiv="refresh" content="${escapeHtml('0;url=' + LIEN_PIEGE)}">`,
    ],
    [
      'srcdoc, meme avec une URL admise',
      () => safeHtml`<iframe srcdoc="${escapeUrl('https://a.fr')}">`,
    ],
    ['srcset', () => safeHtml`<img srcset="${escapeHtml(LIEN_PIEGE)}">`],
    ['background', () => safeHtml`<td background="${escapeHtml(LIEN_PIEGE)}">`],
    [
      'un attribut colle au precedent',
      () => safeHtml`<a title="x"href="${escapeHtml(LIEN_PIEGE)}">x</a>`,
    ],
    [
      'un attribut ordinaire sans guillemets',
      () => safeHtml`<img alt=${escapeHtml('x onerror=alert(1)')}>`,
    ],
    [
      'la suite d une valeur sans guillemets',
      () => safeHtml`<a href=https://a.fr/${escapeHtml('x onmouseover=alert(1)')}>x</a>`,
    ],
    ['un nom de balise', () => safeHtml`<${escapeHtml('script')}>`],
    [
      'une feuille de style',
      () => safeHtml`<style>${escapeHtml('}body{background:url(https://x)}')}</style>`,
    ],
    ['un script', () => safeHtml`<script>var a = ${escapeHtml('1')}</script>`],
    [
      'une URL suivie d une fin de valeur',
      () => safeHtml`<a href="${escapeUrl('https://a.fr')}/x">x</a>`,
    ],
    [
      'une couleur qui charge une ressource',
      () => safeHtml`<circle fill="${escapeHtml('url(https://x/a.svg#b)')}"/>`,
    ],
  ]);

  it('refuse une URL contrefaite qui n a pas ete emise par escapeUrl', () => {
    const contrefaite = {
      genre: 'url',
      toString: () => LIEN_PIEGE,
    } as unknown as ReturnType<typeof escapeUrl>;

    expect(() => safeHtml`<a href="${contrefaite}">x</a>`).toThrowError(/Interpolation refusée/);
  });
});

describe('safeHtml', () => {
  it('concatene comme un template litteral ordinaire', () => {
    const name = escapeHtml('Asili');
    expect(safeHtml`<p>Bonjour ${name}, ${42} points</p>`).toBe(`<p>Bonjour Asili, 42 points</p>`);
  });

  it('concatene les tableaux de fragments sans separateur', () => {
    const items = ['a', 'b'].map((v) => safeHtml`<li>${escapeHtml(v)}</li>`);
    expect(safeHtml`<ul>${items}</ul>`).toBe('<ul><li>a</li><li>b</li></ul>');
  });

  it('ne re-echappe pas un fragment deja echappe', () => {
    expect(safeHtml`<p>${escapeHtml('<b>')}</p>`).toBe('<p>&lt;b&gt;</p>');
  });

  it('rend le tableau vide comme une chaine vide', () => {
    const items: EscapedHtml[] = [];
    expect(safeHtml`<ul>${items}</ul>`).toBe('<ul></ul>');
  });

  it('rend les trous d un tableau creux comme des chaines vides', () => {
    const cellules = new Array<EscapedHtml>(3);
    cellules[2] = safeHtml`<td>c</td>`;

    expect(safeHtml`<tr>${cellules}</tr>`).toBe('<tr><td>c</td></tr>');
  });

  it("n'echappe rien au runtime : la garantie est portee par le type", () => {
    const raw = '<script>alert(1)</script>';

    // @ts-expect-error une chaine brute n'est pas un fragment sur
    const rendered: string = safeHtml`<p>${raw}</p>`;

    expect(rendered).toBe('<p><script>alert(1)</script></p>');
  });

  it("rend le litteral sans interpolation verbatim, sans l'echapper", () => {
    expect(safeHtml`<li>Aucun.</li>`).toBe('<li>Aucun.</li>');
    expect(safeHtml``).toBe('');
  });

  it('produit un fragment interpolable par un autre safeHtml', () => {
    const item = safeHtml`<li>x</li>`;

    expect(safeHtml`<ul>${item}</ul>`).toBe('<ul><li>x</li></ul>');
  });
});

describe('etancheite du type : ce que le compilateur doit refuser', () => {
  it('refuse un tableau de chaines brutes', () => {
    const items = ['<script>alert(1)</script>'];

    // @ts-expect-error un `string[]` n'est pas un `readonly EscapedHtml[]`
    const rendered: string = safeHtml`<ul>${items}</ul>`;

    expect(rendered).toContain('<script>');
  });

  it('refuse une valeur arbitraire non marquee, a la compilation comme au rendu', () => {
    const value = { toString: () => '<img onerror=alert(1) />' };

    // @ts-expect-error seuls EscapedHtml, number et EscapedHtml[] sont admis.
    expect(() => safeHtml`<p>${value}</p>`).toThrowError(/Interpolation refusée/);
  });
});

describe('etancheite a l execution : ce que le compilateur laisse passer', () => {
  const pieger = <T>(elements: unknown[], substitut: string): T[] => {
    function leurre() {
      return new Proxy(Object.assign([substitut], { map: () => [substitut] }), {
        defineProperty: () => true,
      });
    }
    const methodes = Object.getOwnPropertyNames(Array.prototype).filter(
      (nom) => nom !== 'length' && nom !== 'constructor',
    );
    return Object.assign(elements, Object.fromEntries(methodes.map((nom) => [nom, leurre])), {
      [Symbol.iterator]: () => [substitut][Symbol.iterator](),
      constructor: { [Symbol.species]: leurre },
    }) as unknown as T[];
  };

  it('ignore les methodes propres d un tableau interpole', () => {
    const liens = pieger<EscapedHtml>([escapeUrl('https://ok.example')], 'javascript:alert(1)');
    const lignes = pieger<EscapedHtml>([escapeHtml('a')], ARBITRAIRE);

    expect(safeHtml`<a href="${liens}">x</a>`).toBe('<a href="https://ok.example">x</a>');
    expect(safeHtml`<p>${lignes}</p>`).toBe('<p>a</p>');
  });

  it('refuse un tableau vide ou creux dans un href, qui laisserait un lien actif', () => {
    const aucune: EscapedHtml[] = [];
    const trous = new Array<EscapedHtml>(2);

    expect(() => safeHtml`<a href="${aucune}">x</a>`).toThrowError(/Interpolation refusée/);
    expect(() => safeHtml`<a href="${trous}">x</a>`).toThrowError(/Interpolation refusée/);
  });

  it('refuse un objet type comme une URL emise sans l avoir ete', () => {
    const contrefait = Object.assign({ toString: () => ARBITRAIRE }, escapeUrl('#'));

    expect(() => safeHtml`<p>${contrefait}</p>`).toThrowError(/Interpolation refusée/);
  });

  it('refuse une fonction typee comme une URL emise', () => {
    const contrefaite = Object.assign(
      Object.assign(() => 0, { toString: () => ARBITRAIRE }),
      escapeUrl('#'),
    );

    expect(() => safeHtml`<p>${contrefaite}</p>`).toThrowError(/Interpolation refusée/);
  });

  it('refuse un element de tableau qui n est pas un fragment', () => {
    const contrefait = Object.assign({ toString: () => ARBITRAIRE }, escapeUrl('#'));
    const lignes = [contrefait] as unknown as EscapedHtml[];

    expect(() => safeHtml`<ul>${lignes}</ul>`).toThrowError(/Interpolation refusée/);
  });
});

describe('safeHtml — une URL admise ne charge ni script ni document', () => {
  const SCRIPT_DISTANT = 'https://evil.example/x.js';

  refuseChaqueInterpolation([
    ['le src d un script', () => safeHtml`<script src="${escapeUrl(SCRIPT_DISTANT)}"></script>`],
    [
      'le src d un script sans schema',
      () => safeHtml`<script src="${escapeUrl('//evil.example/x.js')}"></script>`,
    ],
    ['le href d une base', () => safeHtml`<base href="${escapeUrl(SCRIPT_DISTANT)}">`],
    ['le src d une iframe', () => safeHtml`<iframe src="${escapeUrl(SCRIPT_DISTANT)}"></iframe>`],
    ['le src d un frame', () => safeHtml`<frame src="${escapeUrl(SCRIPT_DISTANT)}">`],
    ['le src d un embed', () => safeHtml`<embed src="${escapeUrl(SCRIPT_DISTANT)}">`],
    [
      'le href d un link',
      () => safeHtml`<link rel="stylesheet" href="${escapeUrl(SCRIPT_DISTANT)}">`,
    ],
    [
      'le href d un script svg',
      () => safeHtml`<svg><script href="${escapeUrl(SCRIPT_DISTANT)}"></script></svg>`,
    ],
  ]);

  accepteChaque([
    [
      'toujours un lien',
      () => safeHtml`<a href="${escapeUrl('https://a.fr')}">x</a>`,
      '<a href="https://a.fr">x</a>',
    ],
    [
      'toujours une image',
      () => safeHtml`<img src="${escapeUrl('https://a.fr/i.png')}" alt="" />`,
      '<img src="https://a.fr/i.png" alt="" />',
    ],
  ]);
});

describe('safeHtml — une URL emise ne change plus de texte', () => {
  it('garde le texte d une URL dont on tente de remplacer toString', () => {
    const url = escapeUrl('https://a.fr');

    expect(() => Object.assign(url, { toString: () => 'javascript:alert(1)' })).toThrowError(
      TypeError,
    );
    expect(safeHtml`<a href="${url}">x</a>`).toBe('<a href="https://a.fr">x</a>');
  });

  it('garde le texte d une URL dont on tente de modifier le prototype', () => {
    const url = escapeUrl('https://a.fr');
    const prototype = Object.getPrototypeOf(url) as { toString: () => string };

    expect(() => {
      prototype.toString = () => 'javascript:alert(1)';
    }).toThrowError(TypeError);
    expect(safeHtml`<a href="${url}">x</a>`).toBe('<a href="https://a.fr">x</a>');
  });

  it('ignore une conversion en primitive ajoutee a Object.prototype', () => {
    const url = escapeUrl('https://a.fr');
    Object.defineProperty(Object.prototype, Symbol.toPrimitive, {
      value: () => 'javascript:alert(2)',
      configurable: true,
    });
    try {
      expect(safeHtml`<a href="${url}">x</a>`).toBe('<a href="https://a.fr">x</a>');
    } finally {
      Reflect.deleteProperty(Object.prototype, Symbol.toPrimitive);
    }
  });
});

describe('safeHtml — seul un gabarit litteral transporte du HTML brut', () => {
  const BRUT = '<img src=x onerror=alert(1)>';

  it('refuse un faux tableau de gabarit', () => {
    const faux: TemplateStringsArray = Object.assign([BRUT], { raw: [BRUT] });

    expect(() => safeHtml(faux)).toThrowError(/Gabarit refusé/);
  });

  it('refuse un faux tableau de gabarit gele', () => {
    const faux: TemplateStringsArray = Object.freeze(
      Object.assign([BRUT], { raw: Object.freeze([BRUT]) }),
    );

    expect(() => safeHtml(faux)).toThrowError(/Gabarit refusé/);
  });

  it('refuse un tableau gele sans raw', () => {
    const faux = Object.freeze([BRUT]) as unknown as TemplateStringsArray;

    expect(() => safeHtml(faux)).toThrowError(/Gabarit refusé/);
  });
});

describe('safeHtml — un tableau interpole coute un temps lineaire', () => {
  const lignesDe = (nombre: number): EscapedHtml[] =>
    Array.from(
      { length: nombre },
      (_, rang) =>
        safeHtml`<tr><td>${rang}</td><td>${escapeHtml('cellule de démonstration')}</td></tr>`,
    );
  const dureeDAssembler = (lignes: readonly EscapedHtml[], fois: number): number => {
    const debut = performance.now();
    const tableaux = Array.from({ length: fois }, () => safeHtml`<table>${lignes}</table>`);
    expect(tableaux).toHaveSize(fois);
    return performance.now() - debut;
  };

  it('assemble seize fois plus de lignes dans le temps de seize petits tableaux, quelle que soit la charge du poste', () => {
    const courtes = lignesDe(125);
    const longues = lignesDe(2_000);
    dureeDAssembler(longues, 1);
    const rapports = [0, 1, 2]
      .map(() => dureeDAssembler(longues, 1) / Math.max(dureeDAssembler(courtes, 16), 1))
      .sort((a, b) => a - b);

    expect(rapports[1]).toBeLessThan(2);
    expect(safeHtml`<table>${longues}</table>`.endsWith('</tr></table>')).toBeTrue();
  });
});
