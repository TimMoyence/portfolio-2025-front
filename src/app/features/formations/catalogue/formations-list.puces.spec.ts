import {
  cliquerLaPuce,
  pucesRendues,
  saisir,
  SECTIONS_ATTENDUES,
  sectionsRendues,
} from '../../../../testing/dom/catalogue-des-formations';
import { montagePage } from '../../../../testing/page/montage-page';
import { FormationsListComponent } from './formations-list.component';

const AUDIT_SEO = '/formations/audit-seo-diy';

describe('CAT-04 · puces de parcours', () => {
  const page = montagePage(FormationsListComponent);
  const racine = (): HTMLElement => page().nativeElement as HTMLElement;
  const pressees = (): readonly string[] =>
    pucesRendues(racine())
      .filter(({ pressee }) => pressee)
      .map(({ libelle }) => libelle);
  const titres = (): readonly string[] => sectionsRendues(racine()).map(({ titre }) => titre);

  it('CAT-04 · annonce « Toutes » pressée à l ouverture', () => {
    expect(pressees()).toEqual(['Toutes']);
    expect(pucesRendues(racine()).length).toBe(SECTIONS_ATTENDUES.length + 1);
  });

  it('CAT-04 · ne garde que la section de la puce choisie, et l annonce pressée', () => {
    cliquerLaPuce(page(), 'Bachelor 3');

    expect(titres()).toEqual(['Bachelor 3']);
    expect(pressees()).toEqual(['Bachelor 3']);
  });

  it('CAT-04 · rend toutes les sections quand on revient sur « Toutes »', () => {
    cliquerLaPuce(page(), 'Bachelor 3');
    cliquerLaPuce(page(), 'Toutes');

    expect(titres()).toEqual(SECTIONS_ATTENDUES.map(([titre]) => titre));
    expect(pressees()).toEqual(['Toutes']);
  });

  it('CAT-04 · remet « Toutes » à toute frappe dans la recherche', () => {
    cliquerLaPuce(page(), 'BTS CG 1re année');
    saisir(page(), 'seo');

    expect(sectionsRendues(racine()).map(({ titre, liens }) => [titre, liens])).toEqual([
      ['IA & web', [AUDIT_SEO]],
    ]);
    expect(pressees()).toEqual(['Toutes']);
  });

  it('CAT-04 · désactive une puce dont le nombre vaut zéro, et elle seule', () => {
    saisir(page(), 'seo');

    expect(
      pucesRendues(racine()).map(({ libelle, nombre, desactivee }) => [
        libelle,
        nombre,
        desactivee,
      ]),
    ).toEqual([
      ['Toutes', 1, false],
      ['BTS CG 1re année', 0, true],
      ['BTS CG 2e année', 0, true],
      ['Bachelor 3', 0, true],
      ['IA & web', 1, false],
    ]);
  });
});
