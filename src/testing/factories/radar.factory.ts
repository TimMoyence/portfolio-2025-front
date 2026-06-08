import { of } from "rxjs";
import type { RadarPort } from "../../app/core/ports/radar.port";

/**
 * Cree un stub complet du port radar avec un spy Jasmine.
 * Par defaut, le template d'URL est `null` (degradation silencieuse).
 */
export function createRadarPortStub(): Record<keyof RadarPort, jasmine.Spy> {
  return {
    getLatestRadarTileUrlTemplate: jasmine
      .createSpy("getLatestRadarTileUrlTemplate")
      .and.returnValue(of(null)),
  };
}
