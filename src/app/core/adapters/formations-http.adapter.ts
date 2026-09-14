import { HttpErrorResponse, HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import type { CoursContent, DerouleCours } from '../../../cours/content/types';
import type {
  CommandePilotage,
  FormationsPort,
  IncidentEtudiant,
  InscriptionParticipant,
  MotifRefusRattachement,
  QuestionsDues,
  RapportSeance,
  Rattachement,
  ReponseEtudiant,
  SeanceOuverte,
  VerdictReponse,
} from '../ports/formations.port';
import { RattachementRefuse, SujetRefuse } from '../ports/formations.port';
import { getApiBaseUrl } from '../http/api-config';

const ENTETE_JETON = 'x-participant-token';

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

  rejoindre(code: string, inscription: InscriptionParticipant): Observable<Rattachement> {
    const url = `${this.baseUrl}/sessions/${encodeURIComponent(code)}/join`;
    return this.http
      .post<Rattachement>(url, inscription)
      .pipe(catchError((erreur: unknown) => throwError(() => refuserRattachement(erreur))));
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
      );
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
