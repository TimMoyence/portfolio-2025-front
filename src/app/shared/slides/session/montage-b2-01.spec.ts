import type { EcranContent, RenderMode, Role } from '../../../../cours/content/types';
import { monterEcran, RENDUS_DE_MONTAGE } from '../../../../testing/briques-montees';
import { buildInstantaneDeSubstitution } from '../../../../testing/factories/instantane-b2-01.factory';
import {
  ecransDuPupitreV3,
  ecransPublicsV3,
  INSTANTANE_V3,
} from '../../../../testing/fixtures/instantane-b2-01-v3';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import { SlideActivityComponent } from './slide-activity.component';

const EMPREINTE_PUBLIEE_PAR_LE_BACK =
  'f283ff9bf1ac6a0700a1a2dd7aae4f108a8dadae673ae64bc0481b6dce365af6';

const ECRANS_PUBLIES = 52;

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

describe('AC-24 : l instantané V3 réel du back se monte en main, au tableau et en projection', () => {
  beforeEach(() => setupTestBed({ imports: [SlideActivityComponent] }));

  it('porte l empreinte et le nombre d écrans publiés par le back', () => {
    expect(INSTANTANE_V3.empreinte).toBe(EMPREINTE_PUBLIEE_PAR_LE_BACK);
    expect(INSTANTANE_V3.version).toBe(3);
    expect([
      ecransPublicsV3().length,
      ecransDuPupitreV3().length,
      INSTANTANE_V3.catalogue.ecrans.length,
    ]).toEqual([ECRANS_PUBLIES, ECRANS_PUBLIES, ECRANS_PUBLIES]);
    expect(ecransDuPupitreV3().map((ecran) => ecran.id)).toEqual(
      ecransPublicsV3().map((ecran) => ecran.id),
    );
  });

  it('ne livre au poste étudiant ni corrigé, ni notes, ni guide', () => {
    const clesPubliees = new Set(clesDe(ecransPublicsV3()));

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

  for (const ecran of ecransPublicsV3()) {
    it(`${ecran.id} (${ecran.type}) en hand`, () => attesterLeMontage(ecran, 'hand', 'etudiant'));
  }

  for (const ecran of ecransDuPupitreV3()) {
    for (const render of ['board', 'stage'] as const) {
      it(`${ecran.id} (${ecran.type}) en ${render}`, () =>
        attesterLeMontage(ecran, render, 'presentateur'));
    }
  }
});

describe('les factories du front couvrent chaque type d écran du contrat § 9.4', () => {
  beforeEach(() => setupTestBed({ imports: [SlideActivityComponent] }));

  it('produit les 18 types, dont ceux absents de l instantané réel', () => {
    const typesReels = new Set(ecransPublicsV3().map((ecran) => ecran.type));
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
