import type { EtatParticipant } from '../../cours/content/types';

export type IdentiteDEtat = Pick<EtatParticipant, 'sessionId' | 'participantId' | 'revision'>;

export function etatParticipantVierge(identite: IdentiteDEtat): EtatParticipant {
  return {
    ...identite,
    reponses: [],
    reponsesLibres: [],
    jalons: [],
    enigmes: [],
    defis: [],
    rappels: { questionIds: [] },
  };
}
