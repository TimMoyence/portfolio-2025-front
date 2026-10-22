import { Injectable, inject, signal } from '@angular/core';
import type { Observable } from 'rxjs';
import { firstValueFrom, Subject } from 'rxjs';
import type {
  MotifRefusReponseLibre,
  ReponseLibreEtudiant,
} from '../../../core/ports/formations.port';
import {
  FORMATIONS_PORT,
  limiteDuRefus,
  ReponseLibreRefusee,
} from '../../../core/ports/formations.port';
import type { LimiteDeDebit } from '../../../core/models/limite-de-debit';
import { reprendreLAncienneFileLibre } from './ancienne-file-libre';
import type { EtatParticipant } from '../../../../cours/content/types';
import { readIdentity } from '../../../../cours/runtime/core/identity';
import type { EnvoiReponse, Envoyeur } from '../../../../cours/runtime/core/queue';
import {
  enqueue,
  flush,
  pending,
  purgerLesAutresEnvois,
  retirerLaReponseLibre,
} from '../../../../cours/runtime/core/queue';

export type EtatEnvoiLibre =
  | 'enregistre'
  | 'attente_reseau'
  | 'attente_limite'
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

export const ETATS_EN_FILE: readonly EtatEnvoiLibre[] = [
  'attente_reseau',
  'attente_limite',
  'ecran_non_servi',
];

const ETATS_GARDES: readonly EtatEnvoiLibre[] = ['enregistre', ...ETATS_EN_FILE];

type EnvoiEnFile = Omit<EnvoiReponse, 'id' | 'studentKey' | 'horodatage'>;

type ReponseLibreEnFile = Omit<EnvoiReponse, 'id'>;

function cleLogiqueDe(envoi: ReponseLibreEnFile): string {
  return cleDeReponseLibre(envoi.sessionId, envoi.screenId ?? '', envoi.questionId);
}

function texteDe(envoi: ReponseLibreEnFile): string {
  return typeof envoi.valeur === 'string' ? envoi.valeur : '';
}

function neRenvoiePas(): boolean {
  return false;
}

function cleDeTexteGarde(sessionId: string, activityId: string): string {
  return `${sessionId}:${activityId}`;
}

@Injectable({ providedIn: 'root' })
export class EnvoisDeSeanceService {
  private readonly port = inject(FORMATIONS_PORT, { optional: true });
  private readonly etats = signal<ReadonlyMap<string, EtatEnvoiLibre>>(new Map());
  private readonly gardes = signal<ReadonlyMap<string, string>>(new Map());

  readonly etatsDesEnvois = this.etats.asReadonly();
  private readonly reussites = new Subject<void>();
  readonly envoisReussis: Observable<void> = this.reussites.asObservable();
  private readonly limites = new Subject<LimiteDeDebit>();
  readonly limitesAtteintes: Observable<LimiteDeDebit> = this.limites.asObservable();
  private readonly reprises = new Map<string, Promise<unknown>>();
  private readonly refus = signal(false);
  readonly fileRefusee = this.refus.asReadonly();

  texteGarde(sessionId: string, activityId: string): string | null {
    return this.gardes().get(cleDeTexteGarde(sessionId, activityId)) ?? null;
  }

  restaurer(sessionId: string, reponses: EtatParticipant['reponsesLibres']): void {
    this.gardes.update(
      (connus) =>
        new Map([
          ...connus,
          ...reponses.map(
            ({ activityId, response }) =>
              [cleDeTexteGarde(sessionId, activityId), response] as const,
          ),
        ]),
    );
  }

  ouvrir(sessionId: string): void {
    this.refus.set(!purgerLesAutresEnvois(sessionId));
    reprendreLAncienneFileLibre(() => new Date()).catch(() => this.refuser());
  }

  mettreEnFile(envoi: EnvoiEnFile): boolean {
    const studentKey = readIdentity()?.studentKey ?? '';
    if (studentKey === '') {
      return this.refuser();
    }
    try {
      enqueue({ ...envoi, studentKey, horodatage: new Date().toISOString() });
      return true;
    } catch {
      return this.refuser();
    }
  }

  private refuser(): false {
    this.refus.set(true);
    return false;
  }

  reponsesEnAttente(sessionId: string): boolean {
    return pending().some((envoi) => envoi.sessionId === sessionId && envoi.nature !== 'libre');
  }

  private noter(envoi: ReponseLibreEnFile, etat: EtatEnvoiLibre): EtatEnvoiLibre {
    const cleLogique = cleLogiqueDe(envoi);
    this.etats.update((connus) => new Map(connus).set(cleLogique, etat));
    const cle = cleDeTexteGarde(envoi.sessionId, envoi.questionId);
    this.gardes.update((connus) => {
      const suivants = new Map(connus);
      if (ETATS_GARDES.includes(etat)) {
        suivants.set(cle, texteDe(envoi));
      } else {
        suivants.delete(cle);
      }
      return suivants;
    });
    return etat;
  }

  async envoyer(
    sessionId: string,
    jeton: string,
    reponse: ReponseLibreEtudiant,
  ): Promise<EtatEnvoiLibre> {
    const texte = reponse.response.trim();
    if (texte.length === 0) {
      return 'vide';
    }
    const envoi: ReponseLibreEnFile = {
      nature: 'libre',
      sessionId,
      studentKey: readIdentity()?.studentKey ?? '',
      screenId: reponse.screenId,
      questionId: reponse.activityId,
      valeur: texte,
      dureeMs: Math.max(0, reponse.dureeMs),
      horodatage: '',
    };
    const etat = await this.transmettre(jeton, envoi);
    if (!ETATS_EN_FILE.includes(etat)) {
      return this.retirerOuRefuser(envoi, etat);
    }
    return this.mettreEnFile(envoi) ? etat : this.noter(envoi, 'echec');
  }

  reprendre(
    sessionId: string,
    jeton: string,
    renvoyer: Envoyeur = neRenvoiePas,
  ): Promise<ReadonlyMap<string, EtatEnvoiLibre>> {
    const passe = (this.reprises.get(sessionId) ?? Promise.resolve()).then(() =>
      this.repasserLaFile(sessionId, jeton, renvoyer),
    );
    this.reprises.set(
      sessionId,
      passe.catch(() => undefined),
    );
    return passe;
  }

  private retirerOuRefuser(envoi: ReponseLibreEnFile, etat: EtatEnvoiLibre): EtatEnvoiLibre {
    try {
      retirerLaReponseLibre(envoi);
    } catch {
      this.refuser();
    }
    return etat;
  }

  private async repasserLaFile(
    sessionId: string,
    jeton: string,
    renvoyer: Envoyeur,
  ): Promise<ReadonlyMap<string, EtatEnvoiLibre>> {
    const etats = new Map<string, EtatEnvoiLibre>();
    const studentKey = readIdentity()?.studentKey;
    if (studentKey === undefined) {
      return etats;
    }
    try {
      await flush(async (envoi) => {
        if (envoi.sessionId !== sessionId) {
          return false;
        }
        if (envoi.nature !== 'libre') {
          return renvoyer(envoi);
        }
        const etat = await this.transmettre(jeton, envoi);
        etats.set(cleLogiqueDe(envoi), etat);
        return !ETATS_EN_FILE.includes(etat);
      }, studentKey);
    } catch {
      this.refuser();
    }
    return etats;
  }

  private async transmettre(jeton: string, envoi: ReponseLibreEnFile): Promise<EtatEnvoiLibre> {
    const etat = this.noter(envoi, await this.issueDeLEnvoi(jeton, envoi));
    if (etat === 'enregistre') {
      this.reussites.next();
    }
    return etat;
  }

  private async issueDeLEnvoi(jeton: string, envoi: ReponseLibreEnFile): Promise<EtatEnvoiLibre> {
    if (this.port === null) {
      return 'echec';
    }
    try {
      await firstValueFrom(
        this.port.enregistrerReponseLibre(envoi.sessionId, jeton, {
          screenId: envoi.screenId ?? '',
          activityId: envoi.questionId,
          response: texteDe(envoi),
          dureeMs: envoi.dureeMs,
        }),
      );
    } catch (erreur) {
      return this.etatApresLeRefus(erreur);
    }
    return 'enregistre';
  }

  private etatApresLeRefus(erreur: unknown): EtatEnvoiLibre {
    const motif = erreur instanceof ReponseLibreRefusee ? erreur.motif : 'reseau';
    if (motif !== 'reseau' && motif !== 'ecran-non-servi') {
      return ETAT_APRES_REFUS[motif];
    }
    const limite = limiteDuRefus(erreur);
    if (limite !== null) {
      this.limites.next(limite);
      return 'attente_limite';
    }
    return motif === 'reseau' ? 'attente_reseau' : 'ecran_non_servi';
  }
}
