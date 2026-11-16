import {
  cliquerLaPuce,
  liensAffiches,
  SECTIONS_ATTENDUES,
} from '../../../../testing/dom/catalogue-des-formations';
import { montagePage } from '../../../../testing/page/montage-page';
import { texteDe } from '../../../../testing/texte/textes-dom';
import { FormationsListComponent } from './formations-list.component';
import { FORMATIONS } from './formations-list.data';

describe('CAT-03 · CAT-04 · statut sous une puce', () => {
  const page = montagePage(FormationsListComponent);
  const statut = (): string =>
    texteDe((page().nativeElement as HTMLElement).querySelector('[role="status"]'));
  const racine = (): HTMLElement => page().nativeElement as HTMLElement;
  const cartesDe = (titre: string): number =>
    SECTIONS_ATTENDUES.find(([candidat]) => candidat === titre)?.[1].length ?? Number.NaN;

  it('CAT-03 · CAT-04 · la zone de statut dit le nombre de cartes de la seule section choisie', () => {
    cliquerLaPuce(page(), 'Bachelor 3');

    expect(liensAffiches(racine()).length).toBe(cartesDe('Bachelor 3'));
    expect(statut()).toBe(`${cartesDe('Bachelor 3')} formations`);
  });

  it('CAT-03 · CAT-04 · la zone de statut rend le total quand on revient sur « Toutes »', () => {
    cliquerLaPuce(page(), 'Bachelor 3');
    cliquerLaPuce(page(), 'Toutes');

    expect(statut()).toBe(`${FORMATIONS.length} formations`);
  });
});
