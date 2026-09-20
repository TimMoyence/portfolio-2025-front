import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type {
  MotifRefusReponseLibre,
  ReponseLibreEtudiant,
} from '../../../core/ports/formations.port';
import { FORMATIONS_PORT, ReponseLibreRefusee } from '../../../core/ports/formations.port';
import { readIdentity } from '../../../../cours/runtime/core/identity';
import type { PendingFreeResponse } from '../interactions/slide-reflection/free-response.queue';
import {
  enqueueFreeResponse,
  pendingFreeResponses,
  removeFreeResponse,
} from '../interactions/slide-reflection/free-response.queue';

export type EtatEnvoiLibre =
  | 'enregistre'
  | 'attente_reseau'
  | 'ecran_non_servi'
  | 'seance_non_demarree'
  | 'seance_terminee'
  | 'echec'
  | 'vide';

type MotifDefinitif = Exclude<MotifRefusReponseLibre, 'reseau' | 'ecran-non-servi'>;

const ETAT_APRES_REFUS: Readonly<Record<MotifDefinitif, EtatEnvoiLibre>> = {
  'seance-non-demarree': 'seance_non_demarree',
  'seance-terminee': 'seance_terminee',
  refusee: 'echec',
};

export function cleDeReponseLibre(sessionId: string, screenId: string, activityId: string): string {
  return `${sessionId}:${screenId}:${activityId}`;
}

function cleDeStockage(studentKey: string, cleLogique: string): string {
  return `${studentKey}:${cleLogique}`;
}

function cleLogiqueDe(envoi: PendingFreeResponse): string {
  return cleDeReponseLibre(envoi.sessionId, envoi.screenId, envoi.activityId);
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
    const studentKey = readIdentity()?.studentKey ?? '';
    const cleLogique = cleDeReponseLibre(sessionId, reponse.screenId, reponse.activityId);
    return this.transmettre(jeton, {
      key: cleDeStockage(studentKey, cleLogique),
      sessionId,
      studentKey,
      screenId: reponse.screenId,
      activityId: reponse.activityId,
      response: texte,
      dureeMs: Math.max(0, reponse.dureeMs),
    });
  }

  async reprendre(sessionId: string, jeton: string): Promise<ReadonlyMap<string, EtatEnvoiLibre>> {
    const etats = new Map<string, EtatEnvoiLibre>();
    const studentKey = readIdentity()?.studentKey;
    if (studentKey === undefined) {
      return etats;
    }
    for (const envoi of await pendingFreeResponses(sessionId, studentKey)) {
      etats.set(cleLogiqueDe(envoi), await this.transmettre(jeton, envoi));
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
    if (motif !== 'reseau' && motif !== 'ecran-non-servi') {
      await removeFreeResponse(envoi.key);
      return ETAT_APRES_REFUS[motif];
    }
    if (envoi.studentKey === '') {
      return 'echec';
    }
    try {
      await enqueueFreeResponse(envoi);
      return motif === 'reseau' ? 'attente_reseau' : 'ecran_non_servi';
    } catch {
      return 'echec';
    }
  }
}
