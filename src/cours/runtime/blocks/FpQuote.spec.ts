import {
  attendreChaqueClasseCouverte,
  attendreLaCorrectionNicheeEffacee,
  attendreLaMemeTypographieAuPresentateur,
  attendreSansModaliteNiDuree,
  parcourirLesRolesSansEffet,
} from '../../../testing/assertions-briques';
import { installerBrique } from '../../../testing/banc-de-brique';
import { buildQuoteCitation } from '../../../testing/factories/cours.factory';
import { FpQuote } from './FpQuote';

const CITATION = buildQuoteCitation();
const CHARGE_XSS = '<img src=x onerror="alert(1)">';
const CLASSES_ATTENDUES = 6;

function noeud(element: FpQuote, marqueur: string): Element | null {
  return element.shadowRoot?.querySelector(`[data-testid="${marqueur}"]`) ?? null;
}

function texteDe(element: FpQuote, marqueur: string): string {
  return noeud(element, marqueur)?.textContent?.trim() ?? '';
}

describe('FpQuote', () => {
  let hote: FpQuote;
  const traces = installerBrique<FpQuote>({
    balise: 'fp-quote',
    classe: FpQuote,
    poser: (brique) => {
      hote = brique;
      brique.citation = CITATION;
    },
  });

  it('porte la citation par un blockquote dans une figure et non par un div nu', () => {
    const bloc = noeud(hote, 'texte');
    expect(bloc?.tagName).toBe('BLOCKQUOTE');
    expect(bloc?.closest('figure')).toBeTruthy();
    expect(texteDe(hote, 'texte')).toBe(CITATION.texte);
  });

  it('attribue la citation a son auteur puis a sa source', () => {
    expect(noeud(hote, 'attribution')?.tagName).toBe('FIGCAPTION');
    expect(texteDe(hote, 'attribution')).toBe('Mayer Amschel Rothschild, attribue');
  });

  it('n affiche aucune ligne d attribution quand ni auteur ni source ne sont donnes', () => {
    hote.citation = buildQuoteCitation({ id: 'C-CITATION-02', auteur: null, source: null });
    expect(noeud(hote, 'attribution')).toBeNull();
    expect(hote.shadowRoot?.querySelector('figcaption')).toBeNull();
    expect(texteDe(hote, 'texte')).toBe(CITATION.texte);
  });

  it('attribue a l auteur seul quand la source est absente', () => {
    hote.citation = buildQuoteCitation({ id: 'C-CITATION-03', source: null });
    expect(texteDe(hote, 'attribution')).toBe('Mayer Amschel Rothschild');
  });

  it('echappe le html injecte dans le texte, l auteur et la source', () => {
    hote.citation = buildQuoteCitation({
      id: 'C-CITATION-04',
      texte: CHARGE_XSS,
      auteur: CHARGE_XSS,
      source: CHARGE_XSS,
    });
    expect(hote.shadowRoot?.querySelector('img')).toBeNull();
    expect(texteDe(hote, 'texte')).toBe(CHARGE_XSS);
    expect(texteDe(hote, 'attribution')).toBe(`${CHARGE_XSS}, ${CHARGE_XSS}`);
    expect(hote.shadowRoot?.innerHTML ?? '').toContain('&lt;img');
  });

  it('donne la grande typographie de l enonce au presentateur comme a l etudiant', () => {
    attendreLaMemeTypographieAuPresentateur(hote, () => noeud(hote, 'texte'));
  });

  it('n affiche plus la modalite ni la duree, quel que soit le role', () => {
    attendreSansModaliteNiDuree(hote, (repere) => noeud(hote, repere));
  });

  it('efface une donnee de correction nichee dans les metadonnees', () => {
    attendreLaCorrectionNicheeEffacee(buildQuoteCitation({ id: 'C-CITATION-05' }), (contamine) => {
      hote.citation = contamine;
      return hote.citation;
    });
  });

  it('ne diffuse aucun evenement et n ecrit dans aucun stockage', () => {
    hote.citation = buildQuoteCitation({ id: 'C-CITATION-06' });
    parcourirLesRolesSansEffet(hote, traces);
  });

  it('couvre par une regle de la feuille chaque classe fp emise', () => {
    attendreChaqueClasseCouverte(hote, 'quote', CLASSES_ATTENDUES);
  });
});
