import type { EcranContent, Role } from '../../../../cours/content/types';
import {
  DELAI_DE_MONTAGE_MS,
  monterEcran,
  type RevelationDuPupitre,
} from '../../../../testing/briques-montees';
import { INSTANTANE_B3_01 } from '../../../../testing/fixtures/instantane-b3-01';
import {
  ecransDuPupitreDe,
  ecransPublicsDe,
} from '../../../../testing/fixtures/instantane-de-cours';
import {
  decrireLeMontageDeLInstantane,
  ecranNomme,
  texteServiAuPosteEtudiant,
} from '../../../../testing/montage-d-instantane';

const TRI_A_COLONNE_VIDE = 'B3-01-A1-13-TRI-ANOMALIES';
const PIOCHE_PLEINE = [10, 0, 0, 0, 0];
const CLASSEMENT_CORRIGE = [0, 4, 2, 0, 4];

async function comptesDesColonnes(
  ecran: EcranContent,
  role: Role,
  revelation: RevelationDuPupitre | null = null,
): Promise<readonly number[]> {
  const monte = await monterEcran(ecran, role, revelation);
  const comptes = [
    ...(monte.montees()[0]?.shadowRoot?.querySelectorAll('[data-testid="compte"]') ?? []),
  ].map((compte) => Number(compte.textContent));

  expect(monte.erreurs).withContext(`${ecran.id} en ${role}`).toEqual([]);
  monte.detruire();
  return comptes;
}

decrireLeMontageDeLInstantane('B3-01', INSTANTANE_B3_01, {
  empreinte: 'be16621678ff8b0b86512f24bf8a375dede9e284b4ebcafbb5129ced65b9b90d',
  ecrans: 40,
  publicsAuCatalogue: [
    'A1-02-COURRIEL',
    'A1-03-CARTE',
    'A1-05-COURS-DONNEE',
    'A1-06-COURS-RELATIONS',
    'A1-10-COURS-GRILLE',
    'A1-11-COURS-OUTILS',
    'A2-02-FAMILLES',
    'A2-03-COURS-CHERCHER-AGREGER',
    'A2-06-COURS-TEMPS-STATS',
    'A2-09-COURS-TCD',
    'A3-01-GRAPHIQUE-TROMPEUR',
    'A3-03-COURS-GRAPHIQUES',
    'A3-07-COURS-DASHBOARD',
    'A3-11-FICHE-MEMO',
  ],
  textesAuPupitre: [
    { ecran: 'B3-01-A1-02-COURRIEL', textes: ['Nadia Ferrand', 'Données fictives'] },
    { ecran: 'B3-01-A1-10-COURS-GRILLE', textes: ['Faux ou suspect', 'La grille 2 × 2'] },
    { ecran: 'B3-01-A2-09-COURS-TCD', textes: ['T_Commandes'] },
    { ecran: 'B3-01-A3-01-GRAPHIQUE-TROMPEUR', textes: ['Rennes', 'Nantes'] },
  ],
  saisiesDuPosteEtudiant: [
    {
      ecran: 'B3-01-A1-14-ATELIER-NETTOYAGE',
      textes: ['lignes'],
      selecteur: '[data-testid="champ"]',
    },
  ],
  specifiques: () => {
    it(
      'monte le tri A1-13 et sa colonne vide « suspect · automatique » au poste, au pupitre et en projection, chaque colonne comptée juste avant et après la révélation',
      async () => {
        const pupitre = ecranNomme(ecransDuPupitreDe(INSTANTANE_B3_01), TRI_A_COLONNE_VIDE);
        const poste = ecranNomme(ecransPublicsDe(INSTANTANE_B3_01), TRI_A_COLONNE_VIDE);
        const revelation: RevelationDuPupitre = {
          donneesFormateur: pupitre.corrigeEcran,
          direct: { pilotage: { revele: true }, resultats: null, comptesJalon: null },
        };

        expect(await comptesDesColonnes(poste, 'etudiant')).toEqual(PIOCHE_PLEINE);
        expect(await comptesDesColonnes(pupitre, 'presentateur')).toEqual(PIOCHE_PLEINE);
        expect(await comptesDesColonnes(pupitre, 'presentateur', revelation)).toEqual(
          CLASSEMENT_CORRIGE,
        );
        expect(await comptesDesColonnes(poste, 'presentateur', revelation)).toEqual(
          CLASSEMENT_CORRIGE,
        );
      },
      DELAI_DE_MONTAGE_MS,
    );

    it('sert au poste étudiant le courriel de Nadia avec l export brut à télécharger', () => {
      const courriel = texteServiAuPosteEtudiant(INSTANTANE_B3_01, 'B3-01-A1-02-COURRIEL');

      expect(courriel).toContain('Nadia Ferrand');
      expect(courriel).toContain('/assets/cours/b3-01/B3-01_export_ventes.d4f2ceab.xlsx');
    });
  },
});
