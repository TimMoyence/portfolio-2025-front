import { z } from 'zod';
import {
  BOITES_DE_REVISION,
  ETATS_PULSE,
  PACING_MODES,
  TYPES_QUESTION,
  type CorrigeEcranPresentateur,
  type CoursCatalogue,
  type EtatParticipant,
} from '../../../cours/content/types';
import {
  comptesJalon,
  entierPositif,
  progressionEnigme,
  resultatServi,
  resumeBareme,
  statistiquesServies,
} from '../../../cours/runtime/core/schemas-communs';
import type {
  AnnotationFormateur,
  ParticipantDeSeance,
  RappelsDus,
  RapportSeance,
  Rattachement,
  RegleNotation,
  ReponseLibreEnregistree,
  ReponseLibreFormateur,
  SeanceOuverte,
  StrategiesDuDefi,
  SyntheseConcept,
  VerdictProduction,
  VerdictTentative,
} from '../ports/formations.port';
import { ecranServi, optionPublique, tableauEvalue } from './donnees-servies';
import type { DerouleDuFil, LivretDuFil, SujetDuFil } from './formations-fil';

export { luPar } from './lu-par';

const tolerance = z
  .object({
    type: z.enum(['relative', 'absolue', 'decimales']),
    valeur: z.number(),
  })
  .strict();

const corrigeEcran: z.ZodType<CorrigeEcranPresentateur> = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal('feuille'),
      attendus: z.array(
        z
          .object({
            reference: z.string(),
            formuleReference: z.string(),
            valeur: z.union([z.number(), z.string(), z.boolean()]),
            affichage: z.string().optional(),
            tolerance,
            forme: z.union([z.literal('references'), z.object({ memeQue: z.string() }).strict()]),
          })
          .strict(),
      ),
    })
    .strict(),
  z
    .object({
      type: z.literal('tableau'),
      attendus: z.array(
        z.object({ rang: z.number(), cle: z.string(), valeur: z.number() }).strict(),
      ),
      tableauCorrige: tableauEvalue.optional(),
      tolerance,
    })
    .strict(),
  z
    .object({
      type: z.literal('classement'),
      attendus: z.array(
        z
          .object({
            carteId: z.string(),
            categorieId: z.string(),
            justification: z.string(),
          })
          .strict(),
      ),
    })
    .strict(),
  z
    .object({
      type: z.literal('enigmes'),
      enigmes: z.array(
        z.object({ enigmeId: z.string(), solution: z.string(), fragment: z.string() }).strict(),
      ),
      codeFinal: z.string(),
    })
    .strict(),
  z
    .object({
      type: z.literal('defi'),
      strategies: z.array(
        z.object({ id: z.string(), libelle: z.string(), fausse: z.boolean() }).strict(),
      ),
    })
    .strict(),
  z
    .object({
      type: z.literal('revelation'),
      titre: z.string(),
      lignes: z.array(z.string()),
    })
    .strict(),
  z
    .object({
      type: z.literal('reflexion'),
      attendu: z.string(),
      suite: z.string(),
    })
    .strict(),
]);

const reflexion = z.object({ attendu: z.string(), suite: z.string().nullable() }).strict();

const explication = z.object({ reference: z.string(), texte: z.string() }).strict();

const correction = z
  .object({
    ecranId: z.string(),
    questions: z.array(
      z
        .object({
          questionId: z.string(),
          bonneReponse: z.string(),
          optionId: z.string().nullable(),
        })
        .strict(),
    ),
    corrige: corrigeEcran.nullable(),
    reflexion: reflexion.nullable(),
    explications: z.array(explication).optional(),
  })
  .strict();

const champsDeLEcranPublic = {
  id: z.string(),
  titre: z.string().nullable(),
  duree: z.number(),
  interactif: z.boolean(),
  renvoi: z.string().optional(),
  cadrageDuRenvoi: z
    .object({
      extrait: z
        .object({
          lignes: z.array(z.number()).optional(),
          champs: z.array(z.string()).optional(),
        })
        .strict()
        .optional(),
    })
    .strict()
    .optional(),
  pieceJointe: z
    .union([
      z.object({ libelle: z.string(), fichier: z.string() }).strict(),
      z.object({ libelle: z.string(), reservee: z.literal(true) }).strict(),
    ])
    .optional(),
  ecranCorrige: z.string().optional(),
  resoluPar: z.array(z.string()).optional(),
};

const champsDeLEcran = { ...champsDeLEcranPublic, correction: correction.optional() };

const champsDuCours = {
  id: z.string(),
  titre: z.string(),
  niveau: z.string(),
  duree: z.number(),
  concepts: z.array(z.string()),
};

export const sujetServi: z.ZodType<SujetDuFil> = z
  .object({ ...champsDuCours, ecrans: z.array(ecranServi(champsDeLEcran)) })
  .strict();

const coursPublic = z
  .object({ ...champsDuCours, ecrans: z.array(ecranServi(champsDeLEcranPublic)) })
  .strict();

export const coursPublicServi: z.ZodType<SujetDuFil> = coursPublic;

export const catalogueServi: z.ZodType<CoursCatalogue> = coursPublic
  .extend({ version: z.number(), publieLe: z.iso.datetime() })
  .strict();

const ecranDuDeroule = ecranServi({
  ...champsDeLEcran,
  notes: z.string(),
  diffusion: z.enum(['catalogue', 'seance']),
  seuil: z.number().nullable(),
  corriges: z.array(
    z
      .object({
        questionId: z.string(),
        bonneReponse: z.string(),
        confusions: z.array(optionPublique),
      })
      .strict(),
  ),
  questions: z.array(
    z
      .object({
        id: z.string(),
        enonce: z.string(),
        options: z.array(optionPublique).nullable(),
      })
      .strict(),
  ),
  corrigeEcran: corrigeEcran.nullable(),
  reflexion: reflexion.nullable().optional(),
  guide: z
    .object({
      aDire: z.string().optional(),
      question: z.string().optional(),
      reponse: z.string().optional(),
      calcul: z.string().optional(),
      relance: z.string().optional(),
      transition: z.string().optional(),
    })
    .strict()
    .optional(),
  explications: z.array(explication).optional(),
});

export const derouleServi: z.ZodType<DerouleDuFil> = z
  .object({
    ...champsDuCours,
    ecrans: z.array(ecranDuDeroule),
    remediations: z.record(z.string(), z.string()),
  })
  .strict();

export const livretServi: z.ZodType<LivretDuFil> = z
  .object({ version: z.number(), sujet: sujetServi, corrige: derouleServi })
  .strict();

const horodatage = z.iso.datetime();

export const seanceOuverteServie: z.ZodType<SeanceOuverte> = z
  .object({ sessionId: z.string(), code: z.string() })
  .strict();

export const rattachementServi: z.ZodType<Rattachement> = z
  .object({
    participantId: z.string(),
    sessionId: z.string(),
    ecranCourant: entierPositif,
    modeRythme: z.enum(PACING_MODES),
    jeton: z.string(),
    secretDeReprise: z.string(),
  })
  .strict();

export const verdictReponseServi = z
  .object({
    correcte: z.boolean().nullable(),
    misconception: z.string().nullable(),
    libelleConfusion: z.string().nullable(),
  })
  .strict();

const detailDeVerdict = z
  .object({ cle: z.string(), juste: z.boolean(), libelleConfusion: z.string().nullable() })
  .strict();

export const verdictProductionServi: z.ZodType<VerdictProduction> = z
  .object({
    correcte: z.boolean(),
    score: z.number(),
    details: z.array(detailDeVerdict),
    libelleConfusion: z.string().nullable(),
  })
  .strict();

const ETATS_D_ENIGME = ['resolue', 'epuisee', 'ouverte', 'verrouillee'] as const;

const etatDesEnigmes = {
  etats: z
    .record(
      z.string(),
      z.object({ etat: z.enum(ETATS_D_ENIGME), tentativesRestantes: entierPositif }).strict(),
    )
    .optional(),
  enigmeOuverte: z.string().nullable().optional(),
  acheve: z.boolean().optional(),
};

export const verdictTentativeServi: z.ZodType<VerdictTentative> = z
  .object({
    correcte: z.boolean(),
    fragment: z.string().nullable(),
    tentativesRestantes: entierPositif,
    ...etatDesEnigmes,
  })
  .strict();

export const strategiesServies: z.ZodType<StrategiesDuDefi> = z
  .object({
    strategies: z.array(
      z.object({ id: z.string(), libelle: z.string(), fausse: z.boolean().optional() }).strict(),
    ),
  })
  .strict();

export const rappelsServis: z.ZodType<RappelsDus> = z
  .object({
    questions: z.array(
      z
        .object({
          questionId: z.string(),
          concept: z.string(),
          boite: z.union(BOITES_DE_REVISION.map((boite) => z.literal(boite))),
          cours: z.string(),
          enonce: z.string(),
          options: z.array(optionPublique),
        })
        .strict(),
    ),
  })
  .strict();

export const syntheseServie: z.ZodType<{ concepts: readonly SyntheseConcept[] }> = z
  .object({
    concepts: z.array(
      z
        .object({
          concept: z.string(),
          libelle: z.string(),
          boite1: entierPositif,
          boite2: entierPositif,
          boite3: entierPositif,
          nonVus: entierPositif,
        })
        .strict(),
    ),
  })
  .strict();

export const annotationServie: z.ZodType<AnnotationFormateur> = z
  .object({
    id: z.string(),
    sessionId: z.string(),
    teacherId: z.string(),
    screenId: z.string(),
    note: z.string(),
    updatedAt: horodatage,
  })
  .strict();

export const annotationsServies: z.ZodType<{ annotations: readonly AnnotationFormateur[] }> = z
  .object({ annotations: z.array(annotationServie) })
  .strict();

export const reponsesLibresServies: z.ZodType<{ responses: readonly ReponseLibreFormateur[] }> = z
  .object({
    responses: z.array(
      z
        .object({
          id: z.string(),
          sessionId: z.string(),
          participantId: z.string(),
          screenId: z.string(),
          activityId: z.string(),
          response: z.string(),
          premiereReponse: z.string().nullable(),
          strategiesServiesLe: horodatage.nullable(),
          dureeMs: z.number(),
          status: z.enum(['enregistre', 'en_attente', 'echec']),
          submittedAt: horodatage,
        })
        .strict(),
    ),
  })
  .strict();

export const reponseLibreEnregistreeServie: z.ZodType<ReponseLibreEnregistree> = z
  .object({ status: z.literal('enregistre') })
  .strict();

export const participantsServis: z.ZodType<{ participants: readonly ParticipantDeSeance[] }> = z
  .object({
    participants: z.array(
      z
        .object({ id: z.string(), prenom: z.string(), nom: z.string(), evince: z.boolean() })
        .strict(),
    ),
  })
  .strict();

const valeurProduction = z.union([
  z.object({ type: z.literal('feuille'), cellules: z.record(z.string(), z.string()) }).strict(),
  z
    .object({
      type: z.literal('tableau'),
      saisies: z.array(
        z.object({ rang: z.number(), cle: z.string(), valeur: z.number() }).strict(),
      ),
    })
    .strict(),
  z
    .object({ type: z.literal('classement'), classement: z.record(z.string(), z.string()) })
    .strict(),
  z
    .object({
      type: z.enum(['feuille', 'tableau', 'classement']),
      neSaitPas: z.literal(true),
    })
    .strict(),
]);

export const etatParticipantServi: z.ZodType<EtatParticipant> = z
  .object({
    sessionId: z.string(),
    participantId: z.string(),
    revision: entierPositif,
    reponses: z.array(
      z
        .object({
          questionId: z.string(),
          valeur: z.union([z.number(), z.string(), valeurProduction]),
          correcte: z.boolean().nullable(),
          score: z.number().nullable(),
          details: z.array(detailDeVerdict).nullable(),
          libelleConfusion: z.string().nullable(),
        })
        .strict(),
    ),
    reponsesLibres: z.array(z.object({ activityId: z.string(), response: z.string() }).strict()),
    jalons: z.array(z.object({ sondageId: z.string(), etat: z.enum(ETATS_PULSE) }).strict()),
    enigmes: z.array(
      z
        .object({
          parcoursId: z.string(),
          resolues: z.array(z.object({ enigmeId: z.string(), fragment: z.string() }).strict()),
          tentativesRestantes: z.record(z.string(), entierPositif),
          ...etatDesEnigmes,
        })
        .strict(),
    ),
    defis: z.array(z.object({ defiId: z.string(), premiereTentative: z.string() }).strict()),
    rappels: z.object({ questionIds: z.array(z.string()) }).strict(),
  })
  .strict();

const regleDeNotation: z.ZodType<RegleNotation> = z
  .object({
    noteMax: z.number(),
    base: z.literal('participation-relative-cohorte'),
    partCohorteReference: z.number(),
    ratioSeuilValidation: z.number(),
    neSaitPasCompteCommeReponse: z.boolean(),
    pointsNonReponse: z.number(),
    reponsesLibresNotees: z.boolean(),
    seuilQuestionProbleme: z.number(),
    decimalesStatistiques: z.number(),
    typesNotables: z.array(z.enum(TYPES_QUESTION)),
    productionCompteSi: z.literal('au-moins-une-saisie'),
    statistiquesSurQuestionsNotees: z.boolean(),
  })
  .strict();

const reponseRapportee = z
  .object({
    questionId: z.string(),
    concept: z.string(),
    type: z.enum(TYPES_QUESTION),
    score: z.number().nullable(),
    valeur: z.string(),
    reponse: z.string(),
    correcte: z.boolean(),
    misconception: z.string().nullable(),
    libelleConfusion: z.string().nullable(),
    dureeMs: z.number(),
  })
  .strict();

export const rapportServi: z.ZodType<RapportSeance> = z
  .object({
    courseSlug: z.string(),
    code: z.string(),
    ouverteLe: horodatage,
    fermeeLe: horodatage,
    participants: z.array(
      z
        .object({
          prenom: z.string(),
          nom: z.string(),
          email: z.string(),
          completion: z.number(),
          note: z.number(),
          sousSeuil: z.boolean(),
          reponses: z.array(reponseRapportee),
          reponsesLibres: z.array(
            z
              .object({ screenId: z.string(), activityId: z.string(), reponse: z.string() })
              .strict(),
          ),
          incidents: entierPositif,
        })
        .strict(),
    ),
    conceptsFragiles: z.array(z.string()),
    libellesDesConcepts: z.record(z.string(), z.string()),
    resultats: z
      .object({ participants: entierPositif, questions: z.array(resultatServi) })
      .strict(),
    statistiques: statistiquesServies,
    notation: regleDeNotation,
    bareme: resumeBareme,
    jalons: z.record(z.string(), comptesJalon),
    enigmes: z.array(progressionEnigme),
  })
  .strict();
