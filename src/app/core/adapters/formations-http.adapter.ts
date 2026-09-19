import { HttpErrorResponse, HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import type { CoursContent, DerouleCours } from '../../../cours/content/types';
import type {
  CommandePilotage,
  AnnotationFormateur,
  FormationsPort,
  GroupeFormation,
  IncidentEtudiant,
  InscriptionParticipant,
  MotifRefusGroupe,
  MotifRefusRattachement,
  MotifRefusReponse,
  MotifRefusReponseLibre,
  ParticipantDeSeance,
  QuestionsDues,
  RapportSeance,
  Rattachement,
  ReponseEtudiant,
  ReponseLibreEnregistree,
  ReponseLibreEtudiant,
  ReponseLibreFormateur,
  SeanceOuverte,
  VerdictReponse,
} from '../ports/formations.port';
import {
  GroupeRefuse,
  RattachementRefuse,
  ReponseLibreRefusee,
  ReponseRefusee,
  SujetRefuse,
} from '../ports/formations.port';
import { getApiBaseUrl } from '../http/api-config';
import { ENTETE_JETON_PARTICIPANT } from '../http/jeton-participant';

const MOTIFS_DE_CONFLIT_PAR_CODE: Readonly<Record<string, MotifRefusReponse>> = {
  REPONSE_DEJA_ENREGISTREE: 'deja-repondue',
  SEANCE_NON_DEMARREE: 'seance-non-demarree',
};

const MOTIFS_DE_CONFLIT_DE_REPONSE_LIBRE: Readonly<Record<string, MotifRefusReponseLibre>> = {
  SEANCE_NON_DEMARREE: 'seance-non-demarree',
  SEANCE_TERMINEE: 'seance-terminee',
};

const MOTIFS_DE_REFUS_DE_GROUPE: Readonly<Record<number, MotifRefusGroupe>> = {
  404: 'introuvable',
  409: 'nom-deja-pris',
};

const MOTIFS_PAR_STATUT: Readonly<Record<number, MotifRefusRattachement>> = {
  404: 'code-inconnu',
  409: 'deja-inscrit',
};

interface VerdictBrut {
  correcte: boolean;
  misconception?: string | null;
  libelleConfusion?: string | null;
}

function refuserRattachement(erreur: unknown): RattachementRefuse {
  const statut = erreur instanceof HttpErrorResponse ? erreur.status : 0;
  return new RattachementRefuse(MOTIFS_PAR_STATUT[statut] ?? 'rattachement-impossible', statut);
}

function refuserSujet(erreur: unknown): SujetRefuse {
  const statut = erreur instanceof HttpErrorResponse ? erreur.status : 0;
  return new SujetRefuse(statut === 409 ? 'cours-modifie' : 'sujet-indisponible', statut);
}

function codeDuProbleme(erreur: HttpErrorResponse): string | null {
  const corps: unknown = erreur.error;
  if (typeof corps !== 'object' || corps === null) {
    return null;
  }
  const code = (corps as Record<string, unknown>)['code'];
  return typeof code === 'string' ? code : null;
}

function motifDeRefusSelonConflit<M extends string>(
  erreur: HttpErrorResponse,
  conflits: Readonly<Record<string, M>>,
): M | 'reseau' | 'refusee' {
  const statut = erreur.status;
  const code = codeDuProbleme(erreur) ?? '';
  let motif: M | 'reseau' | 'refusee' = 'refusee';
  if (statut === 0 || statut === 429 || statut >= 500) {
    motif = 'reseau';
  } else if (statut === 409 && Object.hasOwn(conflits, code)) {
    motif = conflits[code];
  }
  return motif;
}

function refuserReponse(erreur: unknown): ReponseRefusee {
  if (!(erreur instanceof HttpErrorResponse)) {
    return new ReponseRefusee('reseau', 0);
  }
  return new ReponseRefusee(
    motifDeRefusSelonConflit(erreur, MOTIFS_DE_CONFLIT_PAR_CODE),
    erreur.status,
  );
}

function refuserReponseLibre(erreur: unknown): ReponseLibreRefusee {
  if (!(erreur instanceof HttpErrorResponse)) {
    return new ReponseLibreRefusee('reseau', 0);
  }
  return new ReponseLibreRefusee(
    motifDeRefusSelonConflit(erreur, MOTIFS_DE_CONFLIT_DE_REPONSE_LIBRE),
    erreur.status,
  );
}

function refuserCommandeDeGroupe(erreur: unknown): GroupeRefuse {
  const statut = erreur instanceof HttpErrorResponse ? erreur.status : 0;
  return new GroupeRefuse(MOTIFS_DE_REFUS_DE_GROUPE[statut] ?? 'echec', statut);
}

function commandeDeGroupe<T>(requete: Observable<T>): Observable<T> {
  return requete.pipe(
    catchError((erreur: unknown) => throwError(() => refuserCommandeDeGroupe(erreur))),
  );
}

@Injectable()
export class FormationsHttpAdapter implements FormationsPort {
  private readonly baseUrl = `${getApiBaseUrl()}/formations`;

  constructor(private readonly http: HttpClient) {}

  ouvrirSeance(courseSlug: string): Observable<SeanceOuverte> {
    return this.http.post<SeanceOuverte>(`${this.baseUrl}/sessions`, { courseSlug });
  }

  lireDeroule(sessionId: string): Observable<DerouleCours> {
    return this.http.get<DerouleCours>(`${this.urlSeance(sessionId)}/deroule`);
  }

  lireSujet(sessionId: string, jeton: string): Observable<CoursContent> {
    return this.http
      .get<CoursContent>(`${this.urlSeance(sessionId)}/sujet`, { headers: entetes(jeton) })
      .pipe(catchError((erreur: unknown) => throwError(() => refuserSujet(erreur))));
  }

  demarrer(sessionId: string): Observable<void> {
    return this.http.post<void>(`${this.urlSeance(sessionId)}/start`, {});
  }

  piloter(sessionId: string, commande: CommandePilotage): Observable<void> {
    return this.http.patch<void>(`${this.urlSeance(sessionId)}/control`, commande);
  }

  cloturer(sessionId: string): Observable<void> {
    return this.http.post<void>(`${this.urlSeance(sessionId)}/close`, {});
  }

  lireResultats(sessionId: string): Observable<RapportSeance> {
    return this.http.get<RapportSeance>(`${this.urlSeance(sessionId)}/results`);
  }

  exporterBilan(sessionId: string): Observable<RapportSeance> {
    return this.http.get<RapportSeance>(`${this.urlSeance(sessionId)}/report`);
  }

  lireAnnotations(sessionId: string): Observable<{ annotations: readonly AnnotationFormateur[] }> {
    return this.http.get<{ annotations: readonly AnnotationFormateur[] }>(
      `${this.urlSeance(sessionId)}/annotations`,
    );
  }

  enregistrerAnnotation(
    sessionId: string,
    annotation: Pick<AnnotationFormateur, 'screenId' | 'groupName' | 'note'>,
  ): Observable<AnnotationFormateur> {
    return this.http.post<AnnotationFormateur>(
      `${this.urlSeance(sessionId)}/annotations`,
      annotation,
    );
  }

  lireReponsesLibres(
    sessionId: string,
  ): Observable<{ responses: readonly ReponseLibreFormateur[] }> {
    return this.http.get<{ responses: readonly ReponseLibreFormateur[] }>(
      `${this.urlSeance(sessionId)}/free-responses`,
    );
  }

  lireGroupes(sessionId: string): Observable<{ groups: readonly GroupeFormation[] }> {
    return this.http.get<{ groups: readonly GroupeFormation[] }>(
      `${this.urlSeance(sessionId)}/groups`,
    );
  }

  creerGroupe(sessionId: string, name: string): Observable<GroupeFormation> {
    return commandeDeGroupe(
      this.http.post<GroupeFormation>(`${this.urlSeance(sessionId)}/groups`, { name }),
    );
  }

  renommerGroupe(sessionId: string, groupId: string, name: string): Observable<GroupeFormation> {
    return commandeDeGroupe(
      this.http.patch<GroupeFormation>(
        `${this.urlSeance(sessionId)}/groups/${encodeURIComponent(groupId)}`,
        { name },
      ),
    );
  }

  affecterParticipant(sessionId: string, participantId: string, groupId: string): Observable<void> {
    return commandeDeGroupe(
      this.http.patch<void>(this.urlGroupeDuParticipant(sessionId, participantId), { groupId }),
    );
  }

  retirerParticipantDuGroupe(sessionId: string, participantId: string): Observable<void> {
    return commandeDeGroupe(
      this.http.delete<void>(this.urlGroupeDuParticipant(sessionId, participantId)),
    );
  }

  lireParticipants(
    sessionId: string,
  ): Observable<{ participants: readonly ParticipantDeSeance[] }> {
    return this.http.get<{ participants: readonly ParticipantDeSeance[] }>(
      `${this.urlSeance(sessionId)}/participants`,
    );
  }

  rejoindre(code: string, inscription: InscriptionParticipant): Observable<Rattachement> {
    const url = `${this.baseUrl}/sessions/${encodeURIComponent(code)}/join`;
    return this.http.post<Rattachement>(url, inscription).pipe(
      map(({ participantId, sessionId, ecranCourant, modeRythme, jeton }) => ({
        participantId,
        sessionId,
        ecranCourant,
        modeRythme,
        jeton,
      })),
      catchError((erreur: unknown) => throwError(() => refuserRattachement(erreur))),
    );
  }

  repondre(sessionId: string, jeton: string, reponse: ReponseEtudiant): Observable<VerdictReponse> {
    return this.http
      .post<VerdictBrut>(`${this.urlSeance(sessionId)}/answers`, reponse, {
        headers: entetes(jeton),
      })
      .pipe(
        map(({ correcte, libelleConfusion }) => ({
          reussite: correcte,
          libelleConfusion: libelleConfusion ?? null,
        })),
        catchError((erreur: unknown) => throwError(() => refuserReponse(erreur))),
      );
  }

  enregistrerReponseLibre(
    sessionId: string,
    jeton: string,
    reponse: ReponseLibreEtudiant,
  ): Observable<ReponseLibreEnregistree> {
    return this.http
      .post<ReponseLibreEnregistree>(`${this.urlSeance(sessionId)}/free-responses`, reponse, {
        headers: entetes(jeton),
      })
      .pipe(catchError((erreur: unknown) => throwError(() => refuserReponseLibre(erreur))));
  }

  signalerIncidents(
    sessionId: string,
    jeton: string,
    incidents: readonly IncidentEtudiant[],
  ): Observable<void> {
    return this.http.post<void>(
      `${this.urlSeance(sessionId)}/incidents`,
      { incidents },
      { headers: entetes(jeton) },
    );
  }

  lireQuestionsDues(sessionId: string, jeton: string): Observable<QuestionsDues> {
    return this.http.get<QuestionsDues>(`${this.urlSeance(sessionId)}/due-questions`, {
      headers: entetes(jeton),
    });
  }

  private urlSeance(sessionId: string): string {
    return `${this.baseUrl}/sessions/${encodeURIComponent(sessionId)}`;
  }

  private urlGroupeDuParticipant(sessionId: string, participantId: string): string {
    return `${this.urlSeance(sessionId)}/participants/${encodeURIComponent(participantId)}/group`;
  }
}

function entetes(jeton: string): HttpHeaders {
  return new HttpHeaders({ [ENTETE_JETON_PARTICIPANT]: jeton });
}
