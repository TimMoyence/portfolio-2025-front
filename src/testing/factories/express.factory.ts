import type express from 'express';

export interface ReponseEnregistree {
  express: express.Response;
  statut: number;
  type: string | null;
  entetes: Record<string, string>;
  corps: string | null;
}

export function createReponseExpressStub(): ReponseEnregistree {
  const enregistrement: ReponseEnregistree = {
    express: undefined as unknown as express.Response,
    statut: 200,
    type: null,
    entetes: {},
    corps: null,
  };
  const double = {
    status(code: number) {
      enregistrement.statut = code;
      return double;
    },
    type(valeur: string) {
      enregistrement.type = valeur;
      return double;
    },
    setHeader(nom: string, valeur: string) {
      enregistrement.entetes[nom] = valeur;
      return double;
    },
    send(corps: string) {
      enregistrement.corps = corps;
      return double;
    },
  };
  enregistrement.express = double as unknown as express.Response;
  return enregistrement;
}

export function buildRequeteExpress(
  overrides: Partial<{ host: string; protocol: string; originalUrl: string }> = {},
): express.Request {
  const { host = 'asilidesign.fr', protocol = 'https', originalUrl = '/sitemap.xml' } = overrides;
  return {
    headers: {},
    protocol,
    originalUrl,
    get: (nom: string) => (nom.toLowerCase() === 'host' ? host : undefined),
  } as unknown as express.Request;
}
