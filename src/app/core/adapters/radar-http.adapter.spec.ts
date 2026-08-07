import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RadarHttpAdapter } from './radar-http.adapter';

const RAINVIEWER_URL = 'https://api.rainviewer.com/public/weather-maps.json';

describe('RadarHttpAdapter', () => {
  let adapter: RadarHttpAdapter;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), RadarHttpAdapter],
    });

    adapter = TestBed.inject(RadarHttpAdapter);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('devrait construire le template de la derniere frame radar', () => {
    let result: string | null = 'UNSET';
    adapter.getLatestRadarTileUrlTemplate().subscribe((tpl) => {
      result = tpl;
    });

    const req = httpMock.expectOne(RAINVIEWER_URL);
    expect(req.request.method).toBe('GET');
    req.flush({
      radar: {
        past: [{ path: '/v2/radar/100' }, { path: '/v2/radar/123' }],
      },
    });

    expect(result).toBe('https://tilecache.rainviewer.com/v2/radar/123/256/{z}/{x}/{y}/2/1_1.png');
  });

  it('devrait emettre null si aucune frame radar passee', () => {
    let result: string | null = 'UNSET';
    adapter.getLatestRadarTileUrlTemplate().subscribe((tpl) => {
      result = tpl;
    });

    const req = httpMock.expectOne(RAINVIEWER_URL);
    req.flush({ radar: { past: [] } });

    expect(result).toBeNull();
  });

  it("devrait emettre null en cas d'erreur HTTP", () => {
    let result: string | null = 'UNSET';
    adapter.getLatestRadarTileUrlTemplate().subscribe((tpl) => {
      result = tpl;
    });

    const req = httpMock.expectOne(RAINVIEWER_URL);
    req.flush('Service indisponible', {
      status: 503,
      statusText: 'Service Unavailable',
    });

    expect(result).toBeNull();
  });
});
