import { z } from 'zod';
import {
  TYPES_QUESTION,
  type ComptesJalon,
  type ProgressionEnigme,
  type ResumeBareme,
  type StatistiquesSeance,
} from '../../content/types';

export const entierPositif = z.number().int().nonnegative();

export const valeursParCle = z.record(z.string(), z.number());

export const valeurAffichee = z
  .object({
    valeur: z.number().nullable(),
    affichage: z.string(),
  })
  .strict();

export const sortiesDeMachine = z
  .object({
    valeurs: valeursParCle,
    resultat: valeurAffichee,
    etapes: z.array(valeurAffichee),
    courbes: z.record(
      z.string(),
      z.array(z.object({ x: z.number(), y: z.number().nullable() }).strict()),
    ),
    lignes: z.record(
      z.string(),
      z.array(
        z
          .object({
            valeur: valeurAffichee,
            resultat: valeurAffichee,
            courante: z.boolean(),
          })
          .strict(),
      ),
    ),
    phrase: z.string(),
  })
  .strict();

const decompte = z.object({ total: z.number(), justes: z.number() }).strict();

export const resultatServi = z
  .object({
    questionId: z.string(),
    ecranId: z.string(),
    type: z.enum(TYPES_QUESTION),
    noteCompte: z.boolean(),
    total: z.number(),
    correctes: z.number(),
    neSaitPas: z.number(),
    confusions: z.array(
      z.object({ id: z.string(), libelle: z.string(), nombre: z.number() }).strict(),
    ),
    parOption: valeursParCle.nullable(),
    scoreMoyen: z.number().nullable(),
    parCle: z.record(z.string(), decompte).nullable(),
    confusionDominante: z.string().nullable().optional(),
    part: z.number().optional(),
    sousLeSeuil: z.boolean().optional(),
    remediation: z
      .object({ confusionId: z.string(), ecranId: z.string() })
      .strict()
      .nullable()
      .optional(),
  })
  .strict();

export const statistiquesServies: z.ZodType<StatistiquesSeance> = z
  .object({
    moyenne: z.number(),
    mediane: z.number(),
    dispersion: z.number(),
    tauxParticipation: z.number(),
    tauxReussite: z.number(),
    questionsProblemes: z.array(z.string()),
  })
  .strict();

export const comptesJalon: z.ZodType<ComptesJalon> = z
  .object({ perdu: z.number(), 'ca-va': z.number(), clair: z.number(), total: z.number() })
  .strict();

export const progressionEnigme: z.ZodType<ProgressionEnigme> = z
  .object({
    parcoursId: z.string(),
    enigmeId: z.string(),
    ouvertes: z.number(),
    resolues: z.number(),
    tentativesMoyennes: z.number(),
    epuisees: z.number(),
  })
  .strict();

export const resumeBareme: z.ZodType<ResumeBareme> = z
  .object({
    questionsNotees: z.number(),
    parType: z.record(
      z.enum(TYPES_QUESTION),
      z.object({ notees: z.number(), nonNotees: z.number() }).strict(),
    ),
  })
  .strict();
