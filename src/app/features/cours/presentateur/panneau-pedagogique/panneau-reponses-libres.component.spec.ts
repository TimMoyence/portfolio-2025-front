import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { balisesInjectees, CHARGE_XSS, xssDeclenche } from '../../../../../testing/charge-xss';
import { buildReponseLibreFormateur } from '../../../../../testing/factories/formations.factory';
import { PanneauReponsesLibresComponent } from './panneau-reponses-libres.component';

type Fixture = ComponentFixture<PanneauReponsesLibresComponent>;

const REPONSES = [
  buildReponseLibreFormateur({
    id: 'r-1',
    screenId: 'ecran-1',
    activityId: 'mesure',
    response: 'Comparer les bases.',
  }),
  buildReponseLibreFormateur({ id: 'r-2', screenId: 'ecran-2', response: 'Lire la source.' }),
  buildReponseLibreFormateur({
    id: 'r-3',
    screenId: 'ecran-1',
    activityId: 'unite',
    response: 'Vérifier l’unité.',
  }),
  buildReponseLibreFormateur({
    id: 'r-4',
    screenId: 'ecran-1',
    activityId: 'mesure',
    response: 'Un montant.',
  }),
];

const ENONCES = new Map([
  ['mesure', 'Que mesure chaque chiffre ?'],
  ['unite', 'Quelle unité ?'],
  ['periode', 'Quelle période ?'],
]);

function monter(
  ecranId: string,
  renvoi?: string,
  enonces: ReadonlyMap<string, string> = new Map(),
): Fixture {
  const fixture = TestBed.createComponent(PanneauReponsesLibresComponent);
  fixture.componentRef.setInput('reponses', REPONSES);
  fixture.componentRef.setInput('ecranId', ecranId);
  fixture.componentRef.setInput('renvoi', renvoi);
  fixture.componentRef.setInput('enonces', enonces);
  fixture.detectChanges();
  return fixture;
}

function hote(fixture: Fixture): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

function textes(fixture: Fixture): string[] {
  return [...hote(fixture).querySelectorAll('[data-testid="reponse-libre"]')].map(
    (element) => element.textContent?.trim() ?? '',
  );
}

describe('PanneauReponsesLibresComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [PanneauReponsesLibresComponent] }));

  it('ne montre que les reponses libres de l ecran courant', () => {
    expect(textes(monter('ecran-1'))).toEqual([
      'Comparer les bases.',
      'Un montant.',
      'Vérifier l’unité.',
    ]);
  });

  it('groupe les reponses sous chaque question, dans l ordre de l ecran', () => {
    const fixture = monter('ecran-1', undefined, ENONCES);
    const groupes = [...hote(fixture).querySelectorAll('[data-testid="reponses-libres-groupe"]')];

    expect(groupes.map((groupe) => groupe.getAttribute('data-activite'))).toEqual([
      'mesure',
      'unite',
      'periode',
    ]);
    expect(
      groupes[0].querySelector('[data-testid="reponses-libres-question"]')?.textContent?.trim(),
    ).toBe('Que mesure chaque chiffre ?');
    expect(groupes[0].querySelectorAll('[data-testid="reponse-libre"]').length).toBe(2);
    expect(groupes[2].querySelector('[data-testid="reponses-libres-vide"]')).not.toBeNull();
  });

  it('relit au pupitre d une correction les reponses de l ecran auquel elle renvoie', () => {
    expect(textes(monter('ecran-3', 'ecran-2'))).toEqual(['Lire la source.']);
  });

  it('T6 · affiche une reponse piegee en texte brut, sans creer ni executer de balise', async () => {
    const fixture = TestBed.createComponent(PanneauReponsesLibresComponent);
    fixture.componentRef.setInput('reponses', [
      buildReponseLibreFormateur({ id: 'r-xss', screenId: 'ecran-1', response: CHARGE_XSS }),
    ]);
    fixture.componentRef.setInput('ecranId', 'ecran-1');
    fixture.componentRef.setInput('enonces', new Map([['mesure', CHARGE_XSS]]));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(textes(fixture)).toEqual([CHARGE_XSS]);
    expect(balisesInjectees(hote(fixture))).toBe(0);
    expect(xssDeclenche()).toBeFalse();
  });

  it('ne rend rien sur un ecran sans activite libre ni reponse', () => {
    const fixture = monter('ecran-3');

    expect(hote(fixture).querySelector('.panneau-reponses')).toBeNull();
  });
});
