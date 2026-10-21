import type { EnvoiReponse } from '../../cours/runtime/core/queue';
import { pending } from '../../cours/runtime/core/queue';
import { removeKey } from '../../cours/runtime/core/storage';

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

export function buildReponseLibreEnFile(
  overrides: Partial<Omit<EnvoiReponse, 'id'>> = {},
): Omit<EnvoiReponse, 'id'> {
  return buildEnvoiReponse({
    nature: 'libre',
    screenId: 'ecran-1',
    questionId: 'reflexion-1',
    valeur: 'Mise en file plus tôt.',
    dureeMs: 10,
    ...overrides,
  });
}

export function reponsesLibresEnFile(
  sessionId: string,
  studentKey: string,
): readonly EnvoiReponse[] {
  return pending().filter(
    (envoi) =>
      envoi.nature === 'libre' && envoi.sessionId === sessionId && envoi.studentKey === studentKey,
  );
}

export function viderLaFileDEnvois(): void {
  removeKey('fp.file-reponses');
}
