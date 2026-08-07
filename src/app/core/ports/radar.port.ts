import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

export interface RadarPort {
  /**
   * Retourne le template d'URL des tuiles de la derniere frame radar
   * disponible (placeholders Leaflet `{z}/{x}/{y}`), ou `null` si la source
   * est indisponible.
   */
  getLatestRadarTileUrlTemplate(): Observable<string | null>;
}

export const RADAR_PORT = new InjectionToken<RadarPort>('RADAR_PORT');
