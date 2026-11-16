import {
  liensAffiches,
  pucesRendues,
  saisir,
  sectionsRendues,
} from '../../../../testing/dom/catalogue-des-formations';
import { montagePage } from '../../../../testing/page/montage-page';
import { FormationsListComponent } from './formations-list.component';
import { FORMATIONS } from './formations-list.data';

const B1_01 = '/formations/b1-01-proportions-pourcentages';
const B1_02 = '/formations/b1-02-evolutions-coefficients-indices';
const B1_03 = '/formations/b1-03-tcd-serie-une-variable';
const B2_01 = '/formations/b2-01-traitement-information-chiffree';
const B2_05 = '/formations/b2-05-mathematiques-financieres';
const B3_02 = '/formations/b3-02-formules-et-ia-analyste';
const IA_SOLO = '/formations/ia-solopreneurs';
const AUTO_IA = '/formations/automatiser-avec-ia';
const TOOLKIT = '/formations/ia-solopreneurs/toolkit';

describe('CAT-03 · recherche dans le catalogue', () => {
  const page = montagePage(FormationsListComponent);
  const racine = (): HTMLElement => page().nativeElement as HTMLElement;
  const statut = (): string =>
    racine().querySelector('[role="status"]')?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

  it('CAT-03 · garde les seules cartes qui contiennent le texte et masque les sections vides', () => {
    saisir(page(), 'amortissement');

    expect(
      sectionsRendues(racine()).map(({ titre, nombre, liens }) => [titre, nombre, liens]),
    ).toEqual([['BTS CG 2e année', 1, [B2_05]]]);
  });

  it('CAT-03 · ignore la casse, les accents et les espaces de bord', () => {
    saisir(page(), '  ÉVOLUTIONS ');
    const enCapitales = liensAffiches(racine());
    saisir(page(), 'evolutions');

    expect(enCapitales).toEqual([B1_02, B2_01]);
    expect(liensAffiches(racine())).toEqual([B1_02, B2_01]);
  });

  it('CAT-03 · tient l apostrophe droite et l apostrophe typographique pour la même', () => {
    saisir(page(), "l'information");
    const droite = liensAffiches(racine());
    saisir(page(), 'l’ia');
    const typographique = liensAffiches(racine());
    saisir(page(), "l'ia");

    expect(droite).toEqual([B2_01]);
    expect(typographique).toEqual([B3_02, IA_SOLO, AUTO_IA, TOOLKIT]);
    expect(liensAffiches(racine())).toEqual([B3_02, IA_SOLO, AUTO_IA, TOOLKIT]);
  });

  it('CAT-03 · réduit les espaces internes de la saisie à un seul', () => {
    saisir(page(), 'taux   de  marge');

    expect(liensAffiches(racine())).toEqual([B1_01, B1_03]);
  });

  it('CAT-03 · cherche aussi dans les valeurs meta et le prix, jamais dans les clés meta', () => {
    saisir(page(), 'pdf à télécharger');
    const valeurMeta = liensAffiches(racine());
    saisir(page(), 'offert');
    const prix = liensAffiches(racine());
    saisir(page(), 'durée');

    expect(valeurMeta).toEqual([IA_SOLO]);
    expect(prix).toEqual([TOOLKIT]);
    expect(liensAffiches(racine())).toEqual([]);
  });

  it('CAT-03 · rend tout le catalogue pour une saisie vide ou faite d espaces', () => {
    saisir(page(), 'amortissement');
    saisir(page(), '   ');

    expect(liensAffiches(racine()).length).toBe(FORMATIONS.length);
  });

  it('CAT-03 · fait suivre la recherche aux nombres des titres, des puces et de « Toutes »', () => {
    saisir(page(), "l'ia");

    expect(pucesRendues(racine()).map(({ libelle, nombre }) => [libelle, nombre])).toEqual([
      ['Toutes', 4],
      ['BTS CG 1re année', 0],
      ['BTS CG 2e année', 0],
      ['Bachelor 3', 1],
      ['IA & web', 3],
    ]);
    expect(sectionsRendues(racine()).map(({ titre, nombre }) => [titre, nombre])).toEqual([
      ['Bachelor 3', 1],
      ['IA & web', 3],
    ]);
  });

  it('CAT-03 · dit dans une zone de statut le nombre de formations affichées, accordé', () => {
    const auChargement = statut();
    saisir(page(), 'amortissement');

    expect(auChargement).toBe(`${FORMATIONS.length} formations`);
    expect(statut()).toBe('1 formation');
  });
});
