import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { buildAppConfig } from '../../../../../testing/factories/app-config.factory';
import { buildVisualCourse } from '../../../../../testing/factories/formation-catalogue.factory';
import { buildVisualChartSlide } from '../../../../../testing/factories/visual-slide.factory';
import { setupTestBed } from '../../../../../testing/setup-test-bed';
import { B2TraitementInformationChiffreeComponent } from '../../../../features/formations/b2-01-traitement-information-chiffree/b2-01-traitement-information-chiffree.component';
import { FormationCatalogueHttpAdapter } from '../../../../core/adapters/formation-catalogue-http.adapter';
import { FORMATION_CATALOGUE_PORT } from '../../../../core/ports/formation-catalogue.port';

const SLUG = 'b2-01-traitement-information-chiffree';

const G1 = {
  title: 'Marge brute d’Atelier Rivage, 2022–2025',
  caption: 'Axe vertical de 0 à 300 000 €',
  labels: ['2022', '2023', '2024', '2025'],
  series: [{ label: 'Marge brute', values: [285000, 288000, 289800, 291000], tone: 'teal' }],
  axisRanges: [[0, 300000]],
  unit: '€',
  reading: 'La marge brute passe de 285 000 € à 291 000 € : +6 000 € en trois ans, soit +2,1 %.',
  source: 'Comptes de résultat 2022 à 2025 d’Atelier Rivage (données fictives).',
  description: 'Diagramme en barres à partir de zéro : quatre barres presque égales.',
};

function textes(racine: HTMLElement, selecteur: string): (string | undefined)[] {
  return Array.from(racine.querySelectorAll(selecteur)).map((noeud) =>
    noeud.textContent?.replace(/\s+/g, ' ').trim(),
  );
}

describe('Graphique v2 servi par le catalogue (F13, intégration)', () => {
  it('rend G1 depuis la réponse HTTP réelle de /formations/catalogue/:slug', () => {
    setupTestBed({
      router: true,
      imports: [B2TraitementInformationChiffreeComponent],
      providers: [
        FormationCatalogueHttpAdapter,
        { provide: FORMATION_CATALOGUE_PORT, useExisting: FormationCatalogueHttpAdapter },
      ],
    });
    const httpMock = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(B2TraitementInformationChiffreeComponent);
    fixture.detectChanges();

    const requete = httpMock.expectOne(
      `${buildAppConfig().apiBaseUrl}/formations/catalogue/${SLUG}`,
    );
    expect(requete.request.method).toBe('GET');
    requete.flush(buildVisualCourse({ ecrans: [buildVisualChartSlide(G1)] }));
    fixture.detectChanges();

    const rendu = fixture.nativeElement as HTMLElement;
    const graphique = rendu.querySelector<HTMLElement>('app-slide-chart');
    expect(graphique).not.toBeNull();
    expect(textes(graphique!, 'h2')).toEqual([G1.title]);
    expect(textes(graphique!, '[data-testid="slide-chart-graduation"]')).toEqual([
      '300 000',
      '250 000',
      '200 000',
      '150 000',
      '100 000',
      '50 000',
      '0',
    ]);
    expect(
      Array.from(graphique!.querySelectorAll<HTMLElement>('.slide-chart__bar')).map((barre) =>
        barre.style.getPropertyValue('--hauteur'),
      ),
    ).toEqual(['95%', '96%', '96.6%', '97%']);
    expect(textes(graphique!, '[data-testid="slide-chart-description"]')).toEqual([G1.description]);
    expect(textes(graphique!, '.slide-chart__data summary')).toEqual(['Voir les données']);
    expect(textes(graphique!, '.slide-chart__data tbody td')).toEqual([
      '285 000',
      '288 000',
      '289 800',
      '291 000',
    ]);
    httpMock.verify();
  });
});
