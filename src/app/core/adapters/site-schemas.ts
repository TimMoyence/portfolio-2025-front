import { z } from 'zod';
import type { PublishedArticle, ArticleListResponse } from '../models/article.model';
import type { ClientReport } from '../models/audit-client-report.model';
import type {
  AuditCompletedEvent,
  AuditCreateResponse,
  AuditFailedEvent,
  AuditHeartbeatEvent,
  AuditProgressEvent,
  AuditSummaryResponse,
  AuditTimeoutEvent,
} from '../models/audit-request.model';
import type { AuthActionMessage, AuthSession, AuthUser } from '../models/auth.model';
import type { MessageResponse } from '../models/message.response';
import type { ToolkitPageData } from '../models/toolkit-page.model';
import type { ToolkitResponse } from '../models/toolkit-request.model';
import type { PresentationInteractionsResponse } from '../ports/presentation.port';

export const accuseServi: z.ZodType<MessageResponse> = z
  .object({ message: z.string(), httpCode: z.number() })
  .strict();

export const messageServi: z.ZodType<AuthActionMessage> = z
  .object({ message: z.string() })
  .strict();

export const utilisateurServi: z.ZodType<AuthUser> = z
  .object({
    id: z.string(),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    phone: z.string().nullable(),
    isActive: z.boolean(),
    roles: z.array(z.string()),
    createdAt: z.string(),
    updatedAt: z.string(),
    updatedOrCreatedBy: z.string().nullable(),
    hasPassword: z.boolean(),
    emailVerified: z.boolean(),
  })
  .strict();

export const sessionServie: z.ZodType<AuthSession> = z
  .object({ accessToken: z.string(), expiresIn: z.number(), user: utilisateurServi })
  .strict();

const factDeRubrique = z
  .object({
    entity: z.string(),
    text: z.string(),
    source: z.string(),
    url: z.string(),
    published_at: z.string().optional(),
    retrieved_at: z.string().optional(),
  })
  .strict();

export const articleServi: z.ZodType<PublishedArticle> = z
  .object({
    article_id: z.string(),
    slug: z.string(),
    locale: z.enum(['fr', 'en']),
    title: z.string(),
    excerpt: z.string(),
    content_markdown: z.string(),
    reading_time_minutes: z.number().nullable(),
    tags: z.array(z.string()),
    sections: z.array(
      z
        .object({
          id: z.string(),
          kind: z.enum(['essential', 'deep_dive', 'rubric', 'radar']),
          title: z.string(),
          intro: z.string(),
          body: z.string(),
          items: z.array(factDeRubrique),
        })
        .strict(),
    ),
    sources: z.array(
      z
        .object({
          name: z.string(),
          url: z.string(),
          published_at: z.string().nullable(),
          retrieved_at: z.string().nullable(),
        })
        .strict(),
    ),
    provenance: z
      .object({
        run_id: z.string(),
        edition_date: z.string(),
        item_count: z.number(),
        source_count: z.number(),
        content_sha256: z.string(),
      })
      .strict(),
    seo: z
      .object({
        description: z.string(),
        canonical_path: z.string(),
        keywords: z.array(z.string()),
        image_url: z.string().nullable(),
        image_alt: z.string().nullable(),
      })
      .strict(),
    published_at: z.string(),
    updated_at: z.string(),
  })
  .strict();

export const pageDArticlesServie: z.ZodType<ArticleListResponse> = z
  .object({ items: z.array(articleServi), next_cursor: z.string().nullable() })
  .strict();

const statutDAudit = z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED']);

const syntheseDAudit = {
  summaryText: z.string().nullable(),
  keyChecks: z.record(z.string(), z.unknown()),
  quickWins: z.array(z.string()),
  pillarScores: z.record(z.string(), z.number()),
};

export const auditCreeServi: z.ZodType<AuditCreateResponse> = z
  .object({
    message: z.string(),
    httpCode: z.number(),
    auditId: z.string(),
    status: statutDAudit,
  })
  .strict();

export const resumeDAuditServi: z.ZodType<AuditSummaryResponse> = z
  .object({
    auditId: z.string(),
    ready: z.boolean(),
    status: statutDAudit,
    progress: z.number(),
    ...syntheseDAudit,
  })
  .strict();

const avancement = { done: z.number(), total: z.number() };

const avancementParPage = z
  .object({
    phase: z.enum(['technical_pages', 'page_ai_recaps']),
    iaTask: z.enum(['technical_scan', 'page_ai_recap']),
    iaSubTask: z.string(),
    ...avancement,
    currentUrl: z.string(),
    recentCompletedUrls: z.array(z.string()),
  })
  .strict();

const avancementDeLaSynthese = {
  phase: z.literal('synthesis'),
  iaTask: z.literal('synthesis'),
  iaSubTask: z.string(),
  ...avancement,
};

const statutDeSection = z.enum(['started', 'completed', 'failed', 'fallback']);

const avancementParSection = z
  .object({
    ...avancementDeLaSynthese,
    section: z.enum([
      'summary',
      'executiveSection',
      'prioritySection',
      'executionSection',
      'clientCommsSection',
    ]),
    sectionStatus: statutDeSection,
    sectionStatuses: z.record(z.string(), statutDeSection),
  })
  .strict();

export const progressionDAuditServie: z.ZodType<AuditProgressEvent> = z
  .object({
    auditId: z.string(),
    status: z.enum(['PENDING', 'RUNNING']),
    progress: z.number(),
    step: z.string().nullable(),
    details: z
      .union([avancementParPage, avancementParSection, z.object(avancementDeLaSynthese).strict()])
      .optional(),
    done: z.boolean(),
    updatedAt: z.string(),
  })
  .strict();

const statutDuScore = z.enum(['critical', 'warning', 'ok']);

const scoreDeMoteur = z
  .object({
    score: z.number(),
    summary: z.string(),
    status: statutDuScore,
    statusLabel: z.string(),
  })
  .strict();

const rapportClient: z.ZodType<ClientReport> = z
  .object({
    executiveSummary: z.string(),
    topFindings: z.array(
      z
        .object({
          title: z.string(),
          impact: z.string(),
          severity: z.enum(['high', 'medium', 'low']),
        })
        .strict(),
    ),
    googleVsAiMatrix: z
      .object({ googleVisibility: scoreDeMoteur, aiVisibility: scoreDeMoteur })
      .strict(),
    pillarScorecard: z.array(
      z
        .object({
          pillar: z.string(),
          score: z.number(),
          target: z.number(),
          status: statutDuScore,
          statusLabel: z.string(),
        })
        .strict(),
    ),
    quickWins: z.array(
      z
        .object({
          title: z.string(),
          businessImpact: z.string(),
          effort: z.enum(['low', 'medium', 'high']),
        })
        .strict(),
    ),
    cta: z.object({ title: z.string(), description: z.string(), actionLabel: z.string() }).strict(),
  })
  .strict();

export const auditTermineServi: z.ZodType<AuditCompletedEvent> = z
  .object({
    auditId: z.string(),
    status: z.literal('COMPLETED'),
    progress: z.number(),
    done: z.boolean(),
    ...syntheseDAudit,
    clientReport: rapportClient.nullable(),
    updatedAt: z.string(),
  })
  .strict();

export const auditEchoueServi: z.ZodType<AuditFailedEvent> = z
  .object({
    auditId: z.string(),
    status: z.literal('FAILED'),
    progress: z.number(),
    done: z.boolean(),
    error: z.null(),
    updatedAt: z.string(),
  })
  .strict();

export const auditExpireServi: z.ZodType<AuditTimeoutEvent> = z
  .object({
    auditId: z.string(),
    status: z.literal('TIMEOUT'),
    error: z.null(),
    updatedAt: z.string(),
  })
  .strict();

export const battementServi: z.ZodType<AuditHeartbeatEvent> = z.object({ ts: z.string() }).strict();

export const guideDemandeServi: z.ZodType<ToolkitResponse> = z
  .object({ message: z.string(), accessToken: z.string().optional() })
  .strict();

export const guideServi: z.ZodType<ToolkitPageData> = z
  .object({
    recap: z
      .object({
        firstName: z.string(),
      })
      .strict(),
    cheatsheet: z.array(
      z
        .object({
          tool: z.string(),
          category: z.string(),
          price: z.string(),
          url: z.string(),
          tip: z.string(),
          decision: z.string(),
        })
        .strict(),
    ),
    prompts: z.array(
      z
        .object({
          category: z.string(),
          title: z.string(),
          level: z.enum(['debutant', 'intermediaire', 'avance']),
          prompt: z.string(),
          tool: z.string(),
          description: z.string(),
          example: z.string(),
          tip: z.string(),
        })
        .strict(),
    ),
    workflows: z.array(
      z
        .object({
          title: z.string(),
          description: z.string(),
          setupTime: z.string(),
          monthlyCost: z.number(),
          steps: z.array(
            z
              .object({
                step: z.number(),
                action: z.string(),
                tool: z.string(),
                detail: z.string(),
              })
              .strict(),
          ),
          tools: z.array(z.string()),
        })
        .strict(),
    ),
    templates: z.array(
      z
        .object({
          name: z.string(),
          platform: z.string(),
          url: z.string(),
          description: z.string(),
          minBudget: z.number(),
        })
        .strict(),
    ),
  })
  .strict();

export const interactionsServies: z.ZodType<PresentationInteractionsResponse> = z
  .object({
    slug: z.string(),
    interactions: z.record(
      z.string(),
      z
        .object({
          present: z
            .array(
              z
                .object({
                  type: z.literal('poll'),
                  question: z.string(),
                  options: z.array(z.string()),
                  multiSelect: z.boolean().optional(),
                })
                .strict(),
            )
            .optional(),
          scroll: z
            .array(
              z
                .object({
                  type: z.literal('reflection'),
                  question: z.string(),
                  placeholder: z.string(),
                  rows: z.number().optional(),
                })
                .strict(),
            )
            .optional(),
        })
        .strict(),
    ),
  })
  .strict();
