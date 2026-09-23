import type { EcranContent, RenderMode, Role } from '../../../../cours/content/types';
import { monterEcran, RENDUS_DE_MONTAGE } from '../../../../testing/briques-montees';
import { buildInstantaneDeSubstitution } from '../../../../testing/factories/instantane-b2-01.factory';
import {
  ecransDuPupitreB2_01,
  ecransPublicsB2_01,
  INSTANTANE_B2_01,
} from '../../../../testing/fixtures/instantane-b2-01';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import { SlideActivityComponent } from './slide-activity.component';

const EMPREINTE_PUBLIEE_PAR_LE_BACK =
  'f75ea034686e2f7b1fc2e9bb92aab3e4eac28c29505de169bee6387170c6d902';

const ECRANS_PUBLIES = 55;

const SUBSTITUTION = buildInstantaneDeSubstitution();

function clesDe(valeur: unknown): readonly string[] {
  if (Array.isArray(valeur)) {
    return valeur.flatMap(clesDe);
  }
  if (typeof valeur !== 'object' || valeur === null) {
    return [];
  }
  return Object.entries(valeur).flatMap(([cle, contenu]) => [cle, ...clesDe(contenu)]);
}

async function attesterLeMontage(
  ecran: EcranContent,
  render: RenderMode,
  role: Role,
): Promise<void> {
  const monte = await monterEcran(ecran, render, role);

  expect(monte.erreurs).toEqual([]);
  expect(monte.element.querySelector('[data-testid="slide-activity-error"]')).toBeNull();
  expect(monte.element.querySelector('[data-testid="slide-activity-unknown"]')).toBeNull();
  expect(monte.montees().every((brique) => brique.getAttribute('render') === render)).toBeTrue();
  monte.detruire();
}

describe('AC-24 : l instantané réel du B2-01 servi par le back se monte en main, au tableau et en projection', () => {
  beforeEach(() => setupTestBed({ imports: [SlideActivityComponent] }));

  it('garde la diapositive de Samir réglable au pupitre et la consigne courte de l atelier', async () => {
    const diapositive = ecransDuPupitreB2_01()[13];
    const atelier = ecransPublicsB2_01()[14];
    const monte = await monterEcran(diapositive, 'hand', 'presentateur');
    const graphique = monte.montees()[0] as HTMLElement;

    expect(graphique.shadowRoot?.querySelector('[data-testid="titre"]')?.textContent).toContain(
      'Samir',
    );
    expect(graphique.shadowRoot?.querySelectorAll('[data-testid="parametre"]').length).toBe(1);
    expect(graphique.shadowRoot?.querySelectorAll('[data-testid="prereglage"]').length).toBe(2);
    expect(graphique.shadowRoot?.querySelectorAll('[data-testid="barre"]').length).toBe(4);
    expect(atelier.donnees?.['consigne']).toBe(
      'Calculatrice autorisée, sauf pour la question sur le nombre de commandes (ordre de grandeur). Répondez seul·e, puis comparez avec votre voisin·e avant la correction.',
    );

    monte.detruire();
  });

  it('porte l empreinte et le nombre d écrans publiés par le back', () => {
    expect(INSTANTANE_B2_01.empreinte).toBe(EMPREINTE_PUBLIEE_PAR_LE_BACK);
    expect([
      ecransPublicsB2_01().length,
      ecransDuPupitreB2_01().length,
      INSTANTANE_B2_01.catalogue.ecrans.length,
    ]).toEqual([ECRANS_PUBLIES, ECRANS_PUBLIES, ECRANS_PUBLIES]);
    expect(ecransDuPupitreB2_01().map((ecran) => ecran.id)).toEqual(
      ecransPublicsB2_01().map((ecran) => ecran.id),
    );
  });

  it('ne livre au poste étudiant ni corrigé, ni notes, ni guide', () => {
    const clesPubliees = new Set(clesDe(ecransPublicsB2_01()));

    for (const cle of [
      'corriges',
      'corrigeEcran',
      'notes',
      'guide',
      'solution',
      'misconception',
      'interaction',
      'pieges',
    ]) {
      expect(clesPubliees.has(cle)).withContext(`clé secrète publiée : ${cle}`).toBeFalse();
    }
    expect(clesPubliees.has('donnees')).toBeTrue();
  });

  for (const ecran of ecransPublicsB2_01()) {
    it(`${ecran.id} (${ecran.type}) en hand`, () => attesterLeMontage(ecran, 'hand', 'etudiant'));
  }

  for (const ecran of ecransDuPupitreB2_01()) {
    for (const render of ['board', 'stage'] as const) {
      it(`${ecran.id} (${ecran.type}) en ${render}`, () =>
        attesterLeMontage(ecran, render, 'presentateur'));
    }
  }
});

describe('les factories du front couvrent chaque type d écran du contrat § 9.4', () => {
  beforeEach(() => setupTestBed({ imports: [SlideActivityComponent] }));

  it('produit les 18 types, dont ceux absents de l instantané réel', () => {
    const typesReels = new Set(ecransPublicsB2_01().map((ecran) => ecran.type));
    const typesFabriques = new Set(SUBSTITUTION.map((ecran) => ecran.type));

    expect(typesFabriques.size).toBe(18);
    for (const type of typesReels) {
      expect(typesFabriques.has(type))
        .withContext(`type absent des factories : ${type}`)
        .toBeTrue();
    }
    expect(
      [...typesFabriques]
        .filter((type) => !typesReels.has(type))
        .sort((a, b) => a.localeCompare(b)),
    ).toEqual(['ecran-verrouille', 'fp-numeric']);
  });

  for (const ecran of SUBSTITUTION) {
    for (const { render, role } of RENDUS_DE_MONTAGE) {
      it(`${ecran.id} (${ecran.type}) en ${render}`, () => attesterLeMontage(ecran, render, role));
    }
  }
});
