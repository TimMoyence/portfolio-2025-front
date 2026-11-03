import * as fc from 'fast-check';

const GRAINE_DE_SIMULATION = 20260920;

export function verifierLaPropriete<Ts extends unknown[]>(
  propriete: fc.IProperty<Ts>,
  tours: number,
): void {
  fc.assert(propriete, { seed: GRAINE_DE_SIMULATION, numRuns: tours });
}

export function verifierLaProprieteAsynchrone<Ts extends unknown[]>(
  propriete: fc.IAsyncProperty<Ts>,
  tours: number,
): Promise<void> {
  return fc.assert(propriete, { seed: GRAINE_DE_SIMULATION, numRuns: tours });
}
