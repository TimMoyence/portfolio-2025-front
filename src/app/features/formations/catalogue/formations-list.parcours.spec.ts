import {
  champDeRecherche,
  pucesRendues,
  SECTIONS_ATTENDUES,
  sectionsRendues,
} from '../../../../testing/dom/catalogue-des-formations';
import { montagePage } from '../../../../testing/page/montage-page';
import { FormationsListComponent } from './formations-list.component';
import { FORMATIONS, parcoursDuCours } from './formations-list.data';

describe('CAT-02 · catalogue rangé par parcours', () => {
  const page = montagePage(FormationsListComponent);
  const racine = (): HTMLElement => page().nativeElement as HTMLElement;

  it('CAT-02 · range les cartes en quatre sections titrées, dans l ordre, chacune avec son nombre', () => {
    expect(
      sectionsRendues(racine()).map(({ titre, nombre, liens }) => [titre, nombre, liens]),
    ).toEqual(SECTIONS_ATTENDUES.map(([titre, liens]) => [titre, liens.length, liens]));
  });

  it('CAT-02 · nomme chaque section par son titre h2 et ne laisse aucune carte hors section', () => {
    const sections = Array.from(racine().querySelectorAll('section[aria-labelledby]'));

    expect(sections.length).toBe(SECTIONS_ATTENDUES.length);
    expect(sections.map((section) => section.querySelector('h2')?.id ?? 'sans titre')).toEqual(
      sections.map((section) => section.getAttribute('aria-labelledby') ?? ''),
    );
    expect(sectionsRendues(racine()).flatMap(({ liens }) => liens).length).toBe(FORMATIONS.length);
    expect(racine().querySelectorAll('.formation').length).toBe(FORMATIONS.length);
  });

  it('CAT-02 · offre « Toutes » et une puce par parcours, avec leur nombre, entre le champ et la première carte', () => {
    const groupe = racine().querySelector('[role="group"]');
    const premiereCarte = racine().querySelector('.formation');

    expect(pucesRendues(racine()).map(({ libelle, nombre }) => [libelle, nombre])).toEqual([
      ['Toutes', FORMATIONS.length],
      ...SECTIONS_ATTENDUES.map(([titre, liens]) => [titre, liens.length]),
    ]);
    expect(groupe?.getAttribute('aria-label')).toBe('Parcours');
    expect(groupe && champDeRecherche(racine())?.compareDocumentPosition(groupe)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(premiereCarte && groupe?.compareDocumentPosition(premiereCarte)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('CAT-02 · tire le parcours d un cours du préfixe de son code servi, et refuse un préfixe inconnu', () => {
    expect(['b1-01-a', 'b2-09-b', 'b3-04-c'].map(parcoursDuCours)).toEqual([
      'bts-cg-1',
      'bts-cg-2',
      'bachelor-3',
    ]);
    expect(() => parcoursDuCours('b4-01-inconnu')).toThrowError('b4-01-inconnu : parcours inconnu');
  });
});
