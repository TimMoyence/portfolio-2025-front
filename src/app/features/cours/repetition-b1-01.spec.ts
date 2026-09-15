import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import type { CoursContent, EcranContent, RenderMode, Role } from '../../../cours/content/types';
import { texte } from '../../../cours/runtime/core/i18n';
import sujet from '../../../testing/fixtures/cours/b1-01-proportions.sujet.json';
import { setupTestBed } from '../../../testing/setup-test-bed';
import { CoursEcranComponent } from './ecran/cours-ecran.component';

interface Projection {
  readonly rendu: RenderMode;
  readonly role: Role;
}

const COURS: CoursContent = sujet;
const SLUG = 'b1-01-proportions';
const QUESTIONNAIRE = 'questionnaire';
const CLES_DU_CORRIGE: readonly string[] = [
  'solutions',
  'corriges',
  'pieges',
  'confusion',
  'notes',
  'seuil',
  'remediations',
];
const MARQUEURS_DE_PANNE: readonly string[] = [
  '#NOM?',
  '#VALEUR!',
  '#REF!',
  '#DIV/0!',
  'NaN',
  'undefined',
];
const VALEUR_NON_FINIE = '—';
const PROJECTIONS: readonly Projection[] = [
  { rendu: 'stage', role: 'presentateur' },
  { rendu: 'hand', role: 'etudiant' },
];

function clesDe(valeur: unknown): string[] {
  if (Array.isArray(valeur)) {
    return valeur.flatMap((element: unknown) => clesDe(element));
  }
  if (typeof valeur === 'object' && valeur !== null) {
    return Object.entries(valeur).flatMap(([cle, element]) => [cle, ...clesDe(element)]);
  }
  return [];
}

function briquesAttendues(ecran: EcranContent): number {
  const questions = ecran.donnees?.['questions'];
  return ecran.type === QUESTIONNAIRE && Array.isArray(questions) ? questions.length : 1;
}

function racines(racine: Element | ShadowRoot): (Element | ShadowRoot)[] {
  const ombres = [...racine.querySelectorAll('*')].flatMap((element) =>
    element.shadowRoot === null ? [] : racines(element.shadowRoot),
  );
  return [racine, ...ombres];
}

function elementsDe(racine: Element): Element[] {
  return racines(racine).flatMap((noeud) => [...noeud.querySelectorAll('*')]);
}

function alertesDe(racine: Element): Element[] {
  return elementsDe(racine).filter((element) => element.matches('[role=alert]'));
}

function marqueursDePanne(racine: Element): string[] {
  const html = racines(racine)
    .map((noeud) => noeud.innerHTML)
    .join('\n');
  return MARQUEURS_DE_PANNE.filter((marqueur) => html.includes(marqueur));
}

function valeursNonFinies(racine: Element): string[] {
  return elementsDe(racine)
    .filter((element) => element.children.length === 0)
    .map((element) => element.textContent?.trim() ?? '')
    .filter((valeur) => valeur === VALEUR_NON_FINIE);
}

async function monter(
  ecran: EcranContent,
  projection: Projection,
): Promise<ComponentFixture<CoursEcranComponent>> {
  setupTestBed({ imports: [CoursEcranComponent], http: false });
  await TestBed.compileComponents();
  const fixture = TestBed.createComponent(CoursEcranComponent);
  fixture.componentRef.setInput('ecran', ecran);
  fixture.componentRef.setInput('rendu', projection.rendu);
  fixture.componentRef.setInput('role', projection.role);
  fixture.detectChanges();
  await fixture.componentInstance.quandMonte();
  fixture.detectChanges();
  return fixture;
}

describe('Repetition de B1-01 : chaque ecran reel du sujet', () => {
  it('ne publie que le sujet public du cours, sans aucune cle du corrige', () => {
    expect(COURS.id).toBe(SLUG);
    expect(COURS.ecrans.length).toBeGreaterThan(0);
    expect(clesDe(sujet).filter((cle) => CLES_DU_CORRIGE.includes(cle))).toEqual([]);
  });

  for (const ecran of COURS.ecrans) {
    for (const projection of PROJECTIONS) {
      it(`rend ${ecran.id} en ${projection.rendu} pour le role ${projection.role} sans panne`, async () => {
        const erreurs = spyOn(console, 'error');

        const fixture = await monter(ecran, projection);

        const racine = fixture.nativeElement as HTMLElement;
        const hote = racine.querySelector<HTMLElement>("[data-testid='cours-ecran-hote']");
        const briques = [...(hote?.children ?? [])];
        expect(erreurs.calls.allArgs()).toEqual([]);
        expect(fixture.componentInstance.pret()).toBeTrue();
        expect(briques.map((brique) => brique.getAttribute('render'))).toEqual(
          Array.from({ length: briquesAttendues(ecran) }, () => projection.rendu),
        );
        expect(alertesDe(racine)).toEqual([]);
        expect(marqueursDePanne(racine)).toEqual([]);
        expect(valeursNonFinies(racine)).toEqual([]);
        for (const brique of briques) {
          const contenu = brique.shadowRoot?.textContent?.trim() ?? '';
          expect({ brique: brique.localName, vide: contenu === '' }).toEqual({
            brique: brique.localName,
            vide: false,
          });
          expect(contenu).not.toContain(texte('chargement'));
        }
      });
    }
  }
});
