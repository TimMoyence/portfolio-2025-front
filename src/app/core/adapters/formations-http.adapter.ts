import type { HttpResponse } from '@angular/common/http';
import { HttpErrorResponse, HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { from, throwError } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import type {
  CoursContent,
  DerouleCours,
  EtatParticipant,
  EtatPulse,
} from '../../../cours/content/types';
import type {
  CommandePilotage,
  AnnotationFormateur,
  FichierTelecharge,
  FormationsPort,
  IncidentEtudiant,
  InscriptionParticipant,
  LivretDuCours,
  MotifRefusRattachement,
  MotifRefusReponse,
  MotifRefusReponseLibre,
  ParticipantDeSeance,
  ProductionEtudiante,
  RappelsDus,
  RapportSeance,
  Rattachement,
  ReponseEtudiant,
  ReponseLibreEnregistree,
  ReponseLibreEtudiant,
  ReponseLibreFormateur,
  SeanceOuverte,
  StrategiesDuDefi,
  SyntheseConcept,
  TentativeDefi,
  TentativeEnigme,
  VerdictProduction,
  VerdictReponse,
  VerdictTentative,
} from '../ports/formations.port';
import {
  PieceJointeRefusee,
  RattachementRefuse,
  ReponseLibreRefusee,
  ReponseRefusee,
  SujetRefuse,
} from '../ports/formations.port';
import { getApiFormationsUrl } from '../http/api-config';
import { derouleDuFil, livretDuFil, sujetDuFil } from './formations-fil';
import {
  annotationServie,
  annotationsServies,
  derouleServi,
  etatParticipantServi,
  livretServi,
  luPar,
  participantsServis,
  rappelsServis,
  rapportServi,
  rattachementServi,
  reponseLibreEnregistreeServie,
  reponsesLibresServies,
  seanceOuverteServie,
  strategiesServies,
  sujetServi,
  syntheseServie,
  verdictProductionServi,
  verdictReponseServi,
  verdictTentativeServi,
} from './formations-schemas';
import { ENTETE_JETON_PARTICIPANT } from '../../../cours/runtime/core/jeton-participant';
import { estObjet, jsonOuNull } from '../../../cours/runtime/core/valeurs';

const MOTIFS_DE_REFUS_DE_REPONSE_LIBRE: Readonly<Record<string, MotifRefusReponseLibre>> = {
  SEANCE_NON_DEMARREE: 'seance-non-demarree',
  SEANCE_TERMINEE: 'seance-terminee',
  ECRAN_NON_SERVI: 'ecran-non-servi',
};

const MOTIFS_DE_RATTACHEMENT_PAR_CODE: Readonly<Record<string, MotifRefusRattachement>> = {
  SEANCE_COMPLETE: 'seance-complete',
  SEANCE_TERMINEE: 'seance-terminee',
  PLACE_DEJA_PRISE: 'place-deja-prise',
  PARTICIPANT_EVINCE: 'participant-evince',
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
  REPRISES_EPUISEES: 'reprises-epuisees',
  PRODUCTION_VIDE: 'production-vide',
};

const POSTE_ABSENT_DE_LA_SEANCE: MotifRefusReponse = 'evince';

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
  return codeDuCorps(erreur.error);
}

function codeDuCorps(corps: unknown): string | null {
  const code = estObjet(corps) ? corps['code'] : undefined;
  return typeof code === 'string' ? code : null;
}

async function corpsDuFichierRefuse(corps: unknown): Promise<unknown> {
  return corps instanceof Blob && corps.type.includes('json')
    ? jsonOuNull(await corps.text())
    : corps;
}

async function refuserPieceJointe(erreur: unknown): Promise<PieceJointeRefusee> {
  if (!(erreur instanceof HttpErrorResponse)) {
    return new PieceJointeRefusee('indisponible', 0);
  }
  const code = codeDuCorps(await corpsDuFichierRefuse(erreur.error));
  return new PieceJointeRefusee(
    code === 'PIECE_JOINTE_RETENUE' ? 'retenue' : 'indisponible',
    erreur.status,
  );
}

function motifDeRefusSelonCode<M extends string>(
  erreur: HttpErrorResponse,
  motifsParCode: Readonly<Record<string, M>>,
  absenceSansCode?: M,
): M | 'reseau' | 'refusee' {
  const statut = erreur.status;
  const code = codeDuProbleme(erreur);
  let motif: M | 'reseau' | 'refusee' = 'refusee';
  if (statut === 0 || statut === 429 || statut >= 500) {
    motif = 'reseau';
  } else if (code !== null && Object.hasOwn(motifsParCode, code)) {
    motif = motifsParCode[code];
  } else if (code === null && statut === 404 && absenceSansCode !== undefined) {
    motif = absenceSansCode;
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
  return new ReponseRefusee(
    motifDeRefusSelonCode(erreur, MOTIFS_D_ECRITURE_PAR_CODE, absence),
    erreur.status,
  );
}

function ecritureEtudiante<T>(
  requete: Observable<T>,
  absence: MotifRefusReponse = POSTE_ABSENT_DE_LA_SEANCE,
): Observable<T> {
  return requete.pipe(
    catchError((erreur: unknown) => throwError(() => refuserEcritureEtudiante(erreur, absence))),
  );
}

@Injectable()
export class FormationsHttpAdapter implements FormationsPort {
  private readonly baseUrl = getApiFormationsUrl();

  constructor(private readonly http: HttpClient) {}

  ouvrirSeance(courseSlug: string, options?: { capacite?: number }): Observable<SeanceOuverte> {
    return this.http
      .post<unknown>(`${this.baseUrl}/sessions`, { courseSlug, ...options })
      .pipe(luPar(seanceOuverteServie));
  }

  lireDeroule(sessionId: string): Observable<DerouleCours> {
    return this.http
      .get<unknown>(`${this.urlSeance(sessionId)}/deroule`)
      .pipe(luPar(derouleServi), map(derouleDuFil));
  }

  telechargerPieceJointeDuDeroule(
    sessionId: string,
    ecranId: string,
  ): Observable<FichierTelecharge> {
    return this.telecharger(
      `${this.urlSeance(sessionId)}/deroule/pieces-jointes/${encodeURIComponent(ecranId)}`,
    );
  }

  telechargerPieceJointe(
    sessionId: string,
    jeton: string,
    ecranId: string,
  ): Observable<FichierTelecharge> {
    return this.telecharger(
      `${this.urlSeance(sessionId)}/pieces-jointes/${encodeURIComponent(ecranId)}`,
      entetes(jeton),
    );
  }

  lireLivret(courseSlug: string): Observable<LivretDuCours> {
    return this.http
      .get<unknown>(`${this.baseUrl}/livrets/${encodeURIComponent(courseSlug)}`)
      .pipe(luPar(livretServi), map(livretDuFil));
  }

  lireSujet(sessionId: string, jeton: string): Observable<CoursContent> {
    return this.http
      .get<unknown>(`${this.urlSeance(sessionId)}/sujet`, { headers: entetes(jeton) })
      .pipe(
        luPar(sujetServi),
        map(sujetDuFil),
        catchError((erreur: unknown) => throwError(() => refuserSujet(erreur))),
      );
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
    return this.http.get<unknown>(`${this.urlSeance(sessionId)}/results`).pipe(luPar(rapportServi));
  }

  exporterBilan(sessionId: string): Observable<RapportSeance> {
    return this.http.get<unknown>(`${this.urlSeance(sessionId)}/report`).pipe(luPar(rapportServi));
  }

  telechargerRapportCsv(sessionId: string): Observable<FichierTelecharge> {
    return this.telecharger(`${this.urlSeance(sessionId)}/report.csv`);
  }

  lireAnnotations(sessionId: string): Observable<{ annotations: readonly AnnotationFormateur[] }> {
    return this.http
      .get<unknown>(`${this.urlSeance(sessionId)}/annotations`)
      .pipe(luPar(annotationsServies));
  }

  enregistrerAnnotation(
    sessionId: string,
    annotation: Pick<AnnotationFormateur, 'screenId' | 'note'>,
  ): Observable<AnnotationFormateur> {
    return this.http
      .post<unknown>(`${this.urlSeance(sessionId)}/annotations`, annotation)
      .pipe(luPar(annotationServie));
  }

  lireReponsesLibres(
    sessionId: string,
  ): Observable<{ responses: readonly ReponseLibreFormateur[] }> {
    return this.http
      .get<unknown>(`${this.urlSeance(sessionId)}/free-responses`)
      .pipe(luPar(reponsesLibresServies));
  }

  lireParticipants(
    sessionId: string,
  ): Observable<{ participants: readonly ParticipantDeSeance[] }> {
    return this.http
      .get<unknown>(`${this.urlSeance(sessionId)}/participants`)
      .pipe(luPar(participantsServis));
  }

  rejoindre(code: string, inscription: InscriptionParticipant): Observable<Rattachement> {
    const url = `${this.baseUrl}/sessions/${encodeURIComponent(code)}/join`;
    return this.http.post<unknown>(url, inscription).pipe(
      luPar(rattachementServi),
      catchError((erreur: unknown) => throwError(() => refuserRattachement(erreur))),
    );
  }

  repondre(sessionId: string, jeton: string, reponse: ReponseEtudiant): Observable<VerdictReponse> {
    return ecritureEtudiante(
      this.http.post<unknown>(`${this.urlSeance(sessionId)}/answers`, reponse, {
        headers: entetes(jeton),
      }),
    ).pipe(
      luPar(verdictReponseServi),
      map(({ correcte, libelleConfusion }) => ({ reussite: correcte, libelleConfusion })),
    );
  }

  enregistrerReponseLibre(
    sessionId: string,
    jeton: string,
    reponse: ReponseLibreEtudiant,
  ): Observable<ReponseLibreEnregistree> {
    return this.http
      .post<unknown>(`${this.urlSeance(sessionId)}/free-responses`, reponse, {
        headers: entetes(jeton),
      })
      .pipe(
        catchError((erreur: unknown) => throwError(() => refuserReponseLibre(erreur))),
        luPar(reponseLibreEnregistreeServie),
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

  envoyerProduction(
    sessionId: string,
    jeton: string,
    production: ProductionEtudiante,
  ): Observable<VerdictProduction> {
    return ecritureEtudiante(
      this.http.post<unknown>(`${this.urlSeance(sessionId)}/productions`, production, {
        headers: entetes(jeton),
      }),
    ).pipe(luPar(verdictProductionServi));
  }

  tenterEnigme(
    sessionId: string,
    jeton: string,
    parcoursId: string,
    tentative: TentativeEnigme,
  ): Observable<VerdictTentative> {
    const url = `${this.urlSeance(sessionId)}/escape/${encodeURIComponent(parcoursId)}/tentatives`;
    return ecritureEtudiante(
      this.http.post<unknown>(url, tentative, { headers: entetes(jeton) }),
      'refusee',
    ).pipe(luPar(verdictTentativeServi));
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

  lireRappels(sessionId: string, jeton: string): Observable<RappelsDus> {
    return ecritureEtudiante(
      this.http.get<unknown>(`${this.urlSeance(sessionId)}/rappels`, {
        headers: entetes(jeton),
      }),
    ).pipe(luPar(rappelsServis));
  }

  envoyerDefi(
    sessionId: string,
    jeton: string,
    defiId: string,
    tentative: TentativeDefi,
  ): Observable<StrategiesDuDefi> {
    return ecritureEtudiante(
      this.http.post<unknown>(`${this.urlDuDefi(sessionId, defiId)}/tentative`, tentative, {
        headers: entetes(jeton),
      }),
    ).pipe(luPar(strategiesServies));
  }

  lireStrategies(sessionId: string, jeton: string, defiId: string): Observable<StrategiesDuDefi> {
    return this.http
      .get<unknown>(`${this.urlDuDefi(sessionId, defiId)}/strategies`, {
        headers: entetes(jeton),
      })
      .pipe(luPar(strategiesServies));
  }

  lireMonEtat(sessionId: string, jeton: string): Observable<EtatParticipant> {
    return this.http
      .get<unknown>(`${this.urlSeance(sessionId)}/moi`, { headers: entetes(jeton) })
      .pipe(luPar(etatParticipantServi));
  }

  lireSyntheseRappels(sessionId: string): Observable<{ concepts: readonly SyntheseConcept[] }> {
    return this.http
      .get<unknown>(`${this.urlSeance(sessionId)}/rappels/synthese`)
      .pipe(luPar(syntheseServie));
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

  libererPoste(sessionId: string, participantId: string): Observable<void> {
    return this.http.post<void>(
      `${this.urlDuParticipant(sessionId, participantId)}/liberation`,
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

  private telecharger(url: string, headers?: HttpHeaders): Observable<FichierTelecharge> {
    return this.http.get(url, { headers, observe: 'response', responseType: 'blob' }).pipe(
      catchError((erreur: unknown) =>
        from(refuserPieceJointe(erreur)).pipe(mergeMap((refus) => throwError(() => refus))),
      ),
      map(fichierTelecharge),
    );
  }
}

const NOM_DU_FICHIER_SERVI = /filename="([^"]+)"/;

function fichierTelecharge(reponse: HttpResponse<Blob>): FichierTelecharge {
  const nom = NOM_DU_FICHIER_SERVI.exec(reponse.headers.get('Content-Disposition') ?? '')?.[1];
  if (nom === undefined || reponse.body === null) {
    throw new Error(`Pièce jointe servie sans nom de fichier : ${reponse.url ?? ''}`);
  }
  return { nom, contenu: reponse.body };
}

function entetes(jeton: string): HttpHeaders {
  return new HttpHeaders({ [ENTETE_JETON_PARTICIPANT]: jeton });
}
