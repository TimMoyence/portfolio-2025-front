import { environment } from '../../../environments/environment';
import { buildVisualCourse } from '../../../testing/factories/formation-catalogue.factory';
import { bancAdaptateurHttp } from '../../../testing/http-attendu';
import { FormationCatalogueHttpAdapter } from './formation-catalogue-http.adapter';

describe('FormationCatalogueHttpAdapter', () => {
  const banc = bancAdaptateurHttp(FormationCatalogueHttpAdapter);

  it('lit le cours publié sous le chemin des formations, slug encodé', () => {
    const cours = buildVisualCourse();
    const recus: unknown[] = [];

    banc.adapter.lire('b2-01/../admin').subscribe((lu) => recus.push(lu));

    const requete = banc.httpMock.expectOne(
      `${environment.apiBaseUrl}/formations/catalogue/b2-01%2F..%2Fadmin`,
    );
    expect(requete.request.method).toBe('GET');
    requete.flush(cours);
    expect(recus).toEqual([cours]);
  });
});
