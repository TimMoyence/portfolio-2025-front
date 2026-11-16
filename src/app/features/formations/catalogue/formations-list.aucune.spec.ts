import {
  champDeRecherche,
  cliquerLaPuce,
  liensAffiches,
  pucesRendues,
  saisir,
  SECTIONS_ATTENDUES,
  sectionsRendues,
} from '../../../../testing/dom/catalogue-des-formations';
import { montagePage } from '../../../../testing/page/montage-page';
import { FormationsListComponent } from './formations-list.component';
import { FORMATIONS } from './formations-list.data';

const MESSAGE = 'Aucune formation ne correspond à';

describe('CAT-05 · aucune formation ne correspond', () => {
  const page = montagePage(FormationsListComponent);
  const racine = (): HTMLElement => page().nativeElement as HTMLElement;
  const texte = (): string => (racine().textContent ?? '').replace(/\s+/g, ' ');
  const toutAfficher = (): HTMLButtonElement | undefined =>
    Array.from(racine().querySelectorAll('button')).find(
      (bouton) => bouton.textContent?.trim() === 'Tout afficher',
    );

  it('CAT-05 · ne dit rien tant qu une carte correspond', () => {
    saisir(page(), 'amortissement');

    expect(liensAffiches(racine()).length).toBe(1);
    expect(texte()).not.toContain(MESSAGE);
    expect(toutAfficher()).toBeUndefined();
  });

  it('CAT-05 · dit qu aucune formation ne correspond, en citant le texte sans ses espaces de bord', () => {
    saisir(page(), '  zzz introuvable ');

    expect(liensAffiches(racine())).toEqual([]);
    expect(texte()).toContain(`${MESSAGE} « zzz introuvable »`);
    expect(toutAfficher()).toBeDefined();
  });

  it('CAT-05 · « Tout afficher » vide la recherche, remet « Toutes », rend les quatre sections et le focus au champ', () => {
    cliquerLaPuce(page(), 'Bachelor 3');
    saisir(page(), 'zzz introuvable');
    toutAfficher()?.click();
    page().detectChanges();

    expect(champDeRecherche(racine())?.value).toBe('');
    expect(sectionsRendues(racine()).map(({ titre }) => titre)).toEqual(
      SECTIONS_ATTENDUES.map(([titre]) => titre),
    );
    expect(liensAffiches(racine()).length).toBe(FORMATIONS.length);
    expect(
      pucesRendues(racine())
        .filter(({ pressee }) => pressee)
        .map(({ libelle }) => libelle),
    ).toEqual(['Toutes']);
    expect(document.activeElement).toBe(champDeRecherche(racine()));
    expect(texte()).not.toContain(MESSAGE);
  });
});
