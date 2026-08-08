import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { CityResult } from '../../../core/models/weather.model';
import { WEATHER_PORT } from '../../../core/ports/weather.port';

@Injectable({ providedIn: 'root' })
export class GeolocationService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly weatherPort = inject(WEATHER_PORT);

  locate(): Observable<CityResult> {
    if (!this.isBrowser || !navigator.geolocation) {
      return new Observable((subscriber) =>
        subscriber.error(new Error('Geolocation non disponible')),
      );
    }

    return new Observable<GeolocationPosition>((subscriber) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          subscriber.next(pos);
          subscriber.complete();
        },
        (err) => subscriber.error(err),
        { timeout: 10000, maximumAge: 300000 },
      );
    }).pipe(
      map((pos) => ({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
      })),
      map(
        ({ lat, lon }) =>
          ({
            id: -1,
            name: $localize`:weather.geo.myPosition|@@weatherGeoMyPosition:Ma position`,
            latitude: lat,
            longitude: lon,
            country: '',
            country_code: '',
          }) satisfies CityResult,
      ),
    );
  }

  reverseGeocode(lat: number, lon: number): Observable<string | null> {
    return this.weatherPort.reverseGeocode(lat, lon);
  }
}
