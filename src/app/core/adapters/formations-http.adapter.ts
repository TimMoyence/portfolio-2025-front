import type { HttpResponse } from '@angular/common/http';
import { HttpErrorResponse, HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type { MonoTypeOperatorFunction, Observable } from 'rxjs';
import { from, throwError } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import type {
  CoursContent,
  DerouleCours,
  EtatParticipant,
  EtatPulse,
  FeuilleEvaluee,
  SortiesMachine,
  TableauEvalue,
} from '../../../cours/content/types';
import type {
  CommandePilotage,
  AnnotationFormateur,
  DemandeDeFeuille,
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
  SaisieDeTableau,
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
import { STATUT_LIMITE_DE_DEBIT } from '../../../cours/runtime/core/statuts-http';
import { limiteDeLaReponse } from '../http/limite-de-debit';
import { derouleDuFil, livretDuFil, sujetDuFil } from './formations-fil';
import {
  zDerouleResponseDto as derouleServi,
  zEtatParticipantResponseDto as etatParticipantServi,
  zFeuilleEvalueeResponseDto as feuilleEvalueeServie,
  zFreeResponseSavedResponseDto as reponseLibreEnregistreeServie,
  zFreeResponsesResponseDto as reponsesLibresServies,
  zJoinSessionResponseDto as rattachementServi,
  zLivretResponseDto as livretServi,
  zMachineEvalueeResponseDto as machineEvalueeServie,
  zOpenSessionResponseDto as seanceOuverteServie,
  zRappelsResponseDto as rappelsServis,
  zSessionParticipantsResponseDto as participantsServis,
  zSessionResultsResponseDto as rapportServi,
  zStrategiesDefiResponseDto as strategiesServies,
  zSubmitAnswerResponseDto as verdictReponseServi,
  zSubmitProductionResponseDto as verdictProductionServi,
  zSujetResponseDto as sujetServi,
  zSyntheseRappelsResponseDto as syntheseServie,
  zTableauEvalueResponseDto as tableauEvalueServi,
  zTeacherAnnotationResponseDto as annotationServie,
  zTeacherAnnotationsResponseDto as annotationsServies,
  zTentativeEnigmeResponseDto as verdictTentativeServi,
} from '../../../../contrat/zod.gen';
import { luPar } from './lu-par';
import type { Reglages } from '../../../cours/runtime/blocks/animation';
import { ENTETE_JETON_PARTICIPANT } from '../../../cours/runtime/core/jeton-participant';
import { urlDeLaSeance } from '../../../cours/runtime/core/adresse-de-seance';
import { chaineDe, jsonOuNull } from '../../../cours/runtime/core/valeurs';

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
  SAISIE_NON_NUMERIQUE: 'saisie-non-numerique',
};

const POSTE_ABSENT_DE_LA_SEANCE: MotifRefusReponse = 'evince';

function selonLaReponse<R>(
  erreur: unknown,
  horsReponse: () => R,
  refuser: (reponse: HttpErrorResponse) => R,
): R {
  return erreur instanceof HttpErrorResponse ? refuser(erreur) : horsReponse();
}

function refusRelance<T>(refuser: (erreur: unknown) => Error): MonoTypeOperatorFunction<T> {
  return catchError((erreur: unknown) => throwError(() => refuser(erreur)));
}

function refuserRattachement(erreur: unknown): RattachementRefuse {
  return selonLaReponse(
    erreur,
    () => new RattachementRefuse('rattachement-impossible', 0),
    (reponse) => {
      const limite = limiteDeLaReponse(reponse);
      if (limite !== null) {
        return new RattachementRefuse('rattachement-impossible', reponse.status, limite);
      }
      const code = codeDuProbleme(reponse);
      if (code !== null && Object.hasOwn(MOTIFS_DE_RATTACHEMENT_PAR_CODE, code)) {
        return new RattachementRefuse(MOTIFS_DE_RATTACHEMENT_PAR_CODE[code], reponse.status);
      }
      return new RattachementRefuse(
        reponse.status === 404 ? 'code-inconnu' : 'rattachement-impossible',
        reponse.status,
      );
    },
  );
}

function refuserSujet(erreur: unknown): SujetRefuse {
  return selonLaReponse(
    erreur,
    () => new SujetRefuse('sujet-indisponible', 0),
    (reponse) => {
      const limite = limiteDeLaReponse(reponse);
      if (limite !== null) {
        return new SujetRefuse('sujet-indisponible', reponse.status, limite);
      }
      return new SujetRefuse(
        reponse.status === 409 ? 'cours-modifie' : 'sujet-indisponible',
        reponse.status,
      );
    },
  );
}

function codeDuProbleme(erreur: HttpErrorResponse): string | null {
  return chaineDe(erreur.error, 'code');
}

async function corpsDuFichierRefuse(corps: unknown): Promise<unknown> {
  return corps instanceof Blob && corps.type.includes('json')
    ? jsonOuNull(await corps.text())
    : corps;
}

function refuserPieceJointe(erreur: unknown): Promise<PieceJointeRefusee> {
  return selonLaReponse(
    erreur,
    async () => new PieceJointeRefusee('indisponible', 0),
    async (reponse) => {
      const limite = limiteDeLaReponse(reponse);
      if (limite !== null) {
        return new PieceJointeRefusee('indisponible', reponse.status, limite);
      }
      const code = chaineDe(await corpsDuFichierRefuse(reponse.error), 'code');
      return new PieceJointeRefusee(
        code === 'PIECE_JOINTE_RETENUE' ? 'retenue' : 'indisponible',
        reponse.status,
      );
    },
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
  if (statut === 0 || statut === STATUT_LIMITE_DE_DEBIT || statut >= 500) {
    motif = 'reseau';
  } else if (code !== null && Object.hasOwn(motifsParCode, code)) {
    motif = motifsParCode[code];
  } else if (code === null && statut === 404 && absenceSansCode !== undefined) {
    motif = absenceSansCode;
  }
  return motif;
}

function refuserReponseLibre(erreur: unknown): ReponseLibreRefusee {
  return selonLaReponse(
    erreur,
    () => new ReponseLibreRefusee('reseau', 0),
    (reponse) =>
      new ReponseLibreRefusee(
        motifDeRefusSelonCode(reponse, MOTIFS_DE_REFUS_DE_REPONSE_LIBRE),
        reponse.status,
        limiteDeLaReponse(reponse),
      ),
  );
}

function refuserEcritureEtudiante(erreur: unknown, absence: MotifRefusReponse): ReponseRefusee {
  return selonLaReponse(
    erreur,
    () => new ReponseRefusee('reseau', 0),
    (reponse) =>
      new ReponseRefusee(
        motifDeRefusSelonCode(reponse, MOTIFS_D_ECRITURE_PAR_CODE, absence),
        reponse.status,
        limiteDeLaReponse(reponse),
      ),
  );
}

function ecritureEtudiante<T>(
  requete: Observable<T>,
  absence: MotifRefusReponse = POSTE_ABSENT_DE_LA_SEANCE,
): Observable<T> {
  return requete.pipe(refusRelance((erreur) => refuserEcritureEtudiante(erreur, absence)));
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
      .pipe(luPar(sujetServi), map(sujetDuFil), refusRelance(refuserSujet));
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
    return this.http
      .post<unknown>(`${urlDeLaSeance(this.baseUrl, code)}/join`, inscription)
      .pipe(luPar(rattachementServi), refusRelance(refuserRattachement));
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
      .pipe(refusRelance(refuserReponseLibre), luPar(reponseLibreEnregistreeServie));
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

  evaluerMachine(
    sessionId: string,
    jeton: string,
    ecranId: string,
    reglages: Reglages,
  ): Observable<SortiesMachine> {
    return this.evaluer(sessionId, jeton, `machines/${encodeURIComponent(ecranId)}`, {
      reglages,
    }).pipe(luPar(machineEvalueeServie));
  }

  evaluerTableau(
    sessionId: string,
    jeton: string,
    planId: string,
    saisies: readonly SaisieDeTableau[],
  ): Observable<TableauEvalue> {
    return this.evaluer(sessionId, jeton, `tableaux/${encodeURIComponent(planId)}`, {
      saisies,
    }).pipe(luPar(tableauEvalueServi));
  }

  evaluerFeuille(
    sessionId: string,
    jeton: string,
    planId: string,
    demande: DemandeDeFeuille,
  ): Observable<FeuilleEvaluee> {
    return this.evaluer(sessionId, jeton, `feuilles/${encodeURIComponent(planId)}`, demande).pipe(
      luPar(feuilleEvalueeServie),
    );
  }

  private evaluer(
    sessionId: string,
    jeton: string,
    cible: string,
    corps: object,
  ): Observable<unknown> {
    return ecritureEtudiante(
      this.http.post<unknown>(`${this.urlSeance(sessionId)}/${cible}/evaluation`, corps, {
        headers: entetes(jeton),
      }),
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
    return urlDeLaSeance(this.baseUrl, sessionId);
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
