import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { buildAppConfig } from '../../../../../testing/factories/app-config.factory';
import { buildVisualCourse } from '../../../../../testing/factories/formation-catalogue.factory';
import { buildVisualChartSlide } from '../../../../../testing/factories/visual-slide.factory';
import { GRAPHIQUE_MARGE_BRUTE } from '../../../../../testing/fixtures/graphique-marge-brute';
import { setupTestBed } from '../../../../../testing/setup-test-bed';
import { textes } from '../../../../../testing/textes-dom';
import { FormationCatalogueHttpAdapter } from '../../../../core/adapters/formation-catalogue-http.adapter';
import { SlideActivityComponent } from '../../session/slide-activity.component';

const SLUG = 'b2-01-traitement-information-chiffree';

const G1 = {
  ...GRAPHIQUE_MARGE_BRUTE,
  reading: 'La marge brute passe de 285 000 € à 291 000 € : +6 000 € en trois ans, soit +2,1 %.',
  description: 'Diagramme en barres à partir de zéro : quatre barres presque égales.',
};

describe('Graphique v2 servi par le catalogue (F13, intégration)', () => {
  it('rend G1 depuis la réponse HTTP réelle de /formations/catalogue/:slug', async () => {
    setupTestBed({
      router: true,
      imports: [SlideActivityComponent],
      providers: [FormationCatalogueHttpAdapter],
    });
    const httpMock = TestBed.inject(HttpTestingController);
    const lecture = firstValueFrom(TestBed.inject(FormationCatalogueHttpAdapter).lire(SLUG));

    const requete = httpMock.expectOne(
      `${buildAppConfig().apiBaseUrl}/formations/catalogue/${SLUG}`,
    );
    expect(requete.request.method).toBe('GET');
    requete.flush(buildVisualCourse({ ecrans: [buildVisualChartSlide(G1)] }));
    const [ecran] = (await lecture).ecrans;

    const fixture = TestBed.createComponent(SlideActivityComponent);
    fixture.componentRef.setInput('slide', ecran);
    fixture.componentRef.setInput('apercu', true);
    fixture.componentRef.setInput('prioritaire', true);
    fixture.detectChanges();

    const graphique = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      'app-slide-chart',
    );
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
