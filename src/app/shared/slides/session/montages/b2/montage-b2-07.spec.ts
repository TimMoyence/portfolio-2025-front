import type { ComponentFixture } from '@angular/core/testing';
import { INSTANTANE_B2_07 } from '../../../../../../testing/fixtures/instantanes/b2/instantane-b2-07';
import {
  decrireLeMontageDeLInstantane,
  proprietesServies,
  texteServiAuPosteEtudiant,
} from '../../../../../../testing/page/montage-d-instantane';
import { montagePage, poserLesEntrees } from '../../../../../../testing/page/montage-page';
import { rendreALaLargeur } from '../../../../../../testing/texte/deux-images';
import { etiquettesMasquees, textes } from '../../../../../../testing/texte/textes-dom';
import { SlideCourbeComponent } from '../../../layouts/donnees/slide-courbe/slide-courbe.component';
import { SlideLessonComponent } from '../../../layouts/texte/slide-lesson/slide-lesson.component';

const LARGEURS = ['1216px', '358px'] as const;
const SANS_ETIQUETTE_MASQUEE = Object.fromEntries(LARGEURS.map((largeur) => [largeur, []]));

async function masqueesAuxLargeurs(
  fixture: () => ComponentFixture<unknown>,
): Promise<Record<string, string[]>> {
  const racine = fixture().nativeElement as HTMLElement;
  racine.style.containerType = 'inline-size';
  const masquees: Record<string, string[]> = {};
  for (const largeur of LARGEURS) {
    await rendreALaLargeur(fixture(), largeur);
    masquees[largeur] = etiquettesMasquees(racine);
  }
  return masquees;
}

const ECRANS_D_IMAGE = [
  'B2-07-A1-02-ENFANT-MULTIPLIER',
  'B2-07-A1-03-ENFANT-A-ET-K',
  'B2-07-A1-04-ENFANT-LN',
  'B2-07-A1-05-ENFANT-SEUIL',
  'B2-07-A1-07-ENFANT-BOUCLE',
  'B2-07-A1-08-ENFANT-TANT-QUE',
  'B2-07-A2-03-ENFANT-PENTE',
  'B2-07-A2-09-ENFANT-EXPONENTIELLE',
  'B2-07-A3-02-ENFANT-PANNEAU',
  'B2-07-A3-03-ENFANT-CARTE',
  'B2-07-A4-02-ENFANT-SOMMET',
  'B2-07-A4-03-ENFANT-BORD',
];

decrireLeMontageDeLInstantane('B2-07', INSTANTANE_B2_07, {
  ecrans: 35,
  publicsAuCatalogue: [
    'A1-01-ACCROCHE',
    'A1-02-ENFANT-MULTIPLIER',
    'A1-03-ENFANT-A-ET-K',
    'A1-04-ENFANT-LN',
    'A1-05-ENFANT-SEUIL',
    'A1-07-ENFANT-BOUCLE',
    'A1-08-ENFANT-TANT-QUE',
    'A2-01-DOSSIER',
    'A2-03-ENFANT-PENTE',
    'A2-04-COURBE-PENTES',
    'A2-05-COURS-DERIVEE',
    'A2-09-ENFANT-EXPONENTIELLE',
    'A2-10-COURS-DERIVEE-EXP',
    'A3-02-ENFANT-PANNEAU',
    'A3-03-ENFANT-CARTE',
    'A3-04-COURS-VARIATIONS',
    'A4-02-ENFANT-SOMMET',
    'A4-03-ENFANT-BORD',
    'A4-04-COURS-OPTIMUM',
    'A5-02-FICHE-MEMO',
  ],
  textesAuPupitre: [
    { ecran: 'B2-07-A2-01-DOSSIER', textes: ['360 − 12x', 'Données fictives'] },
    { ecran: 'B2-07-A2-05-COURS-DERIVEE', textes: ['f′(x) = −4x + 40'] },
    { ecran: 'B2-07-A2-10-COURS-DERIVEE-EXP', textes: ['(e^(kx))′ = k e^(kx)'] },
  ],
  saisiesDuPosteEtudiant: [
    {
      ecran: 'B2-07-A4-07-TABLEUR-BENEFICE',
      textes: ['Recopier vers le bas'],
      selecteur: '[data-testid="cellule"]',
    },
  ],
  specifiques: () => {
    it('B207-M2 · sert au poste étudiant chaque écran d’image avec sa règle en notation et ses correspondances image → cours', () => {
      for (const ecran of ECRANS_D_IMAGE) {
        const texte = texteServiAuPosteEtudiant(INSTANTANE_B2_07, ecran);

        expect(texte).toContain('En maths, on écrit');
        expect(texte).toContain(' → ');
      }
    });

    describe('B207-M4 · courbe pas à pas servie (RET-03)', () => {
      const courbe = montagePage(SlideCourbeComponent, {
        http: false,
        avantRendu: (montee) =>
          poserLesEntrees(
            montee,
            proprietesServies(INSTANTANE_B2_07, 'B2-07-A2-04-COURBE-PENTES', 'courbe'),
          ),
      });

      it('B207-M4 · à sa dernière étape, montre chaque pente servie, aucune masquée faute de place, sur la toile comme au téléphone', async () => {
        const racine = courbe().nativeElement as HTMLElement;
        const suivant = racine.querySelector<HTMLButtonElement>(
          '[data-testid="slide-courbe-suivant"]',
        );
        while (suivant !== null && !suivant.disabled) {
          suivant.click();
          courbe().detectChanges();
        }

        expect(textes(racine, '.slide-scatter__point-label')).toEqual([
          'pente 4',
          'pente 2',
          'pente 0',
          'pente −2',
          'pente −4',
        ]);
        expect(await masqueesAuxLargeurs(courbe)).toEqual(SANS_ETIQUETTE_MASQUEE);
      });
    });

    describe('B207-M5 · leçon de l optimum servie (RET-04)', () => {
      const lecon = montagePage(SlideLessonComponent, {
        http: false,
        avantRendu: (montee) =>
          poserLesEntrees(
            montee,
            proprietesServies(INSTANTANE_B2_07, 'B2-07-A4-04-COURS-OPTIMUM', 'lesson'),
          ),
      });

      it('B207-M5 · garde lisible l étiquette du sommet à côté de la contrainte, sur la toile comme au téléphone', async () => {
        expect(textes(lecon().nativeElement as HTMLElement, '.slide-scatter__point-label')).toEqual(
          ['sommet : f(10) = 205'],
        );
        expect(await masqueesAuxLargeurs(lecon)).toEqual(SANS_ETIQUETTE_MASQUEE);
      });
    });
  },
});
