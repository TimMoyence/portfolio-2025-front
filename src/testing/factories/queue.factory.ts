import type { EnvoiReponse } from '../../cours/runtime/core/queue';

export function buildEnvoiReponse(
  overrides: Partial<Omit<EnvoiReponse, 'id'>> = {},
): Omit<EnvoiReponse, 'id'> {
  return {
    nature: 'reponse',
    sessionId: 'b1-09-interets-composes',
    studentKey: 'etu-1',
    questionId: 'Q-CAP-03',
    valeur: 'b',
    dureeMs: 4200,
    horodatage: '2026-09-11T08:00:00.000Z',
    ...overrides,
  };
}
