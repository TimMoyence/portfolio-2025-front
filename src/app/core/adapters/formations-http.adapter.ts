import { HttpErrorResponse, HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import type {
  CommandePilotage,
  FormationsPort,
  IncidentEtudiant,
  InscriptionParticipant,
  MotifRefusRattachement,
  OuvertureSeance,
  QuestionsDues,
  RapportSeance,
  Rattachement,
  ReponseEtudiant,
  SeanceOuverte,
  VerdictReponse,
} from '../ports/formations.port';
import { RattachementRefuse } from '../ports/formations.port';
import { getApiBaseUrl } from '../http/api-config';

const ENTETE_JETON = 'x-participant-token';

const MOTIFS_PAR_STATUT: Readonly<Record<number, MotifRefusRattachement>> = {
  404: 'code-inconnu',
  409: 'deja-inscrit',
};

function refuserRattachement(erreur: unknown): RattachementRefuse {
  const statut = erreur instanceof HttpErrorResponse ? erreur.status : 0;
  return new RattachementRefuse(MOTIFS_PAR_STATUT[statut] ?? 'rattachement-impossible', statut);
}

@Injectable()
export class FormationsHttpAdapter implements FormationsPort {
  private readonly baseUrl = `${getApiBaseUrl()}/formations`;

  constructor(private readonly http: HttpClient) {}

  ouvrirSeance(demande: OuvertureSeance): Observable<SeanceOuverte> {
    return this.http.post<SeanceOuverte>(`${this.baseUrl}/sessions`, demande);
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

  rejoindre(code: string, inscription: InscriptionParticipant): Observable<Rattachement> {
    const url = `${this.baseUrl}/sessions/${encodeURIComponent(code)}/join`;
    return this.http
      .post<Rattachement>(url, inscription)
      .pipe(catchError((erreur: unknown) => throwError(() => refuserRattachement(erreur))));
  }

  repondre(sessionId: string, jeton: string, reponse: ReponseEtudiant): Observable<VerdictReponse> {
    return this.http
      .post<VerdictReponse>(`${this.urlSeance(sessionId)}/answers`, reponse, {
        headers: entetes(jeton),
      })
      .pipe(map(({ correcte, misconception }) => ({ correcte, misconception })));
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
}

function entetes(jeton: string): HttpHeaders {
  return new HttpHeaders({ [ENTETE_JETON]: jeton });
}
