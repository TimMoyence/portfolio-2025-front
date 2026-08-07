import { of } from 'rxjs';
import type { RadarPort } from '../../app/core/ports/radar.port';

export function createRadarPortStub(): Record<keyof RadarPort, jasmine.Spy> {
  return {
    getLatestRadarTileUrlTemplate: jasmine
      .createSpy('getLatestRadarTileUrlTemplate')
      .and.returnValue(of(null)),
  };
}
