import {
  DELAI_DE_MONTAGE_MS,
  monterEcran,
  ROLES_DE_MONTAGE,
} from '../../../../testing/briques-montees';
import { buildInstantaneDeSubstitution } from '../../../../testing/factories/instantane-b2-01.factory';
import {
  ecransDuPupitreB2_01,
  ecransPublicsB2_01,
  INSTANTANE_B2_01,
} from '../../../../testing/fixtures/instantane-b2-01';
import {
  attesterLeMontage,
  decrireLeMontageDeLInstantane,
  ecranNomme,
} from '../../../../testing/montage-d-instantane';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import { SlideActivityComponent } from './slide-activity.component';

const SUBSTITUTION = buildInstantaneDeSubstitution();

decrireLeMontageDeLInstantane('B2-01', INSTANTANE_B2_01, {
  empreinte: 'ff304a0c460920be83586af1f6883f76760a2371a4a14b083f4faa649178e31d',
  ecrans: 59,
  specifiques: () => {
    it(
      'garde la diapositive de Samir réglable au pupitre et la consigne courte de l atelier',
      async () => {
        const diapositive = ecranNomme(ecransDuPupitreB2_01(), 'B2-01-A2-02-ORIGINE-AXE');
        const atelier = ecranNomme(ecransPublicsB2_01(), 'B2-01-A2-03-ATELIER-1-SUITE');
        const monte = await monterEcran(diapositive, 'presentateur');
        const graphique = monte.montees()[0] as HTMLElement;

        expect(graphique.shadowRoot?.querySelector('[data-testid="titre"]')?.textContent).toContain(
          'Samir',
        );
        expect(graphique.shadowRoot?.querySelectorAll('[data-testid="parametre"]').length).toBe(1);
        expect(graphique.shadowRoot?.querySelectorAll('[data-testid="prereglage"]').length).toBe(2);
        expect(graphique.shadowRoot?.querySelectorAll('[data-testid="barre"]').length).toBe(8);
        expect(
          graphique.shadowRoot?.querySelector('[data-vue="reference"] [data-testid="vue"]')
            ?.textContent,
        ).toContain('Axe de Samir');
        expect(atelier.donnees?.['consigne']).toBe(
          'Calculatrice autorisée, sauf pour la question sur le nombre de commandes (ordre de grandeur). Répondez seul·e, puis comparez avec votre voisin·e avant la correction.',
        );

        monte.detruire();
      },
      DELAI_DE_MONTAGE_MS,
    );
  },
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
    for (const role of ROLES_DE_MONTAGE) {
      it(
        `${ecran.id} (${ecran.type}) pour le rôle ${role}`,
        () => attesterLeMontage(ecran, role),
        DELAI_DE_MONTAGE_MS,
      );
    }
  }
});
