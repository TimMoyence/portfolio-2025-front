import { TestBed } from '@angular/core/testing';
import { poserLesEntrees } from '../../../../../testing/montage-page';
import { setupTestBed } from '../../../../../testing/setup-test-bed';
import { textes } from '../../../../../testing/textes-dom';
import { SlideLessonComponent, type SlideLessonBlock } from './slide-lesson.component';

const TRACE_ECRITE: readonly SlideLessonBlock[] = [
  {
    kind: 'definition',
    title: 'Le point moyen',
    text: 'Le point moyen G a pour coordonnées les moyennes des deux séries.',
    formula: 'G(x̄ ; ȳ)',
  },
  {
    kind: 'property',
    title: 'La droite passe par G',
    text: 'La droite d’ajustement par les moindres carrés passe toujours par G.',
    formula: 'ȳ = a·x̄ + b',
  },
  {
    kind: 'method',
    title: 'Tracer la droite',
    text: 'On calcule deux points de la droite puis on les relie.',
    steps: ['Calculer x̄ et ȳ.', 'Calculer b = ȳ − a·x̄.', 'Placer G et un second point.'],
  },
  {
    kind: 'exam',
    title: 'Ce qui est attendu',
    text: 'Justifier chaque calcul et arrondir à 10⁻² près.',
  },
];

function monter(surcharges: Readonly<Record<string, unknown>> = {}): HTMLElement {
  setupTestBed({ http: false, imports: [SlideLessonComponent] });
  const fixture = poserLesEntrees(TestBed.createComponent(SlideLessonComponent), {
    title: 'Ajuster un nuage de points',
    blocks: TRACE_ECRITE,
    ...surcharges,
  });
  return fixture.nativeElement as HTMLElement;
}

describe('SlideLessonComponent', () => {
  it('rend les blocs dans l ordre avec la nature de chacun', () => {
    const racine = monter();
    expect(textes(racine, '[data-testid="slide-lesson-titre-bloc"]')).toEqual([
      'Le point moyen',
      'La droite passe par G',
      'Tracer la droite',
      'Ce qui est attendu',
    ]);
    expect(textes(racine, '[data-testid="slide-lesson-nature"]')).toEqual([
      'Définition',
      'Propriété',
      'Méthode',
      'Au CCF',
    ]);
  });

  it('distingue un exemple par son libelle', () => {
    const racine = monter({
      blocks: [{ kind: 'example', title: 'Six mois de ventes', text: 'x̄ = 3,5 et ȳ = 718.' }],
    });
    expect(textes(racine, '[data-testid="slide-lesson-nature"]')).toEqual(['Exemple']);
  });

  it('met la formule en evidence seulement quand elle existe', () => {
    const racine = monter();
    expect(textes(racine, '[data-testid="slide-lesson-formule"]')).toEqual([
      'G(x̄ ; ȳ)',
      'ȳ = a·x̄ + b',
    ]);
  });

  it('numerote les etapes d une methode en liste ordonnee', () => {
    const racine = monter();
    const etapes = racine.querySelectorAll('ol[data-testid="slide-lesson-etapes"] li');
    expect(etapes.length).toBe(3);
    expect(etapes[1].textContent).toContain('b = ȳ − a·x̄');
    expect(racine.querySelectorAll('ol[data-testid="slide-lesson-etapes"]').length).toBe(1);
  });

  it('R-01 · passe a la ligne une formule de tableur insecable plutot que de deborder de son bloc', () => {
    const formule = '=INDEX(Produits!$C$2:$C$41;EQUIV(H2;Produits!$A$2:$A$41;0))';
    const racine = monter({
      blocks: [
        {
          kind: 'method',
          title: 'Chercher : INDEX et EQUIV',
          text: `Pour ramener la catégorie du produit de la ligne 2 : ${formule}. EQUIV trouve le rang de H2.`,
          steps: [`Recopier ${formule} jusqu’en bas.`],
        },
        {
          kind: 'property',
          title: 'Additionner et compter sous conditions',
          text: 'SOMME.SI.ENS(plage_somme;plage1;critère1;plage2;critère2) additionne les lignes.',
        },
        {
          kind: 'method',
          title: 'Écrire un critère, figer une plage',
          text: 'Un critère est un texte : l’opérateur s’écrit entre guillemets.',
        },
        {
          kind: 'example',
          title: 'Si vous avez Excel 2021 ou 365 : RECHERCHEX',
          text: '=RECHERCHEX(H2;Produits!$A$2:$A$41;Produits!$C$2:$C$41) fait le même travail.',
        },
      ],
    });
    racine.style.cssText = 'display:block;width:1216px;';
    const bord = racine.getBoundingClientRect().right;

    for (const element of racine.querySelectorAll<HTMLElement>(
      '.slide-lesson__blocks, .slide-lesson__block, .slide-lesson__text, .slide-lesson__steps li',
    )) {
      const contexte = element.className || element.tagName;
      expect(element.scrollWidth).withContext(contexte).toBeLessThanOrEqual(element.clientWidth);
      expect(element.getBoundingClientRect().right).withContext(contexte).toBeLessThanOrEqual(bord);
    }
  });

  it('affiche le titre, le sous-titre et le texte de chaque bloc', () => {
    const racine = monter({ subtitle: 'Trace écrite à recopier' });
    expect(racine.querySelector('h2')?.textContent).toContain('Ajuster un nuage de points');
    expect(racine.textContent).toContain('Trace écrite à recopier');
    expect(racine.textContent).toContain('passe toujours par G');
  });
});
