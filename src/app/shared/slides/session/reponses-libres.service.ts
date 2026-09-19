import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type {
  MotifRefusReponseLibre,
  ReponseLibreEtudiant,
} from '../../../core/ports/formations.port';
import { FORMATIONS_PORT, ReponseLibreRefusee } from '../../../core/ports/formations.port';
import type { PendingFreeResponse } from '../interactions/slide-reflection/free-response.queue';
import {
  enqueueFreeResponse,
  pendingFreeResponses,
  removeFreeResponse,
} from '../interactions/slide-reflection/free-response.queue';

export type EtatEnvoiLibre =
  'enregistre' | 'attente_reseau' | 'seance_non_demarree' | 'seance_terminee' | 'echec' | 'vide';

const ETAT_APRES_REFUS: Readonly<
  Record<Exclude<MotifRefusReponseLibre, 'reseau'>, EtatEnvoiLibre>
> = {
  'seance-non-demarree': 'seance_non_demarree',
  'seance-terminee': 'seance_terminee',
  refusee: 'echec',
};

export function cleDeReponseLibre(sessionId: string, screenId: string, activityId: string): string {
  return `${sessionId}:${screenId}:${activityId}`;
}

@Injectable({ providedIn: 'root' })
export class ReponsesLibresService {
  private readonly port = inject(FORMATIONS_PORT, { optional: true });

  async envoyer(
    sessionId: string,
    jeton: string,
    reponse: ReponseLibreEtudiant,
  ): Promise<EtatEnvoiLibre> {
    const texte = reponse.response.trim();
    if (texte.length === 0) {
      return 'vide';
    }
    return this.transmettre(jeton, {
      key: cleDeReponseLibre(sessionId, reponse.screenId, reponse.activityId),
      sessionId,
      screenId: reponse.screenId,
      activityId: reponse.activityId,
      response: texte,
      dureeMs: Math.max(0, reponse.dureeMs),
    });
  }

  async reprendre(sessionId: string, jeton: string): Promise<ReadonlyMap<string, EtatEnvoiLibre>> {
    const etats = new Map<string, EtatEnvoiLibre>();
    for (const envoi of await pendingFreeResponses(sessionId)) {
      etats.set(envoi.key, await this.transmettre(jeton, envoi));
    }
    return etats;
  }

  private async transmettre(jeton: string, envoi: PendingFreeResponse): Promise<EtatEnvoiLibre> {
    if (this.port === null) {
      return 'echec';
    }
    try {
      await firstValueFrom(
        this.port.enregistrerReponseLibre(envoi.sessionId, jeton, {
          screenId: envoi.screenId,
          activityId: envoi.activityId,
          response: envoi.response,
          dureeMs: envoi.dureeMs,
        }),
      );
    } catch (erreur) {
      return this.traiterLeRefus(envoi, erreur);
    }
    await removeFreeResponse(envoi.key);
    return 'enregistre';
  }

  private async traiterLeRefus(
    envoi: PendingFreeResponse,
    erreur: unknown,
  ): Promise<EtatEnvoiLibre> {
    const motif = erreur instanceof ReponseLibreRefusee ? erreur.motif : 'reseau';
    if (motif !== 'reseau') {
      await removeFreeResponse(envoi.key);
      return ETAT_APRES_REFUS[motif];
    }
    try {
      await enqueueFreeResponse(envoi);
      return 'attente_reseau';
    } catch {
      return 'echec';
    }
  }
}
