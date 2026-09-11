import { escapeHtml, escapeUrl, safeHtml } from './html';

const LIEN_PIEGE = 'javascript:alert(1)';
const LIEN_LEGITIME = 'https://exemple.fr/fiche?a=1&b=2';

describe('escapeUrl', () => {
  const CAS_NEUTRALISES: readonly string[] = [
    LIEN_PIEGE,
    'JaVaScRiPt:alert(1)',
    'data:text/html;base64,PHNjcmlwdD4=',
    'vbscript:msgbox(1)',
    '   ',
  ];

  for (const lien of CAS_NEUTRALISES) {
    it(`neutralise le schema refuse de ${lien.trim() || 'la chaine vide'}`, () => {
      expect(String(escapeUrl(lien))).toBe('#');
    });
  }

  const CAS_CONSERVES: ReadonlyArray<[string, string]> = [
    [LIEN_LEGITIME, 'https://exemple.fr/fiche?a=1&amp;b=2'],
    ['mailto:theo@exemple.fr', 'mailto:theo@exemple.fr'],
    ['/cours/demo', '/cours/demo'],
    ['#ancre', '#ancre'],
  ];

  for (const [lien, attendu] of CAS_CONSERVES) {
    it(`conserve et echappe le lien ${lien}`, () => {
      expect(String(escapeUrl(lien))).toBe(attendu);
    });
  }
});

describe('safeHtml en contexte sensible', () => {
  it('refuse une valeur seulement echappee dans un href', () => {
    expect(() => safeHtml`<a href="${escapeHtml(LIEN_PIEGE)}">lien</a>`).toThrowError(/href/);
  });

  it('accepte une url legitime passee par escapeUrl dans un href', () => {
    const rendu = safeHtml`<a href="${escapeUrl(LIEN_LEGITIME)}">lien</a>`;
    expect(String(rendu)).toBe('<a href="https://exemple.fr/fiche?a=1&amp;b=2">lien</a>');
  });

  it('rend inerte un href pris a escapeUrl dont le schema est refuse', () => {
    const rendu = safeHtml`<a href="${escapeUrl(LIEN_PIEGE)}">lien</a>`;
    expect(String(rendu)).toBe('<a href="#">lien</a>');
  });

  const CONTEXTES_REFUSES: ReadonlyArray<[string, () => unknown]> = [
    ['src entre apostrophes', () => safeHtml`<img src='${escapeHtml(LIEN_PIEGE)}' alt="" />`],
    ['href sans guillemets', () => safeHtml`<a href=${escapeHtml(LIEN_PIEGE)}>lien</a>`],
    ['style', () => safeHtml`<span style="${escapeHtml('width:0')}"></span>`],
    ['gestionnaire onclick', () => safeHtml`<button onclick="${escapeHtml('x')}"></button>`],
    ['url dans un style', () => safeHtml`<span style="background:${escapeUrl('https://a.fr')}">`],
  ];

  for (const [nom, rendre] of CONTEXTES_REFUSES) {
    it(`refuse une interpolation dans ${nom}`, () => {
      expect(rendre).toThrowError(/Interpolation refusée/);
    });
  }

  it('accepte un nombre dans un attribut style, qui ne peut porter aucune charge', () => {
    const rendu = safeHtml`<span style="width:${58}%"></span>`;
    expect(String(rendu)).toBe('<span style="width:58%"></span>');
  });

  const CONTEXTES_ADMIS: ReadonlyArray<[string, () => unknown, string]> = [
    ['un texte', () => safeHtml`<p>${escapeHtml('a<b')}</p>`, '<p>a&lt;b</p>'],
    [
      'un attribut ordinaire',
      () => safeHtml`<p data-option="${escapeHtml('a"b')}"></p>`,
      '<p data-option="a&quot;b"></p>',
    ],
    [
      'un attribut apres un href deja referme',
      () => safeHtml`<a href="#" title="${escapeHtml('x')}"></a>`,
      '<a href="#" title="x"></a>',
    ],
  ];

  for (const [nom, rendre, attendu] of CONTEXTES_ADMIS) {
    it(`laisse passer ${nom}`, () => {
      expect(rendre()).toBe(attendu);
    });
  }
});
