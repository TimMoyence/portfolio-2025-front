import {
  enqueueFreeResponse,
  pendingFreeResponses,
  removeFreeResponse,
} from './free-response.queue';

describe('free-response queue', () => {
  function reponseEnAttente(key: string) {
    return {
      key,
      sessionId: `session-${key}`,
      screenId: 'screen-1',
      activityId: 'reflection-1',
      response: 'réponse hors ligne',
      dureeMs: 1200,
    } as const;
  }

  it('conserve une réponse hors ligne puis la retire après reprise', async () => {
    const response = reponseEnAttente(`spec-${Date.now()}`);

    await enqueueFreeResponse(response);

    expect(await pendingFreeResponses(response.sessionId)).toEqual([response]);

    await removeFreeResponse(response.key);

    expect(await pendingFreeResponses(response.sessionId)).toEqual([]);
  });

  it('ferme la connexion IndexedDB ouverte par chaque operation', async () => {
    const fermeture = spyOn(IDBDatabase.prototype, 'close').and.callThrough();
    const response = reponseEnAttente(`fermeture-${Date.now()}`);

    await enqueueFreeResponse(response);
    await pendingFreeResponses(response.sessionId);
    await removeFreeResponse(response.key);

    expect(fermeture).toHaveBeenCalledTimes(3);
  });
});
