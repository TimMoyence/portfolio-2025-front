import { HttpErrorResponse, HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import type {
  CoursContent,
  DerouleCours,
  EtatParticipant,
  EtatPulse,
  ValeurProduction,
} from '../../../cours/content/types';
import type { SpacedQuestionPublique } from '../../../cours/runtime/blocks/donnees-publiques';
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
  RegleNotation,
  ReponseEtudiant,
  ReponseLibreEnregistree,
  ReponseLibreEtudiant,
  ReponseLibreFormateur,
  SeanceOuverte,
  StrategiePublique,
  SyntheseConcept,
  VerdictProduction,
  VerdictReponse,
  VerdictTentative,
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

const MOTIFS_DE_REFUS_DE_REPONSE_LIBRE: Readonly<Record<string, MotifRefusReponseLibre>> = {
  SEANCE_NON_DEMARREE: 'seance-non-demarree',
  SEANCE_TERMINEE: 'seance-terminee',
  ECRAN_NON_SERVI: 'ecran-non-servi',
};

const MOTIFS_DE_REFUS_DE_GROUPE: Readonly<Record<number, MotifRefusGroupe>> = {
  404: 'introuvable',
  409: 'nom-deja-pris',
};

const MOTIFS_DE_RATTACHEMENT_PAR_CODE: Readonly<Record<string, MotifRefusRattachement>> = {
  SEANCE_COMPLETE: 'seance-complete',
  SEANCE_TERMINEE: 'seance-terminee',
};

const MOTIFS_D_ECRITURE_PAR_CODE: Readonly<Record<string, MotifRefusReponse>> = {
  REPONSE_DEJA_ENREGISTREE: 'deja-repondue',
  ENIGME_DEJA_RESOLUE: 'deja-repondue',
  SEANCE_NON_DEMARREE: 'seance-non-demarree',
  SEANCE_TERMINEE: 'seance-terminee',
  ECRAN_NON_SERVI: 'ecran-non-servi',
  PHASE_FERMEE: 'phase-fermee',
  ENIGME_VERROUILLEE: 'enigme-verrouillee',
  TENTATIVES_EPUISEES: 'tentatives-epuisees',
  PRODUCTION_VIDE: 'production-vide',
};

const POSTE_ABSENT_DE_LA_SEANCE: MotifRefusReponse = 'evince';

const NOTATION_ABSENTE_D_UN_SERVEUR_V2: Pick<
  RegleNotation,
  'typesNotables' | 'productionCompteSi' | 'statistiquesSurQuestionsNotees'
> = {
  typesNotables: ['vote', 'numeric', 'classement', 'feuille', 'tableau'],
  productionCompteSi: 'au-moins-une-saisie',
  statistiquesSurQuestionsNotees: true,
};

interface VerdictBrut {
  correcte: boolean;
  misconception?: string | null;
  libelleConfusion?: string | null;
}

function refuserRattachement(erreur: unknown): RattachementRefuse {
  if (!(erreur instanceof HttpErrorResponse)) {
    return new RattachementRefuse('rattachement-impossible', 0);
  }
  const code = codeDuProbleme(erreur);
  if (code !== null && Object.hasOwn(MOTIFS_DE_RATTACHEMENT_PAR_CODE, code)) {
    return new RattachementRefuse(MOTIFS_DE_RATTACHEMENT_PAR_CODE[code], erreur.status);
  }
  return new RattachementRefuse(
    erreur.status === 404 ? 'code-inconnu' : 'rattachement-impossible',
    erreur.status,
  );
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

function motifDeRefusSelonCode<M extends string>(
  erreur: HttpErrorResponse,
  motifsParCode: Readonly<Record<string, M>>,
): M | 'reseau' | 'refusee' {
  const statut = erreur.status;
  const code = codeDuProbleme(erreur) ?? '';
  let motif: M | 'reseau' | 'refusee' = 'refusee';
  if (statut === 0 || statut === 429 || statut >= 500) {
    motif = 'reseau';
  } else if (Object.hasOwn(motifsParCode, code)) {
    motif = motifsParCode[code];
  }
  return motif;
}

function refuserReponseLibre(erreur: unknown): ReponseLibreRefusee {
  if (!(erreur instanceof HttpErrorResponse)) {
    return new ReponseLibreRefusee('reseau', 0);
  }
  return new ReponseLibreRefusee(
    motifDeRefusSelonCode(erreur, MOTIFS_DE_REFUS_DE_REPONSE_LIBRE),
    erreur.status,
  );
}

function refuserEcritureEtudiante(erreur: unknown, absence: MotifRefusReponse): ReponseRefusee {
  if (!(erreur instanceof HttpErrorResponse)) {
    return new ReponseRefusee('reseau', 0);
  }
  const statut = erreur.status;
  if (statut === 0 || statut === 429 || statut >= 500) {
    return new ReponseRefusee('reseau', statut);
  }
  const code = codeDuProbleme(erreur);
  if (code !== null && Object.hasOwn(MOTIFS_D_ECRITURE_PAR_CODE, code)) {
    return new ReponseRefusee(MOTIFS_D_ECRITURE_PAR_CODE[code], statut);
  }
  return new ReponseRefusee(code === null && statut === 404 ? absence : 'refusee', statut);
}

function ecritureEtudiante<T>(
  requete: Observable<T>,
  absence: MotifRefusReponse = POSTE_ABSENT_DE_LA_SEANCE,
): Observable<T> {
  return requete.pipe(
    catchError((erreur: unknown) => throwError(() => refuserEcritureEtudiante(erreur, absence))),
  );
}

function completerNotation(rapport: RapportSeance): RapportSeance {
  return rapport.notation === undefined
    ? rapport
    : { ...rapport, notation: { ...NOTATION_ABSENTE_D_UN_SERVEUR_V2, ...rapport.notation } };
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

  ouvrirSeance(
    courseSlug: string,
    options?: { version?: number; capacite?: number },
  ): Observable<SeanceOuverte> {
    return this.http.post<SeanceOuverte>(`${this.baseUrl}/sessions`, { courseSlug, ...options });
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
    return this.http
      .get<RapportSeance>(`${this.urlSeance(sessionId)}/results`)
      .pipe(map(completerNotation));
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
    return ecritureEtudiante(
      this.http.post<VerdictBrut>(`${this.urlSeance(sessionId)}/answers`, reponse, {
        headers: entetes(jeton),
      }),
    ).pipe(
      map(({ correcte, libelleConfusion }) => ({
        reussite: correcte,
        libelleConfusion: libelleConfusion ?? null,
      })),
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

  envoyerProduction(
    sessionId: string,
    jeton: string,
    production: { questionId: string; valeur: ValeurProduction; dureeMs: number },
  ): Observable<VerdictProduction> {
    return ecritureEtudiante(
      this.http.post<VerdictProduction>(`${this.urlSeance(sessionId)}/productions`, production, {
        headers: entetes(jeton),
      }),
    );
  }

  tenterEnigme(
    sessionId: string,
    jeton: string,
    parcoursId: string,
    tentative: { enigmeId: string; reponse: string; dureeMs: number },
  ): Observable<VerdictTentative> {
    const url = `${this.urlSeance(sessionId)}/escape/${encodeURIComponent(parcoursId)}/tentatives`;
    return ecritureEtudiante(
      this.http.post<VerdictTentative>(url, tentative, { headers: entetes(jeton) }),
      'refusee',
    );
  }

  declarerJalon(
    sessionId: string,
    jeton: string,
    sondageId: string,
    etat: EtatPulse,
  ): Observable<void> {
    const url = `${this.urlSeance(sessionId)}/pulses/${encodeURIComponent(sondageId)}`;
    return ecritureEtudiante(this.http.put<void>(url, { etat }, { headers: entetes(jeton) }));
  }

  lireRappels(
    sessionId: string,
    jeton: string,
  ): Observable<{ questions: readonly SpacedQuestionPublique[] }> {
    return ecritureEtudiante(
      this.http.get<{ questions: readonly SpacedQuestionPublique[] }>(
        `${this.urlSeance(sessionId)}/rappels`,
        { headers: entetes(jeton) },
      ),
    );
  }

  envoyerDefi(
    sessionId: string,
    jeton: string,
    defiId: string,
    tentative: { texte: string; dureeMs: number },
  ): Observable<{ strategies: readonly StrategiePublique[] }> {
    return ecritureEtudiante(
      this.http.post<{ strategies: readonly StrategiePublique[] }>(
        `${this.urlDuDefi(sessionId, defiId)}/tentative`,
        tentative,
        { headers: entetes(jeton) },
      ),
    );
  }

  lireStrategies(
    sessionId: string,
    jeton: string,
    defiId: string,
  ): Observable<{ strategies: readonly StrategiePublique[] }> {
    return this.http.get<{ strategies: readonly StrategiePublique[] }>(
      `${this.urlDuDefi(sessionId, defiId)}/strategies`,
      { headers: entetes(jeton) },
    );
  }

  lireMonEtat(sessionId: string, jeton: string): Observable<EtatParticipant> {
    return this.http.get<EtatParticipant>(`${this.urlSeance(sessionId)}/moi`, {
      headers: entetes(jeton),
    });
  }

  lireSyntheseRappels(sessionId: string): Observable<{ concepts: readonly SyntheseConcept[] }> {
    return this.http.get<{ concepts: readonly SyntheseConcept[] }>(
      `${this.urlSeance(sessionId)}/rappels/synthese`,
    );
  }

  evincerParticipant(sessionId: string, participantId: string): Observable<void> {
    return this.http.delete<void>(this.urlDuParticipant(sessionId, participantId));
  }

  readmettreParticipant(sessionId: string, participantId: string): Observable<void> {
    return this.http.post<void>(
      `${this.urlDuParticipant(sessionId, participantId)}/readmission`,
      {},
    );
  }

  private urlDuParticipant(sessionId: string, participantId: string): string {
    return `${this.urlSeance(sessionId)}/participants/${encodeURIComponent(participantId)}`;
  }

  private urlDuDefi(sessionId: string, defiId: string): string {
    return `${this.urlSeance(sessionId)}/defis/${encodeURIComponent(defiId)}`;
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
