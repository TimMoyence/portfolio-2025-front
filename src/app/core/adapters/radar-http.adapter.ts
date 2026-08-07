import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import type { RadarPort } from '../ports/radar.port';

interface RainViewerWeatherMaps {
  radar?: {
    past?: { path: string }[];
  };
}

@Injectable()
export class RadarHttpAdapter implements RadarPort {
  private static readonly INDEX_URL = 'https://api.rainviewer.com/public/weather-maps.json';

  constructor(private readonly http: HttpClient) {}

  getLatestRadarTileUrlTemplate(): Observable<string | null> {
    return this.http.get<RainViewerWeatherMaps>(RadarHttpAdapter.INDEX_URL).pipe(
      map((data) => {
        const frames = data.radar?.past;
        if (!frames?.length) return null;
        const latest = frames[frames.length - 1];
        return `https://tilecache.rainviewer.com${latest.path}/256/{z}/{x}/{y}/2/1_1.png`;
      }),
      catchError(() => of(null)),
    );
  }
}
