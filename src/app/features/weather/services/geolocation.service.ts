import { isPlatformBrowser } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { inject, Injectable, PLATFORM_ID } from "@angular/core";
import { Observable, of } from "rxjs";
import { map, catchError } from "rxjs/operators";
import type { CityResult } from "../../../core/models/weather.model";

interface NominatimResponse {
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    country?: string;
    country_code?: string;
  };
}

/**
 * Service de geolocation du navigateur avec reverse geocoding.
 * SSR-safe : retourne une erreur propre cote serveur.
 */
@Injectable({ providedIn: "root" })
export class GeolocationService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly http = inject(HttpClient);

  /** Demande la position du navigateur et retourne un CityResult. */
  locate(): Observable<CityResult> {
    if (!this.isBrowser || !navigator.geolocation) {
      return new Observable((subscriber) =>
        subscriber.error(new Error("Geolocation non disponible")),
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
      map(({ lat, lon }) => {
        this.reverseGeocode(lat, lon).subscribe();
        return {
          id: -1,
          name: $localize`:weather.geo.myPosition|@@weatherGeoMyPosition:Ma position`,
          latitude: lat,
          longitude: lon,
          country: "",
          country_code: "",
        } satisfies CityResult;
      }),
    );
  }

  /**
   * Enrichit le nom de la ville via Nominatim reverse geocoding.
   * Retourne le nom de la ville ou null.
   */
  reverseGeocode(lat: number, lon: number): Observable<string | null> {
    return this.http
      .get<NominatimResponse>(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`,
      )
      .pipe(
        map((resp) => {
          const addr = resp.address;
          return (
            addr?.city ??
            addr?.town ??
            addr?.village ??
            addr?.municipality ??
            null
          );
        }),
        catchError(() => of(null)),
      );
  }
}
