import {
  enqueueFreeResponse,
  pendingFreeResponses,
  removeFreeResponse,
} from './free-response.queue';

describe('free-response queue', () => {
  it('conserve une réponse hors ligne puis la retire après reprise', async () => {
    const key = `spec-${Date.now()}`;
    const response = {
      key,
      sessionId: `session-${key}`,
      screenId: 'screen-1',
      activityId: 'reflection-1',
      response: 'réponse hors ligne',
      dureeMs: 1200,
    } as const;

    await enqueueFreeResponse(response);

    expect(await pendingFreeResponses(response.sessionId)).toEqual([response]);

    await removeFreeResponse(response.key);

    expect(await pendingFreeResponses(response.sessionId)).toEqual([]);
  });
});
